import { vi } from "vitest";

// Mock DB so tests don't need a real Neon connection
vi.mock("@/db/index", () => ({
  db: {},
}));

// Suppress console logs in tests
vi.spyOn(console, "log").mockImplementation(() => {});
