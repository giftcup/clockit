import React, { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  ShieldCheck, 
  Wallet, 
  Zap, 
  Clock, 
  ArrowUpRight, 
  Info, 
  AlertCircle,
  PiggyBank,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip,
  AreaChart,
  Area
} from "recharts";
import { GoogleGenAI } from "@google/genai";
import { cn } from "@/src/lib/utils";
import { ScoringResult } from "@/src/types";

// --- Constants ---
const SCORE_MIN = 300;
const SCORE_MAX = 850;

// --- Components ---

const Card = ({ children, className, title, icon: Icon }: { children: React.ReactNode, className?: string, title?: string, icon?: any }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-white border border-slate-200 rounded-2xl p-6 shadow-sm", className)}
  >
    {title && (
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">{title}</h3>
      </div>
    )}
    {children}
  </motion.div>
);

const Gauge = ({ score }: { score: number }) => {
  const data = [
    { value: score - SCORE_MIN },
    { value: SCORE_MAX - score }
  ];
  
  const COLORS = ["#10b981", "#f1f5f9"];

  return (
    <div className="relative w-full aspect-square max-w-[240px] mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="90%"
            startAngle={180}
            endAngle={0}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
        <span className="text-5xl font-bold text-slate-900 tracking-tighter">{score}</span>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Trust Score</span>
      </div>
    </div>
  );
};

const SignalItem = ({ label, value, icon: Icon }: { label: string, value: number, icon: any }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white rounded-lg shadow-sm">
        <Icon className="w-4 h-4 text-emerald-600" />
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          className="h-full bg-emerald-500"
        />
      </div>
      <span className="text-[10px] font-mono text-slate-500 w-8 text-right">{(value * 100).toFixed(0)}%</span>
    </div>
  </div>
);

export default function App() {
  const [data, setData] = useState<ScoringResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiTip, setAiTip] = useState<string>("");
  const [showEthical, setShowEthical] = useState(false);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }), []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/score");
      const json = await res.json();
      setData(json);
      generateAITip(json);
    } catch (err) {
      console.error("Failed to fetch score", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAITip = async (scoreData: ScoringResult) => {
    try {
      const prompt = `
        You are an AI Credit Advisor for informal vendors in Sub-Saharan Africa.
        The user's credit score is ${scoreData.score} (range 300-850).
        Their trust signals are:
        - Liquidity Ratio: ${Math.round(scoreData.signals.liquidityRatio * 100)}%
        - Utility Consistency: ${Math.round(scoreData.signals.utilityConsistency * 100)}%
        - Merchant Velocity: ${Math.round(scoreData.signals.merchantVelocity * 100)}%
        - Airtime Discipline: ${Math.round(scoreData.signals.airtimeDiscipline * 100)}%
        - Night-time Stability: ${Math.round(scoreData.signals.nightTimeStability * 100)}%

        Provide a concise, human-readable reason for this score and 1 actionable tip to improve it.
        Keep it encouraging and culturally relevant (mentioning mobile money like M-Pesa/MTN).
        Format: "Reason: [reason]. Tip: [tip]."
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setAiTip(response.text || "Keep up your consistent mobile money usage to build trust.");
    } catch (err) {
      console.error("AI generation failed", err);
      setAiTip("Your score is based on your consistent utility payments and business inflows.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
          />
          <p className="text-slate-500 font-mono text-xs animate-pulse uppercase tracking-widest">Analyzing Transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-emerald-900">Clock it</h1>
          </div>
          <button 
            onClick={() => setShowEthical(true)}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ShieldCheck className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-6">
        {/* Score Section */}
        <Card className="overflow-hidden">
          <Gauge score={data.score} />
          <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-900 leading-relaxed italic">
              {aiTip}
            </p>
          </div>
        </Card>

        {/* Loan Eligibility */}
        <Card title="Loan Eligibility" icon={Wallet}>
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold text-slate-900">XAF {data.loanEligibility.toLocaleString()}</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12% this month</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "65%" }}
              className="h-full bg-emerald-500"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-mono">Max limit based on trust score</p>
        </Card>

        {/* Trust Signals */}
        <Card title="Trust Signals" icon={Zap}>
          <div className="space-y-3">
            <SignalItem label="Liquidity Ratio" value={data.signals.liquidityRatio} icon={TrendingUp} />
            <SignalItem label="Utility Consistency" value={data.signals.utilityConsistency} icon={Clock} />
            <SignalItem label="Merchant Velocity" value={data.signals.merchantVelocity} icon={Zap} />
            <SignalItem label="Airtime Discipline" value={data.signals.airtimeDiscipline} icon={ShieldCheck} />
            <SignalItem label="Night-time Stability" value={data.signals.nightTimeStability} icon={Clock} />
          </div>
        </Card>

        {/* Micro-Savings */}
        <Card title="Micro-Savings Progress" icon={PiggyBank}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold">XAF 40,250</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Saved</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-600">{(data.suggestedSavings * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Daily Rate</p>
            </div>
          </div>
          {data.score > 700 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900 mb-1">Micro-Investment Bot</p>
                <p className="text-[11px] text-blue-800 leading-tight">
                  Your score is excellent! We suggest moving 2% of daily profits into the "Safari Fund" (low-risk).
                </p>
                <button className="mt-2 text-[10px] font-bold text-blue-600 flex items-center gap-1 uppercase tracking-widest">
                  Enable Auto-Invest <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity" icon={Clock}>
          <div className="space-y-4">
            {data.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    t.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"
                  )}>
                    {t.type === "Merchant" ? <Zap className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.type}</p>
                    <p className="text-[10px] text-slate-500">{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={cn(
                  "text-sm font-mono font-bold",
                  t.amount > 0 ? "text-emerald-600" : "text-slate-900"
                )}>
                  {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </main>

      {/* Ethical Guardrails Modal */}
      <AnimatePresence>
        {showEthical && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowEthical(false)}
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-100 rounded-2xl">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Ethical Guardrails</h2>
              </div>
              
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2 font-mono">Data Privacy</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    "Clock it" uses end-to-end encryption for all transaction data. We only analyze patterns, never storing identifiable personal details of your customers.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2 font-mono">Anti-Predatory Lending</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Our scoring engine is designed to prevent debt traps. Loan limits are strictly capped at 20% of your average monthly inflow to ensure repayment is manageable.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2 font-mono">Algorithmic Fairness</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    We use non-traditional signals to reward consistency, not just wealth. A small vendor with regular payments can score higher than a large vendor with erratic behavior.
                  </p>
                </section>
              </div>

              <button 
                onClick={() => setShowEthical(false)}
                className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav (Mock) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-around items-center max-w-md mx-auto rounded-t-3xl shadow-2xl">
        <button className="p-2 text-emerald-600"><TrendingUp className="w-6 h-6" /></button>
        <button className="p-2 text-slate-300"><Wallet className="w-6 h-6" /></button>
        <button className="p-2 text-slate-300"><PiggyBank className="w-6 h-6" /></button>
        <button className="p-2 text-slate-300" onClick={fetchData}><Zap className="w-6 h-6" /></button>
      </nav>
    </div>
  );
}
