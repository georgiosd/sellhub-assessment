import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client, Pool } from "pg";

import schema from "./schema";

function stripDatabaseName(url: string) {
  const urlParts = url.split("/");
  return {
    rootConnectionString: urlParts.slice(0, urlParts.length - 1).join("/"),
    databaseName: urlParts[urlParts.length - 1],
  };
}

async function createDatabaseIfNotExistsAsync() {
  const { rootConnectionString, databaseName } = stripDatabaseName(
    process.env.POSTGRES_URL as string
  );

  const client = new Client({
    connectionString: rootConnectionString,
  });

  await client.connect();

  try {
    const res = await client.query(
      `SELECT datname FROM pg_catalog.pg_database WHERE datname = '${databaseName}'`
    );

    if (res.rowCount) {
      return;
    }

    console.log(`${databaseName} database not found, creating it.`);
    await client.query(`CREATE DATABASE "${databaseName}";`);
    console.log(`created database ${databaseName}`);
  } finally {
    await client.end();
  }
}

export async function createDrizzleAsync() {
  if (process.env.NODE_ENV === "development") {
    await createDatabaseIfNotExistsAsync();
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  return drizzle(pool, {
    schema,
  });
}
