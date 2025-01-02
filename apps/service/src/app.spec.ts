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
    describe("list", () => {
      it("should return 10 products", async () => {
        const response = await request(app).get("/products");

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body as TProduct[]).toHaveLength(10);
      });
    });

    describe("details", () => {
      it("should return a single product", async () => {
        const response = await request(app).get(
          "/products/00000000-0000-0000-0000-000000000001"
        );

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Object);
        expect(response.body as TProduct).toMatchObject({
          id: "00000000-0000-0000-0000-000000000001",
        });
      });
    });

    describe("purchase", () => {
      it("should return 400/validation_error if schema mismatches", async () => {
        const response = await request(app)
          .post("/products/00000000-0000-0000-0000-000000000001/purchase")
          .send({
            // can't update name through purchase
            name: "foobar",
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("validation_error");
        expect(response.body.details).toBeInstanceOf(Array);
      });

      it("should return 200 if purchase went through ok", async () => {
        const fetch = await request(app).get(
          "/products/00000000-0000-0000-0000-000000000001"
        );

        const purchase = await request(app)
          .post("/products/00000000-0000-0000-0000-000000000001/purchase")
          .send({
            inventory_count: 1,
          });

        expect(purchase.status).toBe(200);
        expect(purchase.body.inventory_count).toBe(
          fetch.body.inventory_count - 1
        );
      });

      it("should return 400/out_of_stock if inventory_count would go negative", async () => {
        const response = await request(app)
          .post("/products/00000000-0000-0000-0000-000000000001/purchase")
          .send({
            inventory_count: Math.pow(2, 31) - 1,
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("out_of_stock");
      });
    });
  });
});
