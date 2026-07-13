import { describe, expect, it } from "vitest";
import { lagICal } from "@/lib/stevner";

describe("lagICal", () => {
  it("genererer gyldig VCALENDAR med escaping", () => {
    const ical = lagICal({
      id: "abc123",
      tittel: "Tur; med, komma",
      beskrivelse: "Linje1\nLinje2",
      sted: "Voss",
      start: new Date("2026-08-01T10:00:00Z"),
      slutt: new Date("2026-08-01T14:00:00Z"),
    });
    expect(ical).toContain("BEGIN:VCALENDAR");
    expect(ical).toContain("SUMMARY:Tur\\; med\\, komma");
    expect(ical).toContain("DESCRIPTION:Linje1\\nLinje2");
    expect(ical).toContain("DTSTART:20260801T100000Z");
    expect(ical).toContain("DTEND:20260801T140000Z");
    expect(ical).toContain("END:VCALENDAR");
  });

  it("utelater DTEND uten sluttid", () => {
    const ical = lagICal({
      id: "x",
      tittel: "Kaffe",
      beskrivelse: null,
      sted: null,
      start: new Date("2026-08-01T10:00:00Z"),
      slutt: null,
    });
    expect(ical).not.toContain("DTEND");
  });
});
