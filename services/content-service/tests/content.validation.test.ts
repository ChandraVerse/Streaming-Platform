import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../src/app.js";

test("content create rejects invalid payload", async () => {
  const response = await request(app).post("/content").send({ title: "" });
  assert.equal(response.status, 400);
});

test("bulk import rejects empty payload", async () => {
  const response = await request(app).post("/content/bulk-import").send({ csv: "" });
  assert.equal(response.status, 400);
});

test("rating rejects invalid payload", async () => {
  const response = await request(app).post("/ratings/123").send({ rating: 10 });
  assert.equal(response.status, 400);
});
