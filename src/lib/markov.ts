import { BASE_BIT_MAP } from "@/constants/baseball";

function scoreFromStates(fromState: number, toState: number) {
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

export const SCORE_MATRIX = Array.from({ length: 25 }, (_, fromState) =>
  Array.from({ length: 25 }, (_, toState) => scoreFromStates(fromState, toState))
);

export function gaussianEliminationSolve(coefficients: number[][], constants: number[]) {
  const size = coefficients.length;
  const augmented = coefficients.map((row, index) => [...row, constants[index]]);

  for (let pivotIndex = 0; pivotIndex < size; pivotIndex += 1) {
    let maxRow = pivotIndex;
    for (let rowIndex = pivotIndex + 1; rowIndex < size; rowIndex += 1) {
      if (Math.abs(augmented[rowIndex][pivotIndex]) > Math.abs(augmented[maxRow][pivotIndex])) {
        maxRow = rowIndex;
      }
    }

    if (Math.abs(augmented[maxRow][pivotIndex]) < 1e-12) {
      throw new Error("連立方程式を解けませんでした。行列が特異です。");
    }

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

export function solveRunExpectancies(batterMatrices: number[][][]) {
  const batterCount = batterMatrices.length;
  const dimension = 24 * batterCount;
  const coefficients = Array.from({ length: dimension }, (_, rowIndex) =>
    Array.from({ length: dimension }, (_, columnIndex) => (rowIndex === columnIndex ? 1 : 0))
  );
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
        if (nextStateIndex < 24) {
          coefficients[equationIndex][nextBatterIndex * 24 + nextStateIndex] -= probability;
        }
      }

      constants[equationIndex] = reward;
    }
  }

  const solution = gaussianEliminationSolve(coefficients, constants);
  return Array.from({ length: batterCount }, (_, batterIndex) =>
    solution.slice(batterIndex * 24, (batterIndex + 1) * 24)
  );
}

export function solveScoreProbabilities(batterMatrices: number[][][]) {
  const batterCount = batterMatrices.length;
  const dimension = 24 * batterCount;
  const coefficients = Array.from({ length: dimension }, (_, rowIndex) =>
    Array.from({ length: dimension }, (_, columnIndex) => (rowIndex === columnIndex ? 1 : 0))
  );
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
  return Array.from({ length: batterCount }, (_, batterIndex) =>
    solution.slice(batterIndex * 24, (batterIndex + 1) * 24)
  );
}

export function makeDistribution(
  batterMatrices: number[][][],
  batterIndex: number,
  stateIndex: number,
  maxRuns = 8
) {
  if (stateIndex === 24) {
    return Array.from({ length: maxRuns + 1 }, (_, index) => ({
      label: index === maxRuns ? `${maxRuns}+` : String(index),
      prob: index === 0 ? 1 : 0,
    }));
  }

  const batterCount = batterMatrices.length;
  const stateCount = 24;
  let current = Array.from({ length: batterCount }, () =>
    Array.from({ length: stateCount }, () => Array(maxRuns + 1).fill(0))
  );
  current[batterIndex][stateIndex][0] = 1;
  const finalDistribution = Array(maxRuns + 1).fill(0);

  while (true) {
    let activeMass = 0;
    const next = Array.from({ length: batterCount }, () =>
      Array.from({ length: stateCount }, () => Array(maxRuns + 1).fill(0))
    );

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

  return finalDistribution.map((probability, index) => ({
    label: index === maxRuns ? `${maxRuns}+` : String(index),
    prob: probability,
  }));
}