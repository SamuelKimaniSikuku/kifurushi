"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function ListingError({ retry }: { retry: () => void }) {
  const t = useT().experience;
  return <div role="alert" className="card mt-6 flex flex-col items-start gap-4 border-danger/20 bg-danger-bg p-6 sm:flex-row sm:items-center">
    <AlertCircle className="shrink-0 text-danger" aria-hidden />
    <div className="flex-1"><h2 className="text-lg font-semibold">{t.loadError}</h2><p className="mt-1 text-base text-muted">{t.loadErrorBody}</p></div>
    <button type="button" className="btn-ghost" onClick={retry}><RefreshCw size={16} aria-hidden />{t.retry}</button>
  </div>;
}
