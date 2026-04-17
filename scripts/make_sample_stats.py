import pandas as pd
import numpy as np

# -----------------------------
# 1. 読み込み & 公式戦フィルタ
# -----------------------------
df = pd.read_csv("../local_data/player_batting_stats_jp_2025.csv")
df = df[df["ゲームタイプ"] == "公式戦"].copy()

# -----------------------------
# 2. 野手・投手分離
# -----------------------------
batters = df[df["守備位置"] != "投"].copy()
pitchers = df[df["守備位置"] == "投"].copy()

# -----------------------------
# 3. 共通カラム
# -----------------------------
cols = ["打数","安打","二塁打","三塁打","本塁打",
        "三振","四球","死球","犠打","犠飛","併殺"]

# -----------------------------
# 4. 野手個人成績
# -----------------------------
bat = batters.groupby("名前", as_index=False)[cols].sum()

# 打席・単打・塁打
bat["PA"] = bat["打数"] + bat["四球"] + bat["死球"] + bat["犠打"] + bat["犠飛"]
bat["1B"] = bat["安打"] - bat["二塁打"] - bat["三塁打"] - bat["本塁打"]
bat["TB"] = bat["1B"] + 2*bat["二塁打"] + 3*bat["三塁打"] + 4*bat["本塁打"]

# OBPのみ計算（必要なものだけ）
bat["OBP"] = np.where(
    bat["PA"] > 0,
    (bat["安打"] + bat["四球"] + bat["死球"]) / bat["PA"],
    0
)

# -----------------------------
# 5. 規定打席
# -----------------------------
if "試合" in df.columns:
    games = df["試合"].max()
    threshold = int(games * 3.1)
else:
    threshold = 443  # fallback（要データ仕様確認）

bat_qual = bat[bat["PA"] >= threshold]

# -----------------------------
# 6. OBP上位10人
# -----------------------------
top10 = bat_qual.sort_values("OBP", ascending=False).head(10)

print("規定打席到達者数:", len(bat_qual))
print("上位10人該当者数:", len(top10))

# -----------------------------
# 7. 集計関数（簡潔＆安全）
# -----------------------------
def summarize(df_part, name):
    if df_part.empty:
        return pd.DataFrame()
    s = df_part[cols].sum()
    pa = s["打数"] + s["四球"] + s["死球"] + s["犠打"] + s["犠飛"]
    obp = (s["安打"] + s["四球"] + s["死球"]) / pa if pa > 0 else 0
    return pd.DataFrame([{
        "Name": name,
        "TeamName": "-",
        "PA": pa,
        "打数": s["打数"],
        "安打": s["安打"],
        "二塁打": s["二塁打"],
        "三塁打": s["三塁打"],
        "本塁打": s["本塁打"],
        "三振": s["三振"],
        "四球": s["四球"],
        "死球": s["死球"],
        "犠打": s["犠打"],
        "犠飛": s["犠飛"],
        "併殺": s["併殺"],
        "OBP": obp
    }])

# -----------------------------
# 8. グループ集計
# -----------------------------
final = pd.concat([
    summarize(batters[batters["名前"].isin(top10["名前"])], "NPB野手 (Top10)"),
    summarize(batters, "NPB野手 (全体)"),
    summarize(pitchers, "NPB投手 (全体)")
], ignore_index=True)

# -----------------------------
# 9. 整形
# -----------------------------
final.insert(0, "Rk", range(1, len(final) + 1))

final = final[[
    "Rk","Name","TeamName",
    "PA","打数","安打","二塁打","三塁打","本塁打",
    "三振","四球","死球","犠打","犠飛","併殺",
    "OBP"
]]

final = final.rename(columns={
    "打数":"AB","安打":"H","二塁打":"2B","三塁打":"3B","本塁打":"HR",
    "三振":"SO","四球":"BB","死球":"HBP","犠打":"SH","犠飛":"SF","併殺":"GDP"
})

# -----------------------------
# 10. 出力
# -----------------------------
final.to_csv("../public/npb_avg_stats.csv", index=False)
print(final)