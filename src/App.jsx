import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, AlertCircle } from "lucide-react";

const DEFAULT_CSV_PATH = "npb_fielder_stats.csv";
const DEFAULT_AVG_CSV_PATH = "npb_avg_stats.csv";

const EVENT_KEYS = ["single", "double", "triple", "home_run", "walk", "strikeout", "field_out"];
const EVENT_JP = {
  single: "一塁打",
  double: "二塁打",
  triple: "三塁打",
  home_run: "本塁打",
  walk: "四球",
  strikeout: "三振",
  field_out: "凡打",
};

const STATE_OPTIONS = [
  { value: "0/1__", label: "無死一塁" },
  { value: "0/_2_", label: "無死二塁" },
  { value: "0/12_", label: "無死一二塁" },
  { value: "1/1__", label: "一死一塁" },
  { value: "1/_2_", label: "一死二塁" },
  { value: "1/12_", label: "一死一二塁" },
];

const STATE_OPTIONS_AFTER_BUNT = [
  { value: "2/___", label: "二死走者無し" },
  { value: "0/1__", label: "無死一塁" },
  { value: "1/1__", label: "一死一塁" },
  { value: "2/1__", label: "二死一塁" },
  { value: "0/_2_", label: "無死二塁" },
  { value: "1/_2_", label: "一死二塁" },
  { value: "2/_2_", label: "二死二塁" },
  { value: "0/__3", label: "無死三塁" },
  { value: "1/__3", label: "一死三塁" },
  { value: "2/__3", label: "二死三塁" },
  { value: "0/12_", label: "無死一二塁" },
  { value: "1/12_", label: "一死一二塁" },
  { value: "2/12_", label: "二死一二塁" },
  { value: "0/1_3", label: "無死一三塁" },
  { value: "1/1_3", label: "一死一三塁" },
  { value: "1/_23", label: "一死二三塁" },
  { value: "2/_23", label: "二死二三塁" },
  { value: "0/123", label: "無死満塁" },
  { value: "1/123", label: "一死満塁" },
  { value: "3/___", label: "チェンジ" },
];

const COLUMN_MAPPING = {
  name: "Name",
  player: "Name",
  teamname: "TeamName",
  team: "TeamName",
  pa: "PA",
  ab: "AB",
  h: "H",
  "1b": "1B",
  "2b": "2B",
  "3b": "3B",
  hr: "HR",
  homerun: "HR",
  bb: "BB",
  walk: "BB",
  ibb: "IBB",
  hbp: "HBP",
  so: "SO",
  k: "SO",
  strikeout: "SO",
  sh: "SH",
  sf: "SF",
  gdp: "GDP",
};

const BASE_BIT_MAP = {
  0: 0b000,
  1: 0b001,
  2: 0b010,
  3: 0b100,
  4: 0b011,
  5: 0b101,
  6: 0b110,
  7: 0b111,
};

const STATE_STR_MAP = {
  0: "0/___",
  1: "0/1__",
  2: "0/_2_",
  3: "0/__3",
  4: "0/12_",
  5: "0/1_3",
  6: "0/_23",
  7: "0/123",
  8: "1/___",
  9: "1/1__",
  10: "1/_2_",
  11: "1/__3",
  12: "1/12_",
  13: "1/1_3",
  14: "1/_23",
  15: "1/123",
  16: "2/___",
  17: "2/1__",
  18: "2/_2_",
  19: "2/__3",
  20: "2/12_",
  21: "2/1_3",
  22: "2/_23",
  23: "2/123",
  24: "3/___",
};

const STATE_TO_INDEX = Object.fromEntries(Object.entries(STATE_STR_MAP).map(([key, value]) => [value, Number(key)]));
const DEFAULT_LINEUP = Array.from({ length: 9 }, (_, index) => ({ slot: index + 1, playerKey: "" }));

const TEAM_STYLES = {
  G: { badgeClass: "bg-orange-500", label: "G" },
  T: { badgeClass: "bg-yellow-400", label: "T" },
  DB: { badgeClass: "bg-blue-500", label: "DB" },
  C: { badgeClass: "bg-red-500", label: "C" },
  D: { badgeClass: "bg-blue-600", label: "D" },
  S: { badgeClass: "bg-lime-500", label: "S" },
  H: { badgeClass: "bg-yellow-300", label: "H" },
  F: { badgeClass: "bg-sky-500", label: "F" },
  M: { badgeClass: "bg-black", label: "M" },
  L: { badgeClass: "bg-indigo-600", label: "L" },
  E: { badgeClass: "bg-rose-700", label: "E" },
  Bs: { badgeClass: "bg-blue-900", label: "Bs" },
  B: { badgeClass: "bg-blue-900", label: "B" },
};

const TEAM_FILTER_OPTIONS = [
  { value: "ALL", label: "全チーム" },
  { value: "G", label: "読売ジャイアンツ" },
  { value: "T", label: "阪神タイガース" },
  { value: "DB", label: "横浜DeNAベイスターズ" },
  { value: "C", label: "広島東洋カープ" },
  { value: "D", label: "中日ドラゴンズ" },
  { value: "S", label: "東京ヤクルトスワローズ" },
  { value: "H", label: "福岡ソフトバンクホークス" },
  { value: "F", label: "北海道日本ハムファイターズ" },
  { value: "M", label: "千葉ロッテマリーンズ" },
  { value: "L", label: "埼玉西武ライオンズ" },
  { value: "E", label: "東北楽天イーグルス" },
  { value: "Bs", label: "オリックス・バファローズ" },
  { value: "-", label: "その他" },
];

const NPB_DEFAULT_BUNT_SUCCESS_RATES = {
  "0/1__": 84.2,
  "1/1__": 84.2,
  "0/_2_": 89.7,
  "1/_2_": 89.7,
  "0/12_": 75.2,
  "1/12_": 75.2,
};

function normalizeColumnName(name) {
  return String(name ?? "").trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "");
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function parseCsvText(text) {
  const normalizedText = String(text).replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < normalizedText.length; i += 1) {
    const ch = normalizedText[i];
    const next = normalizedText[i + 1];
    if (ch === '"') {
      current += ch;
      if (inQuotes && next === '"') {
        current += next;
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "\n" && !inQuotes) {
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.length > 0) lines.push(current);
  const meaningfulLines = lines.filter((line) => line.trim() !== "");
  if (meaningfulLines.length === 0) return [];
  const headers = parseCsvLine(meaningfulLines[0]).map((header) => header.trim());
  return meaningfulLines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function normalizePlayerRows(rows) {
  return rows.map((row, index) => {
    const normalized = {};
    for (const [key, value] of Object.entries(row || {})) {
      const mappedKey = COLUMN_MAPPING[normalizeColumnName(key)] || key;
      normalized[mappedKey] = value;
    }
    if (!normalized.Name || String(normalized.Name).trim() === "") {
      normalized.Name = `Player ${index + 1}`;
    }
    normalized.TeamName = normalized.TeamName ? String(normalized.TeamName).trim() : "";
    normalized.playerKey = `${normalized.Name}__${normalized.TeamName || "NA"}__${index}`;
    return normalized;
  });
}

function buildPlayerProbabilities(playerRow) {
  const PA = toNumber(playerRow.PA);
  const H = toNumber(playerRow.H);
  const doubles = toNumber(playerRow["2B"]);
  const triples = toNumber(playerRow["3B"]);
  const HR = toNumber(playerRow.HR);
  const BB = toNumber(playerRow.BB);
  const IBB = toNumber(playerRow.IBB);
  const HBP = toNumber(playerRow.HBP);
  const SO = toNumber(playerRow.SO);
  const SH = toNumber(playerRow.SH);
  const denominator = PA - IBB - SH;
  if (denominator <= 0) throw new Error(`${playerRow.Name}: PA - IBB - SH が 0 以下です`);
  const singles = H - doubles - triples - HR;
  const walks = BB - IBB + HBP;
  const fieldOuts = PA - H - BB - HBP - SO - SH;
  if (singles < 0 || walks < 0 || fieldOuts < 0) throw new Error(`${playerRow.Name}: 成績列の整合性が取れていません`);
  const probabilities = {
    Name: playerRow.Name,
    single: singles / denominator,
    double: doubles / denominator,
    triple: triples / denominator,
    home_run: HR / denominator,
    walk: walks / denominator,
    strikeout: SO / denominator,
    field_out: fieldOuts / denominator,
  };
  const total = EVENT_KEYS.reduce((sum, key) => sum + probabilities[key], 0);
  if (!Number.isFinite(total) || Math.abs(total - 1) > 1e-6) {
    throw new Error(`${playerRow.Name}: 打撃確率の合計が 1 になりません (${total.toFixed(6)})`);
  }
  return probabilities;
}

function scoreFromStates(fromState, toState) {
  const fromOuts = Math.floor(fromState / 8);
  const toOuts = Math.floor(toState / 8);
  const fromRunners = BASE_BIT_MAP[fromState % 8].toString(2).replace(/0/g, "").length;
  const toRunners = BASE_BIT_MAP[toState % 8].toString(2).replace(/0/g, "").length;
  let score = fromOuts + fromRunners + 1 - toOuts - toRunners;
  if (fromOuts > toOuts) score = -1;
  if (fromState % 8 === 3 && toState % 8 === 4) score = -1;
  if (toOuts === 3) score = Math.min(score, 0);
  if (score < 0) score = -1;
  return score;
}

const SCORE_MATRIX = Array.from({ length: 25 }, (_, fromState) => Array.from({ length: 25 }, (_, toState) => scoreFromStates(fromState, toState)));

function normalizeTransitionMatrix(matrix) {
  return matrix.map((row, rowIndex) => {
    const rowSum = row.reduce((sum, value) => sum + value, 0);
    if (rowSum <= 0) throw new Error(`遷移行列の ${rowIndex} 行目の和が 0 以下です`);
    return row.map((value) => value / rowSum);
  });
}

function buildBatterTransitionMatrices(model, lineupProbabilities) {
  return lineupProbabilities.map((playerProbabilities) => {
    const matrix = Array.from({ length: 25 }, () => Array(25).fill(0));
    for (const eventKey of EVENT_KEYS) {
      const eventMatrix = model[eventKey];
      if (!eventMatrix) throw new Error(`JSON に ${eventKey} がありません`);
      for (let rowIndex = 0; rowIndex < 25; rowIndex += 1) {
        for (let columnIndex = 0; columnIndex < 25; columnIndex += 1) {
          matrix[rowIndex][columnIndex] += eventMatrix[rowIndex][columnIndex] * playerProbabilities[eventKey];
        }
      }
    }
    return normalizeTransitionMatrix(matrix);
  });
}

function parseModelJson(text) {
  const parsed = JSON.parse(text);
  const model = parsed.model || parsed;
  for (const eventKey of EVENT_KEYS) {
    if (!Array.isArray(model[eventKey]) || model[eventKey].length !== 25 || !model[eventKey].every((row) => Array.isArray(row) && row.length === 25)) {
      throw new Error(`モデルJSONの ${eventKey} は 25x25 行列である必要があります`);
    }
  }
  return model;
}

function gaussianEliminationSolve(coefficients, constants) {
  const size = coefficients.length;
  const augmented = coefficients.map((row, index) => [...row, constants[index]]);
  for (let pivotIndex = 0; pivotIndex < size; pivotIndex += 1) {
    let maxRow = pivotIndex;
    for (let rowIndex = pivotIndex + 1; rowIndex < size; rowIndex += 1) {
      if (Math.abs(augmented[rowIndex][pivotIndex]) > Math.abs(augmented[maxRow][pivotIndex])) {
        maxRow = rowIndex;
      }
    }
    if (Math.abs(augmented[maxRow][pivotIndex]) < 1e-12) throw new Error("連立方程式を解けませんでした。行列が特異です。");
    [augmented[pivotIndex], augmented[maxRow]] = [augmented[maxRow], augmented[pivotIndex]];
    const pivot = augmented[pivotIndex][pivotIndex];
    for (let columnIndex = pivotIndex; columnIndex <= size; columnIndex += 1) {
      augmented[pivotIndex][columnIndex] /= pivot;
    }
    for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
      if (rowIndex === pivotIndex) continue;
      const factor = augmented[rowIndex][pivotIndex];
      for (let columnIndex = pivotIndex; columnIndex <= size; columnIndex += 1) {
        augmented[rowIndex][columnIndex] -= factor * augmented[pivotIndex][columnIndex];
      }
    }
  }
  return augmented.map((row) => row[size]);
}

function solveRunExpectancies(batterMatrices) {
  const batterCount = batterMatrices.length;
  const dimension = 24 * batterCount;
  const coefficients = Array.from({ length: dimension }, (_, rowIndex) => Array.from({ length: dimension }, (_, columnIndex) => (rowIndex === columnIndex ? 1 : 0)));
  const constants = Array(dimension).fill(0);
  for (let batterIndex = 0; batterIndex < batterCount; batterIndex += 1) {
    const nextBatterIndex = (batterIndex + 1) % batterCount;
    for (let stateIndex = 0; stateIndex < 24; stateIndex += 1) {
      const equationIndex = batterIndex * 24 + stateIndex;
      let reward = 0;
      for (let nextStateIndex = 0; nextStateIndex < 25; nextStateIndex += 1) {
        const probability = batterMatrices[batterIndex][stateIndex][nextStateIndex];
        const score = SCORE_MATRIX[stateIndex][nextStateIndex];
        if (score >= 0) reward += probability * score;
        if (nextStateIndex < 24) coefficients[equationIndex][nextBatterIndex * 24 + nextStateIndex] -= probability;
      }
      constants[equationIndex] = reward;
    }
  }
  const solution = gaussianEliminationSolve(coefficients, constants);
  return Array.from({ length: batterCount }, (_, batterIndex) => solution.slice(batterIndex * 24, (batterIndex + 1) * 24));
}

function solveScoreProbabilities(batterMatrices) {
  const batterCount = batterMatrices.length;
  const dimension = 24 * batterCount;
  const coefficients = Array.from({ length: dimension }, (_, rowIndex) => Array.from({ length: dimension }, (_, columnIndex) => (rowIndex === columnIndex ? 1 : 0)));
  const constants = Array(dimension).fill(0);
  for (let batterIndex = 0; batterIndex < batterCount; batterIndex += 1) {
    const nextBatterIndex = (batterIndex + 1) % batterCount;
    for (let stateIndex = 0; stateIndex < 24; stateIndex += 1) {
      const equationIndex = batterIndex * 24 + stateIndex;
      let rhs = 0;
      for (let nextStateIndex = 0; nextStateIndex < 25; nextStateIndex += 1) {
        const probability = batterMatrices[batterIndex][stateIndex][nextStateIndex];
        const score = SCORE_MATRIX[stateIndex][nextStateIndex];
        if (score > 0) {
          rhs += probability;
        } else if (nextStateIndex < 24) {
          coefficients[equationIndex][nextBatterIndex * 24 + nextStateIndex] -= probability;
        }
      }
      constants[equationIndex] = rhs;
    }
  }
  const solution = gaussianEliminationSolve(coefficients, constants);
  return Array.from({ length: batterCount }, (_, batterIndex) => solution.slice(batterIndex * 24, (batterIndex + 1) * 24));
}

function makeDistribution(batterMatrices, batterIndex, stateIndex, maxRuns = 8) {
  if (stateIndex === 24) {
    return Array.from({ length: maxRuns + 1 }, (_, index) => ({ label: index === maxRuns ? `${maxRuns}+` : String(index), prob: index === 0 ? 1 : 0 }));
  }
  const batterCount = batterMatrices.length;
  const stateCount = 24;
  let current = Array.from({ length: batterCount }, () => Array.from({ length: stateCount }, () => Array(maxRuns + 1).fill(0)));
  current[batterIndex][stateIndex][0] = 1;
  const finalDistribution = Array(maxRuns + 1).fill(0);

  while (true) {
    let activeMass = 0;
    const next = Array.from({ length: batterCount }, () => Array.from({ length: stateCount }, () => Array(maxRuns + 1).fill(0)));

    for (let currentBatter = 0; currentBatter < batterCount; currentBatter += 1) {
      const nextBatter = (currentBatter + 1) % batterCount;
      for (let currentState = 0; currentState < stateCount; currentState += 1) {
        for (let runsSoFar = 0; runsSoFar <= maxRuns; runsSoFar += 1) {
          const mass = current[currentBatter][currentState][runsSoFar];
          if (mass === 0) continue;
          activeMass += mass;
          for (let nextState = 0; nextState < 25; nextState += 1) {
            const probability = batterMatrices[currentBatter][currentState][nextState];
            if (probability === 0) continue;
            const scored = SCORE_MATRIX[currentState][nextState];
            const nextRuns = Math.min(maxRuns, runsSoFar + Math.max(scored, 0));
            const movedMass = mass * probability;
            if (nextState === 24) {
              finalDistribution[nextRuns] += movedMass;
            } else {
              next[nextBatter][nextState][nextRuns] += movedMass;
            }
          }
        }
      }
    }

    if (activeMass < 1e-15) break;
    current = next;
  }

  return finalDistribution.map((probability, index) => ({ label: index === maxRuns ? `${maxRuns}+` : String(index), prob: probability }));
}

function getBuntOutcomeOutcomes(stateKey, buntSuccessRateValue) {
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
  };
  const config = table[stateKey];
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
  if (Math.abs(total - 1) > 1e-12) outcomes[outcomes.length - 1].probability += 1 - total;
  return outcomes;
}

function getTeamStyle(teamName) {
  if (!teamName) {
    return { badgeClass: "bg-slate-300", label: "-" };
  }
  return TEAM_STYLES[teamName] || { badgeClass: "bg-slate-400", label: teamName };
}

function TeamMark({ teamName }) {
  const team = getTeamStyle(teamName);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
      <span className={`h-3 w-1.5 rounded-[2px] ${team.badgeClass}`} />
      <span className="font-medium">{team.label}</span>
    </span>
  );
}

function TeamPlayerLabel({ name, teamName }) {
  return (
    <span className="inline-flex items-center gap-2">
      <TeamMark teamName={teamName} />
      <span>{name}</span>
    </span>
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(`Self-test failed: ${message}`);
}

function runSelfTests() {
  const parsed = parseCsvText('Name,PA,H,2B,3B,HR,BB,IBB,HBP,SO,SH\nAlice,100,20,5,1,2,10,1,2,15,3');
  assert(parsed.length === 1, "CSV row count");
  assert(parsed[0].Name === "Alice", "CSV field parse");
  const parsedQuoted = parseCsvText('Name,PA\n"Suzuki, Ichiro",10');
  assert(parsedQuoted[0].Name === "Suzuki, Ichiro", "CSV quoted comma");
  const normalized = normalizePlayerRows([{ name: "Bob", pa: "50", h: "10", teamname: "T" }]);
  assert(normalized[0].TeamName === "T", "column alias TeamName");
  const probabilities = buildPlayerProbabilities({ Name: "Test", PA: 100, H: 20, "2B": 5, "3B": 1, HR: 2, BB: 10, IBB: 1, HBP: 2, SO: 15, SH: 3 });
  const totalProbability = EVENT_KEYS.reduce((sum, key) => sum + probabilities[key], 0);
  assert(Math.abs(totalProbability - 1) < 1e-9, "probability sum");
  const buntOutcomes = getBuntOutcomeOutcomes("0/1__", 0.842);
  assert(buntOutcomes.length === 4, "bunt outcome count");
  assert(Math.abs(buntOutcomes.reduce((sum, outcome) => sum + outcome.probability, 0) - 1) < 1e-9, "bunt outcome probability sum");
  assert(buntOutcomes.find((outcome) => outcome.key === "allSafe")?.state === "0/12_", "bunt all-safe state");
}

if (typeof window !== "undefined") {
  try {
    runSelfTests();
  } catch (error) {
    console.error(error);
  }
}

function getChangeRateTone(changeRate) {
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

function ComparisonSection({
  title,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  changeRateLabel,
  changeRateValue,
  changeRate,
}) {
  const tone = getChangeRateTone(changeRate);
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
          <div className="space-y-1">
            <div className="text-sm text-slate-500">{leftLabel}</div>
            <div className="text-2xl font-semibold">{leftValue}</div>
          </div>
          <div className="text-2xl text-slate-400">→</div>
          <div className="space-y-1">
            <div className="text-sm text-slate-500">{rightLabel}</div>
            <div className="text-2xl font-semibold">{rightValue}</div>
          </div>
        </div>
        <div className={`rounded-2xl p-1 text-center justify-center ${tone.cardClass}`}>
          {/* <div className="text-sm text-slate-500">{changeRateLabel}</div> */}
          <div className={`mt-2 flex items-center justify-center gap-2 text-3xl font-semibold ${tone.textClass}`}>
            <span>{changeRateValue}</span>
            <span>{tone.arrow}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BuntOutcomeSummary({ outcomes }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">バント直後の状態分布</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {outcomes.map((outcome) => (
          <div key={outcome.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{STATE_OPTIONS_AFTER_BUNT.find((option) => option.value === outcome.state)?.label || outcome.state}</span>
              <span>{(outcome.probability * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-slate-700" style={{ width: `${outcome.probability * 100}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DistributionBars({ title, data }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <ScrollArea className="h-[250px]">
      <CardContent className="space-y-3">
        {data.map((row) => (
          <div key={row.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{row.label} 点</span>
              <span>{(row.prob * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-slate-700" style={{ width: `${row.prob * 100}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
      </ScrollArea>
    </Card>
  );
}

export default function BuntStrategyGui() {
  const [model, setModel] = useState(null);
  const [playerRows, setPlayerRows] = useState([]);
  const [statsFileName, setStatsFileName] = useState("");
  const [lineup, setLineup] = useState(DEFAULT_LINEUP);
  const [selectedState, setSelectedState] = useState("0/1__");
  const [currentBatterSlot, setCurrentBatterSlot] = useState("1");
  const [buntInputMode, setBuntInputMode] = useState("npb_default");
  const [manualBuntSuccessRate, setManualBuntSuccessRate] = useState("100");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");

  const displayedBuntSuccessRate = useMemo(() => {
    if (buntInputMode === "npb_default") {
      return String(NPB_DEFAULT_BUNT_SUCCESS_RATES[selectedState] ?? 0);
    }
    return manualBuntSuccessRate;
  }, [buntInputMode, manualBuntSuccessRate, selectedState]);

  const buntSuccessRateFraction = useMemo(() => {
    const percentage = Number(displayedBuntSuccessRate);
    if (!Number.isFinite(percentage)) return NaN;
    return percentage / 100;
  }, [displayedBuntSuccessRate]);

  const filteredPlayers = useMemo(() => (teamFilter === "ALL" ? playerRows : playerRows.filter((player) => player.TeamName === teamFilter)), [playerRows, teamFilter]);

  const selectedLineupPlayers = useMemo(() => lineup.map((slot) => playerRows.find((player) => player.playerKey === slot.playerKey)).filter(Boolean), [lineup, playerRows]);

  const playerOptionsBySlot = useMemo(() => {
    return lineup.map((slot) => {
      const selectedPlayer = playerRows.find((player) => player.playerKey === slot.playerKey);
      const slotCandidates = [...filteredPlayers];
      if (selectedPlayer && !slotCandidates.some((player) => player.playerKey === selectedPlayer.playerKey)) {
        slotCandidates.unshift(selectedPlayer);
      }
      return slotCandidates.map((player, index) => ({
        key: player.playerKey || `${player.Name || "Unknown"}__${player.TeamName || "NA"}__${index}`,
        name: player.Name,
        teamName: player.TeamName,
      }));
    });
  }, [filteredPlayers, lineup, playerRows]);

  useEffect(() => {
    fetch("model.json")
      .then((response) => {
        if (!response.ok) throw new Error("model.json の読み込みに失敗しました");
        return response.text();
      })
      .then((text) => setModel(parseModelJson(text)))
      .catch((fetchError) => setError(fetchError.message));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(DEFAULT_CSV_PATH),
          fetch(DEFAULT_AVG_CSV_PATH),
        ]);
        const [text1, text2] = await Promise.all([
          res1.text(),
          res2.text(),
        ]);

        const rows1 = normalizePlayerRows(parseCsvText(text1));
        const rows2 = normalizePlayerRows(parseCsvText(text2));

        const merged = [...rows1, ...rows2];

        setPlayerRows(merged);
        setStatsFileName("デフォルトデータ");
        setLineup(Array.from({ length: 9 }, (_, index) => ({
          slot: index + 1,
          playerKey: merged[index]?.playerKey || ""
        })));

        setError("");
      } catch (e) {
        setError("デフォルトCSVの読み込みに失敗しました");
      }
    })();
  }, []);

  useEffect(() => {
    if (!model || selectedLineupPlayers.length !== 9) return;
    if (displayedBuntSuccessRate === "" || displayedBuntSuccessRate === ".") return;
    const parsedRate = Number(displayedBuntSuccessRate);
    if (!Number.isFinite(parsedRate)) return;
    runAnalysis();
  }, [model, selectedLineupPlayers, currentBatterSlot, selectedState, displayedBuntSuccessRate]);

  async function handleCsvUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const normalizedRows = normalizePlayerRows(parseCsvText(text));
      setPlayerRows(normalizedRows);
      setStatsFileName(file.name);
      setLineup(Array.from({ length: 9 }, (_, index) => ({ slot: index + 1, playerKey: normalizedRows[index]?.playerKey || "" })));
      setError("");
      setResult(null);
    } catch (readError) {
      setError(`CSV 読み込みエラー: ${readError.message}`);
      setResult(null);
    }
  }

  const handleResetToDefault = async () => {
    try {
      const [res1, res2] = await Promise.all([
        fetch(DEFAULT_CSV_PATH),
        fetch(DEFAULT_AVG_CSV_PATH),
      ]);
      const [text1, text2] = await Promise.all([
        res1.text(),
        res2.text(),
      ]);

      const rows1 = normalizePlayerRows(parseCsvText(text1));
      const rows2 = normalizePlayerRows(parseCsvText(text2));

      const merged = [...rows1, ...rows2];

      setPlayerRows(merged);
      setStatsFileName("デフォルトデータ");

      setLineup(Array.from({ length: 9 }, (_, index) => ({
        slot: index + 1,
        playerKey: merged[index]?.playerKey || ""
      })));

      setError("");
      setResult(null);
    } catch (e) {
      setError("デフォルトに戻せませんでした");
    }
  };

  function updateLineup(slotIndex, playerKey) {
    setLineup((previous) => previous.map((slot, index) => (index === slotIndex ? { ...slot, playerKey } : slot)));
  }

  function runAnalysis(overrides = {}) {
    try {
      setError("");
      if (!model) throw new Error("進塁モデルJSONを読み込んでください");
      if (selectedLineupPlayers.length !== 9) throw new Error("9人分の打順をすべて指定してください");

      const effectiveState = overrides.selectedState ?? selectedState;
      const effectiveCurrentBatterSlot = overrides.currentBatterSlot ?? currentBatterSlot;
      const effectiveBuntSuccessRate = overrides.buntSuccessRate ?? buntSuccessRateFraction;

      const lineupProbabilities = selectedLineupPlayers.map(buildPlayerProbabilities);
      const batterMatrices = buildBatterTransitionMatrices(model, lineupProbabilities);
      const runExpectancies = solveRunExpectancies(batterMatrices);
      const scoreProbabilities = solveScoreProbabilities(batterMatrices);

      const batterIndex = Number(effectiveCurrentBatterSlot) - 1;
      const stateIndex = STATE_TO_INDEX[effectiveState];
      const nextBatterIndex = (batterIndex + 1) % 9;

      const noBuntExpectedRuns = runExpectancies[batterIndex][stateIndex];
      const noBuntScoreProbability = scoreProbabilities[batterIndex][stateIndex];
      const noBuntDist = makeDistribution(batterMatrices, batterIndex, stateIndex);

      const buntOutcomes = getBuntOutcomeOutcomes(effectiveState, effectiveBuntSuccessRate);
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
      const buntDist = Array.from({ length: 9 }, (_, index) => ({ label: index === 8 ? "8+" : String(index), prob: 0 }));
      buntOutcomes.forEach((outcome) => {
        const outcomeStateIndex = STATE_TO_INDEX[outcome.state];
        const outcomeDist = makeDistribution(batterMatrices, nextBatterIndex, outcomeStateIndex);
        outcomeDist.forEach((row, index) => {
          buntDist[index].prob += outcome.probability * row.prob;
        });
      });

      const expectedRunsChangeRate = (buntExpectedRuns / noBuntExpectedRuns) - 1;
      const scoringProbabilityChangeRate = (buntScoreProbability / noBuntScoreProbability) - 1;

      setResult({
        noBuntEV: noBuntExpectedRuns,
        buntEV: buntExpectedRuns,
        expectedRunsChangeRate,
        noBuntProb: noBuntScoreProbability,
        buntProb: buntScoreProbability,
        scoringProbabilityChangeRate,
        noBuntDist,
        buntDist,
        lineupProbs: lineupProbabilities,
        buntOutcomes,
      });
    } catch (analysisError) {
      setResult(null);
      setError(analysisError.message);
    }
  }

  function formatExpectedRunsChangeRate(changeRate) {
    return `${changeRate >= 0 ? "+" : ""}${(changeRate * 100).toFixed(0)} %`;
  }

  function formatScoringProbabilityChangeRate(changeRate) {
    return `${changeRate >= 0 ? "+" : ""}${(changeRate * 100).toFixed(0)} %`;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Shall We Bunt?</h1>
            <p className="mt-2 text-sm text-slate-600">アウトカウント・ランナー状況・打力・打順・バント成功率を考慮して、ヒッティングまたはバント時の得点期待値と得点確率を計算・比較します</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">評価条件</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>ランナー状況</Label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="rounded-xl bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>現在の打順</Label>
                  <Select value={currentBatterSlot} onValueChange={setCurrentBatterSlot}>
                    <SelectTrigger className="rounded-xl bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 9 }, (_, index) => <SelectItem key={index + 1} value={String(index + 1)}>{index + 1} 番</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-[160px_auto] items-center gap-x-4 gap-y-2">

                    <Label className="whitespace-nowrap">
                      バント成功率（％）
                    </Label>

                    <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                      <input
                        type="radio"
                        name="bunt-input-mode"
                        value="npb_default"
                        checked={buntInputMode === "npb_default"}
                        onChange={(event) => setBuntInputMode(event.target.value)}
                      />
                      <span>NPB平均値</span>
                    </label>

                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <div className="w-[120px]">
                        <Input
                          inputMode="decimal"
                          value={displayedBuntSuccessRate}
                          onChange={(event) => {
                            if (buntInputMode !== "manual") return;
                            let value = event.target.value;
                            value = value
                              .replace(/[０-９]/g, (s) =>
                                String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
                              )
                              .replace(/．/g, "."); 
                            if (/^[0-9]*\.?[0-9]*$/.test(value)) {
                              setManualBuntSuccessRate(value);
                            }
                          }}
                          disabled={buntInputMode !== "manual"}
                          className={`rounded-xl ${buntInputMode !== "manual"
                            ? "bg-slate-200 text-slate-900"
                            : "bg-white"
                            }`}
                        />
                      </div>
                      <span className="text-sm text-slate-500">％</span>
                    </div>

                    {/* 右下：手動入力 */}
                    <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                      <input
                        type="radio"
                        name="bunt-input-mode"
                        value="manual"
                        checked={buntInputMode === "manual"}
                        onChange={(event) => setBuntInputMode(event.target.value)}
                      />
                      <span>手動入力</span>
                    </label>

                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">打順</CardTitle>
                <CardDescription>1〜9番の打者を選択します</CardDescription>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-[270px] rounded-xl bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEAM_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="inline-flex items-center gap-2">
                          {option.value !== "ALL" && <TeamMark teamName={option.value} />}
                          <span>{option.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  {lineup.map((slot, slotIndex) => {
                    const isCurrentBatter = Number(currentBatterSlot) === slot.slot;
                    return (
                      <div key={slot.slot} className={`space-y-2 rounded-2xl border p-3 transition-colors ${isCurrentBatter ? "border-slate-900 bg-slate-100 shadow-sm" : "bg-white"}`}>
                        <div className="flex items-center justify-between">
                          <Label>{slot.slot} 番</Label>
                          {isCurrentBatter && <Badge className="rounded-full bg-slate-900 text-white hover:bg-slate-900">現在の打者</Badge>}
                        </div>
                        <Select value={slot.playerKey || undefined} onValueChange={(value) => updateLineup(slotIndex, value)}>
                          <SelectTrigger className="rounded-xl bg-white"><SelectValue placeholder="選手を選択" /></SelectTrigger>
                          <SelectContent>
                            {playerOptionsBySlot[slotIndex].map((player) => (
                              <SelectItem key={`${slot.slot}-${player.key}`} value={player.key}>
                                <TeamPlayerLabel name={player.name} teamName={player.teamName} />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="h-5 w-5" />
                  入力データ
                </CardTitle>
                <CardDescription>
                  デフォルト or CSVアップロードで選手成績を切り替え
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="csvUpload">CSVアップロード</Label>

                  <Input
                    id="csvUpload"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvUpload}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {statsFileName || "未読込"}
                  </div>

                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    デフォルトに戻す
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Tabs defaultValue="result" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl">
                <TabsTrigger value="result">結果</TabsTrigger>
                <TabsTrigger value="players">打者データ</TabsTrigger>
              </TabsList>

              <TabsContent value="result" className="space-y-6">
                {result ? (
                  <>
                    <ComparisonSection
                      title="この回の得点期待値"
                      leftLabel="ヒッティング"
                      leftValue={`${result.noBuntEV.toFixed(2)} 点`}
                      rightLabel="バント"
                      rightValue={`${result.buntEV.toFixed(2)} 点`}
                      changeRateLabel="変化率 (バント / ヒッティング)"
                      changeRateValue={formatExpectedRunsChangeRate(result.expectedRunsChangeRate)}
                      changeRate={result.expectedRunsChangeRate}
                    />
                    <ComparisonSection
                      title="この回の得点確率"
                      leftLabel="ヒッティング"
                      leftValue={`${(result.noBuntProb * 100).toFixed(1)} %`}
                      rightLabel="バント"
                      rightValue={`${(result.buntProb * 100).toFixed(1)} %`}
                      changeRateLabel="変化率 (バント / ヒッティング)"
                      changeRateValue={formatScoringProbabilityChangeRate(result.scoringProbabilityChangeRate)}
                      changeRate={result.scoringProbabilityChangeRate}
                    />
                    <div className="grid gap-4 xl:grid-cols-2">
                      <DistributionBars title="ヒッティング時の得点分布" data={result.noBuntDist} />
                      <DistributionBars title="バント時の得点分布" data={result.buntDist} />
                    </div>
                    {/*<BuntOutcomeSummary outcomes={result.buntOutcomes} />*/}
                  </>
                ) : (
                  <Card className="rounded-2xl shadow-sm"><CardContent className="p-6 text-sm text-slate-600">まだ解析結果がありません</CardContent></Card>
                )}
              </TabsContent>

              <TabsContent value="players">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">打者ごとの打撃イベント確率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[660px]">
                      <div className="space-y-4">
                        {result?.lineupProbs ? result.lineupProbs.map((player, index) => (
                          <div key={`${player.Name}-${index}`} className="rounded-2xl border p-4">
                            <div className="mb-3 font-medium">{index + 1} 番: {player.Name}</div>
                            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                              {EVENT_KEYS.map((key) => (
                                <div key={key} className="rounded-xl bg-slate-50 p-2">
                                  <div className="text-slate-500">{EVENT_JP[key]}</div>
                                  <div className="font-medium">{(player[key] * 100).toFixed(2)}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )) : <div className="text-sm text-slate-600">まだ解析結果がありません</div>}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">説明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>・本サイトのソースコードは<a href="https://github.com/haborite/shall-we-bunt" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">こちら</a>で公開しています。</p>
            <p>・野球の攻撃状態を25状態（アウトカウント × ランナー状況）の吸収マルコフ過程としてモデル化し、逐次状態間遷移計算により任意の状況からの得点期待値と得点確率を算出しています。</p>
            <p>・<a href="https://github.com/ogu-kazemiya/baseball-state-simulator" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">ogu-kazemiya氏によって公開されている</a>、各打撃イベント(単打・二塁打・三塁打・本塁打・三振・四死球・凡打)による攻撃状態間の遷移確率行列を状態遷移モデルとして用いました。</p>
            <p>・遷移確率行列の構築には<a href="https://baseballsavant.mlb.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Baseball Savant</a>で公開されているMLBのStatcastデータを用いました。</p>
            <p>・バント試行時の状態遷移モデルには、<a href="https://1point02.jp/op/gnav/column/bs/column.aspx?cid=53680" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">DELTA社が公開しているバントの結果分布</a>データにいくつかの仮定を加えて用いました。</p>
            <p>・「バント成功率」は「意図通りの進塁 + オールセーフ」の合計確率として定義しています。</p>
            <p>・各選手の打席内容データは現行シーズンのものです。<a href="https://npbdata.jp" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">プロ野球データ</a>で公開されているものを用いました（50打席以上の選手が対象）。</p>
            <p>・選手ごとの走塁能力、凡打の内容、投手との相性、相手チームの守備力といった要素は考慮されていません。</p>
          </CardContent>
        </Card>

        <Separator />
        <NyTimesQuote />
      </div>
    </div>
  );
}

function NyTimesQuote() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full px-4 py-8">
      <div className="relative space-y-6 text-slate-700">

        {/* 引用マーク */}
        <div className="absolute -left-2 -top-2 text-5xl text-slate-300">
          “
        </div>

        {/* 本文 */}
        <div className="space-y-5 font-serif text-[16px] leading-8 tracking-[0.01em]">
          <p>
            ずいぶん昔のこと、フランキー・フリッシュがピッツバーグ・パイレーツの監督をしていた頃の話だ。三塁側のボックス席に居た一人のファンが、絶えずフリッシュに野次を飛ばし、大声で采配にケチをつけていた。試合のある場面で、フリッシュは微妙な判断を迫られた。打者にバントをさせるべきか、それとも打たせるべきか。
          </p>

          {/* ★ 強調部分 */}
          <p>
            いたずら好きのフリッシュはタイムをかけ、わざわざその大声男のところまで歩いていった。
            「困ったことになってね、相棒」とフリッシュは言った。
            「君の助けが必要なんだ。バントするか、それとも打たせるか、どっちがいい？
            <span className="ml-2 text-slate-500">
              （
              <span className="italic text-slate-700">
                <span className="font-semibold tracking-wide">
                  Shall we bunt
                </span>{" "}
                or hit away?
              </span>
              ）
            </span>」
          </p>

          {expanded && (
            <div className="animate-in fade-in-0 duration-300">
              <p>
                ──────────
              </p>
              <p>
                「助かったよ、相棒」フリッシュはにこやかに言った。「ところで、名前と勤め先を教えてくれないか。」
              </p>
              <p>
                「なぜだ？」と男が訝しむと、フリッシュは体裁をかなぐり捨てて怒鳴った。
              </p>
              <p><br></br></p>
              <p>
                <span className="italic text-slate-700">
                  <span>
                    「
                  </span>
                  <span className="font-semibold tracking-wide">
                    決まってるだろ！明日の朝いちばんに君の職場へ行って、一日中君に仕事のやり方を教えてやるためさ！
                  </span>
                  」
                </span>                
              </p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-end justify-between pt-4">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs tracking-[0.15em] text-slate-400 hover:text-slate-600 transition"
          >
            {expanded ? "CLOSE" : "READ MORE"}
          </button>

          <a
            href="https://www.nytimes.com/1954/11/18/archives/sports-of-the-times-thats-telling-em-buster.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-right text-xs tracking-[0.12em] text-slate-400 transition hover:text-slate-600"
          >
            NEW YORK TIMES<br />
            NOVEMBER 18, 1954
          </a>
        </div>
      </div>
    </div>
  );
}