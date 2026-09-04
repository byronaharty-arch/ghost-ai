import { FileText, Sparkles, Users } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

const FEATURES: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}[] = [
  {
    icon: Sparkles,
    title: "AI-generated system architecture",
    description:
      "Describe your system and AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Users,
    title: "Real-time collaborative canvas",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Exportable technical specs",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col border-r border-surface-border bg-bg-surface-accent px-16 py-12 lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-brand text-xs font-bold text-bg-base">
            G
          </span>
          <span className="text-lg font-semibold tracking-tight text-copy-primary">
            Ghost AI
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-8">
          <div className="max-w-sm space-y-3">
            <p className="text-2xl font-medium text-copy-primary">
              Describe a system. Watch it take shape.
            </p>
            <p className="text-sm text-copy-muted">
              Describe your architecture in plain English. Ghost AI maps it
              to a shared canvas your whole team can refine in real time.
            </p>
          </div>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-dim text-brand">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-copy-primary">
                    {title}
                  </p>
                  <p className="text-sm text-copy-muted">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-center bg-bg-base px-6 py-12">
        {children}
      </div>
    </div>
  );
}
