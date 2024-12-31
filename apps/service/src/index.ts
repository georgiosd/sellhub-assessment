import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { seed } from "drizzle-seed";
import {
  createDatabaseIfNotExistsAsync,
  createDrizzleAsync,
} from "./drizzle/db";
import schema from "./drizzle/schema";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, async () => {
  const connectionString = process.env.POSTGRES_URL as string;
  const isDevEnv = process.env.NODE_ENV === "development";

  if (isDevEnv) {
    await createDatabaseIfNotExistsAsync(connectionString);
  }

  const drizzle = await createDrizzleAsync(connectionString);

  await migrate(drizzle, {
    migrationsFolder: "./src/drizzle/migrations",
  });

  if (isDevEnv) {
    await seed(drizzle, schema);
  }

  console.log(`[server]: Server is running at http://localhost:${port}`);
});
