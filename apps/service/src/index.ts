import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

import { migrate } from "drizzle-orm/node-postgres/migrator";
import {
  createDatabaseIfNotExistsAsync,
  createDrizzleAsync,
} from "./drizzle/db";
import { create } from "domain";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, async () => {
  const connectionString = process.env.POSTGRES_URL as string;

  if (process.env.NODE_ENV === "development") {
    await createDatabaseIfNotExistsAsync(connectionString);
  }

  const drizzle = await createDrizzleAsync(connectionString);

  await migrate(drizzle, {
    migrationsFolder: "./src/drizzle/migrations",
  });

  console.log(`[server]: Server is running at http://localhost:${port}`);
});
