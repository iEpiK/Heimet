import { describe, expect, it } from "vitest";
import { hentSesong } from "@/lib/aarshjul";

describe("hentSesong", () => {
  it("finner 17. mai", () => {
    expect(hentSesong(new Date(2026, 4, 17)).navn).toBe("Grunnlovsdagen");
  });

  it("finner julehøytiden", () => {
    expect(hentSesong(new Date(2026, 11, 24)).navn).toBe("Julehøytiden");
  });

  it("håndterer intervall over årsskiftet (mørketida)", () => {
    expect(hentSesong(new Date(2026, 10, 20)).navn).toBe("Mørketida");
    expect(hentSesong(new Date(2026, 0, 10)).navn).toBe("Mørketida");
  });

  it("gir alltid en sesong", () => {
    for (let m = 0; m < 12; m++) {
      for (const d of [1, 15, 28]) {
        expect(hentSesong(new Date(2026, m, d)).navn).toBeTruthy();
      }
    }
  });
});
