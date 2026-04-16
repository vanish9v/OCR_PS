import type { ReactNode } from "react";

interface TopbarProps {
  title: string;
  action?: ReactNode;
}

export function Topbar({ title, action }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6">
      <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
      {action && <div>{action}</div>}
    </header>
  );
}
