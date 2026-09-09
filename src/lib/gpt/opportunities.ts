import type { LiveOpportunity } from "@/lib/api";
import type { GptState, OpportunityView } from "./types";
import { formatMoneyPrimary } from "./format";

const ART_ONE = "#f06a43";
const ART_TWO = "#41364f";

export const TRIAL_CARD_SVG = "/cards/trial-151.svg";

export function resolveCardArt(item: Pick<LiveOpportunity, "trialEligible" | "imageUrl">): string | null {
  if (item.trialEligible) return TRIAL_CARD_SVG;
  return item.imageUrl;
}

export function toOpportunityView(item: LiveOpportunity): OpportunityView {
  return {
    id: item.id,
    category: item.category,
    symbol: item.symbol,
    title: item.title,
    lowMarket: item.lowMarket,
    highMarket: item.highMarket,
    requiredKrw: item.requiredKrw,
    highKrw: 0,
    feesKrw: 0,
    riskKrw: 0,
    duration: item.duration,
    artOne: ART_ONE,
    artTwo: ART_TWO,
    imageUrl: resolveCardArt(item),
    seats: item.seats ?? 0,
    lowKrw: item.requiredKrw ?? 0,
    grossKrw: 0,
    expectedKrw: item.expectedKrw,
    profitRate: 0,
    pricingVersion: 1,
    fresh: true,
    affordable: item.bucket === "affordable",
    requiredUsdt: item.requiredUsdt,
    expectedUsdt: item.expectedUsdt,
    bucket: item.bucket,
    trialEligible: item.trialEligible,
  };
}

export function emptyOpportunity(): OpportunityView {
  return toOpportunityView({
    id: "",
    title: "아직 확인할 기회가 없어요",
    category: "기회",
    symbol: "",
    bucket: null,
    trialEligible: false,
    requiredUsdt: null,
    requiredKrw: null,
    imageUrl: null,
    expectedUsdt: null,
    expectedKrw: null,
    lowMarket: "",
    highMarket: "",
    seats: null,
    duration: "",
  });
}

export function opportunityById(id: string, feed: LiveOpportunity[]): OpportunityView {
  const found = feed.find((item) => item.id === id);
  return found ? toOpportunityView(found) : emptyOpportunity();
}

export function allOpportunityViews(state: GptState): OpportunityView[] {
  return state.feed.map(toOpportunityView);
}

export function selectedOpportunity(state: GptState): OpportunityView {
  return opportunityById(state.selectedId || state.feed[0]?.id || "", state.feed);
}

export function principalSuggestion(state: GptState, opportunity: OpportunityView): string {
  if (!opportunity.id) {
    return "조건이 맞는 기회가 생기면 여기에서 보여 드려요.";
  }
  if (opportunity.trialEligible && opportunity.affordable) {
    return opportunity.title + "부터 바로 확인할 수 있어요.";
  }
  const required = formatMoneyPrimary(opportunity.requiredUsdt, opportunity.requiredKrw);
  if (required) {
    return required + "이 필요한 " + opportunity.title + "이에요.";
  }
  return opportunity.title + "을 먼저 살펴보세요.";
}
