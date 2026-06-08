"use client"

import { useMemo, useState, useEffect } from "react"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, 
  Mail, 
  School, 
  Calendar, 
  Phone, 
  Camera, 
  Loader2, 
  ShieldCheck, 
  LogOut,
  Trophy,
  Target,
  BookOpen,
  CheckCircle2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "",
    mobileNumber: "",
    collegeName: "",
    currentYear: ""
  })

  // Track counts for progress
  const [stats, setStats] = useState({
    completedCount: 0,
    totalNotes: 0
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || "",
        mobileNumber: profile.mobileNumber || "",
        collegeName: profile.collegeName || "",
        currentYear: profile.currentYear || ""
      })
    }
  }, [profile])

  useEffect(() => {
    async function fetchProgress() {
      if (!db || !user) return
      try {
        const completedSnap = await getDocs(query(collection(db, 'users', user.uid, 'progress'), where('completed', '==', true)))
        setStats(prev => ({ ...prev, completedCount: completedSnap.size }))
      } catch (e) {
        console.error(e)
      }
    }
    fetchProgress()
  }, [db, user])

  const handleSave = async () => {
    if (!profileRef) return
    setIsSaving(true)
    try {
      await updateDoc(profileRef, {
        ...formData,
        lastUpdated: new Date().toISOString()
      })
      toast({ title: "Profile Updated", description: "Your academic settings have been saved." })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  if (authLoading || profileLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  }

  if (!user) return null

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-2xl">
              <AvatarImage src={user.photoURL || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                {user.displayName?.[0] || "D"}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white shadow-lg scale-0 group-hover:scale-100 transition-transform">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{profile?.displayName || user.displayName}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium uppercase tracking-widest">{profile?.role || "Medical Student"}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" onClick={handleSignOut} className="rounded-xl gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Personal Information
              </CardTitle>
              <CardDescription>Update your contact and identification details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="pl-10 glass border-white/10" 
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10 glass border-white/10 opacity-50" value={user.email || ""} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="pl-10 glass border-white/10" 
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-accent" /> Academic Settings
              </CardTitle>
              <CardDescription>Your current medical institution and study year.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medical College</Label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="pl-10 glass border-white/10" 
                      value={formData.collegeName}
                      onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Year of Study</Label>
                  <Select 
                    value={formData.currentYear} 
                    onValueChange={(v) => setFormData({ ...formData, currentYear: v })}
                  >
                    <SelectTrigger className="glass border-white/10">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select Year" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      {["1st Year", "2nd Year", "3rd Year (Part 1)", "4th Year (Part 2)", "Internship"].map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="rounded-xl px-8 shadow-xl shadow-primary/20"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass border-none overflow-hidden">
            <div className="h-2 bg-accent" />
            <CardHeader>
              <CardTitle className="text-lg">Study Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Topics Mastered</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10 text-accent">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">14</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-none">
            <CardHeader>
              <CardTitle className="text-lg">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your data is secured with Firebase Cloud encryption and access rules.
              </p>
              <Button variant="outline" className="w-full glass border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest h-11">
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
