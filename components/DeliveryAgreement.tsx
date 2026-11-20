"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { sendMessage } from "@/lib/db";
import { deliveryReturnCopy } from "@/lib/locales/deliveryReturn";
import { agreementMessage, AGREEMENT_CURRENCIES } from "@/lib/deliveryAgreement";

export default function DeliveryAgreement({ matchId, onSaved }: { matchId: string; onSaved: () => void }) {
  const { lang } = useLang();
  const s = deliveryReturnCopy[lang];
  const [fee, setFee] = useState("");
  const [currency, setCurrency] = useState<string>("EUR");
  const [handover, setHandover] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <details className="rounded-xl border border-line p-4 text-sm">
    <summary className="min-h-11 cursor-pointer font-semibold text-forest">{s.agreement}</summary>
    <form className="mt-2 space-y-3" onSubmit={async event => {
      event.preventDefault();
      if (busy) return;
      const message = agreementMessage(fee, currency, handover, lang);
      if (!message) { setError(s.invalid); return; }
      setBusy(true); setError("");
      try {
        await sendMessage(matchId, message);
        setFee(""); setHandover(""); onSaved();
      } catch { setError(s.failed); }
      finally { setBusy(false); }
    }}>
      <p className="text-muted">{s.agreementHint}</p>
      <div className="grid grid-cols-2 gap-3">
        <label>{s.fee}<input type="number" inputMode="decimal" min="0" max="1000000" step="0.01" required className="field mt-1 w-full" value={fee} onChange={event => setFee(event.target.value)} disabled={busy} /></label>
        <label>{s.currency}<select className="field mt-1 w-full" value={currency} onChange={event => setCurrency(event.target.value)} disabled={busy}>{AGREEMENT_CURRENCIES.map(code => <option key={code}>{code}</option>)}</select></label>
      </div>
      <label className="block">{s.handover}<textarea rows={3} className="field mt-1 w-full" required maxLength={500} value={handover} onChange={event => setHandover(event.target.value)} disabled={busy} /></label>
      {error && <p role="alert" className="field-error">{error}</p>}
      <button type="submit" className="btn-primary min-h-11" disabled={busy}>{s.save}</button>
    </form>
  </details>;
}
