import { describe, expect, it } from "vitest";
import { innenforGrense } from "@/lib/ratelimit";

describe("innenforGrense", () => {
  it("tillater opp til maks og stopper deretter", () => {
    const nokkel = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(innenforGrense(nokkel, 3, 60_000)).toBe(true);
    }
    expect(innenforGrense(nokkel, 3, 60_000)).toBe(false);
  });

  it("skiller mellom nøkler", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(innenforGrense(a, 1, 60_000)).toBe(true);
    expect(innenforGrense(b, 1, 60_000)).toBe(true);
    expect(innenforGrense(a, 1, 60_000)).toBe(false);
  });
});
