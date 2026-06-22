"use client";

import { Download } from "lucide-react";

export function ExportCsv({
  rows,
  columns,
  filename,
}: {
  rows: Record<string, any>[];
  columns: { key: string; label: string }[];
  filename: string;
}) {
  function download() {
    const esc = (v: any) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = columns.map((c) => esc(c.label)).join(",");
    const body = rows
      .map((r) => columns.map((c) => esc(r[c.key])).join(","))
      .join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="btn-outline-gold flex items-center gap-2 px-4 py-2 text-sm"
    >
      <Download size={15} /> Export CSV
    </button>
  );
}
