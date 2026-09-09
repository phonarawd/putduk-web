// GPT 데스크 UI 이식 - 타입

import type { FeedBucket, LiveOpportunity, TrialState } from "@/lib/api";

export interface Opportunity {
  id: string;
  category: string;
  symbol: string;
  title: string;
  lowMarket: string;
  highMarket: string;
  requiredKrw: number | null;
  highKrw: number;
  feesKrw: number;
  riskKrw: number;
  duration: string;
  artOne: string;
  artTwo: string;
  imageUrl: string | null;
  seats: number;
}

export interface OpportunityView extends Opportunity {
  lowKrw: number;
  grossKrw: number;
  expectedKrw: number | null;
  profitRate: number;
  pricingVersion: number;
  fresh: boolean;
  affordable: boolean;
  requiredUsdt: number | null;
  requiredCapitalUsdt: string | null;
  expectedUsdt: number | null;
  bucket: FeedBucket | null;
  trialEligible: boolean;
}

export type TradeStatus = "success" | "safe_stop" | "failed";

export interface Trade {
  tradeId: string;
  opportunityId: string;
  title: string;
  capitalKrw: number | null;
  expectedProfitKrw?: number;
  settledProfitKrw: number | null;
  settledProfitUsdt?: number | null;
  pricingVersion?: number;
  status: TradeStatus | string;
  createdAt: string;
}

export interface DepositRecord {
  id: string;
  amount: number;
  depositor: string;
  status: string;
  createdAt: string;
}

export interface WithdrawalRecord {
  id: string;
  amount: number;
  mode: "profit" | "principal";
  status: string;
  createdAt: string;
}

export type ChatRole = "user" | "assistant";

export interface Evidence {
  label: string;
  route: string;
}

export interface ChatMessage {
  role: ChatRole;
  text: string;
  evidence?: Evidence[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
  serverConversationId?: string;
}

export type TicketType = "base" | "bonus";

export interface PendingLock {
  capitalKrw: number;
  ticketType: TicketType;
}

export type ExecutionStatus = "running" | "rechecking" | "success" | "safe_stop";

export interface ActiveExecution {
  tradeId: string;
  opportunityId: string;
  title: string;
  ticketType: TicketType;
  capitalKrw: number;
  expectedProfitKrw: number;
  pricingVersion: number;
  resultPlan: "success" | "safe_stop";
  status: ExecutionStatus;
  progress: number;
  stepIndex: number;
  startedAt: number;
  message: string;
}

export type Gender = "" | "male" | "female";

export interface GptState {
  schemaVersion: number;
  loggedIn: boolean;
  authMethod: "" | "password" | "google";
  profileCompleted: boolean;
  resellerId: string;
  issuedAt: string;
  displayName: string;
  email: string;
  birthday: string;
  gender: Gender;
  phone: string;
  kycStatus: "not_started" | "verified";
  principalUsdt: number | null;
  principalKrw: number | null;
  lockedUsdt: number | null;
  lockedKrw: number | null;
  profitUsdt: number | null;
  profitKrw: number | null;
  practiceUsdt: number | null;
  practiceKrw: number | null;
  trial: TrialState;
  feed: LiveOpportunity[];
  deskReady: boolean;
  dailyKey: string;
  dailyBaseUsed: number;
  dailyBonusUsed: number;
  bonusBank: number;
  selectedId: string;
  quoteVersion: number;
  lastRefreshAt: number;
  trades: Trade[];
  recordsError: boolean;
  pending: PendingLock | null;
  deposits: DepositRecord[];
  withdrawals: WithdrawalRecord[];
  notificationsEnabled: boolean;
  benefitNews: boolean;
  settlementAlerts: boolean;
  walletAlerts: boolean;
  preferKrwFirst: boolean;
  celebrateOn: boolean;
  conversations: Conversation[];
  activeConversationId: string;
  pendingAiQuestion: string;
  pendingRoute: string;
}
