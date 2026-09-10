import { Badge } from "@/components/ui/badge";

export function MatchScoreBadge({ score }: { score: number }) {
  const tone = getScoreTone(score);

  return (
    <Badge className={`min-w-16 justify-center rounded-full border px-2.5 py-1 font-semibold ${tone.className}`} variant="outline">
      {score}%
    </Badge>
  );
}

function getScoreTone(score: number) {
  if (score >= 80) {
    return {
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    };
  }

  if (score >= 55) {
    return {
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    };
  }

  return {
    className: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300",
  };
}
