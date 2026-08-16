"use client"

import { useState, useMemo } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, ArrowLeft, Users, Search, Download, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function UsersAdminPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const usersQuery = useMemo(() => (!db) ? null : collection(db, 'users'), [db])
  const { data: users, loading: usersLoading } = useCollection(usersQuery)

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")

  const yearOptions = useMemo(() => {
    const set = new Set<string>()
    users?.forEach((u: any) => { if (u.currentYear) set.add(u.currentYear) })
    return Array.from(set).sort()
  }, [users])

  const planOptions = useMemo(() => {
    const set = new Set<string>()
    users?.forEach((u: any) => { if (u.plan) set.add(u.plan) })
    return Array.from(set).sort()
  }, [users])

  const filtered = useMemo(() => {
    if (!users) return []
    return users.filter((u: any) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      if (yearFilter !== "all" && u.currentYear !== yearFilter) return false
      if (planFilter !== "all" && (u.plan || "free") !== planFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matches = (u.displayName || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.mobileNumber || "").toLowerCase().includes(q) ||
          (u.collegeName || "").toLowerCase().includes(q)
        if (!matches) return false
      }
      return true
    })
  }, [users, search, roleFilter, yearFilter, planFilter])

  function handleExportCSV() {
    const headers = ["Name", "Email", "Mobile", "College", "Year", "Role", "Plan", "Subscription Status", "Notes Packs Purchased", "Referred By", "Signed Up"]
    const rows = [headers.join(",")]
    filtered.forEach((u: any) => {
      const row = [
        u.displayName || "",
        u.email || "",
        u.mobileNumber || "",
        u.collegeName || "",
        u.currentYear || "",
        u.role || "student",
        u.plan || "free",
        u.subscriptionStatus || "",
        Array.isArray(u.purchasedNotePacks) ? u.purchasedNotePacks.length : 0,
        u.referredBy || "",
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
      ].map((val) => {
        const str = String(val)
        return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str
      })
      rows.push(row.join(","))
    })
    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "qubixprep-users-" + new Date().toISOString().slice(0, 10) + ".csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (authLoading || profileLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  if (!user || (profile as any)?.role !== 'admin') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <Lock className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Admin Restricted</h1>
        <Link href="/"><Button className="mt-4">Return Home</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Users
          </h1>
          <p className="text-sm text-muted-foreground">
            {usersLoading ? "Loading..." : `${filtered.length} of ${users?.length || 0} users`}
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={usersLoading || filtered.length === 0} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card className="glass border-none">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name, email, mobile, college..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 glass border-white/10" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-40 glass border-white/10"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent className="glass border-white/10">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-full md:w-44 glass border-white/10"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent className="glass border-white/10">
              <SelectItem value="all">All Years</SelectItem>
              {yearOptions.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-full md:w-40 glass border-white/10"><SelectValue placeholder="Plan" /></SelectTrigger>
            <SelectContent className="glass border-white/10">
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              {planOptions.filter(p => p !== "free").map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {usersLoading ? (
        <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
      ) : (
        <Card className="glass border-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-bold">Name</th>
                  <th className="text-left px-4 py-3 font-bold">Email</th>
                  <th className="text-left px-4 py-3 font-bold">Mobile</th>
                  <th className="text-left px-4 py-3 font-bold">College</th>
                  <th className="text-left px-4 py-3 font-bold">Year</th>
                  <th className="text-left px-4 py-3 font-bold">Role</th>
                  <th className="text-left px-4 py-3 font-bold">Plan</th>
                  <th className="text-left px-4 py-3 font-bold">Packs</th>
                  <th className="text-left px-4 py-3 font-bold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((u: any) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-1.5">
                      {u.displayName || "-"}
                      {u.role === "admin" && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.mobileNumber || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.collegeName || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.currentYear || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === "admin" ? "bg-primary/15 text-primary" : "bg-white/5 text-muted-foreground"}`}>
                        {u.role || "student"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.plan && u.plan !== "free" ? "bg-accent/15 text-accent" : "bg-white/5 text-muted-foreground"}`}>
                        {u.plan || "free"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{Array.isArray(u.purchasedNotePacks) ? u.purchasedNotePacks.length : 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-16 text-muted-foreground">No users match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
