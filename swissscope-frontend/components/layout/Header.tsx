import { BriefcaseBusiness } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="size-5" />
          <span className="text-sm font-semibold">SwissScope</span>
        </div>
        <span className="text-xs text-muted-foreground">Personal job intelligence</span>
      </div>
    </header>
  );
}
