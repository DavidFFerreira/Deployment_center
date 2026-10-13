import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function parseSizeToBytes(sizeStr) {
  if (typeof sizeStr === 'number') return sizeStr;
  if (!sizeStr || typeof sizeStr !== 'string') return 0;
  const s = sizeStr.trim();
  const match = s.match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  if (unit === 'KB' || unit === 'KIB') return val * 1024;
  if (unit === 'MB' || unit === 'MIB') return val * 1024 * 1024;
  if (unit === 'GB' || unit === 'GIB') return val * 1024 * 1024 * 1024;
  if (unit === 'TB' || unit === 'TIB') return val * 1024 * 1024 * 1024 * 1024;
  return val;
}

describe('Tabelas & Storage Filtering/Sorting', () => {
  it('parseSizeToBytes correctly handles diverse units and byte sizes', () => {
    assert.equal(parseSizeToBytes('120 kB'), 120 * 1024);
    assert.equal(parseSizeToBytes('3047 MB'), 3047 * 1024 * 1024);
    assert.equal(parseSizeToBytes('1.5 GB'), 1.5 * 1024 * 1024 * 1024);
    assert.equal(parseSizeToBytes('500 bytes'), 500);
    assert.equal(parseSizeToBytes(102400), 102400);
    assert.equal(parseSizeToBytes('-'), 0);
    assert.equal(parseSizeToBytes(null), 0);
  });

  it('filters and sorts database tables by name, size and rows', () => {
    const tables = [
      { schema_name: 'public', table_name: 'gym_members', row_count_estimate: 2500, total_size: '12 MB', total_size_bytes: 12582912, rls_enabled: true },
      { schema_name: 'auth', table_name: 'audit_log_entries', row_count_estimate: 111, total_size: '120 kB', total_size_bytes: 122880, rls_enabled: true },
      { schema_name: 'storage', table_name: 'objects', row_count_estimate: 50, total_size: '2 MB', total_size_bytes: 2097152, rls_enabled: false },
      { schema_name: 'public', table_name: 'plans', row_count_estimate: 10, total_size: '16 kB', total_size_bytes: 16384, rls_enabled: false },
    ];

    // Search query 'audit'
    const filtered = tables.filter(t => `${t.schema_name}.${t.table_name}`.includes('audit'));
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].table_name, 'audit_log_entries');

    // Sort by size descending
    const sortedBySize = [...tables].sort((a, b) => b.total_size_bytes - a.total_size_bytes);
    assert.equal(sortedBySize[0].table_name, 'gym_members');
    assert.equal(sortedBySize[sortedBySize.length - 1].table_name, 'plans');

    // Sort by rows descending
    const sortedByRows = [...tables].sort((a, b) => b.row_count_estimate - a.row_count_estimate);
    assert.equal(sortedByRows[0].table_name, 'gym_members');
    assert.equal(sortedByRows[1].table_name, 'audit_log_entries');
  });

  it('filters and sorts storage files and folders', () => {
    const folders = [{ name: 'avatars', path: 'avatars' }, { name: 'docs', path: 'docs' }];
    const files = [
      { name: 'b.jpg', displayName: 'b.jpg', sizeBytes: 2048 },
      { name: 'a.png', displayName: 'a.png', sizeBytes: 102400 },
      { name: 'report.pdf', displayName: 'report.pdf', sizeBytes: 524288 },
    ];

    // Search by '.png'
    const pngFiles = files.filter(f => f.displayName.includes('.png'));
    assert.equal(pngFiles.length, 1);
    assert.equal(pngFiles[0].name, 'a.png');

    // Sort files by size descending
    const sortedBySize = [...files].sort((a, b) => b.sizeBytes - a.sizeBytes);
    assert.equal(sortedBySize[0].name, 'report.pdf');
    assert.equal(sortedBySize[2].name, 'b.jpg');
  });
});
