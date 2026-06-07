"use client"

import { useState } from "react";
import { generateMindMap, type MindMapGeneratorOutput } from "@/ai/flows/ai-mind-map-generator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Share2, Sparkles, Network } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MindMapPage() {
  const [text, setText] = useState("");
  const [map, setMap] = useState<MindMapGeneratorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleGenerate() {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const result = await generateMindMap({ medicalText: text });
      setMap(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Visualization failed",
        description: "Try reducing the amount of text or simplifying it."
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/20 text-accent mb-4">
          <Share2 className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold">Concept Relationship Mapper</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Visualize the connections between anatomy, physiology, and clinical medicine.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass border-none">
            <CardHeader>
              <CardTitle className="text-lg">Paste Concept Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Describe a complex medical process or list several related concepts..."
                className="min-h-[300px] glass border-white/5 resize-none leading-relaxed"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <Button 
                onClick={handleGenerate} 
                disabled={isLoading || !text.trim()}
                className="w-full rounded-xl bg-accent text-background hover:bg-accent/90 py-6 text-lg font-bold gap-2"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Network className="h-5 w-5" />}
                Map Relationships
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 h-full">
          {map ? (
            <Card className="glass border-none h-full min-h-[500px] relative overflow-hidden animate-in zoom-in-95 duration-700">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" /> Generated Mind Map
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="relative w-full h-full flex items-center justify-center p-12">
                  <div className="flex flex-wrap gap-8 justify-center">
                    {map.nodes.map((node) => (
                      <div 
                        key={node.id} 
                        className="px-6 py-4 rounded-2xl glass-darker border-primary/40 text-center min-w-[120px] shadow-2xl relative group hover:border-accent hover:scale-105 transition-all cursor-default z-10"
                      >
                        <span className="text-sm font-bold tracking-tight">{node.label}</span>
                        {/* Mock connection lines */}
                        <div className="absolute top-1/2 left-full w-8 h-[1px] bg-primary/30 group-hover:bg-accent/50 -translate-y-1/2 pointer-events-none" />
                      </div>
                    ))}
                  </div>
                  {/* Decorative connections */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <svg className="w-full h-full">
                      {map.edges.map((edge, i) => (
                        <line 
                          key={i} 
                          x1="20%" y1="20%" x2="80%" y2="80%" 
                          stroke="currentColor" strokeWidth="1" 
                          className="text-primary"
                        />
                      ))}
                    </svg>
                  </div>
                </div>
                <div className="mt-8 grid gap-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Key Relationships Identified</p>
                  {map.edges.map((edge, i) => (
                    <div key={i} className="text-sm p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
                      <span className="font-bold text-accent">{edge.source}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="italic text-muted-foreground">{edge.label || 'connected to'}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-bold text-primary">{edge.target}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[500px] rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
              <Network className="h-16 w-16 mb-4 opacity-10" />
              <p className="text-xl font-medium opacity-20">Your interactive conceptual map will appear here after generation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}