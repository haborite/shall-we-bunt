import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DistributionBars({
  title,
  data,
}: {
  title: string;
  data: { label: string; prob: number }[];
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <ScrollArea className="h-[250px]">
        <CardContent className="space-y-3">
          {data.map((row) => (
            <div key={row.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{row.label} 点</span>
                <span>{(row.prob * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-slate-700" style={{ width: `${row.prob * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}