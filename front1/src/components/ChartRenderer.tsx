import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartConfig, ChartType } from "@/lib/api";

const COLORS = [
  "#6366f1",
  "#06b6d4",
  "#f59e0b",
  "#ec4899",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#0ea5e9",
];

interface Props {
  chartType: ChartType;
  config: ChartConfig | null;
  columns: string[];
  rows: Record<string, unknown>[];
}

const axisProps = {
  stroke: "#94a3b8",
  tick: { fontSize: 11, fill: "#94a3b8" },
  tickLine: false,
  axisLine: false,
};

const isDark = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

function getTooltipStyle() {
  const dark = isDark();
  return {
    contentStyle: {
      borderRadius: 10,
      border: "1px solid rgba(148,163,184,0.3)",
      fontSize: 12,
      boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
      background: dark ? "#0a0a0a" : "#ffffff",
      color: dark ? "#ffffff" : "#0f172a",
    },
  };
}

export default function ChartRenderer({
  chartType,
  config,
  columns,
  rows,
}: Props) {
  if (chartType === "table" || rows.length === 0) return null;

  const numericCols = columns.filter((c) =>
    rows.every((r) => typeof r[c] === "number" || !isNaN(Number(r[c])))
  );
  const x = config?.x_axis ?? columns[0];
  const y = config?.y_axis ?? numericCols.find((c) => c !== x) ?? columns[1];
  if (!x || !y) return null;

  const data = rows.map((r) => ({
    ...r,
    [y]: typeof r[y] === "number" ? r[y] : Number(r[y]),
  })) as Record<string, string | number>[];

  const title = config?.title;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
      {title && (
        <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-neutral-200">
          {title}
        </h4>
      )}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
              <XAxis dataKey={x} {...axisProps} interval={0} angle={data.length > 6 ? -20 : 0} textAnchor={data.length > 6 ? "end" : "middle"} height={data.length > 6 ? 56 : 30} />
              <YAxis {...axisProps} width={70} />
              <Tooltip cursor={{ fill: "rgba(99,102,241,0.08)" }} {...getTooltipStyle()} />
              <Bar dataKey={y} radius={[6, 6, 0, 0]} fill="var(--chart-primary)" maxBarSize={56} />
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
              <XAxis dataKey={x} {...axisProps} />
              <YAxis {...axisProps} width={70} />
              <Tooltip {...getTooltipStyle()} />
              <Line
                type="monotone"
                dataKey={y}
                stroke="var(--chart-primary)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--chart-primary)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : chartType === "pie" ? (
            <PieChart>
              <Tooltip {...getTooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Pie
                data={data}
                dataKey={y}
                nameKey={x}
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
              <XAxis dataKey={x} {...axisProps} name={x} />
              <YAxis dataKey={y} {...axisProps} name={y} width={70} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} {...getTooltipStyle()} />
              <Scatter data={data} fill="var(--chart-primary)" />
            </ScatterChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
