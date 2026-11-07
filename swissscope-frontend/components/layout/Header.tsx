import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link className="flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/">
          <BriefcaseBusiness aria-hidden="true" className="size-5" />
          <span className="text-sm font-semibold">SwissScope</span>
        </Link>
        <span className="text-xs text-muted-foreground">Personal job intelligence</span>
      </div>
    </header>
  );
}
