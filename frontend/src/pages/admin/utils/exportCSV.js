// Utility: CSV export
export function exportCSV(filename, rows, columns) {
  try {
    const header = columns.map(c => `"${c.label}"`).join(',');
    const body = rows.map(row => {
      return columns.map(col => {
        const val = typeof col.value === 'function' ? col.value(row) : row[col.key];
        return `"${String(val || '').replace(/"/g, '""')}"`;
      }).join(',');
    }).join('\n');
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('CSV export failed:', err);
  }
}
