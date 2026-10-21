import { Types } from "mongoose";
import { Decimal } from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

export type DecimalInstance = Decimal;

/**
 * Converts a string, number, Decimal, or Decimal128 to mongoose Decimal128
 */
export function toDecimal128(value: string | number | DecimalInstance | Types.Decimal128 | null | undefined): Types.Decimal128 | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (value instanceof Types.Decimal128) {
    return value;
  }
  const str = value instanceof Decimal ? value.toString() : String(value).trim();
  return Types.Decimal128.fromString(str);
}

/**
 * Converts a mongoose Decimal128 or string into a Decimal object for lossless math
 */
export function toDecimal(value: string | number | DecimalInstance | Types.Decimal128 | null | undefined): DecimalInstance {
  if (value === null || value === undefined || value === "") {
    return new Decimal(0);
  }
  if (value instanceof Decimal) {
    return value;
  }
  if (value instanceof Types.Decimal128) {
    return new Decimal(value.toString());
  }
  return new Decimal(String(value).trim());
}

/**
 * Converts any decimal representation into standard string with 2 decimal places
 */
export function formatDecimalString(value: string | number | DecimalInstance | Types.Decimal128 | null | undefined): string {
  return toDecimal(value).toFixed(2);
}
