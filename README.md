# Shall We Bunt?

https://haborite.github.io/shall-we-bunt/

野球における「バント vs ヒッティング」の意思決定を、マルコフ過程モデルに基づいて定量的に評価するWebアプリケーション。
打力・打順・アウトカウント・ランナー状況・バント成功率を加味してヒッティング時とバント時の得点期待値と得点確率を計算・比較できる。

---

## 概要

本ツールは、打順・打者特性・アウトカウント・走者状況を入力として、

- 得点期待値 (Expected Runs)
- 1点以上得点確率 (Scoring Probability)
- 得点分布 (Run Distribution)

をヒッティング時 / バント時で比較する。

---

## 理論

### 状態空間

攻撃状態は以下の25状態で表現され、吸収マルコフ過程として扱われる：

- アウトカウント: 3通り
- 走者状況: 8通り (なし, 一塁, 二塁, 三塁, 一二塁, 一三塁, 二三塁, 満塁)
- 吸収状態: 3アウト（チェンジ）

合計: 3 × 8 + 吸収状態 = 25状態

---

### 遷移モデル

以下の各打撃イベントごとに、状態遷移確率行列を持つ：

- 単打
- 二塁打
- 三塁打
- 本塁打
- 四球
- 三振
- 凡打

各打者について

$$
P(\text{state} \to \text{state}') = \sum_{\text{event}} P(\text{event}) \times P(\text{state} \to \text{state}' \mid \text{event})
$$

として遷移行列を構築する。

---

### 得点期待値

状態 \( s \)、打者 \( i \) に対して：

$$
V_i(s) = \sum_{s'} P_i(s \to s') \left( R(s,s') + V_{i+1}(s') \right)
$$

これを全状態・全打者について連立一次方程式として解く。

---

### 得点確率（1点以上）

- 得点あり → 1
- 無得点 → 0

として同様の連立方程式を解くことで、`P(1点以上得点)`の解を得る。

---

### 得点分布

- 状態 × 打者 × 得点累積

の確率分布を逐次伝播させることで

$$
P(0点), P(1点), ..., P(8点以上)
$$

を計算する。

---

### バントモデル

バントは[DELTA社が公開しているバントの結果分布データ](https://1point02.jp/op/gnav/column/bs/column.aspx?cid=53680)にしたがって、ランナー状況別に以下の4事象に分解した。

- 大失敗
- 失敗
- 成功
- オールセーフ

ただし、一死については直接的なデータが無いため、無死と同じ値を用いた。また、無死一二塁からの「大失敗」後に遷移する状態は「二死二塁」であると仮定した。

本アプリでは予めこれらの事象の確率が「NPB平均」としてランナー状況に応じて自動入力されるが、ユーザーが「成功率（成功＋オールセーフ）」を手動入力することも可能である。この場合、成功率の値に応じて上記4事象の確率を線形スケーリングさせる。

---

## 実装

### 数値計算

- ガウス消去法により連立一次方程式の解を得た

---

### CSVフォーマット

- [Baseball Reference](https://www.baseball-reference.com/)形式のインポートに対応

---

## データ

### 進塁モデル

以下のリポジトリにおける`scripts/run_modeling.py`を用いて状態遷移行列を生成した。

- https://github.com/ogu-kazemiya/baseball-state-simulator

各打撃イベントごとの状態遷移を集計し、25×25行列として使用している。入力データとしては[Baseball Savant](https://baseballsavant.mlb.com/)で公開されているMLBのStatcastを用いた。

---

### 打者データ

- https://npbdata.jp

NPBの現行シーズンにおける打撃成績データを使用（50打席以上）。

---

## 参考実装

本プロジェクトは以下の実装をベースにしている：

- https://github.com/ogu-kazemiya/baseball-state-simulator

本リポジトリで行った変更は以下の通り。

- UIの構築
- 解析過程のJavaScriptへの再実装
- モンテカルロシミュレーションを解析的な解法に置き換え
- バント後の状態遷移を二事象から四事象へと拡張

を行っている。

---

## 制限

モデルに含まれない要素は考慮していない。

例：
- 選手ごとの走塁能力の違い
- 選手ごとの打球方向・打球質の違い
- 相手チームの守備力

---

## 補遺

本サイト名 "Shall We Bunt?" は、[1954年11月18日にニューヨーク・タイムズ誌に掲載されたコラムの一節]("https://www.nytimes.com/1954/11/18/archives/sports-of-the-times-thats-telling-em-buster.html")に由来する。

>*First coach to depart*
>
>Many years ago when Frank Frisch was managing the Pittsburgh Pirates, a leather-lunged fan in a box behind third base kept heckling the old Flash and second-guessing him at every turn. At one spot in the game a hairline decision had to be made. Should the batter bunt or hit away? The mischievous Frisch called time and ceremoniously walked over to leather-lungs.
>
>"I'm in a quandary, pal," said the Flash. "I need your help. **Shall we bunt** or hit away ?". It's a long and funny story the way Frisch tells it. But for the rest of the game he kept seeking advice from the know-it-all. Then in the ninth inning the Flash made his last visit to the box.

>*Returning the Favor*
>
>"I don't know what I'd have done without you, pal," said Frisch pleasantly. "Now I'd like you to give me your name and the place where you work."
>
>"Because," shrieked the Flash, casting off all pretense, "I'm gonna be at your office first thing in the morning and spend the day telling you how to run your business."
>
>When a fellow spends his entire life in a sport—it doesn't matter whether it's football, baseball or anything else—it should be safe to assume that he knows a little more about it than folks in the stands.
