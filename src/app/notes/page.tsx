import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Stethoscope, Microscope, TestTube, Brain, HeartPulse, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const subjects = [
  { id: 'anatomy', name: "Anatomy", description: "Gross anatomy, histology, and embryology basics.", icon: Brain, color: "text-red-400", bg: "bg-red-400/10", units: 12, topics: 148 },
  { id: 'physio', name: "Physiology", description: "Mechanism of human body functions and homeostasis.", icon: HeartPulse, color: "text-pink-400", bg: "bg-pink-400/10", units: 8, topics: 92 },
  { id: 'biochem', name: "Biochemistry", description: "Molecular basis of biological processes.", icon: TestTube, color: "text-blue-400", bg: "bg-blue-400/10", units: 10, topics: 110 },
  { id: 'patho', name: "Pathology", description: "Study of disease processes and morphological changes.", icon: Stethoscope, color: "text-purple-400", bg: "bg-purple-400/10", units: 15, topics: 210 },
  { id: 'micro', name: "Microbiology", description: "Bacteriology, Virology, and Mycology concepts.", icon: Microscope, color: "text-green-400", bg: "bg-green-400/10", units: 9, topics: 135 },
  { id: 'pharma', name: "Pharmacology", description: "Drug actions, interactions, and therapeutic uses.", icon: BookOpen, color: "text-yellow-400", bg: "bg-yellow-400/10", units: 11, topics: 180 },
];

export default function NotesPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Medical Library</h1>
          <p className="text-muted-foreground text-lg">Browse structured notes and high-yield topics organized by subject.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search subjects or topics..." 
            className="pl-10 rounded-xl glass border-white/10"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Link key={subject.id} href={`/notes/${subject.id}`}>
            <Card className="glass border-none group cursor-pointer hover:bg-white/5 transition-all duration-300 relative overflow-hidden h-full flex flex-col">
              <div className={`absolute top-0 left-0 w-1 h-full ${subject.bg.replace('10', '50')}`} />
              <CardHeader className="flex flex-row items-start justify-between space-y-0 p-8">
                <div className={`p-4 rounded-2xl ${subject.bg} ${subject.color}`}>
                  <subject.icon className="h-8 w-8" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-4 flex-1">
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">{subject.name}</CardTitle>
                  <CardDescription className="text-base text-muted-foreground line-clamp-2 leading-relaxed">
                    {subject.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4 pt-4 mt-auto">
                  <div className="px-3 py-1 rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {subject.units} Units
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {subject.topics} Topics
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
