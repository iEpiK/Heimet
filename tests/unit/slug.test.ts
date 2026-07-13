import { describe, expect, it } from "vitest";
import { lagSlug } from "@/lib/slug";

describe("lagSlug", () => {
  it("håndterer norske tegn", () => {
    expect(lagSlug("Bålkos på Røros")).toMatch(/^balkos-pa-roros-[0-9a-f]{6}$/);
  });

  it("håndterer tomt navn", () => {
    expect(lagSlug("!!!")).toMatch(/^uten-navn-[0-9a-f]{6}$/);
  });

  it("gir unike slugs for samme navn", () => {
    expect(lagSlug("Voss")).not.toBe(lagSlug("Voss"));
  });
});
