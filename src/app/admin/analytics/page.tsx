"use client"

import { useState, useMemo, useEffect } from "react"
import { useUser, useDoc, useFirestore } from "@/firebase"
import {
  doc, collection, query, where, orderBy, limit,
  getCountFromServer, getDocs, Timestamp
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Lock, ArrowLeft, BarChart3, Users, Eye, Clock } from "lucide-react"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type RangeKey = "today" | "week" | "month"

type Bucket = { label: string; start: Date; end: Date }

function buildBuckets(range: RangeKey): Bucket[] {
  const now = new Date()
  const buckets: Bucket[] = []

  if (range === "today") {
    for (let h = 23; h >= 0; h--) {
      const end = new Date(now)
      end.setMinutes(0, 0, 0)
      end.setHours(end.getHours() - h + 1)
      const start = new Date(end)
      start.setHours(start.getHours() - 1)
      buckets.push({ label: start.getHours().toString().padStart(2, "0") + ":00", start, end })
    }
  } else {
    const days = range === "week" ? 7 : 30
    for (let d = days - 1; d >= 0; d--) {
      const end = new Date(now)
      end.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() - d + 1)
      const start = new Date(end)
      start.setDate(start.getDate() - 1)
      buckets.push({
        label: start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        start,
        end,
      })
    }
  }
  return buckets
}

export default function AnalyticsAdminPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const [range, setRange] = useState<RangeKey>("today")
  const [chartData, setChartData] = useState<{ label: string; views: number }[]>([])
  const [totalViews, setTotalViews] = useState<number | null>(null)
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [activeUsers, setActiveUsers] = useState<number | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const isAdmin = !authLoading && !profileLoading && user && (profile as any)?.role === 'admin'

  useEffect(() => {
    if (!isAdmin || !db) return
    let cancelled = false

    async function loadAnalytics() {
      setIsLoading(true)
      try {
        const buckets = buildBuckets(range)

        // Cheap: one count() aggregation query per bucket, 1 read each regardless of matching doc count
        const counts = await Promise.all(buckets.map(async (b) => {
          const q = query(
            collection(db, "pageViews"),
            where("timestamp", ">=", Timestamp.fromDate(b.start)),
            where("timestamp", "<", Timestamp.fromDate(b.end))
          )
          const snap = await getCountFromServer(q)
          return snap.data().count
        }))

        if (cancelled) return
        setChartData(buckets.map((b, i) => ({ label: b.label, views: counts[i] })))
        setTotalViews(counts.reduce((a, b) => a + b, 0))

        // Total registered users - cheap single count()
        const usersSnap = await getCountFromServer(collection(db, "users"))
        if (!cancelled) setTotalUsers(usersSnap.data().count)

        // Active users in this range - cheap single count() against the small users collection,
        // using the throttled lastActiveAt field instead of scanning raw events
        const rangeStart = buckets[0].start
        const activeQ = query(collection(db, "users"), where("lastActiveAt", ">=", Timestamp.fromDate(rangeStart)))
        const activeSnap = await getCountFromServer(activeQ)
        if (!cancelled) setActiveUsers(activeSnap.data().count)

        // Recent activity feed - bounded read (last 15 events only), cheap regardless of total history size
        const recentQ = query(collection(db, "pageViews"), orderBy("timestamp", "desc"), limit(15))
        const recentSnap = await getDocs(recentQ)
        if (!cancelled) setRecentActivity(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error("[analytics] load failed:", e)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadAnalytics()
    return () => { cancelled = true }
  }, [isAdmin, db, range])

  if (authLoading || profileLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  if (!isAdmin) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <Lock className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Admin Restricted</h1>
        <Link href="/"><Button className="mt-4">Return Home</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Analytics
          </h1>
          <p className="text-sm text-muted-foreground">Page views and user activity, updated live from the tracking log.</p>
        </div>
      </div>

      <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
        <TabsList className="glass border-white/10">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value={range} className="space-y-6 mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="glass border-none">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary"><Eye className="h-5 w-5" /></div>
                <div>
                  <p className="text-2xl font-bold">{totalViews ?? "-"}</p>
                  <p className="text-xs text-muted-foreground">Page views ({range === "today" ? "last 24h" : range === "week" ? "last 7 days" : "last 30 days"})</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-none">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10 text-accent"><Clock className="h-5 w-5" /></div>
                <div>
                  <p className="text-2xl font-bold">{activeUsers ?? "-"}</p>
                  <p className="text-xs text-muted-foreground">Active users in this period</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-none">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400"><Users className="h-5 w-5" /></div>
                <div>
                  <p className="text-2xl font-bold">{totalUsers ?? "-"}</p>
                  <p className="text-xs text-muted-foreground">Total registered users</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass border-none">
            <CardHeader><CardTitle className="text-base">Views over time</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={range === "today" ? 2 : range === "month" ? 3 : 0} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: "12px" }} />
                      <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-none">
            <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {recentActivity.length === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground text-center py-6">No activity recorded yet.</p>
              )}
              {recentActivity.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 text-sm">
                  <span className="font-medium truncate">{ev.userName || "Unknown"}</span>
                  <span className="text-muted-foreground truncate mx-3 flex-1 text-center">{ev.path}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {ev.timestamp?.toDate ? ev.timestamp.toDate().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
