import { cell, toCsv } from './csv';

describe('cell', () => {
  it('writes plain text, numbers, booleans, dates and blanks', () => {
    expect(cell('DSA')).toBe('DSA');
    expect(cell(45)).toBe('45');
    expect(cell(true)).toBe('true');
    expect(cell(new Date('2026-11-06T10:00:00Z'))).toBe('2026-11-06T10:00:00.000Z');
    expect(cell(null)).toBe('');
    expect(cell(undefined)).toBe('');
  });

  it('quotes commas, quotes and line breaks, doubling inner quotes', () => {
    expect(cell('a,b')).toBe('"a,b"');
    expect(cell('say "hi"')).toBe('"say ""hi"""');
    expect(cell('two\nlines')).toBe('"two\nlines"');
  });

  it.each(['=1+1', '+1', '-1', '@SUM(A1)', '\tx', '\rx'])('neutralises formula start %j', (v) => {
    expect(cell(v).replace(/^"|"$/g, '')).toMatch(/^'/);
  });

  it('does not touch a dash or equals inside the text', () => {
    expect(cell('a=b')).toBe('a=b');
    expect(cell('Mon-Fri')).toBe('Mon-Fri');
  });

  it('keeps real numbers numeric, including negatives', () => {
    expect(cell(-3)).toBe('-3');
  });
});

describe('toCsv', () => {
  it('writes a BOM, header and CRLF rows', () => {
    expect(toCsv(['a', 'b'], [['x', 1], ['y', 2]])).toBe('﻿a,b\r\nx,1\r\ny,2\r\n');
  });

  it('writes just the header when there are no rows', () => {
    expect(toCsv(['a'], [])).toBe('﻿a\r\n');
  });
});
