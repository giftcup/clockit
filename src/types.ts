export interface Transaction {
  id: string;
  date: string;
  type: "P2P" | "Paybill" | "Merchant";
  amount: number;
  balanceAfter: number;
  category?: string;
}

export interface ScoringResult {
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
  transactions: Transaction[];
}
