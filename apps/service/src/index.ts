import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { reset, seed } from "drizzle-seed";
import {
  createDatabaseIfNotExistsAsync,
  createDrizzleAsync,
} from "./drizzle/db";
import schema from "./drizzle/schema";

dotenv.config();

function addRoutes(app: Express) {
  app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
  });

  return app;
}

async function createExpressApp({
  connectionString,
  isDevEnv,
}: {
  connectionString: string;
  isDevEnv: boolean;
}) {
  const app: Express = addRoutes(express());

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

  return app;
}

async function main() {
  const app = await createExpressApp({
    connectionString: process.env.POSTGRES_URL as string,
    isDevEnv: process.env.NODE_ENV === "development",
  });

  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
}

main();
