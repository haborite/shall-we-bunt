import { useState } from "react";

export function NyTimesQuote() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full px-4 py-8">
      <div className="relative space-y-6 text-slate-700">

        {/* 引用マーク */}
        <div className="absolute -left-2 -top-2 text-5xl text-slate-300">
          “
        </div>

        {/* 本文 */}
        <div className="space-y-5 font-serif text-[16px] leading-8 tracking-[0.01em]">
          <p>
            ずいぶん昔のこと、フランキー・フリッシュがピッツバーグ・パイレーツの監督をしていた頃の話だ。三塁側のボックス席に居た一人のファンが、絶えずフリッシュに野次を飛ばし、大声で采配にケチをつけていた。試合のある場面で、フリッシュは微妙な判断を迫られた。打者にバントをさせるべきか、それとも打たせるべきか。
          </p>

          {/* ★ 強調部分 */}
          <p>
            いたずら好きのフリッシュはタイムをかけ、わざわざその大声男のところまで歩いていった。
            「困ったことになってね、相棒」とフリッシュは言った。
            「君の助けが必要なんだ。バントするか、それとも打たせるか、どっちがいい？
            <span className="ml-2 text-slate-500">
              （
              <span className="italic text-slate-700">
                <span className="font-semibold tracking-wide">
                  Shall we bunt
                </span>{" "}
                or hit away?
              </span>
              ）
            </span>」
          </p>

          {expanded && (
            <div className="animate-in fade-in-0 duration-300">
              <p>
                ──────────
              </p>
              <p>
                「助かったよ、相棒」フリッシュはにこやかに言った。「ところで、名前と勤め先を教えてくれないか」
              </p>
              <p>
                「なぜ？」と男が訝しむと、フリッシュは体裁をかなぐり捨てて怒鳴った。
              </p>
              <p><br></br></p>
              <p>
                <span className="italic text-slate-700">
                  <span>
                    「
                  </span>
                  <span className="font-semibold tracking-wide">
                    決まってるだろ！明日の朝いちばんに君の職場へ行って、一日中君に仕事のやり方を教えてやるためさ！
                  </span>
                  」
                </span>                
              </p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-end justify-between pt-4">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs tracking-[0.15em] text-slate-400 hover:text-slate-600 transition"
          >
            {expanded ? "CLOSE" : "READ MORE"}
          </button>

          <a
            href="https://www.nytimes.com/1954/11/18/archives/sports-of-the-times-thats-telling-em-buster.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-right text-xs tracking-[0.12em] text-slate-400 transition hover:text-slate-600"
          >
            NEW YORK TIMES<br />
            NOVEMBER 18, 1954
          </a>
        </div>
      </div>
    </div>
  );
}