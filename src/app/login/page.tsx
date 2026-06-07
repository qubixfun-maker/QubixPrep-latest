
"use client"

import { useState } from "react"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth"
import { useAuth, useFirestore } from "@/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { BrainCircuit, Loader2, Mail, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!auth || !db) return
    setIsLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      const userRef = doc(db, 'users', user.uid)
      const docSnap = await getDoc(userRef)
      const userData = docSnap.data()
      
      if (userData?.role === 'admin') {
        router.push("/admin")
      } else {
        router.push("/")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!auth) return
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your registered email address first."
      })
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      toast({
        title: "Reset Link Sent",
        description: "Check your email for instructions to reset your password."
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    }
  }

  async function handleGoogleSignIn() {
    if (!auth || !db) return
    const provider = new GoogleAuthProvider()
    try {
      setIsLoading(true)
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const userRef = doc(db, 'users', user.uid)
      const docSnap = await getDoc(userRef)

      let userRole = "student"

      if (!docSnap.exists()) {
        userRole = user.email?.toLowerCase().includes('admin') ? "admin" : "student"
        const profileData = {
          uid: user.uid,
          displayName: user.displayName || "Medical Student",
          email: user.email || "",
          mobileNumber: "",
          collegeName: "",
          currentYear: "1st Year",
          role: userRole,
          createdAt: new Date().toISOString(),
          photoURL: user.photoURL || ""
        }
        await setDoc(userRef, profileData, { merge: true })
      } else {
        userRole = (docSnap.data() as any).role || "student"
      }

      router.push(userRole === 'admin' ? "/admin" : "/")
    } catch (error: any) {
      let message = error.message
      if (error.code === 'auth/unauthorized-domain') {
        message = "Domain unauthorized. Add it in Firebase Console > Authentication > Settings > Authorized domains."
      }
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md glass border-none shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your medical library</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="Medical Email" 
                  className="pl-10 glass border-white/10 h-12"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="Password" 
                  className="pl-10 glass border-white/10 h-12"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </div>
            <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" className="glass border-white/10 h-12" onClick={handleGoogleSignIn} disabled={isLoading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81.64z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-white/5 bg-white/5 pt-6">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline">Register Now</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
