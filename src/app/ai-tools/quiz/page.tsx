"use client"

import { useState } from "react";
import { generateQuizAndFlashcards, type GenerateQuizAndFlashcardsOutput } from "@/ai/flows/ai-quiz-flashcard-generator-flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BrainCircuit, LayoutList, Sparkles, CheckCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QuizGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [results, setResults] = useState<GenerateQuizAndFlashcardsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleGenerate() {
    if (!topic.trim()) return;
    setIsLoading(true);
    try {
      const result = await generateQuizAndFlashcards({ studyTopic: topic });
      setResults(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error generating quiz",
        description: "We couldn't generate the quiz. Please try a more specific topic."
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-10 animate-in fade-in duration-500">
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/20 text-accent mb-2">
          <BrainCircuit className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold">Smart Assessment Generator</h1>
        <p className="text-muted-foreground">
          Enter any medical topic (e.g., "Acute Myocardial Infarction Management") and let Qubix AI craft USMLE-standard questions.
        </p>
        <div className="flex gap-2 max-w-xl mx-auto">
          <Input 
            placeholder="Enter a study topic..." 
            className="rounded-xl glass border-white/10 h-14 text-lg focus-visible:ring-primary"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <Button 
            onClick={handleGenerate} 
            disabled={isLoading || !topic.trim()}
            className="h-14 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {results && (
        <div className="animate-in slide-in-from-bottom-6 duration-700">
          <Tabs defaultValue="quiz" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 glass p-1 h-14 rounded-2xl">
              <TabsTrigger value="quiz" className="rounded-xl data-[state=active]:bg-primary h-full font-bold">Multiple Choice</TabsTrigger>
              <TabsTrigger value="flashcards" className="rounded-xl data-[state=active]:bg-primary h-full font-bold">Flashcards</TabsTrigger>
            </TabsList>

            <TabsContent value="quiz" className="space-y-6">
              {results.quizzes.map((q, i) => (
                <Card key={i} className="glass border-none group">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      <span className="text-accent">Question {i + 1}</span>
                    </div>
                    <CardTitle className="text-xl leading-relaxed">{q.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{String.fromCharCode(65 + oi)}</div>
                          <span className="text-sm">{opt}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 rounded-xl bg-accent/5 border border-accent/20 animate-in fade-in slide-in-from-top-2">
                      <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Correct Answer: {q.correctAnswer}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
                        {q.explanation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="flashcards" className="grid md:grid-cols-2 gap-6">
              {results.flashcards.map((f, i) => (
                <div key={i} className="perspective-1000 group">
                  <div className="relative h-64 w-full transition-all duration-500 transform-style-3d group-hover:rotate-y-180 cursor-pointer">
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden flex items-center justify-center p-8 rounded-2xl glass border-primary/20 text-center shadow-2xl">
                      <div className="absolute top-4 left-4 text-[10px] font-bold text-primary uppercase tracking-widest">Question</div>
                      <p className="text-lg font-semibold leading-relaxed">{f.front}</p>
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center p-8 rounded-2xl bg-primary text-white text-center shadow-2xl">
                      <div className="absolute top-4 left-4 text-[10px] font-bold text-white/50 uppercase tracking-widest">Answer</div>
                      <p className="text-lg leading-relaxed">{f.back}</p>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {!results && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <Info className="h-12 w-12 mb-4" />
          <p className="text-lg">Waiting for your topic choice...</p>
        </div>
      )}
    </div>
  );
}