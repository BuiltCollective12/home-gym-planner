import { describe, expect, it } from "vitest";
import {
  formatArea,
  formatFeetInches,
  formatLength,
  formatUsd,
  formatWeight,
  parseLengthToInches,
} from "@/lib/units";

describe("formatFeetInches", () => {
  it("formats whole feet without inches", () => {
    expect(formatFeetInches(96)).toBe("8'");
  });

  it("formats feet and inches", () => {
    expect(formatFeetInches(100)).toBe("8' 4\"");
  });

  it("formats sub-foot values as inches", () => {
    expect(formatFeetInches(9)).toBe('9"');
  });
});

describe("parseLengthToInches", () => {
  it("reads bare numbers as feet in imperial and cm in metric", () => {
    expect(parseLengthToInches("12", "imperial")).toBe(144);
    expect(parseLengthToInches("254", "metric")).toBe(100);
  });

  it("reads explicit units regardless of system", () => {
    expect(parseLengthToInches("12ft", "metric")).toBe(144);
    expect(parseLengthToInches("96in", "metric")).toBe(96);
    expect(parseLengthToInches('96"', "imperial")).toBe(96);
    expect(parseLengthToInches("254cm", "imperial")).toBe(100);
    expect(parseLengthToInches("3m", "imperial")).toBeCloseTo(118.11, 2);
  });

  it("reads combined feet-and-inches", () => {
    expect(parseLengthToInches("8' 4\"", "imperial")).toBe(100);
    expect(parseLengthToInches("8ft 4", "imperial")).toBe(100);
  });

  it("handles decimals and stray whitespace", () => {
    expect(parseLengthToInches("  12.5  ", "imperial")).toBe(150);
  });

  it("returns null for garbage", () => {
    expect(parseLengthToInches("", "imperial")).toBeNull();
    expect(parseLengthToInches("wide", "imperial")).toBeNull();
    expect(parseLengthToInches("12 x 20", "imperial")).toBeNull();
  });
});

describe("display formatting", () => {
  it("switches length units", () => {
    expect(formatLength(96, "imperial")).toBe("8'");
    expect(formatLength(100, "metric")).toBe("254 cm");
  });

  it("switches weight units", () => {
    expect(formatWeight(1000, "imperial")).toBe("1,000 lb");
    expect(formatWeight(1000, "metric")).toBe("454 kg");
  });

  it("switches area units", () => {
    expect(formatArea(240, "imperial")).toBe("240 sq ft");
    expect(formatArea(240, "metric")).toBe("22.3 m²");
  });

  it("formats whole-dollar currency", () => {
    expect(formatUsd(2495)).toBe("$2,495");
  });
});
