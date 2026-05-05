import { UrgencyLevel, URGENCY_COLORS, URGENCY_LABELS } from "@/lib/utils";

interface UrgencyPillProps {
  level: UrgencyLevel;
}

export function UrgencyPill({ level }: UrgencyPillProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider pill-${level}`}
    >
      {URGENCY_LABELS[level]}
    </span>
  );
}
