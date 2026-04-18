import { TeamMark } from "./TeamMark";

export function TeamPlayerLabel({
  name,
  teamName,
}: {
  name: string;
  teamName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <TeamMark teamName={teamName} />
      <span>{name}</span>
    </span>
  );
}