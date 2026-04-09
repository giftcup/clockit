import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";

// --- Types ---
interface Transaction {
  id: string;
  date: string;
  type: "P2P" | "Paybill" | "Merchant";
  amount: number;
  balanceAfter: number;
  category?: string;
}

interface ScoringResult {
  score: number;
  signals: {
    liquidityRatio: number;
    utilityConsistency: number;
    merchantVelocity: number;
    airtimeDiscipline: number;
    nightTimeStability: number;
  };
  explanation: string;
  loanEligibility: number;
  suggestedSavings: number;
}

// --- Scoring Logic ---
function calculateCreditScore(transactions: Transaction[]): ScoringResult {
  // 1. Liquidity Ratio: Avg balance / Withdrawal frequency
  const withdrawals = transactions.filter(t => t.amount < 0);
  const avgBalance = transactions.reduce((acc, t) => acc + t.balanceAfter, 0) / transactions.length;
  const withdrawalFreq = withdrawals.length / (transactions.length / 30); // Monthly freq
  const liquidityRatio = Math.min(1, avgBalance / (Math.abs(withdrawalFreq) * 500 + 1));

  // 2. Utility Consistency: Frequency of Paybill
  const paybills = transactions.filter(t => t.type === "Paybill");
  const utilityConsistency = Math.min(1, paybills.length / 6); // Assuming 1 per month for 6 months

  // 3. Merchant Velocity: Business activity
  const merchantInflows = transactions.filter(t => t.type === "Merchant" && t.amount > 0);
  const merchantVelocity = Math.min(1, merchantInflows.length / 24); // 4 per month

  // 4. Airtime Discipline: Airtime spend vs total inflows
  const totalInflows = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const airtimeSpend = Math.abs(transactions.filter(t => t.category === "Airtime").reduce((acc, t) => acc + t.amount, 0));
  const airtimeDiscipline = totalInflows > 0 ? Math.max(0, 1 - (airtimeSpend / (totalInflows * 0.1))) : 0.5;

  // 5. Night-time Stability: Daytime vs Nighttime
  const daytimeTransactions = transactions.filter(t => {
    const hour = new Date(t.date).getHours();
    return hour >= 6 && hour <= 20;
  });
  const nightTimeStability = daytimeTransactions.length / transactions.length;

  // Final Score Calculation (300 - 850)
  const baseScore = 300;
  const maxBonus = 550;
  const weights = {
    liquidityRatio: 0.25,
    utilityConsistency: 0.2,
    merchantVelocity: 0.25,
    airtimeDiscipline: 0.15,
    nightTimeStability: 0.15
  };

  const weightedSum = (
    liquidityRatio * weights.liquidityRatio +
    utilityConsistency * weights.utilityConsistency +
    merchantVelocity * weights.merchantVelocity +
    airtimeDiscipline * weights.airtimeDiscipline +
    nightTimeStability * weights.nightTimeStability
  );

  const score = Math.round(baseScore + weightedSum * maxBonus);
  
  // Loan Eligibility (Mock logic)
  const loanEligibility = Math.round((score - 300) * 20); // e.g., 500 score -> 4000 loan
  const suggestedSavings = score > 700 ? 0.02 : 0.01;

  return {
    score,
    signals: {
      liquidityRatio,
      utilityConsistency,
      merchantVelocity,
      airtimeDiscipline,
      nightTimeStability
    },
    explanation: "Calculated based on 6 months of mobile money activity.",
    loanEligibility,
    suggestedSavings
  };
}

// --- Mock Data Generator ---
function generateMockTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  let balance = 5000;

  for (let i = 180; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    
    // Daily business inflow
    if (Math.random() > 0.3) {
      const amount = Math.floor(Math.random() * 2000) + 500;
      balance += amount;
      transactions.push({
        id: `t-${i}-in`,
        date: date.toISOString(),
        type: "Merchant",
        amount,
        balanceAfter: balance
      });
    }

    // Daily personal spend
    if (Math.random() > 0.2) {
      const amount = -(Math.floor(Math.random() * 1000) + 100);
      balance += amount;
      transactions.push({
        id: `t-${i}-out`,
        date: date.toISOString(),
        type: "P2P",
        amount,
        balanceAfter: balance
      });
    }

    // Monthly utilities
    if (i % 30 === 0) {
      const amount = -1500;
      balance += amount;
      transactions.push({
        id: `t-${i}-util`,
        date: date.toISOString(),
        type: "Paybill",
        amount,
        balanceAfter: balance,
        category: "Utility"
      });
    }

    // Weekly airtime
    if (i % 7 === 0) {
      const amount = -200;
      balance += amount;
      transactions.push({
        id: `t-${i}-air`,
        date: date.toISOString(),
        type: "Paybill",
        amount,
        balanceAfter: balance,
        category: "Airtime"
      });
    }
  }

  return transactions;
}

// --- Server Setup ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Endpoints
  app.get("/api/score", (req, res) => {
    const transactions = generateMockTransactions();
    const result = calculateCreditScore(transactions);
    res.json({ ...result, transactions: transactions.slice(-10) }); // Return last 10 for UI
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
