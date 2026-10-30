# Opt - Basic CRUD Users API

Simple Express + TypeScript CRUD API for users.  
Current storage is **in-memory** (array), so data resets on restart.

---

## How it works

Request flow:

1. `src/server.ts` starts Express on port `8000`
2. Server mounts `userRoutes` at `/api/users`
3. `src/routes/user.route.ts` maps HTTP methods to controllers
4. `src/controllers/user.controller.ts` validates input and calls service methods
5. `src/services/user.service.ts` handles business logic + in-memory data updates

---

## Project structure

- `src/server.ts`  
  App bootstrap, JSON middleware, route mounting, listen on `8000`

- `src/routes/user.route.ts`  
  Route definitions:
  - `POST /`
  - `DELETE /:id`
  - `PUT /:id`
  - `GET /`

- `src/controllers/user.controller.ts`  
  Controller layer:
  - `addUserController`
  - `removeUserController`
  - `updateUserController`
  - `getUsersController`

- `src/services/user.service.ts`  
  Data contracts + business logic:
  - `User`, `AddUserPayload`, `UpdateUserPayload`
  - `users` array (in-memory)
  - `addUser`, `removeUser`, `updateUser`

- `test/users.k6.js`  
  k6 load script for user endpoints

- `test/users.breakpoint.k6.js`  
  k6 breakpoint/stress-style script

---

## API

Base URL: `http://localhost:8000/api/users`

### Create user

`POST /api/users`

Body:

```json
{
  "name": "John",
  "email": "john@example.com"
}
```

Success: `201`

---

### Get users

`GET /api/users`

Success: `200`

Response includes:

- `success: true`
- `users: User[]`

---

### Update user

`PUT /api/users/:id`

Body (partial allowed):

```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

Success: `200`  
Not found: `404`

---

### Delete user

`DELETE /api/users/:id`

Success: `200`

---

## Service behavior (current implementation)

- IDs auto-increment from `1` using `nextId`
- Users are stored in exported `users` array
- Update keeps old value when `name` or `email` is `null`
- Delete always returns success (even if ID does not exist)
- Data is not persisted (lost on process restart)

---

## Run locally

Install dependencies:

```bash
npm install
```

Start app (use your project script):

```bash
npm run dev
```

Server:

- `http://localhost:8000`
- Users API at `http://localhost:8000/api/users`

---

## Quick curl checks

Create:

```bash
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'
```

Get all:

```bash
curl http://localhost:8000/api/users
```

Update:

```bash
curl -X PUT http://localhost:8000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Updated"}'
```

Delete:

```bash
curl -X DELETE http://localhost:8000/api/users/1
```

---

## Load testing scripts (k6)

If k6 is installed:

```bash
k6 run test/users.k6.js
k6 run test/users.breakpoint.k6.js
```

---

## Scaling direction

To optimize for scale, replace the in-memory `users` store with a database and keep route/controller/service separation unchanged.
Suggested next steps:

- Add DB layer (PostgreSQL/MySQL/MongoDB)
- Add validation schema (Zod/Joi)
- Add pagination/filtering for `GET /api/users`
- Add centralized error handling
- Add auth/rate limiting/logging
- Add unit + integration tests in CI
