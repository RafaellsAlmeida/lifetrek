
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WeeklyReportDashboard } from "@/components/WeeklyReportDashboard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AnalyticsSection() {
    const data = [
      { name: 'Mon', calls: 4, emails: 12 },
      { name: 'Tue', calls: 7, emails: 18 },
      { name: 'Wed', calls: 5, emails: 10 },
      { name: 'Thu', calls: 9, emails: 23 },
      { name: 'Fri', calls: 12, emails: 8 },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Performance Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Activity Overview</CardTitle>
                        <CardDescription>Calls vs Emails this week</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: '#f1f5f9'}} />
                                <Bar dataKey="emails" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="calls" fill="#0f172a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                   <WeeklyReportDashboard />
                </div>
            </div>
        </div>
    );
}
