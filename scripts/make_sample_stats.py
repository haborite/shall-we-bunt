import pandas as pd
import numpy as np

# -----------------------------
# 1. 読み込み & 公式戦フィルタ
# -----------------------------
df = pd.read_csv("player_batting_stats_jp_2025.csv")
df = df[df["ゲームタイプ"] == "公式戦"]

# -----------------------------
# 2. 野手・投手分離
# -----------------------------
batters = df[df["守備位置"] != "投"]
pitchers = df[df["守備位置"] == "投"]

# -----------------------------
# 3. 共通カラム
# -----------------------------
cols = ["打数","安打","二塁打","三塁打","本塁打",
        "三振","四球","死球","犠打","犠飛","併殺"]

# -----------------------------
# 4. 野手個人成績
# -----------------------------
bat = batters.groupby("名前", as_index=False)[cols].sum()

bat["PA"] = bat["打数"] + bat["四球"] + bat["死球"] + bat["犠打"] + bat["犠飛"]
bat["TB"] = bat["安打"] + bat["二塁打"] + 2*bat["三塁打"] + 3*bat["本塁打"]

bat["AVG"] = np.where(bat["打数"] > 0, bat["安打"] / bat["打数"], 0)
bat["OBP"] = np.where(bat["PA"] > 0, (bat["安打"] + bat["四球"] + bat["死球"]) / bat["PA"], 0)
bat["SLG"] = np.where(bat["打数"] > 0, bat["TB"] / bat["打数"], 0)
bat["OPS"] = bat["OBP"] + bat["SLG"]

# 規定打席（443）
bat_qual = bat[bat["PA"] >= 443]

top24 = bat_qual.nlargest(24, "OPS")
bottom24 = bat_qual.nsmallest(24, "OPS")

# -----------------------------
# 5. 集計関数
# -----------------------------
def summarize(df_part, name):
    s = df_part[cols].sum()

    pa = s["打数"] + s["四球"] + s["死球"] + s["犠打"] + s["犠飛"]
    tb = s["安打"] + s["二塁打"] + 2*s["三塁打"] + 3*s["本塁打"]

    avg = s["安打"] / s["打数"] if s["打数"] > 0 else 0
    obp = (s["安打"] + s["四球"] + s["死球"]) / pa if pa > 0 else 0
    slg = tb / s["打数"] if s["打数"] > 0 else 0

    return pd.DataFrame([{
        "Name": name,
        "TeamName": "",
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
        "AVG": avg,
        "OBP": obp,
        "OPS": obp + slg
    }])

# -----------------------------
# 6. グループ作成
# -----------------------------
final = pd.concat([
    summarize(batters, "NPB野手（平均）"),
    summarize(pitchers, "NPB投手（平均）"),
    summarize(batters[batters["名前"].isin(top24["名前"])], "NPB野手（上位）"),
    summarize(batters[batters["名前"].isin(bottom24["名前"])], "NPB野手（下位）")
], ignore_index=True)

# -----------------------------
# 7. 整形
# -----------------------------
final.insert(0, "Rk", range(1, len(final) + 1))

final = final[[
    "Rk","Name","TeamName",
    "PA","打数","安打","二塁打","三塁打","本塁打",
    "三振","四球","死球","犠打","犠飛","併殺",
    "AVG","OBP","OPS"
]]

final = final.rename(columns={
    "打数":"AB","安打":"H","二塁打":"2B","三塁打":"3B","本塁打":"HR",
    "三振":"SO","四球":"BB","死球":"HBP","犠打":"SH","犠飛":"SF","併殺":"GDP"
})

# -----------------------------
# 8. 出力
# -----------------------------
final.to_csv("../public/npb_avg_stats.csv", index=False)

print(final)