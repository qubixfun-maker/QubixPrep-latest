
"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useUser, useDoc, useFirestore, useAuth } from "@/firebase"
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { updateProfile, sendPasswordResetEmail, signOut } from "firebase/auth"
import { supabase } from "@/lib/supabase"
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
  Target,
  CheckCircle2,
  Lock,
  Upload,
  Crown,
  Zap,
  BookOpen
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { usePlan } from '@/hooks/use-plan'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { plan, isFree, isBasic, isPro } = usePlan()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "",
    mobileNumber: "",
    collegeName: "",
    currentYear: ""
  })

  const [stats, setStats] = useState({
    completedCount: 0,
    streakCount: 0
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: (profile as any).displayName || "",
        mobileNumber: (profile as any).mobileNumber || "",
        collegeName: (profile as any).collegeName || "",
        currentYear: (profile as any).currentYear || ""
      })
      setStats(prev => ({
        ...prev,
        streakCount: (profile as any).streakCount || 0
      }))
    }
  }, [profile])

  useEffect(() => {
    async function fetchStats() {
      if (!db || !user) return
      try {
        const completedSnap = await getDocs(query(
          collection(db, 'users', user.uid, 'progress'), 
          where('completed', '==', true)
        ))
        setStats(prev => ({ ...prev, completedCount: completedSnap.size }))
      } catch (e) {
        console.error("Stats Fetch Error:", e)
      }
    }
    fetchStats()
  }, [db, user])

  const handleSave = async () => {
    if (!profileRef || !user) return
    setIsSaving(true)
    
    const updateData = {
      ...formData,
      lastUpdated: new Date().toISOString()
    }

    try {
      // 1. Update Auth Profile
      if (formData.displayName !== user.displayName) {
        await updateProfile(user, { displayName: formData.displayName })
      }

      // 2. Update Firestore Profile
      await updateDoc(profileRef, updateData)

      toast({ 
        title: "Profile Updated", 
        description: "Your academic settings have been successfully synchronized." 
      })
    } catch (e: any) {
      const permissionError = new FirestorePermissionError({
        path: profileRef.path,
        operation: 'update',
        requestResourceData: updateData
      });
      errorEmitter.emit('permission-error', permissionError);
      
      toast({ 
        variant: "destructive", 
        title: "Update Failed", 
        description: e.message 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !profileRef) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.uid}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('mindmaps') // Reusing existing bucket or assume an 'avatars' bucket exists
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('mindmaps')
        .getPublicUrl(filePath)

      // Update both Auth and Firestore
      await updateProfile(user, { photoURL: publicUrl })
      await updateDoc(profileRef, { photoURL: publicUrl })

      toast({ title: "Photo Updated", description: "Your profile picture is now live." })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: e.message })
    } finally {
      setIsUploading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    try {
      await sendPasswordResetEmail(auth, user.email)
      toast({ 
        title: "Reset Email Sent", 
        description: "Check your inbox for a secure link to change your password." 
      })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action Failed", description: e.message })
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (e) {
      toast({ variant: "destructive", title: "Sign Out Error" })
    }
  }

  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancelSubscription = async () => {
    if (!profile || !user) return
    const subscriptionId = (profile as any).razorpaySubscriptionId

    if (!subscriptionId) {
      toast({
        variant: "destructive",
        title: "No active subscription found",
        description: "If you believe this is an error, please contact support."
      })
      return
    }

    if (!confirm("Are you sure you want to cancel your subscription? You'll keep access until your current billing period ends.")) {
      return
    }

    setIsCancelling(true)
    try {
      const res = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not cancel subscription')
      }

      toast({
        title: "Subscription Cancelled",
        description: "You'll keep access until the end of your current billing period."
      })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Cancellation Failed", description: e.message })
    } finally {
      setIsCancelling(false)
    }
  }

  if (authLoading || profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-2xl overflow-hidden">
              <AvatarImage src={user.photoURL || ""} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || "D"}
              </AvatarFallback>
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </Avatar>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white shadow-lg hover:scale-110 transition-transform"
              disabled={isUploading}
            >
              <Camera className="h-4 w-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarUpload} 
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{user.displayName || "Medical Student"}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium uppercase tracking-widest">{(profile as any)?.role || "Student"} ID: {user.uid.slice(0, 8)}</span>
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
              <CardDescription>Update your public identity and contact details.</CardDescription>
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
                      placeholder="e.g. Dr. Jane Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10 glass border-white/10 opacity-50" value={user.email || ""} disabled />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Email changes require administrative verification.</p>
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="pl-10 glass border-white/10" 
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
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
              <CardDescription>Your current medical institution and curriculum track.</CardDescription>
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
                      placeholder="Enter your college name"
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
                  className="rounded-xl px-8 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Academic Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass border-none overflow-hidden">
            <div className={`h-2 ${isPro ? 'bg-primary' : isBasic ? 'bg-accent' : 'bg-white/20'}`} />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {isPro ? <Zap className="h-5 w-5 text-primary" /> : isBasic ? <Crown className="h-5 w-5 text-accent" /> : <BookOpen className="h-5 w-5 text-muted-foreground" />}
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${isPro ? 'bg-primary/10 border-primary/20' : isBasic ? 'bg-accent/10 border-accent/20' : 'bg-white/5 border-white/10'}`}>
                <div>
                  <p className={`text-xl font-bold ${isPro ? 'text-primary' : isBasic ? 'text-accent' : 'text-white'}`}>
                    {isPro ? 'Clinician' : isBasic ? 'Scholar' : 'Explorer'}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    {isPro ? '₹59/month' : isBasic ? '₹29/month' : 'Free forever'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${isPro ? 'bg-primary/20 text-primary' : isBasic ? 'bg-accent/20 text-accent' : 'bg-white/10 text-muted-foreground'}`}>
                  Active
                </div>
              </div>
              {!isPro && (
                <Link href="/pricing">
                  <Button className={`w-full rounded-xl h-11 font-bold gap-2 ${isBasic ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30' : 'bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30'}`}>
                    {isBasic ? <Zap className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
                    {isBasic ? 'Upgrade to Clinician' : 'Upgrade Plan'}
                  </Button>
                </Link>
              )}
              {isPro && (
                <Button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  variant="outline"
                  className="w-full rounded-xl h-10 text-xs font-bold uppercase tracking-widest glass border-white/10 text-muted-foreground hover:text-red-400 hover:border-red-400/30"
                >
                  {isCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
                  Cancel Subscription
                </Button>
              )}
              {!isPro && isBasic && (
                <Button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  variant="ghost"
                  className="w-full rounded-xl h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-red-400"
                >
                  {isCancelling ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                  Cancel Subscription
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-none overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-accent" />
            <CardHeader>
              <CardTitle className="text-lg">Real-Time Study Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-colors">
                <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-inner">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Mastered Topics</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-colors">
                <div className="p-3 rounded-xl bg-accent/10 text-accent shadow-inner">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.streakCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Active Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-none">
            <CardHeader>
              <CardTitle className="text-lg">Security & Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your academic data is secured with AES-256 Cloud encryption and restricted by Firebase Security Rules.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handlePasswordReset}
                className="w-full glass border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest h-11 gap-2 hover:bg-white/5"
              >
                <Lock className="h-3.5 w-3.5" /> Reset Password
              </Button>
              <p className="text-[9px] text-center text-muted-foreground uppercase tracking-tighter">Last Login: {new Date(user.metadata.lastSignInTime || "").toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
