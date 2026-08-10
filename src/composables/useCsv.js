
const escapeCell = value => {
  if (value === null || value === undefined) return '""';
  return `"${String(value).replace(/"/g, '""')}"`;
};

export const toCsv = (headers, rows, preamble = []) => [
  ...preamble.map(line => escapeCell(line)),
  headers.map(escapeCell).join(','),
  ...rows.map(row => row.map(escapeCell).join(','))
].join('\r\n');

export const todayStamp = () => new Date().toISOString().split('T')[0];

export const downloadCsvFile = (filename, headers, rows, preamble = []) => {
  const blob = new Blob(['﻿' + toCsv(headers, rows, preamble)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
