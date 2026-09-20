import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne } from "../db/query";

export async function saveCheckoutCustomer(customer: { email: string; name: string; phone: string; countryCode: string }, connection: PoolConnection): Promise<string> {
  const email = customer.email.trim().toLowerCase();
  await executeMutation(`INSERT INTO customers (email,full_name,phone,country_code) VALUES (?,?,?,?)
    ON DUPLICATE KEY UPDATE full_name=VALUES(full_name),phone=VALUES(phone),country_code=VALUES(country_code),last_active_at=CURRENT_TIMESTAMP(3)`, [email, customer.name, customer.phone, customer.countryCode], connection);
  const row = await selectOne<RowDataPacket & { id: string }>("SELECT CAST(id AS CHAR) id FROM customers WHERE email=?", [email], connection);
  if (!row) throw new Error("Unable to save the customer.");
  return row.id;
}
