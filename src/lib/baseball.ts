import { EVENT_KEYS } from "@/constants/baseball";
import { toNumber } from "@/lib/csv";

export function buildPlayerProbabilities(playerRow: Record<string, unknown>) {
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

  if (denominator <= 0) {
    throw new Error(`${playerRow.Name}: PA - IBB - SH が 0 以下です`);
  }

  const singles = H - doubles - triples - HR;
  const walks = BB - IBB + HBP;
  const fieldOuts = PA - H - BB - HBP - SO - SH;

  if (singles < 0 || walks < 0 || fieldOuts < 0) {
    throw new Error(`${playerRow.Name}: 成績列の整合性が取れていません`);
  }

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

export function parseModelJson(text: string) {
  const parsed = JSON.parse(text);
  const model = parsed.model || parsed;

  for (const eventKey of EVENT_KEYS) {
    if (
      !Array.isArray(model[eventKey]) ||
      model[eventKey].length !== 25 ||
      !model[eventKey].every((row: unknown) => Array.isArray(row) && row.length === 25)
    ) {
      throw new Error(`モデルJSONの ${eventKey} は 25x25 行列である必要があります`);
    }
  }

  return model;
}

export function normalizeTransitionMatrix(matrix: number[][]) {
  return matrix.map((row, rowIndex) => {
    const rowSum = row.reduce((sum, value) => sum + value, 0);
    if (rowSum <= 0) {
      throw new Error(`遷移行列の ${rowIndex} 行目の和が 0 以下です`);
    }
    return row.map((value) => value / rowSum);
  });
}

export function buildBatterTransitionMatrices(model: Record<string, number[][]>, lineupProbabilities: Record<string, number>[]) {
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