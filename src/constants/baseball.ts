export const DEFAULT_CSV_PATH = "npb_fielder_stats.csv";
export const DEFAULT_AVG_CSV_PATH = "npb_avg_stats.csv";

export const EVENT_KEYS = [
  "single",
  "double",
  "triple",
  "home_run",
  "walk",
  "strikeout",
  "field_out",
] as const;

export const EVENT_JP = {
  single: "一塁打",
  double: "二塁打",
  triple: "三塁打",
  home_run: "本塁打",
  walk: "四球",
  strikeout: "三振",
  field_out: "凡打",
};

export const STATE_OPTIONS = [
  { value: "0/1__", label: "無死一塁" },
  { value: "0/_2_", label: "無死二塁" },
  { value: "0/12_", label: "無死一二塁" },
  { value: "1/1__", label: "一死一塁" },
  { value: "1/_2_", label: "一死二塁" },
  { value: "1/12_", label: "一死一二塁" },
];

export const STATE_OPTIONS_AFTER_BUNT = [
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

export const COLUMN_MAPPING = {
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
} as const;

export const BASE_BIT_MAP: Record<number, number> = {
  0: 0b000,
  1: 0b001,
  2: 0b010,
  3: 0b100,
  4: 0b011,
  5: 0b101,
  6: 0b110,
  7: 0b111,
};

export const STATE_STR_MAP = {
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
} as const;

export const STATE_TO_INDEX = Object.fromEntries(
  Object.entries(STATE_STR_MAP).map(([key, value]) => [value, Number(key)])
);

export const DEFAULT_LINEUP = Array.from({ length: 9 }, (_, index) => ({
  slot: index + 1,
  playerKey: "",
}));

export const TEAM_STYLES = {
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
} as const;

export const TEAM_FILTER_OPTIONS = [
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
];

export const TEAM_FILTER_OPTIONS_GENERAL = [
  { value: "-", label: "その他" },
];

export const NPB_DEFAULT_BUNT_SUCCESS_RATES = {
  "0/1__": 84.2,
  "1/1__": 84.2,
  "0/_2_": 89.7,
  "1/_2_": 89.7,
  "0/12_": 75.2,
  "1/12_": 75.2,
} as const;