import { useEffect, useMemo, useState } from "react";
import { Upload, AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  DEFAULT_CSV_PATH,
  DEFAULT_AVG_CSV_PATH,
  DEFAULT_LINEUP,
  EVENT_KEYS,
  EVENT_JP,
  STATE_OPTIONS,
  TEAM_FILTER_OPTIONS,
  NPB_DEFAULT_BUNT_SUCCESS_RATES,
} from "@/constants/baseball";

import { parseCsvText, normalizePlayerRows } from "@/lib/csv";
import { parseModelJson } from "@/lib/baseball";
import { analyzeBuntStrategy } from "@/lib/analyze";
import {
  formatExpectedRunsChangeRate,
  formatScoringProbabilityChangeRate,
} from "@/lib/format";
import { runSelfTests } from "@/lib/selfTest";

import { ComparisonSection } from "@/components/bunt/ComparisonSection";
import { DistributionBars } from "@/components/bunt/DistributionBars";
import { BuntOutcomeSummary } from "@/components/bunt/BuntOutcomeSummary";
import { TeamMark } from "@/components/bunt/TeamMark";
import { TeamPlayerLabel } from "@/components/bunt/TeamPlayerLabel";
import { NyTimesQuote } from "@/components/bunt/NyTimesQuote";

type PlayerRow = Record<string, unknown> & {
  Name: string;
  TeamName?: string;
  playerKey: string;
};

type LineupSlot = {
  slot: number;
  playerKey: string;
};

type AnalysisResult = {
  noBuntEV: number;
  buntEV: number;
  expectedRunsChangeRate: number;
  noBuntProb: number;
  buntProb: number;
  scoringProbabilityChangeRate: number;
  noBuntDist: { label: string; prob: number }[];
  buntDist: { label: string; prob: number }[];
  lineupProbs: Array<Record<string, number | string>>;
  buntOutcomes: { key: string; label: string; probability: number; state: string }[];
};

if (typeof window !== "undefined") {
  try {
    runSelfTests();
  } catch (error) {
    console.error(error);
  }
}

export default function BuntStrategyGui() {
  const [model, setModel] = useState<Record<string, number[][]> | null>(null);
  const [playerRows, setPlayerRows] = useState<PlayerRow[]>([]);
  const [statsFileName, setStatsFileName] = useState("");
  const [lineup, setLineup] = useState<LineupSlot[]>(DEFAULT_LINEUP);
  const [selectedState, setSelectedState] = useState("0/1__");
  const [currentBatterSlot, setCurrentBatterSlot] = useState("1");
  const [buntInputMode, setBuntInputMode] = useState<"npb_default" | "manual">("npb_default");
  const [manualBuntSuccessRate, setManualBuntSuccessRate] = useState("100");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");

  const displayedBuntSuccessRate = useMemo(() => {
    if (buntInputMode === "npb_default") {
      return String(
        NPB_DEFAULT_BUNT_SUCCESS_RATES[
          selectedState as keyof typeof NPB_DEFAULT_BUNT_SUCCESS_RATES
        ] ?? 0
      );
    }
    return manualBuntSuccessRate;
  }, [buntInputMode, manualBuntSuccessRate, selectedState]);

  const buntSuccessRateFraction = useMemo(() => {
    const percentage = Number(displayedBuntSuccessRate);
    if (!Number.isFinite(percentage)) return NaN;
    return percentage / 100;
  }, [displayedBuntSuccessRate]);

  const filteredPlayers = useMemo(() => {
    if (teamFilter === "ALL") return playerRows;
    return playerRows.filter((player) => player.TeamName === teamFilter);
  }, [playerRows, teamFilter]);

  const selectedLineupPlayers = useMemo(() => {
    return lineup
      .map((slot) => playerRows.find((player) => player.playerKey === slot.playerKey))
      .filter(Boolean) as PlayerRow[];
  }, [lineup, playerRows]);

  const playerOptionsBySlot = useMemo(() => {
    return lineup.map((slot) => {
      const selectedPlayer = playerRows.find(
        (player) => player.playerKey === slot.playerKey
      );
      const slotCandidates = [...filteredPlayers];

      if (
        selectedPlayer &&
        !slotCandidates.some((player) => player.playerKey === selectedPlayer.playerKey)
      ) {
        slotCandidates.unshift(selectedPlayer);
      }

      return slotCandidates.map((player, index) => ({
        key: player.playerKey || `${player.Name || "Unknown"}__${player.TeamName || "NA"}__${index}`,
        name: String(player.Name ?? "Unknown"),
        teamName: String(player.TeamName ?? ""),
      }));
    });
  }, [filteredPlayers, lineup, playerRows]);

  useEffect(() => {
    fetch("model.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("model.json の読み込みに失敗しました");
        }
        return response.text();
      })
      .then((text) => {
        setModel(parseModelJson(text));
      })
      .catch((fetchError: unknown) => {
        setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
      });
  }, []);

  useEffect(() => {
    void loadDefaultStats();
  }, []);

  useEffect(() => {
    if (!model || selectedLineupPlayers.length !== 9) return;
    if (displayedBuntSuccessRate === "" || displayedBuntSuccessRate === ".") return;

    const parsedRate = Number(displayedBuntSuccessRate);
    if (!Number.isFinite(parsedRate)) return;

    runAnalysis();
  }, [
    model,
    selectedLineupPlayers,
    currentBatterSlot,
    selectedState,
    displayedBuntSuccessRate,
  ]);

  async function loadDefaultStats() {
    try {
      const [res1, res2] = await Promise.all([
        fetch(DEFAULT_CSV_PATH),
        fetch(DEFAULT_AVG_CSV_PATH),
      ]);

      if (!res1.ok || !res2.ok) {
        throw new Error("デフォルトCSVの読み込みに失敗しました");
      }

      const [text1, text2] = await Promise.all([res1.text(), res2.text()]);

      const rows1 = normalizePlayerRows(parseCsvText(text1)) as PlayerRow[];
      const rows2 = normalizePlayerRows(parseCsvText(text2)) as PlayerRow[];
      const merged = [...rows1, ...rows2];

      setPlayerRows(merged);
      setStatsFileName("デフォルトデータ");
      setLineup(
        Array.from({ length: 9 }, (_, index) => ({
          slot: index + 1,
          playerKey: merged[index]?.playerKey || "",
        }))
      );
      setError("");
      setResult(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "デフォルトCSVの読み込みに失敗しました");
      setResult(null);
    }
  }

  async function handleCsvUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const normalizedRows = normalizePlayerRows(parseCsvText(text)) as PlayerRow[];

      setPlayerRows(normalizedRows);
      setStatsFileName(file.name);
      setLineup(
        Array.from({ length: 9 }, (_, index) => ({
          slot: index + 1,
          playerKey: normalizedRows[index]?.playerKey || "",
        }))
      );
      setError("");
      setResult(null);
    } catch (readError: unknown) {
      setError(
        `CSV 読み込みエラー: ${
          readError instanceof Error ? readError.message : String(readError)
        }`
      );
      setResult(null);
    }
  }

  async function handleResetToDefault() {
    await loadDefaultStats();
  }

  function updateLineup(slotIndex: number, playerKey: string) {
    setLineup((previous) =>
      previous.map((slot, index) =>
        index === slotIndex ? { ...slot, playerKey } : slot
      )
    );
  }

  function runAnalysis(
    overrides: {
      selectedState?: string;
      currentBatterSlot?: string;
      buntSuccessRate?: number;
    } = {}
  ) {
    try {
      setError("");

      if (!model) {
        throw new Error("進塁モデルJSONを読み込んでください");
      }
      if (selectedLineupPlayers.length !== 9) {
        throw new Error("9人分の打順をすべて指定してください");
      }

      const effectiveState = overrides.selectedState ?? selectedState;
      const effectiveCurrentBatterSlot =
        overrides.currentBatterSlot ?? currentBatterSlot;
      const effectiveBuntSuccessRate =
        overrides.buntSuccessRate ?? buntSuccessRateFraction;

      const analysisResult = analyzeBuntStrategy({
        model,
        lineupPlayers: selectedLineupPlayers,
        selectedState: effectiveState,
        currentBatterSlot: effectiveCurrentBatterSlot,
        buntSuccessRateFraction: effectiveBuntSuccessRate,
      }) as AnalysisResult;

      setResult(analysisResult);
    } catch (analysisError: unknown) {
      setResult(null);
      setError(
        analysisError instanceof Error ? analysisError.message : String(analysisError)
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 text-slate-900 sm:px-4 sm:py-6 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Shall We Bunt?</h1>
            <p className="mt-2 text-sm text-slate-600">
              具体的な状況ごとのヒッティング or バントの得点期待値と得点確率を計算・比較します
            </p>
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
          <div className="order-2 space-y-6 lg:order-1">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">評価条件</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>ランナー状況</Label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="rounded-xl bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>現在の打順</Label>
                  <Select value={currentBatterSlot} onValueChange={setCurrentBatterSlot}>
                    <SelectTrigger className="rounded-xl bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 9 }, (_, index) => (
                        <SelectItem key={index + 1} value={String(index + 1)}>
                          {index + 1} 番
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-[160px_auto] items-center gap-x-4 gap-y-2">
                    <Label className="whitespace-nowrap">バント成功率（％）</Label>

                    <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                      <input
                        type="radio"
                        name="bunt-input-mode"
                        value="npb_default"
                        checked={buntInputMode === "npb_default"}
                        onChange={(event) =>
                          setBuntInputMode(event.target.value as "npb_default" | "manual")
                        }
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
                                String.fromCharCode(s.charCodeAt(0) - 0xfee0)
                              )
                              .replace(/．/g, ".");

                            if (/^[0-9]*\.?[0-9]*$/.test(value)) {
                              setManualBuntSuccessRate(value);
                            }
                          }}
                          disabled={buntInputMode !== "manual"}
                          className={`rounded-xl ${
                            buntInputMode !== "manual"
                              ? "bg-slate-200 text-slate-900"
                              : "bg-white"
                          }`}
                        />
                      </div>
                      <span className="text-sm text-slate-500">％</span>
                    </div>

                    <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                      <input
                        type="radio"
                        name="bunt-input-mode"
                        value="manual"
                        checked={buntInputMode === "manual"}
                        onChange={(event) =>
                          setBuntInputMode(event.target.value as "npb_default" | "manual")
                        }
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
                  <SelectTrigger className="w-full rounded-xl bg-white sm:w-[270px]">
                    <SelectValue />
                  </SelectTrigger>
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {lineup.map((slot, slotIndex) => {
                    const isCurrentBatter = Number(currentBatterSlot) === slot.slot;

                    return (
                      <div
                        key={slot.slot}
                        className={`space-y-2 rounded-2xl border p-3 transition-colors ${
                          isCurrentBatter
                            ? "border-slate-900 bg-slate-100 shadow-sm"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Label>{slot.slot} 番</Label>
                          {isCurrentBatter && (
                            <Badge className="rounded-full bg-slate-900 text-white hover:bg-slate-900">
                              現在の打者
                            </Badge>
                          )}
                        </div>

                        <Select
                          value={slot.playerKey || undefined}
                          onValueChange={(value) => updateLineup(slotIndex, value)}
                        >
                          <SelectTrigger className="rounded-xl bg-white">
                            <SelectValue placeholder="選手を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {playerOptionsBySlot[slotIndex].map((player) => (
                              <SelectItem key={`${slot.slot}-${player.key}`} value={player.key}>
                                <TeamPlayerLabel
                                  name={player.name}
                                  teamName={player.teamName}
                                />
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

          <div className="order-1 space-y-6 lg:order-2">
            <Tabs defaultValue="result" className="w-full">
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-2xl">
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
                      changeRateValue={formatExpectedRunsChangeRate(
                        result.expectedRunsChangeRate
                      )}
                      changeRate={result.expectedRunsChangeRate}
                    />

                    <ComparisonSection
                      title="この回の得点確率"
                      leftLabel="ヒッティング"
                      leftValue={`${(result.noBuntProb * 100).toFixed(1)} %`}
                      rightLabel="バント"
                      rightValue={`${(result.buntProb * 100).toFixed(1)} %`}
                      changeRateValue={formatScoringProbabilityChangeRate(
                        result.scoringProbabilityChangeRate
                      )}
                      changeRate={result.scoringProbabilityChangeRate}
                    />

                    <div className="grid gap-4 xl:grid-cols-2">
                      <DistributionBars
                        title="ヒッティング時の得点分布"
                        data={result.noBuntDist}
                      />
                      <DistributionBars
                        title="バント時の得点分布"
                        data={result.buntDist}
                      />
                    </div>

                    {/* 必要なら有効化 */}
                    {/* <BuntOutcomeSummary outcomes={result.buntOutcomes} /> */}
                  </>
                ) : (
                  <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-6 text-sm text-slate-600">
                      まだ解析結果がありません
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="players">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">打者ごとの打撃イベント確率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[420px] sm:h-[520px] lg:h-[660px]">
                      <div className="space-y-4">
                        {result?.lineupProbs ? (
                          result.lineupProbs.map((player, index) => (
                            <div
                              key={`${String(player.Name)}-${index}`}
                              className="rounded-2xl border p-4"
                            >
                              <div className="mb-3 font-medium">
                                {index + 1} 番: {String(player.Name)}
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                                {EVENT_KEYS.map((key) => (
                                  <div key={key} className="rounded-xl bg-slate-50 p-2">
                                    <div className="text-slate-500">
                                      {EVENT_JP[key]}
                                    </div>
                                    <div className="font-medium">
                                      {(Number(player[key]) * 100).toFixed(2)}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-600">
                            まだ解析結果がありません
                          </div>
                        )}
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
            <p>
              ・本サイトのソースコードは
              <a
                href="https://github.com/haborite/shall-we-bunt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                こちら
              </a>
              で公開しています。
            </p>
            <p>
              ・野球の攻撃状態を25状態（アウトカウント × ランナー状況）の吸収マルコフ過程としてモデル化し、逐次状態間遷移計算により任意の状況からの得点期待値と得点確率を算出しています。
            </p>
            <p>
              ・状態間遷移モデルとしては、7種類の打撃イベント(単打・二塁打・三塁打・本塁打・三振・四死球・凡打)による攻撃状態間の遷移確率行列を用いました。
            </p>
            <p>
              ・遷移確率行列の構築には
              <a
                href="https://baseballsavant.mlb.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Baseball Savant
              </a>
              で公開されているMLBのStatcastデータを用いました。
            </p>
            <p>
              ・バント試行時の状態遷移モデルとしては、
              <a
                href="https://1point02.jp/op/gnav/column/bs/column.aspx?cid=53680"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                DELTA株式会社が公開している4種類のバント結果分布（大成功・成功・失敗・大失敗）
              </a>
              にいくつかの仮定を加えて用いました。
            </p>
            <p>
              ・「バント成功率」は「意図通りの進塁 + オールセーフ」の合計確率として定義しています。
            </p>
            <p>
              ・各選手の打席内容データは現行シーズンのものです。
              <a
                href="https://npbdata.jp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                プロ野球データ
              </a>
              で公開されているものを用いました（50打席以上の選手が対象）。
            </p>
            <p>
              ・選手ごとの走塁能力、凡打内容、相手チームの投手力・守備力といった要素は考慮されていません。
            </p>
          </CardContent>
        </Card>

        <Separator />
        <NyTimesQuote />
      </div>
    </div>
  );
}