import { eq } from "drizzle-orm";
import cors from "cors";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { reset, seed } from "drizzle-seed";
import express, { Express, NextFunction, Request, Response } from "express";
import z, { ZodError } from "zod";
import { createDatabaseIfNotExistsAsync, createDrizzle } from "./drizzle/db";
import * as schema from "./drizzle/schema";
import { type TPurchaseProduct } from "./drizzle/schema";

const { products } = schema;

type TDatabase = ReturnType<typeof createDrizzle>["db"];

function sanitizePagingParameter(skip: any) {
  const parsed = parseInt(skip, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function validateData(schema: z.ZodObject<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "validation_error",
          details: error.errors,
        });
        return;
      }

      next(error);
    }
  };
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

  app.post(
    "/products/:id/purchase",
    validateData(schema.PurchaseProductSchema),
    async (
      req: Request<IdentifiedProductRequestParams, any, TPurchaseProduct>,
      res: Response
    ) => {
      const match = await db
        .select()
        .from(products)
        .where(eq(products.id, req.params.id));

      if (!match.length) {
        res.status(404);
        return;
      }

      if (match[0].inventory_count === 0) {
        res.status(400).json({
          error: "out_of_stock",
        });
        return;
      }

      const newCount = await db.transaction(async (tx) => {
        const result = await tx
          .update(schema.products)
          .set({
            inventory_count:
              match[0].inventory_count - req.body.inventory_count,
          })
          .where(eq(products.id, req.params.id))
          .returning({ inventory_count: products.inventory_count });

        if (result[0].inventory_count < 0) {
          try {
            tx.rollback();
          } catch {}
          return -1;
        }

        return result[0].inventory_count;
      });

      if (newCount === -1) {
        res.status(400).json({
          error: "out_of_stock",
        });
        return;
      }

      res.status(200).json({
        inventory_count: newCount,
      });
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

  const app = express();

  app.use(cors());
  app.use(express.json());

  return {
    app: addRoutes(app, db),
    db,
    pool,
  };
}
