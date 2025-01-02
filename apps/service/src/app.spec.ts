import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Express } from "express";
import request from "supertest";
import { createExpressApp } from "./app";
import { Pool } from "pg";

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
  it("should return 200 on /", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });
});
