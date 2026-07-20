import { describe, expect, it } from 'vitest';
import { escapeSpreadsheetCell } from '../domain/csv';

describe('CSV Domain - escapeSpreadsheetCell', () => {
  it('handles null or undefined safely', () => {
    expect(escapeSpreadsheetCell(null)).toBe('');
    expect(escapeSpreadsheetCell(undefined)).toBe('');
  });

  it('handles normal text correctly', () => {
    expect(escapeSpreadsheetCell('Normal text')).toBe('"Normal text"');
    expect(escapeSpreadsheetCell('12345')).toBe('"12345"');
  });

  it('escapes quotes correctly', () => {
    expect(escapeSpreadsheetCell('Text with "quotes"')).toBe('"Text with ""quotes"""');
  });

  it('neutralizes spreadsheet formulas (=, +, -, @)', () => {
    expect(escapeSpreadsheetCell('=1+1')).toBe('"\'=1+1"');
    expect(escapeSpreadsheetCell('+cmd')).toBe('"\'+cmd"');
    expect(escapeSpreadsheetCell('-10+20')).toBe('"\'-10+20"');
    expect(escapeSpreadsheetCell('@SUM(A1:A2)')).toBe('"\'@SUM(A1:A2)"');
  });

  it('neutralizes formulas with leading whitespace or invisible characters', () => {
    expect(escapeSpreadsheetCell('  =1+1')).toBe('"\'  =1+1"');
    expect(escapeSpreadsheetCell('\t@SUM(A1)')).toBe('"\'\t@SUM(A1)"');
    expect(escapeSpreadsheetCell('\r\n+cmd')).toBe('"\'\r\n+cmd"');
  });

  it('neutralizes fullwidth formula characters', () => {
    expect(escapeSpreadsheetCell('＝1+1')).toBe('"\'＝1+1"');
    expect(escapeSpreadsheetCell('＋cmd')).toBe('"\'＋cmd"');
    expect(escapeSpreadsheetCell('－10')).toBe('"\'－10"');
    expect(escapeSpreadsheetCell('＠SUM')).toBe('"\'＠SUM"');
  });

  it('does not prefix if formula character is not at the start', () => {
    expect(escapeSpreadsheetCell('Test =1+1')).toBe('"Test =1+1"');
    expect(escapeSpreadsheetCell('Value -10')).toBe('"Value -10"');
  });
});
