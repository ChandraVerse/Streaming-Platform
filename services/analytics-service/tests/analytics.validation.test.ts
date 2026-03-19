import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../src/app.js";

test("events rejects invalid payload", async () => {
  const response = await request(app).post("/analytics/events").send({ kind: "unknown" });
  assert.equal(response.status, 400);
});

test("experiments rejects invalid payload", async () => {
  const response = await request(app).post("/analytics/experiments").send({ name: "" });
  assert.equal(response.status, 400);
});
