import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Express } from "express";
import request from "supertest";
import { createExpressApp } from "./app";
import { Pool } from "pg";
import { TProduct } from "./drizzle/schema";

let app: Express;
let pool: Pool;
let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres")
    .withName("test-postgres")
    .withExposedPorts({
      container: 5432,
      host: 5435, // don't conflict with local postgres
    })
    .withPrivilegedMode()
    .withReuse()
    .start();

  ({ app, pool } = await createExpressApp({
    connectionString: "postgres://test:test@localhost:5435/service",
    isDevEnv: true,
  }));
});

afterAll(async () => {
  if (pool) {
    await pool.end();
  }

  if (container) {
    await container.stop();
  }
});

describe("app", () => {
  describe("products", () => {
    it("should return 10 products", async () => {
      const response = await request(app).get("/products");

      expect(response.status).toBe(200);

      const result = response.body as TProduct[];
      expect(result).toHaveLength(10);
    });
  });
});
