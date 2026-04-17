import pandas as pd
import numpy as np

input_file = "player_batting_stats_jp_2025.csv"
df = pd.read_csv(input_file)

# -----------------------------
# 1. 公式戦のみ
# -----------------------------
df = df[df["ゲームタイプ"] == "公式戦"].copy()

# -----------------------------
# 2. リーグ分け
# -----------------------------
pl_teams = {
    "福岡ソフトバンクホークス",
    "北海道日本ハムファイターズ",
    "千葉ロッテマリーンズ",
    "東北楽天ゴールデンイーグルス",
    "埼玉西武ライオンズ",
    "オリックス・バファローズ"
}

df["league"] = df["球団"].apply(lambda x: "PL" if x in pl_teams else "CL")

# -----------------------------
# 3. 分離
# -----------------------------
batters = df[df["守備位置"] != "投"].copy()
pitchers = df.copy()  # 両リーグ平均（全投手）

# -----------------------------
# 4. 共通カラム
# -----------------------------
cols = ["打数","安打","二塁打","三塁打","本塁打",
        "三振","四球","死球","犠打","犠飛","併殺"]

# -----------------------------
# 5. 野手（選手集計）
# -----------------------------
bat = batters.groupby("名前")[cols].sum().reset_index()

bat["PA"] = bat["打数"] + bat["四球"] + bat["死球"] + bat["犠打"] + bat["犠飛"]

bat["TB"] = (
    bat["安打"] +
    bat["二塁打"] +
    2 * bat["三塁打"] +
    3 * bat["本塁打"]
)

bat["AVG"] = np.where(bat["打数"] > 0, bat["安打"] / bat["打数"], 0)

bat["OBP"] = np.where(
    bat["PA"] > 0,
    (bat["安打"] + bat["四球"] + bat["死球"]) / bat["PA"],
    0
)

bat["SLG"] = np.where(
    bat["打数"] > 0,
    bat["TB"] / bat["打数"],
    0
)

bat["OPS"] = bat["OBP"] + bat["SLG"]

# 規定打席フィルタ
bat_qual = bat[bat["PA"] >= 50].copy()

# 上位・下位（OPS）
top24 = bat_qual.sort_values("OPS", ascending=False).head(24)
bottom24 = bat_qual.sort_values("OPS", ascending=True).head(24)

# -----------------------------
# 6. 集計関数
# -----------------------------
def summarize(df_part, name):
    out = df_part[cols].sum().to_frame().T

    out["PA"] = (
        out["打数"] + out["四球"] + out["死球"] +
        out["犠打"] + out["犠飛"]
    )

    out["TB"] = (
        out["安打"] +
        out["二塁打"] +
        2 * out["三塁打"] +
        3 * out["本塁打"]
    )

    out["AVG"] = np.where(out["打数"] > 0, out["安打"] / out["打数"], 0)
    out["OBP"] = np.where(out["PA"] > 0, (out["安打"] + out["四球"] + out["死球"]) / out["PA"], 0)
    out["SLG"] = np.where(out["打数"] > 0, out["TB"] / out["打数"], 0)
    out["OPS"] = out["OBP"] + out["SLG"]

    out["TeamName"] = ""
    out.insert(0, "Name", name)
    return out

# -----------------------------
# 7. グループ作成
# -----------------------------
row1 = summarize(batters, "NPB野手（平均）")
row2 = summarize(pitchers[pitchers["守備位置"] == "投"], "NPB投手（平均）")
row3 = summarize(batters[batters["名前"].isin(top24["名前"])], "NPB野手（上位）")
row4 = summarize(batters[batters["名前"].isin(bottom24["名前"])], "NPB野手（下位）")

final = pd.concat([row1, row2, row3, row4], ignore_index=True)

# -----------------------------
# 8. カラム整形
# -----------------------------
final.insert(0, "Rk", range(1, len(final) + 1))

final = final[[
    "Rk","Name","TeamName",
    "PA","打数","安打","二塁打","三塁打","本塁打",
    "三振","四球","死球","犠打","犠飛","併殺",
    "AVG","OBP","OPS"
]]

# 英字化
final = final.rename(columns={
    "打数":"AB",
    "安打":"H",
    "二塁打":"2B",
    "三塁打":"3B",
    "本塁打":"HR",
    "三振":"SO",
    "四球":"BB",
    "死球":"HBP",
    "犠打":"SH",
    "犠飛":"SF",
    "併殺":"GDP"
})

# -----------------------------
# 9. 出力
# -----------------------------
final.to_csv("npb_2025_summary_4rows.csv", index=False)

print(final)