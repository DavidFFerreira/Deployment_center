import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEnv, matchesLog, summarizeUptime } from '../lib/observability.js';

test('uptime has no synthetic measurements and aggregates real samples', () => {
  const date = new Date('2026-09-10T12:00:00Z');
  assert.equal(summarizeUptime({}, date).uptime_percent, null);
  const result = summarizeUptime({ '2026-09-10': { checks: 4, online: 3, latencySum: 60 } }, date);
  assert.equal(result.uptime_percent, 75);
  assert.equal(result.latency_ms, 20);
  assert.equal(result.days[0].status, 'unknown');
});
test('search filters lines and warnings include errors', () => {
  assert.equal(matchesLog('ERROR needle', 'needle', 'warn').matches, true);
  assert.equal(matchesLog('WARN other', 'needle', 'warn').matches, false);
  assert.equal(matchesLog('INFO needle', 'needle', 'warn').matches, false);
});
test('env parser preserves secrets with equals, quotes and literal dollar signs', () => {
  assert.deepEqual(parseEnv('# comment\nKEY="a=b$literal"\nexport URL=https://example.test # note\n'), { KEY: 'a=b$literal', URL: 'https://example.test' });
  assert.throws(() => parseEnv('broken line'), /inválida/);
});
