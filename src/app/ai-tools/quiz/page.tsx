"use client"

import { useState } from "react";
import { generateQuizAndFlashcards, type GenerateQuizAndFlashcardsOutput } from "@/ai/flows/ai-quiz-flashcard-generator-flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BrainCircuit, Sparkles, CheckCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePlan } from "@/hooks/use-plan";
import { UpgradeGate } from "@/components/upgrade-gate";

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 25];

export default function QuizGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [results, setResults] = useState<GenerateQuizAndFlashcardsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { canAccessAI, loading: planLoading } = usePlan();

  async function handleGenerate() {
    if (!topic.trim()) return;
    setIsLoading(true);
    setResults(null);
    try {
      const result = await generateQuizAndFlashcards({ studyTopic: topic, numQuestions });
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

  if (planLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!canAccessAI) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-12">
        <UpgradeGate type="ai" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-10 animate-in fade-in duration-500">
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/20 text-accent mb-2">
          <BrainCircuit className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold">Quiz Simulator</h1>
        <p className="text-muted-foreground">
          Enter any medical topic and choose how many questions you want — Qubix AI generates a full board-style mock test on demand.
        </p>

        <div className="space-y-4 max-w-xl mx-auto">
          <Input
            placeholder="Enter a study topic (e.g., Acute Myocardial Infarction)..."
            className="rounded-xl glass border-white/10 h-14 text-lg focus-visible:ring-primary"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-left">Number of Questions</span>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUESTION_COUNT_OPTIONS.map((count) => (
                <button
                  key={count}
                  onClick={() => setNumQuestions(count)}
                  className={`h-11 px-5 rounded-xl text-sm font-bold transition-all ${
                    numQuestions === count
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'glass border border-white/10 text-muted-foreground hover:text-white hover:border-primary/40'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isLoading || !topic.trim()}
            className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 text-base font-bold"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            Generate {numQuestions} Questions
          </Button>
        </div>
      </div>

      {results && results.quizzes.length > 0 && (
        <div className="animate-in slide-in-from-bottom-6 duration-700 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold">Your Quiz: {topic}</h2>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{results.quizzes.length} Questions</span>
          </div>
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
        </div>
      )}

      {!results && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <Info className="h-12 w-12 mb-4" />
          <p className="text-lg">Pick a topic and question count to begin.</p>
        </div>
      )}
    </div>
  );
}
