// Export ledger data to CSV file

export function exportContactLedgerToCSV(contact) {
  if (!contact || !contact.udhars || contact.udhars.length === 0) {
    alert('No transactions to export for this contact.');
    return;
  }

  const headers = ['Transaction ID', 'Contact Name', 'Identity', 'Amount', 'Type', 'Date'];
  const rows = contact.udhars.map((u) => [
    `"${u.udhar_id || ''}"`,
    `"${contact.name}"`,
    `"${contact.identity || ''}"`,
    u.amount,
    `"${u.type}"`,
    `"${u.date}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `${contact.name.replace(/\s+/g, '_')}_ledger.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
