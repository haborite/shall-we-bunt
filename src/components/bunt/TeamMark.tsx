import { TEAM_STYLES } from "@/constants/baseball";

function getTeamStyle(teamName?: string) {
  if (!teamName) {
    return { badgeClass: "bg-slate-300", label: "-" };
  }
  return TEAM_STYLES[teamName as keyof typeof TEAM_STYLES] || {
    badgeClass: "bg-slate-400",
    label: teamName,
  };
}

export function TeamMark({ teamName }: { teamName?: string }) {
  const team = getTeamStyle(teamName);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
      <span className={`h-3 w-1.5 rounded-[2px] ${team.badgeClass}`} />
      <span className="font-medium">{team.label}</span>
    </span>
  );
}