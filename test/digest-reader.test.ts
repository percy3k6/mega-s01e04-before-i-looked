import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/readNight.js';

describe('readNight', () => {
  it('reads 2026-10-28 with five jobs and one bad line', () => {
    const d = readNight('runs', '2026-10-28');
    expect(d).not.toBeNull();
    expect(d!.badLines).toBe(1);
    expect(d!.rows).toHaveLength(5);
    expect(d!.rows.map((r) => r.job).sort()).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    const sync = d!.rows.find((r) => r.job === 'lane/sync')!;
    expect(sync.retries).toBeGreaterThanOrEqual(1);
    const notes = d!.rows.find((r) => r.job === 'notes/backup')!;
    expect(notes.lastStatus).toBe('fail');
  });

  it('returns null for a missing night', () => {
    expect(readNight('runs', '1999-01-01')).toBeNull();
  });

  it('returns empty rows for an empty file', () => {
    const d = readNight('test/fixtures', 'empty-night');
    expect(d?.rows).toEqual([]);
  });
});
