import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, NightDigest, RunLine } from './types.js';

function parseLine(line: string): RunLine | null {
  try {
    const o = JSON.parse(line) as Partial<RunLine>;
    if (!o.at || !o.job || !o.status) return null;
    if (o.status !== 'ok' && o.status !== 'retry' && o.status !== 'fail') return null;
    return {
      at: o.at,
      job: o.job,
      status: o.status,
      owner: o.owner ?? null,
      error: o.error,
    };
  } catch {
    return null;
  }
}

function mergeRow(rows: Map<string, DigestRow>, line: RunLine) {
  const prev = rows.get(line.job);
  if (!prev) {
    rows.set(line.job, {
      job: line.job,
      owner: line.owner,
      runs: 1,
      retries: line.status === 'retry' ? 1 : 0,
      lastStatus: line.status,
      lastError: line.error,
      firstAt: line.at,
      lastAt: line.at,
    });
    return;
  }
  prev.runs += 1;
  if (line.status === 'retry') prev.retries += 1;
  prev.lastStatus = line.status;
  prev.lastAt = line.at;
  if (line.error) prev.lastError = line.error;
  if (line.owner !== null) prev.owner = line.owner;
}

/** Read runs/<night>.jsonl into one row per job. Returns null if the night file is missing. */
export function readNight(runsDir: string, night: string): NightDigest | null {
  const path = join(runsDir, `${night}.jsonl`);
  if (!existsSync(path)) return null;
  const text = readFileSync(path, 'utf8');
  if (text.trim() === '') {
    return { night, rows: [], badLines: 0 };
  }
  const rows = new Map<string, DigestRow>();
  let badLines = 0;
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    const parsed = parseLine(line);
    if (!parsed) {
      badLines += 1;
      continue;
    }
    mergeRow(rows, parsed);
  }
  const sorted = [...rows.values()].sort((a, b) => a.job.localeCompare(b.job));
  return { night, rows: sorted, badLines };
}

export function nightCounts(digest: NightDigest): { ok: number; retry: number; fail: number } {
  let ok = 0;
  let retry = 0;
  let fail = 0;
  for (const r of digest.rows) {
    if (r.lastStatus === 'ok') ok += 1;
    else if (r.lastStatus === 'retry') retry += 1;
    else fail += 1;
  }
  return { ok, retry, fail };
}
