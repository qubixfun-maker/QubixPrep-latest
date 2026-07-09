"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { useAuth, useFirestore } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BrainCircuit, Loader2, Mail, Lock, User, Phone, School, Calendar, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

function SignUpPageContent() {
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setFormData(prev => ({ ...prev, referralCode: ref }))
  }, [searchParams])

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!auth || !db) {
      toast({ variant: "destructive", title: "System Error", description: "Firebase initialization failed." })
      return
    }
    if (!formData.year) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select your year." })
      return
    }

    setIsLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      await updateProfile(userCredential.user, { displayName: formData.name })
      const userRole = formData.email.toLowerCase().includes('admin') ? "admin" : "student"
      const profileData = {
        uid: userCredential.user.uid,
        displayName: formData.name,
        email: formData.email,
        mobileNumber: formData.mobile,
        collegeName: formData.college,
        currentYear: formData.year,
        role: userRole,
        createdAt: new Date().toISOString(),
        photoURL: userCredential.user.photoURL || "",
        referredBy: formData.referralCode.trim().toUpperCase() || null
      }
      const userRef = doc(db, 'users', userCredential.user.uid)
      await setDoc(userRef, profileData, { merge: true })
      toast({ title: "Account Created!", description: `Welcome as ${userRole}.` })
      router.push(userRole === 'admin' ? "/admin" : "/")
    } catch (error: any) {
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
      let userRole = "student"
      if (!docSnap.exists()) {
        userRole = result.user.email?.toLowerCase().includes('admin') ? "admin" : "student"
        await setDoc(userRef, {
          uid: result.user.uid,
          displayName: result.user.displayName || "Medical Student",
          email: result.user.email || "",
          role: userRole,
          createdAt: new Date().toISOString()
        })
      } else {
        userRole = (docSnap.data() as any).role || "student"
      }
      router.push(userRole === 'admin' ? "/admin" : "/")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Error", description: error.message })
    } finally {
      setIsLoading(false)
    }
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
            <Input type="tel" placeholder="Mobile Number" required value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
            <Input placeholder="College Name" required value={formData.college} onChange={(e) => setFormData({ ...formData, college: e.target.value })} />
            <Select onValueChange={(v) => setFormData({ ...formData, year: v })}>
              <SelectTrigger><SelectValue placeholder="Study Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1st Year">1st Year</SelectItem>
                <SelectItem value="2nd Year">2nd Year</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
              </SelectContent>
            </Select>
            <Input type={showPassword ? "text" : "password"} placeholder="Password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
            </Button>
          </form>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>Sign up with Google</Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">Already have an account? <Link href="/login" className="text-primary hover:underline">Log In</Link></p>
        </CardFooter>
      </Card>
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
