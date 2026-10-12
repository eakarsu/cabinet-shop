import NativeAIReport from "@/components/NativeAIReport";

type SavedReport = {
  id: string;
  feature: string;
  result: string | null;
  createdAt: Date;
};

export function AIReportHistory({ reports }: { reports: SavedReport[] }) {
  if (!reports.length) return <p className="text-sm text-muted-foreground">No saved AI reports yet.</p>;
  return <div className="space-y-3">{reports.map(report => <details key={report.id} className="rounded-md border border-border bg-card p-4">
    <summary className="cursor-pointer text-sm font-medium text-white">{report.feature.replace(/_/g, " ")} · {report.createdAt.toLocaleString()}</summary>
    <NativeAIReport value={report.result} title="Saved AI report" />
  </details>)}</div>;
}
