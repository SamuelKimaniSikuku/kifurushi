import { PackageSearch } from "lucide-react";

export default function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span
        aria-hidden
        className="grid h-12 w-12 place-items-center rounded-full bg-sand-deep text-forest"
      >
        <PackageSearch size={20} strokeWidth={2} />
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>}
      {children && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
