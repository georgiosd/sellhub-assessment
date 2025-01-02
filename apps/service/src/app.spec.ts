import { Express } from "express";
import request from "supertest";
import { createExpressApp } from "./app";

let app: Express;

beforeAll(async () => {
  app = await createExpressApp({
    connectionString: "postgres://postgres:password@localhost:5432/service",
    isDevEnv: true,
  });
});

describe("app", () => {
  it("should return 200 on /", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
  });
});
