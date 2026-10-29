import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const baseConfig = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('digest routes', () => {
  it('GET /digest/2026-10-28 returns 200 with jobs', async () => {
    process.env.LANE_MARKER = 'TEST-MARKER';
    const res = await createApp(baseConfig).request('/digest/2026-10-28');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('fixtures/refresh');
    expect(html).toContain('TEST-MARKER');
  });

  it('GET /api/digest/2026-10-28 matches page job order', async () => {
    const page = await createApp(baseConfig).request('/digest/2026-10-28');
    const api = await createApp(baseConfig).request('/api/digest/2026-10-28');
    const rows = (await api.json()) as { job: string }[];
    const html = await page.text();
    for (const { job } of rows) expect(html).toContain(job);
  });

  it('returns 404 for missing night', async () => {
    const res = await createApp(baseConfig).request('/digest/2099-12-31');
    expect(res.status).toBe(404);
  });

  it('renders nothing ran for empty night file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'runs-'));
    writeFileSync(join(dir, 'empty-night.jsonl'), '');
    const res = await createApp({ ...baseConfig, runsDir: dir }).request('/digest/empty-night');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('skips bad lines', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'runs-'));
    writeFileSync(join(dir, 'bad-night.jsonl'), '{"at":"2026-10-28T01:00:00+01:00","job":"a/b","status":"ok","owner":"x"}\nnot json\n');
    const res = await createApp({ ...baseConfig, runsDir: dir }).request('/digest/bad-night');
    expect(await res.text()).toContain('1 bad line');
  });
});
