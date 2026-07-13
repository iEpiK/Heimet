import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "tests/e2e/**"],
    setupFiles: ["dotenv/config"],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
