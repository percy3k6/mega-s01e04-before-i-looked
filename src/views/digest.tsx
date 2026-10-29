import type { NightDigest } from '../digest/types.js';

function rowClass(row: { retries: number; lastStatus: string }) {
  if (row.lastStatus === 'fail') return 'warn';
  if (row.retries >= 3) return 'warn';
  return '';
}

export function DigestPage({ digest }: { digest: NightDigest }) {
  if (digest.rows.length === 0) {
    return (
      <>
        <h1>digest · {digest.night}</h1>
        <p class="mute">nothing ran</p>
      </>
    );
  }
  return (
    <>
      <h1>digest · {digest.night}</h1>
      {digest.badLines > 0 ? <p class="mute">{digest.badLines} bad line(s) skipped</p> : null}
      <table>
        <thead>
          <tr>
            <th>job</th>
            <th>owner</th>
            <th>runs</th>
            <th>retries</th>
            <th>last</th>
            <th>error</th>
            <th>first</th>
            <th>last at</th>
          </tr>
        </thead>
        <tbody>
          {digest.rows.map((r) => (
            <tr class={rowClass(r)}>
              <td>{r.job}</td>
              <td>{r.owner ?? '—'}</td>
              <td>{r.runs}</td>
              <td>{r.retries}</td>
              <td>{r.lastStatus}</td>
              <td>{r.lastError ?? '—'}</td>
              <td>{r.firstAt}</td>
              <td>{r.lastAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
