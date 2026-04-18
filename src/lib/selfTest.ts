import { parseCsvText, normalizePlayerRows } from "@/lib/csv";
import { buildPlayerProbabilities } from "@/lib/baseball";
import { getBuntOutcomeOutcomes } from "@/lib/bunt";
import { EVENT_KEYS } from "@/constants/baseball";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Self-test failed: ${message}`);
}

export function runSelfTests() {
  const parsed = parseCsvText(
    'Name,PA,H,2B,3B,HR,BB,IBB,HBP,SO,SH\nAlice,100,20,5,1,2,10,1,2,15,3'
  );
  assert(parsed.length === 1, "CSV row count");
  assert(parsed[0].Name === "Alice", "CSV field parse");

  const parsedQuoted = parseCsvText('Name,PA\n"Suzuki, Ichiro",10');
  assert(parsedQuoted[0].Name === "Suzuki, Ichiro", "CSV quoted comma");

  const normalized = normalizePlayerRows([{ name: "Bob", pa: "50", h: "10", teamname: "T" }]);
  assert(normalized[0].TeamName === "T", "column alias TeamName");

  const probabilities = buildPlayerProbabilities({
    Name: "Test",
    PA: 100,
    H: 20,
    "2B": 5,
    "3B": 1,
    HR: 2,
    BB: 10,
    IBB: 1,
    HBP: 2,
    SO: 15,
    SH: 3,
  });

  const totalProbability = EVENT_KEYS.reduce((sum, key) => sum + probabilities[key], 0);
  assert(Math.abs(totalProbability - 1) < 1e-9, "probability sum");

  const buntOutcomes = getBuntOutcomeOutcomes("0/1__", 0.842);
  assert(buntOutcomes.length === 4, "bunt outcome count");
  assert(
    Math.abs(buntOutcomes.reduce((sum, outcome) => sum + outcome.probability, 0) - 1) < 1e-9,
    "bunt outcome probability sum"
  );
  assert(
    buntOutcomes.find((outcome) => outcome.key === "allSafe")?.state === "0/12_",
    "bunt all-safe state"
  );
}