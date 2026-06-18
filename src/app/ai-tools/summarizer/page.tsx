"use client"

import { useState } from "react";
import { aiNoteSummarizer } from "@/ai/flows/ai-note-summarizer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Sparkles, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePlan } from "@/hooks/use-plan";
import { UpgradeGate } from "@/components/upgrade-gate";

export function SummarizerPageContent() {
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { canAccessAI, loading: planLoading } = usePlan();

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

  if (planLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!canAccessAI) {
    return <UpgradeGate type="ai" />;
  }

  return (
    <div className="space-y-6">
      <Card className="glass border-none overflow-hidden">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Input Study Text</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Textarea
            placeholder="Paste your dense medical notes here..."
            className="min-h-[200px] rounded-none border-none bg-transparent p-6 text-base focus-visible:ring-0"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </CardContent>
      </Card>

      <Button
        onClick={handleSummarize}
        disabled={isLoading || !content.trim()}
        className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 gap-2 text-base font-bold"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
        Generate Summary
      </Button>

      {summary && (
        <Card className="glass border-none overflow-hidden border-accent/20">
          <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-2">
              <FileText className="h-3 w-3" /> High-Yield Summary
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 gap-1 text-xs">
              <Copy className="h-3 w-3" /> Copy
            </Button>
          </CardHeader>
          <CardContent className="p-6 whitespace-pre-wrap text-sm leading-relaxed">
            {summary}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
