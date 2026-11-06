export type Cell = string | number | boolean | Date | null | undefined;

const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * One CSV cell. Strings that a spreadsheet would run as a formula (= + - @ tab CR) are prefixed with an
 * apostrophe so a habit named "=HYPERLINK(...)" opens as text. Numbers are written as-is.
 */
export function cell(value: Cell): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** RFC 4180 rows (CRLF), with a UTF-8 byte-order mark so Excel reads non-ASCII names correctly. */
export function toCsv(header: string[], rows: Cell[][]): string {
  return '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}
