"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, FileText, LayoutList, Wand2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";

const tools = [
  {
    title: "Note Summarizer",
    description: "Upload your dense medical notes and get a concise, high-yield summary instantly.",
    icon: FileText,
    href: "/ai-tools/summarizer",
    color: "bg-blue-500/10 text-blue-400",
    feature: "Critical Concept Identification"
  },
  {
    title: "Quiz Simulator",
    description: "Choose a topic and question count to generate a board-style mock test instantly.",
    icon: LayoutList,
    href: "/ai-tools/quiz",
    color: "bg-purple-500/10 text-purple-400",
    feature: "Custom Length Mock Tests"
  }
];

export default function AIToolsPage() {
  const { checkingAuth } = useRequireAuth()
  if (checkingAuth) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-12 animate-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/20 text-accent mb-4">
          <BrainCircuit className="h-8 w-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Qubix AI Laboratory</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Supercharge your MBBS prep with clinical-grade AI tools designed to extract
          high-yield concepts from complex medical literature.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <Link key={tool.title} href={tool.href}>
            <Card className="glass border-none h-full hover:scale-[1.02] transition-all duration-300 group cursor-pointer overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                <tool.icon className="h-24 w-24" />
              </div>
              <CardHeader className="p-8">
                <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mb-4`}>
                  <tool.icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{tool.title}</CardTitle>
                    <span className="text-[10px] uppercase font-bold tracking-tighter px-2 py-1 rounded bg-white/5 border border-white/5 text-muted-foreground group-hover:text-accent transition-colors">
                      {tool.feature}
                    </span>
                  </div>
                  <CardDescription className="text-base text-muted-foreground leading-relaxed">
                    {tool.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 pt-0">
                <Button className="w-full rounded-xl bg-white/5 hover:bg-white/10 text-white border-white/5 flex items-center gap-2">
                  Launch Tool <Wand2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="glass rounded-3xl p-8 md:p-12 text-center space-y-6">
        <h2 className="text-2xl font-bold">New to AI-Assisted Learning?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto italic">
          "QubixPrep's AI tools reduced my note-taking time by 60%, allowing me to focus on clinical correlation and case-based learning."
        </p>
        <div className="flex items-center justify-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted border border-white/10" />
          <div className="text-left">
            <p className="font-semibold text-sm">Dr. Sarah Chen</p>
            <p className="text-xs text-muted-foreground">Internal Medicine Resident</p>
          </div>
        </div>
      </div>
    </div>
  );
}
