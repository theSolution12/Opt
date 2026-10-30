import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL;
const baseUrl = "http://localhost:8000";

// Tunables (override with -e NAME=value)
const SEED_COUNT = Number(__ENV.SEED_COUNT || 10000); // users created before the test
const READ_PEAK = Number(__ENV.READ_PEAK || 900); // list requests/sec at the 100% stage
const WRITE_PEAK = Number(__ENV.WRITE_PEAK || 100); // create+update+delete flows/sec at 100%
const MAX_VUS = Number(__ENV.MAX_VUS || 3000);

const jsonParams = { headers: { "Content-Type": "application/json" } };

// 25% -> 50% -> 100% -> 200% of peak, 30s each.
// The stage where thresholds start failing is your breaking point.
function stages(peak) {
  return [
    { target: Math.round(peak * 0.25), duration: "30s" },
    { target: Math.round(peak * 0.5), duration: "30s" },
    { target: peak, duration: "30s" },
    { target: peak * 2, duration: "30s" },
  ];
}

export const options = {
  setupTimeout: "600s",
  teardownTimeout: "600s",
  scenarios: {
    reads: {
      executor: "ramping-arrival-rate",
      exec: "readFlow",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 100,
      maxVUs: MAX_VUS,
      stages: stages(READ_PEAK),
    },
    writes: {
      executor: "ramping-arrival-rate",
      exec: "writeFlow",
      startRate: 1,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: MAX_VUS,
      stages: stages(WRITE_PEAK),
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
    "http_req_duration{scenario:reads}": ["p(95)<200"],
    "http_req_duration{scenario:writes}": ["p(95)<200"],
    // Abort the test if the 95th percentile of request duration exceeds 200ms for either scenario.
    "http_req_duration{scenario:reads}": [
      { threshold: "p(95)<200", abortOnFail: true, delayAbortEval: "10s" },
    ],
    "http_req_duration{scenario:writes}": [
      { threshold: "p(95)<200", abortOnFail: true, delayAbortEval: "10s" },
    ],
    // Non-zero means k6 couldn't keep up with the target rate (server saturated)
    dropped_iterations: ["count==0"],
  },
};

// Seed data once, in batches, so the dataset has a realistic size.
export function setup() {
  const BATCH = 100;
  let created = 0;

  for (let start = 0; start < SEED_COUNT; start += BATCH) {
    const requests = [];
    const end = Math.min(start + BATCH, SEED_COUNT);

    for (let i = start; i < end; i++) {
      requests.push([
        "POST",
        `${baseUrl}/api/users`,
        JSON.stringify({
          name: `seed-user-${i}`,
          email: `seed-${i}@example.com`,
        }),
        jsonParams,
      ]);
    }

    const responses = http.batch(requests);
    created += responses.filter((r) => r.status === 201).length;
  }

  console.log(`Seeded ${created}/${SEED_COUNT} users`);
}

// Read-heavy traffic: list only checks status (body parsing is skipped so
// k6 itself doesn't become the bottleneck).
export function readFlow() {
  const res = http.get(`${baseUrl}/api/users`, { responseType: "none" });
  check(res, { "list returns 200": (r) => r.status === 200 });
}

// Write traffic: create -> update -> delete its own user, so the dataset
// size stays roughly constant for the whole run.
export function writeFlow() {
  const id = `${__VU}-${__ITER}`;
  const user = { name: `k6-user-${id}`, email: `k6-${id}@example.com` };

  const createRes = http.post(
    `${baseUrl}/api/users`,
    JSON.stringify(user),
    jsonParams,
  );
  const created = check(createRes, {
    "create returns 201": (r) => r.status === 201,
    "create returns the user": (r) =>
      r.status === 201 && r.json("user.name") === user.name,
  });
  if (!created) return;

  const userId = createRes.json("user.id");

  const updateRes = http.put(
    `${baseUrl}/api/users/${userId}`,
    JSON.stringify({ name: `${user.name}-updated`, email: user.email }),
    jsonParams,
  );
  check(updateRes, {
    "update returns 200": (r) => r.status === 200,
    "update returns the changed name": (r) =>
      r.status === 200 && r.json("user.name") === `${user.name}-updated`,
  });

  const deleteRes = http.del(`${baseUrl}/api/users/${userId}`);
  check(deleteRes, {
    "delete returns 200": (r) => r.status === 200,
    "delete succeeds": (r) => r.status === 200 && r.json("success") === true,
  });
}

// Runs once after the test (including when a threshold aborts it).
// Deletes every user so the next run starts from an empty store.
export function teardown() {
  const listRes = http.get(`${baseUrl}/api/users`, { timeout: "120s" });
  if (listRes.status !== 200) {
    console.warn(`Teardown could not list users (status ${listRes.status})`);
    return;
  }

  const ids = listRes.json("users").map((u) => u.id);
  const BATCH = 100;
  let deleted = 0;

  for (let i = 0; i < ids.length; i += BATCH) {
    const responses = http.batch(
      ids
        .slice(i, i + BATCH)
        .map((id) => [
          "DELETE",
          `${baseUrl}/api/users/${id}`,
          null,
          { timeout: "120s" },
        ]),
    );
    deleted += responses.filter((r) => r.status === 200).length;
  }

  console.log(`Teardown removed ${deleted}/${ids.length} users`);
}
