import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const night = process.argv[2] ?? '2026-10-28';
const out = resolve(process.argv[3] ?? 'docs/preview.html');
const config = loadConfig();
const res = await createApp(config).request(`/digest/${night}`);
if (res.status !== 200) {
  console.error(`expected 200, got ${res.status}`);
  process.exit(1);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, await res.text());
console.log(`wrote ${out} (${res.status})`);
