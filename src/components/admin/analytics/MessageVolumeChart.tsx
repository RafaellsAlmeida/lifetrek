import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MessageVolumeChartProps {
  data: any[];
}

export function MessageVolumeChart({ data }: MessageVolumeChartProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Message Activity</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
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
            />
            <Tooltip 
                 cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                 contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px", color: "#F9FAFB" }}
            />
            <Bar dataKey="sent" name="Sent" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="received" name="Received" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
