import http from "k6/http";
import { check, fail } from "k6";

const baseUrl = __ENV.BASE_URL || "http://localhost:8000";

export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<200"],
    checks: ["rate>0.99"],
  },
};

function requestHeaders() {
  return { headers: { "Content-Type": "application/json" } };
}

export default function () {
  const user = {
    name: `k6-user-${__VU}-${__ITER}`,
    email: `k6-${__VU}-${__ITER}@example.com`,
  };

  const createResponse = http.post(
    `${baseUrl}/api/users`,
    JSON.stringify(user),
    requestHeaders(),
  );

  const created = check(createResponse, {
    "create returns 201": (response) => response.status === 201,
    "create returns the user": (response) =>
      response.json("user.name") === user.name &&
      response.json("user.email") === user.email,
  });

  if (!created) {
    fail(`Could not create user: ${createResponse.body}`);
  }

  const userId = createResponse.json("user.id");

  const listResponse = http.get(`${baseUrl}/api/users`);
  check(listResponse, {
    "list returns 200": (response) => response.status === 200,
    "list contains the created user": (response) =>
      response.json("users").some((item) => item.id === userId),
  });

  const update = {
    name: `${user.name}-updated`,
    email: user.email,
  };
  const updateResponse = http.put(
    `${baseUrl}/api/users/${userId}`,
    JSON.stringify(update),
    requestHeaders(),
  );

  check(updateResponse, {
    "update returns 200": (response) => response.status === 200,
    "update returns the changed name": (response) =>
      response.json("user.name") === update.name,
  });

  const deleteResponse = http.del(`${baseUrl}/api/users/${userId}`);
  check(deleteResponse, {
    "delete returns 200": (response) => response.status === 200,
    "delete succeeds": (response) => response.json("success") === true,
  });
}
