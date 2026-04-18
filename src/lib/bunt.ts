import { NPB_DEFAULT_BUNT_SUCCESS_RATES } from "@/constants/baseball";

export { NPB_DEFAULT_BUNT_SUCCESS_RATES };

export function getBuntOutcomeOutcomes(stateKey: string, buntSuccessRateValue: number) {
  const table = {
    "0/1__": {
      base: { disaster: 0.024, failure: 0.134, success: 0.789, allSafe: 0.053 },
      states: { disaster: "2/___", failure: "1/1__", success: "1/_2_", allSafe: "0/12_" },
    },
    "1/1__": {
      base: { disaster: 0.024, failure: 0.134, success: 0.789, allSafe: 0.053 },
      states: { disaster: "3/___", failure: "2/1__", success: "2/_2_", allSafe: "1/12_" },
    },
    "0/_2_": {
      base: { disaster: 0.036, failure: 0.067, success: 0.781, allSafe: 0.116 },
      states: { disaster: "1/1__", failure: "1/_2_", success: "1/__3", allSafe: "0/1_3" },
    },
    "1/_2_": {
      base: { disaster: 0.036, failure: 0.067, success: 0.781, allSafe: 0.116 },
      states: { disaster: "2/1__", failure: "2/_2_", success: "2/__3", allSafe: "1/1_3" },
    },
    "0/12_": {
      base: { disaster: 0.017, failure: 0.231, success: 0.65, allSafe: 0.102 },
      states: { disaster: "2/_2_", failure: "1/12_", success: "1/_23", allSafe: "0/123" },
    },
    "1/12_": {
      base: { disaster: 0.017, failure: 0.231, success: 0.65, allSafe: 0.102 },
      states: { disaster: "3/___", failure: "2/12_", success: "2/_23", allSafe: "1/123" },
    },
  } as const;

  const config = table[stateKey as keyof typeof table];
  if (!config) throw new Error(`この状態はバント評価対象外です: ${stateKey}`);

  const targetSuccessTotal = Math.max(0, Math.min(1, Number(buntSuccessRateValue)));
  const baseSuccessTotal = config.base.success + config.base.allSafe;
  const baseFailureTotal = config.base.failure + config.base.disaster;
  const successScale = baseSuccessTotal === 0 ? 0 : targetSuccessTotal / baseSuccessTotal;
  const failureScale = baseFailureTotal === 0 ? 0 : (1 - targetSuccessTotal) / baseFailureTotal;

  const outcomes = [
    { key: "disaster", label: "大失敗", probability: config.base.disaster * failureScale, state: config.states.disaster },
    { key: "failure", label: "失敗", probability: config.base.failure * failureScale, state: config.states.failure },
    { key: "success", label: "成功", probability: config.base.success * successScale, state: config.states.success },
    { key: "allSafe", label: "オールセーフ", probability: config.base.allSafe * successScale, state: config.states.allSafe },
  ];

  const total = outcomes.reduce((sum, outcome) => sum + outcome.probability, 0);
  if (Math.abs(total - 1) > 1e-12) {
    outcomes[outcomes.length - 1].probability += 1 - total;
  }

  return outcomes;
}