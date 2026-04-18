import { ScrollArea } from "@/components/ui/scroll-area";

export function DistributionBars({
  data,
}: {
  data: { label: string; prob: number }[];
}) {
  return (
    <ScrollArea className="h-[250px]">
      <div className="space-y-3 pr-3">
        {data.map((row) => (
          <div key={row.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{row.label} 点</span>
              <span>{(row.prob * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-slate-700"
                style={{ width: `${row.prob * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}