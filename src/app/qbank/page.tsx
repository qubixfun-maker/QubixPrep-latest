"use client"

import { useMemo, useState } from "react"
import { useCollection, useFirestore, useUser } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Database, Brain, HeartPulse, TestTube, Stethoscope, Microscope, BookOpen, ChevronRight, Search, Loader2, FileUp, PlayCircle, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MyPdfQbanks } from "./my-pdf-qbanks"

const ICON_MAP: Record<string, any> = {
  "Anatomy": Brain,
  "Physiology": HeartPulse,
  "Biochemistry": TestTube,
  "Pathology": Stethoscope,
  "Microbiology": Microscope,
  "Pharmacology": BookOpen
}

export default function QBankPage() {
  const { user } = useUser()
  const db = useFirestore()
  const subjectsQuery = useMemo(() => (!db ? null : collection(db, 'subjects')), [db])
  const { data: subjects, loading } = useCollection(subjectsQuery)

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Question Bank Hub</h1>
          <p className="text-muted-foreground text-lg">Active recall through board-style MCQs and clinical simulations.</p>
        </div>
      </div>

      <Tabs defaultValue="standard" className="w-full">
        <TabsList className="glass border-none h-14 p-1 rounded-2xl mb-8 flex-wrap">
          <TabsTrigger value="standard" className="rounded-xl px-6 gap-2 data-[state=active]:bg-primary h-full font-bold">
            <Database className="h-4 w-4" /> Standard QBank
          </TabsTrigger>
          <TabsTrigger value="pdf" className="rounded-xl px-6 gap-2 data-[state=active]:bg-primary h-full font-bold">
            <FileUp className="h-4 w-4" /> My PDF QBanks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standard">
          <div className="space-y-8">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search question banks..." className="pl-10 rounded-xl glass border-white/10" />
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects?.map((subject: any) => {
                  const Icon = ICON_MAP[subject.name] || Database
                  return (
                    <Link key={subject.id} href={`/qbank/${subject.id}`}>
                      <Card className="glass border-none group cursor-pointer hover:bg-white/5 transition-all duration-300 relative overflow-hidden h-full flex flex-col">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <CardHeader className="flex flex-row items-start justify-between p-8">
                          <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                            <Icon className="h-8 w-8" />
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1" />
                        </CardHeader>
                        <CardContent className="px-8 pb-8 flex-1">
                          <CardTitle className="text-2xl font-bold mb-2">{subject.name}</CardTitle>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">Board-standard MCQs for {subject.name}.</p>
                          <div className="px-3 py-1 w-fit rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {subject.questionCount || 0} Questions
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pdf">
          <MyPdfQbanks />
        </TabsContent>
      </Tabs>
    </div>
  )
}