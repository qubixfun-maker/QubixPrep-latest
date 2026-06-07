import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Clock, ChevronRight, Share2, Bookmark, LayoutList } from "lucide-react"
import Link from "next/link"

const topics = [
  { id: '1', title: "Cell Structure and Function", status: "completed", readTime: "15m", importance: "High" },
  { id: '2', title: "Epithelial Tissues", status: "completed", readTime: "12m", importance: "Medium" },
  { id: '3', title: "Connective Tissues", status: "in-progress", readTime: "20m", importance: "High" },
  { id: '4', title: "Muscular System Basics", status: "locked", readTime: "18m", importance: "High" },
  { id: '5', title: "Nervous System Histology", status: "locked", readTime: "25m", importance: "Essential" },
]

export default function SubjectDetailPage({ params }: { params: { id: string } }) {
  const subjectName = params.id.charAt(0).toUpperCase() + params.id.slice(1)
  
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 space-y-12 animate-in slide-in-from-right-4 duration-700">
      <div className="relative overflow-hidden rounded-3xl glass p-8 md:p-12 border-primary/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <Link href="/notes" className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1 hover:text-accent transition-colors">
              <ChevronRight className="h-3 w-3 rotate-180" /> Back to Library
            </Link>
            <h1 className="text-5xl font-bold tracking-tighter">{subjectName}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Master the foundational structures of the human body through high-resolution illustrations and clinician-curated notes.
            </p>
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <LayoutList className="h-4 w-4 text-accent" />
                <span className="text-sm font-bold">12 Units</span>
              </div>
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">42 Bookmarks</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-64 space-y-3 glass-darker p-6 rounded-2xl border-white/5">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>Overall Progress</span>
              <span className="text-accent">45%</span>
            </div>
            <Progress value={45} className="h-2 bg-white/5" />
            <p className="text-[10px] text-muted-foreground italic text-center">Next goal: Nervous System (Unit 4)</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Units</h3>
          <div className="space-y-2">
            {["Introduction", "General Anatomy", "Histology Basics", "Musculoskeletal", "Neuroanatomy"].map((unit, i) => (
              <Button 
                key={unit} 
                variant={i === 2 ? "default" : "ghost"} 
                className={`w-full justify-start rounded-xl h-12 px-4 transition-all ${i === 2 ? 'bg-primary shadow-lg shadow-primary/20' : 'hover:bg-white/5'}`}
              >
                <span className="mr-3 opacity-30">0{i+1}</span>
                <span className="font-bold">{unit}</span>
                {i < 2 && <CheckCircle2 className="h-4 w-4 ml-auto text-green-400" />}
              </Button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold">Topics in Histology Basics</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
              <Share2 className="h-4 w-4" /> Share Progress
            </Button>
          </div>
          <div className="space-y-3">
            {topics.map((topic) => (
              <Link key={topic.id} href={`/notes/${params.id}/${topic.id}`}>
                <div className="glass group p-6 rounded-2xl border-white/5 hover:border-primary/50 transition-all flex items-center justify-between cursor-pointer mb-3">
                  <div className="flex items-center gap-6">
                    <div className={`p-3 rounded-full ${topic.status === 'completed' ? 'bg-green-500/10 text-green-400' : topic.status === 'in-progress' ? 'bg-accent/10 text-accent' : 'bg-white/5 text-muted-foreground'}`}>
                      {topic.status === 'completed' ? <CheckCircle2 className="h-6 w-6" /> : topic.status === 'in-progress' ? <Circle className="h-6 w-6 fill-current" /> : <Circle className="h-6 w-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{topic.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {topic.readTime} reading</span>
                        <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold ${topic.importance === 'High' || topic.importance === 'Essential' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {topic.importance}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}