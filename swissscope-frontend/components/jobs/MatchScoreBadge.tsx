import { Badge } from "@/components/ui/badge";

export function MatchScoreBadge({ score }: { score: number }) {
  const variant = score >= 70 ? "default" : score >= 35 ? "secondary" : "outline";

  return (
    <Badge variant={variant} className="min-w-14 justify-center rounded-md">
      {score}%
    </Badge>
  );
}
