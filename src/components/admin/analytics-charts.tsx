"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const GOLD = "#c8a25a";
const PIE_COLORS = ["#c8a25a", "#7c8aa5", "#9c7b3d", "#5a6b52", "#8a5a5a"];

export function LeadsByStatusChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h3 className="mb-4 font-semibold text-white">Estimates by status</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
          <XAxis dataKey="status" stroke="#8a8a93" fontSize={12} />
          <YAxis stroke="#8a8a93" fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#16161a", border: "1px solid #2a2a30", borderRadius: 6, color: "#fff" }}
            cursor={{ fill: "rgba(200,162,90,0.08)" }}
          />
          <Bar dataKey="count" fill={GOLD} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConsultationsByStatusChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h3 className="mb-4 font-semibold text-white">Consultations by status</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="status" outerRadius={90} label>
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#16161a", border: "1px solid #2a2a30", borderRadius: 6, color: "#fff" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
