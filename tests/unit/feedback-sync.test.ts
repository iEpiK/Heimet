import { describe, expect, it } from "vitest";
import { kanGiFeedbackSync } from "@/lib/innlegg";

const venner = new Set(["venn1", "venn2"]);

describe("kanGiFeedbackSync", () => {
  it("INGEN stopper alle, også forfatteren", () => {
    const innlegg = { forfatterId: "meg", feedbackPolicy: "INGEN" as const };
    expect(kanGiFeedbackSync(innlegg, "meg", venner)).toBe(false);
    expect(kanGiFeedbackSync(innlegg, "venn1", venner)).toBe(false);
  });

  it("VENNER slipper kun venner og forfatteren til", () => {
    const innlegg = { forfatterId: "venn1", feedbackPolicy: "VENNER" as const };
    expect(kanGiFeedbackSync(innlegg, "venn1", venner)).toBe(true); // forfatter
    expect(kanGiFeedbackSync(innlegg, "meg", venner)).toBe(true); // venn av forfatter
    const fremmedInnlegg = { forfatterId: "fremmed", feedbackPolicy: "VENNER" as const };
    expect(kanGiFeedbackSync(fremmedInnlegg, "meg", venner)).toBe(false);
  });

  it("ALLE slipper alle til", () => {
    const innlegg = { forfatterId: "fremmed", feedbackPolicy: "ALLE" as const };
    expect(kanGiFeedbackSync(innlegg, "meg", venner)).toBe(true);
  });
});
