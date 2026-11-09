import { defineConfig } from "@playwright/test";
// Start the stack first: `docker compose up --build` (or the dev servers) and `python manage.py seed_demo`.
export default defineConfig({ testDir: ".", use: { baseURL: process.env.STORE_URL || "http://localhost:5173" }, retries: 1 });
