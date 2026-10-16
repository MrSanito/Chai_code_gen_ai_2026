import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

function createDb() {
  return postgres<Contract>({
    contractJson,
    url: process.env["DATABASE_URL"]!,
  });
}

const globalForDb = globalThis as unknown as {
  db?: ReturnType<typeof createDb>;
  contractHash?: string;
};

const currentHash = (contractJson as any).storageHash ?? (contractJson as any).profileHash;

export const db =
  globalForDb.db && globalForDb.contractHash === currentHash
    ? globalForDb.db
    : createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
  globalForDb.contractHash = currentHash;
}

export default db;