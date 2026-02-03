import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConnectionGrowthChartProps {
  data: any[];
}

export function ConnectionGrowthChart({ data }: ConnectionGrowthChartProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Connection Growth</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
                dataKey="date" 
                stroke="#6B7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
            />
            <YAxis 
                stroke="#6B7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px", color: "#F9FAFB" }}
            />
            <Line 
                type="monotone" 
                dataKey="connections" 
                stroke="#2563EB" 
                strokeWidth={2} 
                dot={{ r: 4, fill: "#2563EB" }}
                activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
