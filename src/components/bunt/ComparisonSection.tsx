import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getChangeRateTone } from "@/lib/format";

export function ComparisonSection({
  title,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  changeRateValue,
  changeRate,
}: {
  title: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  changeRateValue: string;
  changeRate: number;
}) {
  const tone = getChangeRateTone(changeRate);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
          <div className="space-y-1">
            <div className="text-sm text-slate-500">{leftLabel}</div>
            <div className="text-2xl font-semibold">{leftValue}</div>
          </div>
          <div className="text-2xl text-slate-400">→</div>
          <div className="space-y-1">
            <div className="text-sm text-slate-500">{rightLabel}</div>
            <div className="text-2xl font-semibold">{rightValue}</div>
          </div>
        </div>

        <div className={`rounded-2xl p-1 text-center justify-center ${tone.cardClass}`}>
          <div className={`mt-2 flex items-center justify-center gap-2 text-3xl font-semibold ${tone.textClass}`}>
            <span>{changeRateValue}</span>
            <span>{tone.arrow}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}