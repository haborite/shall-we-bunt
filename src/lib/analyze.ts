import { STATE_TO_INDEX } from "@/constants/baseball";
import { buildPlayerProbabilities, buildBatterTransitionMatrices } from "@/lib/baseball";
import { solveRunExpectancies, solveScoreProbabilities, makeDistribution } from "@/lib/markov";
import { getBuntOutcomeOutcomes } from "@/lib/bunt";

export function analyzeBuntStrategy({
  model,
  lineupPlayers,
  selectedState,
  currentBatterSlot,
  buntSuccessRateFraction,
}: {
  model: Record<string, number[][]>;
  lineupPlayers: Record<string, unknown>[];
  selectedState: string;
  currentBatterSlot: string;
  buntSuccessRateFraction: number;
}) {
  const lineupProbabilities = lineupPlayers.map(buildPlayerProbabilities);
  const batterMatrices = buildBatterTransitionMatrices(model, lineupProbabilities);
  const runExpectancies = solveRunExpectancies(batterMatrices);
  const scoreProbabilities = solveScoreProbabilities(batterMatrices);

  const batterIndex = Number(currentBatterSlot) - 1;
  const stateIndex = STATE_TO_INDEX[selectedState];
  const nextBatterIndex = (batterIndex + 1) % 9;

  const noBuntExpectedRuns = runExpectancies[batterIndex][stateIndex];
  const noBuntScoreProbability = scoreProbabilities[batterIndex][stateIndex];
  const noBuntDist = makeDistribution(batterMatrices, batterIndex, stateIndex);

  const buntOutcomes = getBuntOutcomeOutcomes(selectedState, buntSuccessRateFraction);

  const buntExpectedRuns = buntOutcomes.reduce((sum, outcome) => {
    const outcomeStateIndex = STATE_TO_INDEX[outcome.state];
    if (outcomeStateIndex === 24) return sum;
    return sum + outcome.probability * runExpectancies[nextBatterIndex][outcomeStateIndex];
  }, 0);

  const buntScoreProbability = buntOutcomes.reduce((sum, outcome) => {
    const outcomeStateIndex = STATE_TO_INDEX[outcome.state];
    if (outcomeStateIndex === 24) return sum;
    return sum + outcome.probability * scoreProbabilities[nextBatterIndex][outcomeStateIndex];
  }, 0);

  const buntDist = Array.from({ length: 9 }, (_, index) => ({
    label: index === 8 ? "8+" : String(index),
    prob: 0,
  }));

  buntOutcomes.forEach((outcome) => {
    const outcomeStateIndex = STATE_TO_INDEX[outcome.state];
    const outcomeDist = makeDistribution(batterMatrices, nextBatterIndex, outcomeStateIndex);
    outcomeDist.forEach((row, index) => {
      buntDist[index].prob += outcome.probability * row.prob;
    });
  });

  return {
    noBuntEV: noBuntExpectedRuns,
    buntEV: buntExpectedRuns,
    expectedRunsChangeRate: buntExpectedRuns / noBuntExpectedRuns - 1,
    noBuntProb: noBuntScoreProbability,
    buntProb: buntScoreProbability,
    scoringProbabilityChangeRate: buntScoreProbability / noBuntScoreProbability - 1,
    noBuntDist,
    buntDist,
    lineupProbs: lineupProbabilities,
    buntOutcomes,
  };
}