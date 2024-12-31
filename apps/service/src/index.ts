import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDrizzleAsync } from "./drizzle/db";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, async () => {
  const drizzle = await createDrizzleAsync();

  await migrate(drizzle, {
    migrationsFolder: "./src/drizzle/migrations",
  });

  console.log(`[server]: Server is running at http://localhost:${port}`);
});
