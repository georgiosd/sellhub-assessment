import express, { Express, Request, Response } from "express";

import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { reset, seed } from "drizzle-seed";
import { createDatabaseIfNotExistsAsync, createDrizzle } from "./drizzle/db";
import * as schema from "./drizzle/schema";

const { products } = schema;

type TDatabase = ReturnType<typeof createDrizzle>["db"];

function sanitizePagingParameter(skip: any) {
  const parsed = parseInt(skip, 10);
  return isNaN(parsed) ? 0 : parsed;
}

type IdentifiedProductRequestParams = { id: string };

function addRoutes(app: Express, db: TDatabase) {
  app.get("/products", async (req: Request, res: Response) => {
    const match = await db
      .select()
      .from(products)
      .offset(sanitizePagingParameter(req.query.skip))
      .limit(10);

    res.json(match);
  });

  app.get(
    "/products/:id",
    async (req: Request<IdentifiedProductRequestParams>, res: Response) => {
      const match = await db
        .select()
        .from(products)
        .where(eq(products.id, req.params.id));

      if (!match.length) {
        res.status(404);
        return;
      }

      res.json(match[0]);
    }
  );

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
    // this step would be refactored out normally
    await reset(db, schema);

    await seed(db, schema).refine((f) => ({
      products: {
        columns: {
          id: f.valuesFromArray({
            values: [
              // this is an easy way to have sequential UUIDs, that help with writing tests quickly
              // I wouldn't use this strategy in a real codebase
              "00000000-0000-0000-0000-000000000000",
              "00000000-0000-0000-0000-000000000001",
              "00000000-0000-0000-0000-000000000002",
              "00000000-0000-0000-0000-000000000003",
              "00000000-0000-0000-0000-000000000004",
              "00000000-0000-0000-0000-000000000005",
              "00000000-0000-0000-0000-000000000006",
              "00000000-0000-0000-0000-000000000007",
              "00000000-0000-0000-0000-000000000008",
              "00000000-0000-0000-0000-000000000009",
            ],
            isUnique: true,
          }),
          name: f.loremIpsum({
            sentencesCount: 1,
          }),
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
