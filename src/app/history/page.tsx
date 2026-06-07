"use client"

import { StudyHeatMap } from "@/components/dashboard/heat-map"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart, 
  LineChart, 
  Activity, 
  TrendingUp, 
  Target, 
  Calendar,
  Clock,
  Zap,
  CheckCircle2,
  Trophy
} from "lucide-react"
import { 
  Bar, 
  BarChart as RechartBar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartTooltip, 
  ResponsiveContainer, 
  Line, 
  LineChart as RechartLine 
} from "recharts"

const weeklyData = [
  { day: "Mon", hours: 4.5 },
  { day: "Tue", hours: 6.2 },
  { day: "Wed", hours: 3.8 },
  { day: "Thu", hours: 7.1 },
  { day: "Fri", hours: 5.4 },
  { day: "Sat", hours: 8.2 },
  { day: "Sun", hours: 2.5 },
]

const scoreTrend = [
  { week: "W1", score: 65 },
  { week: "W2", score: 72 },
  { week: "W3", score: 68 },
  { week: "W4", score: 85 },
  { week: "W5", score: 78 },
  { week: "W6", score: 92 },
]

export default function HistoryPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" /> Study Analytics
          </h1>
          <p className="text-muted-foreground">Detailed insights into your learning habits and academic progress.</p>
        </div>
        <div className="flex items-center gap-2 glass p-2 rounded-xl border-white/5">
          <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
          <select className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer outline-none px-2">
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
            <option>This Year</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Productivity Score", value: "88/100", trend: "+12%", icon: Target, color: "text-accent" },
          { label: "Avg. Session", value: "2h 15m", trend: "+5m", icon: Clock, color: "text-blue-400" },
          { label: "Concepts Mastered", value: "154", trend: "+22", icon: Zap, color: "text-yellow-400" },
          { label: "Study Ranking", value: "Top 5%", trend: "↑ 2", icon: Trophy, color: "text-purple-400" },
        ].map((metric) => (
          <Card key={metric.label} className="glass border-none">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-white/5 ${metric.color}`}>
                  <metric.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">{metric.trend}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{metric.label}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 glass border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Weekly Study Volume
            </CardTitle>
            <CardDescription>Total hours spent on reading and lectures this week.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartBar data={weeklyData}>
                <XAxis 
                  dataKey="day" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}h`}
                />
                <RechartTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(24, 20, 30, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff' 
                  }}
                />
                <Bar 
                  dataKey="hours" 
                  fill="hsl(var(--primary))" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                />
              </RechartBar>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" /> Accuracy Trend
            </CardTitle>
            <CardDescription>Performance in AI-generated quizzes.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartLine data={scoreTrend}>
                <XAxis 
                  dataKey="week" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <RechartTooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(24, 20, 30, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff' 
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </RechartLine>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="glass border-none">
          <CardHeader>
            <CardTitle>Study Heatmap</CardTitle>
            <CardDescription>Daily activity intensity over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <StudyHeatMap />
          </CardContent>
        </Card>

        <Card className="glass border-none overflow-hidden">
          <CardHeader>
            <CardTitle>Recent Milestones</CardTitle>
            <CardDescription>Your latest achievements and certificates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Neuroscience Pro", desc: "Completed all topics in Neuroanatomy unit", icon: CheckCircle2, date: "2 days ago" },
              { title: "Quiz Master", desc: "Maintained 90% accuracy in Pathology quizzes for a week", icon: Trophy, date: "5 days ago" },
              { title: "Longest Session", desc: "Studied for 8.2 hours without break on Saturday", icon: Clock, date: "1 week ago" },
            ].map((milestone) => (
              <div key={milestone.title} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0 h-fit">
                  <milestone.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold">{milestone.title}</h4>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{milestone.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}