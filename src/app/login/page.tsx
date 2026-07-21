"use client"
import { Suspense, useState } from "react"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth"
import { useAuth, useFirestore } from "@/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { BrainCircuit, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

function LoginPageContent() {
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [isResetting, setIsResetting] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!auth) return
    setIsLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)
      const userRef = doc(db!, 'users', userCredential.user.uid)
      const docSnap = await getDoc(userRef)
      const userRole = docSnap.exists() ? (docSnap.data() as any).role : "student"
      toast({ title: "Welcome back!", description: "Successfully logged in." })
      router.push(userRole === 'admin' ? "/admin" : "/")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or password." })
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePasswordReset() {
    if (!auth) return
    if (!formData.email) {
      toast({ variant: "destructive", title: "Enter your email first", description: "Type your email above, then tap \"Forgot password?\" again." })
      return
    }
    setIsResetting(true)
    try {
      await sendPasswordResetEmail(auth, formData.email)
      toast({ title: "Reset Email Sent", description: `Check ${formData.email} for a link to reset your password.` })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Could Not Send Reset Email", description: error.message })
    } finally {
      setIsResetting(false)
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
          displayName: result.user.displayName,
          email: result.user.email,
          role: userRole,
          createdAt: new Date().toISOString()
        })
      } else {
        userRole = (docSnap.data() as any).role || "student"
      }
      router.push(userRole === 'admin' ? "/admin" : "/")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Login Failed", description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardHeader className="text-center">
          <BrainCircuit className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl font-bold">Log In</CardTitle>
          <CardDescription>Welcome back to QubixPrep</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="email" placeholder="Email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <Input type={showPassword ? "text" : "password"} placeholder="Password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            <div className="text-right -mt-2">
              <button type="button" onClick={handlePasswordReset} disabled={isResetting} className="text-xs text-primary hover:underline">
                {isResetting ? "Sending..." : "Forgot password?"}
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>Google Login</Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">Don't have an account? <Link href="/signup" className="text-primary hover:underline">Sign Up</Link></p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
