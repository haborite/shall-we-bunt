import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATE_OPTIONS_AFTER_BUNT } from "@/constants/baseball";

export function BuntOutcomeSummary({
  outcomes,
}: {
  outcomes: { key: string; probability: number; state: string }[];
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">バント直後の状態分布</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {outcomes.map((outcome) => (
          <div key={outcome.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>
                {STATE_OPTIONS_AFTER_BUNT.find((option) => option.value === outcome.state)?.label || outcome.state}
              </span>
              <span>{(outcome.probability * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-slate-700" style={{ width: `${outcome.probability * 100}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}