import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { GA4TrafficSource } from "@/hooks/useGA4Analytics";

interface TrafficSourcesChartProps {
  data: GA4TrafficSource[];
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#6366f1", // indigo
];

const sourceLabels: Record<string, string> = {
  "(direct)": "Direto",
  "google": "Google",
  "linkedin": "LinkedIn",
  "linkedin.com": "LinkedIn",
  "instagram": "Instagram",
  "facebook": "Facebook",
  "twitter": "Twitter",
  "bing": "Bing",
};

export function TrafficSourcesChart({ data }: TrafficSourcesChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fontes de Tráfego</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Sem dados para o período selecionado
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 6).map((source, index) => ({
    name: sourceLabels[source.source.toLowerCase()] || source.source,
    value: source.sessions,
    medium: source.medium,
    color: COLORS[index % COLORS.length],
  }));

  // Add "Outros" if there are more sources
  if (data.length > 6) {
    const otherSessions = data.slice(6).reduce((sum, s) => sum + s.sessions, 0);
    chartData.push({
      name: "Outros",
      value: otherSessions,
      medium: "various",
      color: "#94a3b8",
    });
  }

  const totalSessions = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fontes de Tráfego</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => 
                percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
              }
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                `${value.toLocaleString()} sessões (${((value / totalSessions) * 100).toFixed(1)}%)`,
                "Sessões"
              ]}
            />
            <Legend 
              verticalAlign="bottom"
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
