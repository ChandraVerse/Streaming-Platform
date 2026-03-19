import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../src/app.js";

test("register rejects invalid payload", async () => {
  const response = await request(app).post("/auth/register").send({ email: "not-an-email" });
  assert.equal(response.status, 400);
});

test("login rejects invalid payload", async () => {
  const response = await request(app).post("/auth/login").send({ email: "bad" });
  assert.equal(response.status, 400);
});

test("otp verify rejects invalid payload", async () => {
  const response = await request(app).post("/auth/verify-otp").send({ email: "bad", code: "1" });
  assert.equal(response.status, 400);
});

test("refresh rejects invalid payload", async () => {
  const response = await request(app).post("/auth/refresh").send({ refreshToken: "" });
  assert.equal(response.status, 400);
});
