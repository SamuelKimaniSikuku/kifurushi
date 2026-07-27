import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ small }: { small?: boolean }) {
  return (
    <span
      title="ID verified"
      className={`inline-flex items-center rounded-full bg-success-bg font-semibold text-success ${
        small ? "gap-1 px-2 py-0.5 text-[11px]" : "gap-1.5 px-2.5 py-1 text-xs"
      }`}
    >
      <BadgeCheck size={small ? 13 : 15} strokeWidth={2} aria-hidden />
      Verified
    </span>
  );
}
