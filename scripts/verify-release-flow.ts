import "./load-env";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import mysql from "mysql2";
import { getDatabaseConfig } from "../lib/env";
import { snapshotReleaseData, verifyReleaseData } from "./release-data";

async function run() {
  const config = getDatabaseConfig();
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(config.host), "Checks require a local database");
  const database = `n7_release_test_${Date.now()}`;
  assert.match(database, /^n7_release_test_\d+$/);
  const db = mysql.createConnection({ host: config.host, port: config.port,
    user: process.env.DB_ROOT_PASSWORD ? "root" : config.user,
    password: process.env.DB_ROOT_PASSWORD || config.password, multipleStatements: true,
    dateStrings: true, supportBigNumbers: true, bigNumberStrings: true });
  const setup = db.promise();
  let created = false, checks = 0;
  try {
    await setup.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    created = true;
    await setup.changeUser({ database });
    const migrations = (await readdir("database/migrations")).filter(name => name.endsWith(".sql")).sort();
    for (const name of migrations.filter(name => name < "028")) {
      await setup.query(await readFile(`database/migrations/${name}`, "utf8"));
    }
    await setup.query("INSERT INTO site_settings (setting_key, setting_group, value_json) VALUES ('release.fixture', 'test', '{\"preserve\":true}')");
    await setup.query("INSERT INTO products (name, slug, status) VALUES ('Preserved product', 'release-fixture', 'ACTIVE')");
    // Exercise the same JSON snapshot format retained by failed production deploys.
    const before = JSON.parse(JSON.stringify(await snapshotReleaseData(db)));
    await verifyReleaseData(db, before); checks++;
    for (const name of migrations.filter(name => name >= "028" && name < "030")) {
      await setup.query(await readFile(`database/migrations/${name}`, "utf8"));
    }
    await verifyReleaseData(db, before); checks++;

    const rejectsChange = async (sql: string, baseline = before) => {
      await setup.beginTransaction();
      try {
        await setup.query(sql);
        await assert.rejects(verifyReleaseData(db, baseline), /Row count changed|Existing values changed/);
        checks++;
      } finally { await setup.rollback(); }
    };
    await rejectsChange("UPDATE site_settings SET value_json = '{}' WHERE setting_key = 'release.fixture'");
    await rejectsChange("DELETE FROM site_settings WHERE setting_key = 'release.fixture'");
    await rejectsChange("INSERT INTO site_settings (setting_key, setting_group, value_json) VALUES ('unexpected', 'test', '{}')");
    await rejectsChange("UPDATE site_settings SET value_json = '{\"enabled\":true}' WHERE setting_key = 'meta.configuration'");
    await rejectsChange("UPDATE site_settings SET is_public = 1 WHERE setting_key = 'meta.configuration'");
    await rejectsChange("UPDATE site_settings SET setting_group = 'wrong' WHERE setting_key = 'meta.configuration'");
    await rejectsChange("UPDATE products SET name = 'Changed product' WHERE slug = 'release-fixture'");
    const withDefaultMeta = await snapshotReleaseData(db);
    await rejectsChange("INSERT INTO site_settings (setting_key, setting_group, value_json) VALUES ('unexpected', 'test', '{}')", withDefaultMeta);
    await setup.query("UPDATE site_settings SET value_json = '{\"enabled\":true}' WHERE setting_key = 'meta.configuration'");
    const withMeta = await snapshotReleaseData(db);
    await verifyReleaseData(db, withMeta); checks++;
    await rejectsChange("UPDATE site_settings SET value_json = '{}' WHERE setting_key = 'meta.configuration'", withMeta);
    await rejectsChange("DELETE FROM site_settings WHERE setting_key = 'meta.configuration'", withMeta);
    await rejectsChange("INSERT INTO site_settings (setting_key, setting_group, value_json) VALUES ('unexpected', 'test', '{}')", withMeta);
    console.log(`${checks} release integrity checks passed; migrations 028/029 preserve existing data.`);
  } finally {
    if (created) await setup.query(`DROP DATABASE \`${database}\``);
    await setup.end();
  }
}
void run().catch(error => { console.error(error instanceof Error ? error.message : "Release integrity checks failed"); process.exitCode = 1; });
