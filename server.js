"use strict";

const path = require("node:path");
const { createServer } = require("node:http");
const { loadEnvFile } = require("node:process");

const applicationRoot = __dirname;
process.chdir(applicationRoot);

try {
  loadEnvFile(path.join(applicationRoot, ".env"));
} catch (error) {
  if (!(error && error.code === "ENOENT")) throw error;
}

process.env.NODE_ENV = "production";

const next = require("next");

const port = Number.parseInt(process.env.PORT || "3000", 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const app = next({
  dev: false,
  dir: applicationRoot,
});
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((request, response) => {
      handle(request, response).catch((error) => {
        console.error("Request failed:", error);
        if (!response.headersSent) response.statusCode = 500;
        response.end("Internal Server Error");
      });
    });

    server.listen(port, "0.0.0.0", () => {
      console.log(`N7 Cosmetics is listening on port ${port}.`);
    });
  })
  .catch((error) => {
    console.error("Application startup failed:", error);
    process.exit(1);
  });
