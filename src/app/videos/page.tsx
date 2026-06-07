import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Play, Clock, Star, Filter, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const videoCategories = [
  "All", "Pre-Clinical", "Para-Clinical", "Clinical", "Revision"
]

const topVideos = [
  { id: 1, title: "Neuroanatomy: Limbic System", duration: "45m", rating: 4.9, views: "12K", category: "Anatomy", thumb: "https://picsum.photos/seed/vid1/800/600" },
  { id: 2, title: "Diabetes Mellitus Pathophysiology", duration: "1h 12m", rating: 4.8, views: "8.4K", category: "Medicine", thumb: "https://picsum.photos/seed/vid2/800/600" },
  { id: 3, title: "Anti-Arrhythmic Drugs Simplified", duration: "38m", rating: 5.0, views: "15K", category: "Pharmacology", thumb: "https://picsum.photos/seed/vid3/800/600" },
  { id: 4, title: "Surgical Suturing Techniques", duration: "52m", rating: 4.7, views: "22K", category: "Surgery", thumb: "https://picsum.photos/seed/vid4/800/600" },
]

export default function VideoLibraryPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Video Lectures</h1>
          <p className="text-muted-foreground text-lg">Watch world-class medical educators break down complex concepts.</p>
        </div>
        <div className="flex gap-2">
          {videoCategories.map(cat => (
            <Button key={cat} variant={cat === "All" ? "default" : "outline"} className={`rounded-xl h-10 ${cat === "All" ? 'bg-primary' : 'glass border-white/10'}`}>
              {cat}
            </Button>
          ))}
          <Button variant="outline" className="glass border-white/10 rounded-xl px-3">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-bold">Recommended for You</h2>
          <Button variant="link" className="text-accent gap-2">Explore All <ArrowRight className="h-4 w-4" /></Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topVideos.map(vid => (
            <Link key={vid.id} href={`/videos/${vid.id}`} className="group">
              <Card className="glass border-none h-full overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={vid.thumb} 
                    alt={vid.title} 
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" 
                    data-ai-hint="medical lecture"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white">
                    {vid.duration}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-300">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-2xl">
                      <Play className="h-6 w-6 text-white fill-current ml-1" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{vid.category}</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-500">
                      <Star className="h-3 w-3 fill-current" /> {vid.rating}
                    </div>
                  </div>
                  <h3 className="font-bold leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">{vid.title}</h3>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-white/5 pt-2">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {vid.views} views</span>
                    <span className="text-accent">Watch Now</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="relative overflow-hidden rounded-3xl glass p-8 md:p-16 text-center space-y-6">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Learning Path: Cardiology Residency</h2>
          <p className="text-muted-foreground text-lg">Follow a structured 24-video series to master internal medicine core concepts with Dr. Julian Thorne.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button size="lg" className="rounded-xl bg-accent text-background hover:bg-accent/90 font-bold px-10">Start Series</Button>
            <div className="flex -space-x-3 overflow-hidden">
              {[1,2,3,4].map(i => (
                <div key={i} className="inline-block h-10 w-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                  <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" />
                </div>
              ))}
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-white/5 text-[10px] font-bold text-muted-foreground">
                +2k
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}