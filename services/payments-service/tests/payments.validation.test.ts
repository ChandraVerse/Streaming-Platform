import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../src/app.js";

test("stripe checkout rejects invalid payload", async () => {
  const response = await request(app).post("/payments/stripe/checkout-session").send({ planId: "" });
  assert.ok([400, 503].includes(response.status));
});

test("tvod intent rejects invalid payload", async () => {
  const response = await request(app).post("/payments/tvod/intent").send({ userId: "" });
  assert.equal(response.status, 400);
});
