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

  const drizzle = await createDrizzleAsync(connectionString);

  await migrate(drizzle, {
    migrationsFolder: "./src/drizzle/migrations",
  });

  if (isDevEnv) {
    await reset(drizzle, schema);

    await seed(drizzle, schema).refine((f) => ({
      products: {
        columns: {
          inventory_count: f.int({ minValue: 0 }),
        },
      },
    }));
  }

  return addRoutes(express());
}
