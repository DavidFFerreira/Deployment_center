export function summarizeUptime(samples = {}, now = new Date()) {
  const days = [];
  let checks = 0, online = 0, latencySum = 0, latencyCount = 0;
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
    const sample = samples[date];
    const uptime = sample?.checks ? 100 * sample.online / sample.checks : null;
    const latency = sample?.online ? Math.round(sample.latencySum / sample.online) : null;
    days.push({ date, uptime_percent: uptime, latency_ms: latency, samples: sample?.checks || 0,
      status: uptime === null ? 'unknown' : uptime === 100 ? 'operational' : uptime === 0 ? 'down' : 'degraded' });
    checks += sample?.checks || 0;
    online += sample?.online || 0;
    latencySum += sample?.latencySum || 0;
    latencyCount += sample?.online || 0;
  }
  return { ok: true, history: days, days, samples: checks,
    uptime_percent: checks ? 100 * online / checks : null,
    avgUptime: checks ? `${(100 * online / checks).toFixed(1)}%` : 'Sem dados',
    latency_ms: latencyCount ? Math.round(latencySum / latencyCount) : null };
}

export function matchesLog(line, search, filter) {
  const level = /error|fatal|fail|\berr\b|panic/i.test(line) ? 'error' : /warn/i.test(line) ? 'warn' : 'info';
  const matchesLevel = filter === 'all' || filter === level || (filter === 'warn' && level === 'error');
  return { level, matches: matchesLevel && line.toLowerCase().includes(search.toLowerCase()) };
}

// Preserve values; comments and blank lines are excluded only from the runtime map.
export function parseEnv(raw) {
  const values = {};
  for (const line of String(raw).split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) {
      if (line.trim() && !line.trim().startsWith('#')) throw new Error('Linha .env inválida. Use CHAVE=valor numa linha.');
      continue;
    }
    let value = match[2];
    if (value.startsWith('"') || value.startsWith("'")) {
      const quote = value[0];
      const end = value.lastIndexOf(quote);
      if (end === 0 || (value.slice(end + 1).trim() && !value.slice(end + 1).trim().startsWith('#'))) throw new Error('Valor .env com aspas inválidas.');
      value = value.slice(1, end);
      if (quote === '"') value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\"/g, '"');
    } else value = value.replace(/\s+#.*$/, '').trim();
    values[match[1]] = value;
  }
  return values;
}
