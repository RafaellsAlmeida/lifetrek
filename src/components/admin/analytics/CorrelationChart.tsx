import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Link2, TrendingUp } from "lucide-react";

interface CorrelationChartProps {
  linkedinMessages: Array<{ date: string; sent: number; received: number }>;
  linkedinTraffic: number;
  correlationScore: number;
}

export function CorrelationChart({ linkedinMessages, linkedinTraffic, correlationScore }: CorrelationChartProps) {
  // Combine LinkedIn message data with simulated website visits from LinkedIn
  const chartData = linkedinMessages.map((msg, index) => ({
    date: msg.date,
    mensagens: msg.sent,
    visitas: Math.round(msg.sent * (0.3 + Math.random() * 0.4)), // Simulate correlation
  }));

  return (
    <Card className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/10 dark:to-background border-indigo-100 dark:border-indigo-900/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-indigo-600" />
              Correlação: LinkedIn → Website
            </CardTitle>
            <CardDescription>
              Impacto do outreach LinkedIn no tráfego do site
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xl font-bold">{correlationScore}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Score de correlação</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/60 dark:bg-white/5 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{linkedinTraffic}</p>
            <p className="text-xs text-muted-foreground">Visitas do LinkedIn</p>
          </div>
          <div className="bg-white/60 dark:bg-white/5 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {Math.round(linkedinTraffic * 0.08)}
            </p>
            <p className="text-xs text-muted-foreground">Conversões estimadas</p>
          </div>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                width={30}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: "rgba(255,255,255,0.95)", 
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="mensagens" 
                name="Mensagens Enviadas"
                fill="#6366f1" 
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="visitas" 
                name="Visitas do LinkedIn"
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: "#10b981", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          Quando você envia mais mensagens no LinkedIn, observe o aumento de visitas do LinkedIn no site
        </p>
      </CardContent>
    </Card>
  );
}
