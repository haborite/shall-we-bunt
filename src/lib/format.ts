export function getChangeRateTone(changeRate: number) {
  if (changeRate >= 0.01) {
    return {
      cardClass: "border-green-300 bg-green-50",
      textClass: "text-green-700",
      arrow: "↑",
    };
  }
  if (changeRate <= -0.01) {
    return {
      cardClass: "border-red-300 bg-red-50",
      textClass: "text-red-700",
      arrow: "↓",
    };
  }
  return {
    cardClass: "border-slate-200 bg-slate-50",
    textClass: "text-slate-700",
    arrow: "→",
  };
}

export function formatExpectedRunsChangeRate(changeRate: number) {
  return `${changeRate >= 0 ? "+" : ""}${(changeRate * 100).toFixed(0)} %`;
}

export function formatScoringProbabilityChangeRate(changeRate: number) {
  return `${changeRate >= 0 ? "+" : ""}${(changeRate * 100).toFixed(0)} %`;
}