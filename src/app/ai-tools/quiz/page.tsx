"use client"

import { useState } from "react";
import { generateQuizAndFlashcards, type GenerateQuizAndFlashcardsOutput } from "@/ai/flows/ai-quiz-flashcard-generator-flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, BrainCircuit, Sparkles, CheckCircle, XCircle, Info, RotateCcw, ArrowRight } from "lucide-react";
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setIsLoading(true);
    setResults(null);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    setShowResult(false);
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

  function handleSelectOption(option: string) {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    setAnswers(prev => ({ ...prev, [currentIndex]: option }));
  }

  function handleNext() {
    if (!results) return;
    if (currentIndex + 1 < results.quizzes.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(answers[currentIndex + 1] || null);
    } else {
      setShowResult(true);
    }
  }

  function handleRestart() {
    setResults(null);
    setTopic("");
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    setShowResult(false);
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

  if (!results) {
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

        {!isLoading && (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Info className="h-12 w-12 mb-4" />
            <p className="text-lg">Pick a topic and question count to begin.</p>
          </div>
        )}
      </div>
    );
  }

  if (showResult) {
    const correctCount = results.quizzes.reduce((acc, q, i) => {
      return answers[i] === q.correctAnswer ? acc + 1 : acc;
    }, 0);
    const total = results.quizzes.length;
    const percentage = Math.round((correctCount / total) * 100);

    return (
      <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
        <Card className="glass border-none text-center p-8">
          <CardContent className="space-y-6 pt-6">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/20 text-accent">
              <BrainCircuit className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Quiz Complete!</h2>
              <p className="text-muted-foreground mt-2">{topic}</p>
            </div>
            <div className="text-6xl font-bold text-primary">{percentage}%</div>
            <p className="text-lg">
              You got <span className="font-bold text-green-400">{correctCount}</span> out of <span className="font-bold">{total}</span> correct
            </p>
            <Progress value={percentage} className="h-2 bg-white/5" />
            <Button onClick={handleRestart} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 gap-2 font-bold">
              <RotateCcw className="h-4 w-4" /> Start New Quiz
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Review Your Answers</h3>
          {results.quizzes.map((q, i) => {
            const userAnswer = answers[i];
            const isCorrect = userAnswer === q.correctAnswer;
            return (
              <Card key={i} className={`glass border-none ${isCorrect ? 'border-l-2 border-l-green-500' : 'border-l-2 border-l-red-500'}`}>
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-start gap-2">
                    {isCorrect ? <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                    <p className="text-sm font-medium">{q.question}</p>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Your answer: <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>{userAnswer || 'Skipped'}</span>
                    {!isCorrect && <> · Correct: <span className="text-green-400">{q.correctAnswer}</span></>}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const currentQuestion = results.quizzes[currentIndex];
  const isAnswered = !!selectedAnswer;
  const isLastQuestion = currentIndex === results.quizzes.length - 1;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span>{topic}</span>
          <span>Question {currentIndex + 1} of {results.quizzes.length}</span>
        </div>
        <Progress value={((currentIndex + 1) / results.quizzes.length) * 100} className="h-1.5 bg-white/5" />
      </div>

      <Card className="glass border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl leading-relaxed">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {currentQuestion.options.map((opt, oi) => {
              const isSelected = selectedAnswer === opt;
              const isCorrectOption = opt === currentQuestion.correctAnswer;

              let optionStyle = "bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer";
              if (isAnswered) {
                if (isCorrectOption) {
                  optionStyle = "bg-green-500/10 border border-green-500/40";
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = "bg-red-500/10 border border-red-500/40";
                } else {
                  optionStyle = "bg-white/5 border border-white/5 opacity-50";
                }
              }

              return (
                <div
                  key={oi}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-4 rounded-xl transition-colors flex items-center gap-3 ${optionStyle}`}
                >
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {String.fromCharCode(65 + oi)}
                  </div>
                  <span className="text-sm flex-1">{opt}</span>
                  {isAnswered && isCorrectOption && <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />}
                  {isAnswered && isSelected && !isCorrectOption && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-6 p-4 rounded-xl bg-accent/5 border border-accent/20 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Correct Answer: {currentQuestion.correctAnswer}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleNext}
        disabled={!isAnswered}
        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 gap-2 font-bold disabled:opacity-30"
      >
        {isLastQuestion ? 'Finish Quiz' : 'Next Question'} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
