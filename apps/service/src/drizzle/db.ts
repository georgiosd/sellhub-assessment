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

export async function createDatabaseIfNotExistsAsync(url: string) {
  const { rootConnectionString, databaseName } = stripDatabaseName(url);

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

    await client.query(`CREATE DATABASE "${databaseName}";`);
  } finally {
    await client.end();
  }
}

export async function createDrizzleAsync(url: string) {
  const pool = new Pool({
    connectionString: url,
  });

  return {
    db: drizzle(pool, {
      schema,
    }),
    pool,
  };
}
