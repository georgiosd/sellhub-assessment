import express, { Express, Request, Response } from "express";

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { reset, seed } from "drizzle-seed";
import { createDatabaseIfNotExistsAsync, createDrizzle } from "./drizzle/db";
import * as schema from "./drizzle/schema";

type TDatabase = ReturnType<typeof createDrizzle>["db"];

function sanitizePagingParameter(skip: any) {
  const parsed = parseInt(skip, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function addRoutes(app: Express, db: TDatabase) {
  app.get("/products", async (req: Request, res: Response) => {
    const products = await db
      .select()
      .from(schema.products)
      .offset(sanitizePagingParameter(req.query.skip))
      .limit(10);

      res.json(products);
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
    app: addRoutes(express(), db),
    db,
    pool,
  };
}
