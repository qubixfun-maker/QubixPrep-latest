
"use client"

import { useState } from "react";
import { aiNoteSummarizer } from "@/ai/flows/ai-note-summarizer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Sparkles, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SummarizerPageContent() {
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleSummarize() {
    if (!content.trim()) return;
    setIsLoading(true);
    try {
      const result = await aiNoteSummarizer({ noteContent: content });
      setSummary(result.summary);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error generating summary",
        description: "Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    toast({
      title: "Copied to clipboard",
      description: "Summary saved to your clipboard."
    });
  };

  return (
    <div className="space-y-6">
      <Card className="glass border-none overflow-hidden">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Input Study Text</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Textarea
            placeholder="Paste text from the note or textbook to analyze..."
            className="min-h-[200px] border-none bg-transparent focus-visible:ring-0 p-4 text-sm leading-relaxed resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="p-3 bg-black/20 border-t border-white/5 flex justify-end">
            <Button 
              onClick={handleSummarize} 
              disabled={isLoading || !content.trim()}
              className="rounded-xl bg-primary hover:bg-primary/90 h-10 px-6 text-sm gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isLoading ? "Analyzing..." : "Analyze Concepts"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" /> AI Summary Results
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs text-muted-foreground hover:text-white">
              <Copy className="h-3 w-3 mr-2" /> Copy
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="prose prose-invert max-w-none">
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {summary}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SummarizerPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" /> AI Note Summarizer
        </h1>
        <p className="text-muted-foreground">
          Paste your medical text below. Our AI will identify critical diagnostic criteria and treatment protocols.
        </p>
      </div>
      <SummarizerPageContent />
    </div>
  );
}
