export type UnitSystem = "imperial" | "metric";

export const CM_PER_IN = 2.54;
export const KG_PER_LB = 0.45359237;

export function inToCm(inches: number): number {
  return inches * CM_PER_IN;
}

export function cmToIn(cm: number): number {
  return cm / CM_PER_IN;
}

/** 100 -> `8' 4"` */
export function formatFeetInches(inches: number): string {
  const rounded = Math.round(inches * 10) / 10;
  const feet = Math.floor(rounded / 12);
  const rest = Math.round((rounded - feet * 12) * 10) / 10;
  if (feet === 0) return `${rest}"`;
  if (rest === 0) return `${feet}'`;
  return `${feet}' ${rest}"`;
}

export function formatLength(inches: number, units: UnitSystem): string {
  return units === "metric"
    ? `${Math.round(inToCm(inches))} cm`
    : formatFeetInches(inches);
}

export function formatWeight(lbs: number, units: UnitSystem): string {
  return units === "metric"
    ? `${Math.round(lbs * KG_PER_LB).toLocaleString()} kg`
    : `${Math.round(lbs).toLocaleString()} lb`;
}

export function formatArea(sqft: number, units: UnitSystem): string {
  return units === "metric"
    ? `${(sqft * 0.092903).toFixed(1)} m²`
    : `${Math.round(sqft).toLocaleString()} sq ft`;
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/**
 * Parse loose length input into inches.
 * Accepts: `12`, `12'`, `12ft`, `12' 6"`, `12.5`, `150in`, `380cm`, `3.8m`.
 * Bare numbers are read in the given unit system (feet for imperial).
 */
export function parseLengthToInches(
  raw: string,
  units: UnitSystem,
): number | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;

  const cm = s.match(/^([\d.]+)\s*cm$/);
  if (cm) return cmToIn(parseFloat(cm[1]));

  const m = s.match(/^([\d.]+)\s*m$/);
  if (m) return cmToIn(parseFloat(m[1]) * 100);

  const inch = s.match(/^([\d.]+)\s*(?:in|")$/);
  if (inch) return parseFloat(inch[1]);

  const ftIn = s.match(/^([\d.]+)\s*(?:'|ft|feet)\s*([\d.]+)\s*(?:in|")?$/);
  if (ftIn) return parseFloat(ftIn[1]) * 12 + parseFloat(ftIn[2]);

  const ft = s.match(/^([\d.]+)\s*(?:'|ft|feet)$/);
  if (ft) return parseFloat(ft[1]) * 12;

  const bare = s.match(/^([\d.]+)$/);
  if (bare) {
    const value = parseFloat(bare[1]);
    return units === "metric" ? cmToIn(value) : value * 12;
  }

  return null;
}
