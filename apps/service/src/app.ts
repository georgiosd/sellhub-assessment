import express, { Express, Request, Response } from "express";

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { reset, seed } from "drizzle-seed";
function addRoutes(app: Express) {
  app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
import { createDatabaseIfNotExistsAsync, createDrizzle } from "./drizzle/db";
import * as schema from "./drizzle/schema";

  });

  return app;
}

export async function createExpressApp({
  connectionString,
  isDevEnv,
}: {
  connectionString: string;
  isDevEnv: boolean;
}) {
  if (isDevEnv) {
    await createDatabaseIfNotExistsAsync(connectionString);
  }

  const { db, pool } = createDrizzle(connectionString);

  await migrate(db, {
    migrationsFolder: "./src/drizzle/migrations",
  });

  if (isDevEnv) {
    await reset(db, schema);

    await seed(db, schema).refine((f) => ({
      products: {
        columns: {
          inventory_count: f.int({ minValue: 0 }),
        },
      },
    }));
  }

  return {
    app: addRoutes(express()),
    db,
    pool,
  };
}
