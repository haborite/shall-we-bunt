import requests
import pandas as pd
from bs4 import BeautifulSoup
import time

base_url = "https://npbdata.jp/stats/fielder?plateAppearances=plate_appearances_50&column=battingAverage&order=desc&page={}"

all_rows = []
page = 1

while True:
    url = base_url.format(page)
    print(f"Fetching page {page}...")

    res = requests.get(url)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")
    table = soup.find("table")

    if table is None:
        break

    rows = table.find_all("tr")

    # ヘッダー取得（最初だけ）
    if page == 1:
        headers = [th.text.strip().replace("▼", "").replace("▲", "") for th in rows[0].find_all("th")]

    data_rows = []
    for tr in rows[1:]:
        cols = [td.text.strip() for td in tr.find_all("td")]
        if cols:
            data_rows.append(cols)

    if len(data_rows) == 0:
        print("Reached empty page.")
        break

    all_rows.extend(data_rows)
    page += 1
    time.sleep(1)

df = pd.DataFrame(all_rows, columns=headers)

drop_cols = [
    "打率", "試合", "塁打", "打点", "得点",
    "盗塁", "盗塁死", "出塁率", "長打率", "得点圏打率"
]

df = df.drop(columns=[col for col in drop_cols if col in df.columns])

# -----------------------------
# カラム名リネーム
# -----------------------------
rename_dict = {
    "#": "Rk",
    "選手": "Name",
    "チーム": "TeamName",
    "打席": "PA",
    "打数": "AB",
    "安打": "H",
    "二塁打": "2B",
    "三塁打": "3B",
    "本塁打": "HR",
    "三振": "SO",
    "四球": "BB",
    "死球": "HBP",
    "犠打": "SH",
    "犠飛": "SF",
    "併殺打": "GDP"
}

df = df.rename(columns=rename_dict)

numeric_cols = [
    "Rk", "PA", "AB", "H", "2B", "3B", "HR",
    "SO", "BB", "HBP", "SH", "SF", "GDP"
]

for col in numeric_cols:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")

df.to_csv("npb_fielder_stats_clean.csv", index=False, encoding="utf-8-sig")

print("Saved to npb_fielder_stats_clean.csv")