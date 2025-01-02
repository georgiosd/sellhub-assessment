import express, { Express, Request, Response } from "express";

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { reset, seed } from "drizzle-seed";
import {
  createDatabaseIfNotExistsAsync,
  createDrizzleAsync,
} from "./drizzle/db";
import schema from "./drizzle/schema";

function addRoutes(app: Express) {
  app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
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

  const { db, pool } = await createDrizzleAsync(connectionString);

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
