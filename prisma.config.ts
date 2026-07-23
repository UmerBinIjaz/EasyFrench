import { existsSync } from "node:fs";
import { defineConfig } from "@prisma/config";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
} else if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

export default defineConfig({
  migrations: {
    seed: 'npx tsx --env-file=.env.local prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
