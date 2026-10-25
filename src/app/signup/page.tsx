"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { useAuth, useFirestore } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BrainCircuit, Loader2, MessageCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { CollegePicker } from "@/components/college-picker"
import { ConsentDialog } from "@/components/consent-dialog"
import { buildConsent, normalizeMobile, WHATSAPP_GROUP_URL } from "@/lib/legal"

type Pending = "email" | "google" | null

function SignUpPageContent() {
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    college: "",
    year: "",
    password: "",
    referralCode: ""
  })

  const [pendingGoogleUser, setPendingGoogleUser] = useState<FirebaseUser | null>(null)
  const [googleProfile, setGoogleProfile] = useState({
    mobile: "",
    college: "",
    year: "",
    referralCode: ""
  })

  // The "before you join" popup opens for whichever form was submitted.
  const [consentFor, setConsentFor] = useState<Pending>(null)
  // After the account exists: show the optional "join our WhatsApp group" step.
  const [joinStep, setJoinStep] = useState<{ role: string } | null>(null)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref }))
      setGoogleProfile(prev => ({ ...prev, referralCode: ref }))
    }
  }, [searchParams])

  function goAfterSignup(role: string) {
    if (WHATSAPP_GROUP_URL && role !== 'admin') {
      setJoinStep({ role })
      return
    }
    router.push(role === 'admin' ? "/admin" : "/")
  }

  // Step 1: check the form, then ask for agreement in the popup.
  function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!auth || !db) {
      toast({ variant: "destructive", title: "System Error", description: "Firebase initialization failed." })
      return
    }
    if (!formData.college.trim()) {
      toast({ variant: "destructive", title: "College Required", description: "Search and pick your college, or type it." })
      return
    }
    if (!formData.year) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select your year." })
      return
    }
    if (!normalizeMobile(formData.mobile)) {
      toast({ variant: "destructive", title: "Check Mobile Number", description: "Enter a valid 10-digit Indian mobile number." })
      return
    }
    setConsentFor("email")
  }

  // Step 2 (email): the student agreed in the popup, create the account.
  async function createEmailAccount(whatsapp: boolean) {
    if (!auth || !db) return
    setIsLoading(true)
    try {
      const mobile = normalizeMobile(formData.mobile)
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      await updateProfile(userCredential.user, { displayName: formData.name })
      const userRole = formData.email.toLowerCase().includes('admin') ? "admin" : "student"
      const profileData = {
        uid: userCredential.user.uid,
        displayName: formData.name,
        email: formData.email,
        mobileNumber: mobile,
        collegeName: formData.college.trim(),
        currentYear: formData.year,
        role: userRole,
        createdAt: new Date().toISOString(),
        photoURL: userCredential.user.photoURL || "",
        referredBy: formData.referralCode.trim().toUpperCase() || null,
        ...buildConsent({ whatsapp, mobile, source: "email" })
      }
      const userRef = doc(db, 'users', userCredential.user.uid)
      await setDoc(userRef, profileData, { merge: true })
      if (profileData.referredBy) {
        fetch('/api/affiliate/track-referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: profileData.referredBy,
            idToken: await userCredential.user.getIdToken(),
            referredUserEmail: formData.email,
            referredUserName: formData.name
          })
        }).catch(() => {})
      }
      setConsentFor(null)
      toast({ title: "Account Created!", description: `Welcome as ${userRole}.` })
      goAfterSignup(userRole)
    } catch (error: any) {
      setConsentFor(null)
      toast({ variant: "destructive", title: "Registration Failed", description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    if (!auth || !db) return
    const provider = new GoogleAuthProvider()
    try {
      setIsLoading(true)
      const result = await signInWithPopup(auth, provider)
      const userRef = doc(db, 'users', result.user.uid)
      const docSnap = await getDoc(userRef)

      if (!docSnap.exists()) {
        setPendingGoogleUser(result.user)
        setIsLoading(false)
        return
      }

      const userRole = (docSnap.data() as any).role || "student"
      router.push(userRole === 'admin' ? "/admin" : "/")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Error", description: error.message })
      setIsLoading(false)
    }
  }

  function handleCompleteGoogleProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!db || !pendingGoogleUser) return
    if (!googleProfile.college.trim()) {
      toast({ variant: "destructive", title: "College Required", description: "Search and pick your college, or type it." })
      return
    }
    if (!googleProfile.year) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select your year." })
      return
    }
    if (!normalizeMobile(googleProfile.mobile)) {
      toast({ variant: "destructive", title: "Check Mobile Number", description: "Enter a valid 10-digit Indian mobile number." })
      return
    }
    setConsentFor("google")
  }

  async function createGoogleAccount(whatsapp: boolean) {
    if (!db || !pendingGoogleUser) return
    setIsLoading(true)
    try {
      const mobile = normalizeMobile(googleProfile.mobile)
      const userRole = pendingGoogleUser.email?.toLowerCase().includes('admin') ? "admin" : "student"
      const profileData = {
        uid: pendingGoogleUser.uid,
        displayName: pendingGoogleUser.displayName || "Medical Student",
        email: pendingGoogleUser.email || "",
        mobileNumber: mobile,
        collegeName: googleProfile.college.trim(),
        currentYear: googleProfile.year,
        role: userRole,
        createdAt: new Date().toISOString(),
        photoURL: pendingGoogleUser.photoURL || "",
        referredBy: googleProfile.referralCode.trim().toUpperCase() || null,
        ...buildConsent({ whatsapp, mobile, source: "google" })
      }
      const userRef = doc(db, 'users', pendingGoogleUser.uid)
      await setDoc(userRef, profileData, { merge: true })

      if (profileData.referredBy) {
        fetch('/api/affiliate/track-referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: profileData.referredBy,
            idToken: await pendingGoogleUser.getIdToken(),
            referredUserEmail: pendingGoogleUser.email,
            referredUserName: pendingGoogleUser.displayName
          })
        }).catch(() => {})
      }

      setConsentFor(null)
      toast({ title: "Account Created!", description: `Welcome as ${userRole}.` })
      goAfterSignup(userRole)
    } catch (error: any) {
      setConsentFor(null)
      toast({ variant: "destructive", title: "Registration Failed", description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const activeMobile = consentFor === "google" ? googleProfile.mobile : formData.mobile
  const dialog = (
    <ConsentDialog
      open={consentFor !== null}
      busy={isLoading}
      canWhatsApp={!!normalizeMobile(activeMobile)}
      onCancel={() => setConsentFor(null)}
      onConfirm={(wa) => (consentFor === "google" ? createGoogleAccount(wa) : createEmailAccount(wa))}
    />
  )

  if (joinStep) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="text-2xl font-bold">You&apos;re in!</CardTitle>
            <CardDescription>Your QubixPrep account is ready.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">Join our WhatsApp community for study tips, updates and doubts. Tap the button — you join with one tap, and you can leave any time.</p>
            <Button asChild className="w-full bg-green-600 text-white hover:bg-green-700">
              <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" />Join the WhatsApp Group</a>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/")}>Skip, go to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (pendingGoogleUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardHeader className="text-center">
            <BrainCircuit className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
            <CardDescription>Just a few more details, {pendingGoogleUser.displayName?.split(' ')[0] || 'there'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCompleteGoogleProfile} className="space-y-4">
              <Input type="tel" inputMode="numeric" placeholder="Mobile Number (10 digits)" required value={googleProfile.mobile} onChange={(e) => setGoogleProfile({ ...googleProfile, mobile: e.target.value })} />
              <CollegePicker required value={googleProfile.college} onChange={(v) => setGoogleProfile({ ...googleProfile, college: v })} />
              <Select onValueChange={(v) => setGoogleProfile({ ...googleProfile, year: v })}>
                <SelectTrigger><SelectValue placeholder="Study Year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year (Part 1)">3rd Year (Part 1)</SelectItem>
                  <SelectItem value="4th Year (Part 2)">4th Year (Part 2)</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Referral Code (optional)" value={googleProfile.referralCode} onChange={(e) => setGoogleProfile({ ...googleProfile, referralCode: e.target.value.toUpperCase() })} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Finish Sign Up"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">You&apos;ll review our <Link href="/terms" target="_blank" className="underline">Terms</Link> and <Link href="/privacy" target="_blank" className="underline">Privacy Policy</Link> on the next step.</p>
            </form>
          </CardContent>
        </Card>
        {dialog}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardHeader className="text-center">
          <BrainCircuit className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Join QubixPrep</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignUp} className="space-y-4">
            <Input placeholder="Full Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <Input type="email" placeholder="Medical Email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <Input type="tel" inputMode="numeric" placeholder="Mobile Number (10 digits)" required value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
            <CollegePicker required value={formData.college} onChange={(v) => setFormData({ ...formData, college: v })} />
            <Select onValueChange={(v) => setFormData({ ...formData, year: v })}>
              <SelectTrigger><SelectValue placeholder="Study Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1st Year">1st Year</SelectItem>
                <SelectItem value="2nd Year">2nd Year</SelectItem>
                <SelectItem value="3rd Year (Part 1)">3rd Year (Part 1)</SelectItem>
                <SelectItem value="4th Year (Part 2)">4th Year (Part 2)</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Referral Code (optional)" value={formData.referralCode} onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })} />
            <Input type="password" placeholder="Password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
            </Button>
          </form>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
            {isLoading && !consentFor ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign up with Google"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">By signing up you agree to our <Link href="/terms" target="_blank" className="underline">Terms &amp; Conditions</Link> and <Link href="/privacy" target="_blank" className="underline">Privacy Policy</Link>.</p>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">Already have an account? <Link href="/login" className="text-primary hover:underline">Log In</Link></p>
        </CardFooter>
      </Card>
      {dialog}
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Registration...</div>}>
      <SignUpPageContent />
    </Suspense>
  )
}
