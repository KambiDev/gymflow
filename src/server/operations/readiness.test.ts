import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";

import { prisma } from "../../lib/db";
import { checkPilotDatabase, pilotEnvironmentIssues } from "./readiness";

const valid = {
  DATABASE_URL: "postgresql://operator:private@localhost:5432/gymflow",
  AUTH_SECRET: "a".repeat(32),
  AUTH_URL: "https://gymflow.example",
  NODE_ENV: "production",
};

test("checks required pilot settings without revealing secrets", () => {
  assert.deepEqual(pilotEnvironmentIssues(valid), []);
  const issues = pilotEnvironmentIssues({
    DATABASE_URL: "postgresql://user:do-not-print@localhost:5432/gymflow",
    AUTH_SECRET: "too-short-secret",
    NODE_ENV: "production",
  });
  assert.equal(issues.length, 2);
  assert.ok(!issues.join(" ").includes("do-not-print"));
  assert.ok(!issues.join(" ").includes("too-short-secret"));
  assert.equal(
    pilotEnvironmentIssues({
      ...valid,
      DATABASE_URL: "invalid",
      AUTH_URL: "http://gymflow.example",
    }).length,
    2,
  );
  assert.equal(
    pilotEnvironmentIssues({ ...valid, AUTH_URL: "https://localhost:3000" })
      .length,
    1,
  );
  assert.deepEqual(
    pilotEnvironmentIssues({
      ...valid,
      AUTH_URL: undefined,
      NODE_ENV: "development",
    }),
    [],
  );
});

test("checks pilot tables without changing database rows", async () => {
  try {
    const before = await prisma.organization.count();
    await checkPilotDatabase();
    assert.equal(await prisma.organization.count(), before);
  } finally {
    await prisma.$disconnect();
  }
});
