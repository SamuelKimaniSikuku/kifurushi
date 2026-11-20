import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { escapeHtml, sendTrackedEmail } from './notifications.ts';

type Stage = 'agreement' | 'contents' | 'inspection' | 'collection' | 'receipt' | 'review';
type Candidate = { match_id: string; recipient_id: string; stage: Stage; route: string; lang: string };
const copy = {
 en: {
  agreement: ['Confirm your delivery agreement', 'Agreed on WhatsApp? Record the fee and handover arrangements in your Kifurushi chat, then confirm the agreement.', 'Confirm agreement'],
  contents: ['Add your parcel contents', 'Add the parcel contents before handover so you and the traveller can check the same list.', 'Add parcel contents'],
  inspection: ['Your parcel check is waiting', 'Before collection, open and inspect the parcel together. Confirm your own check on Kifurushi only when it is complete.', 'Check parcel'],
  collection: ['Has the parcel been collected?', 'Both parcel checks are recorded. If you have collected the parcel, confirm collection on Kifurushi so the sender can follow the delivery.', 'Confirm collection'],
  receipt: ['Has your parcel arrived?', 'Tell us whether everything arrived, some items are missing, or the parcel has not arrived. Only confirm full receipt once the receiver has checked the parcel.', 'Update receipt'],
  review: ['How was your delivery?', 'Your delivery is complete. Leave an honest review to help the next sender or traveller.', 'Leave a review'],
 },
 fr: {
  agreement: ['Confirmez votre accord de livraison', 'Vous avez discuté sur WhatsApp ? Enregistrez le prix et les modalités de remise dans votre conversation Kifurushi, puis confirmez l’accord.', 'Confirmer l’accord'],
  contents: ['Ajoutez le contenu du colis', 'Ajoutez le contenu avant la remise pour vérifier la même liste avec le voyageur.', 'Ajouter le contenu'],
  inspection: ['Votre vérification du colis est attendue', 'Avant la collecte, ouvrez et vérifiez le colis ensemble. Confirmez votre vérification sur Kifurushi une fois terminée.', 'Vérifier le colis'],
  collection: ['Avez-vous récupéré le colis ?', 'Les deux vérifications sont enregistrées. Si vous avez récupéré le colis, confirmez la collecte pour informer l’expéditeur.', 'Confirmer la collecte'],
  receipt: ['Votre colis est-il arrivé ?', 'Indiquez si tout est arrivé, si des articles manquent ou si le colis n’est pas arrivé. Confirmez la réception complète après la vérification par le destinataire.', 'Mettre à jour la réception'],
  review: ['Comment s’est passée la livraison ?', 'Votre livraison est terminée. Laissez un avis honnête pour aider les prochains utilisateurs.', 'Laisser un avis'],
 },
 sw: {
  agreement: ['Thibitisha makubaliano ya uwasilishaji', 'Mmezungumza kwenye WhatsApp? Hifadhi ada na mpango wa makabidhiano kwenye mazungumzo ya Kifurushi, kisha thibitisha makubaliano.', 'Thibitisha makubaliano'],
  contents: ['Ongeza yaliyomo kwenye kifurushi', 'Ongeza yaliyomo kabla ya makabidhiano ili wewe na msafiri mkague orodha ileile.', 'Ongeza yaliyomo'],
  inspection: ['Ukaguzi wako wa kifurushi unasubiri', 'Kabla ya kuchukua, fungueni na kukagua kifurushi pamoja. Thibitisha ukaguzi wako kwenye Kifurushi baada ya kukamilika.', 'Kagua kifurushi'],
  collection: ['Umechukua kifurushi?', 'Ukaguzi wa wote wawili umerekodiwa. Ikiwa umechukua kifurushi, thibitisha kwenye Kifurushi ili mtumaji ajue.', 'Thibitisha kuchukua'],
  receipt: ['Kifurushi chako kimefika?', 'Tujulishe ikiwa vitu vyote vimefika, baadhi havipo au kifurushi hakijafika. Thibitisha kupokea vitu vyote baada ya mpokeaji kukagua kifurushi.', 'Sasisha kupokea'],
  review: ['Uwasilishaji ulikuwaje?', 'Uwasilishaji umekamilika. Toa maoni ya kweli kusaidia mtumaji au msafiri mwingine.', 'Toa maoni'],
 },
} as const;

export function followupEmail(candidate: Candidate) {
 const lang = candidate.lang === 'fr' || candidate.lang === 'sw' ? candidate.lang : 'en';
 const [subject, body, button] = copy[lang][candidate.stage];
 const target = candidate.stage === 'review' ? 'review' : 'delivery';
 const href = `https://www.kifurushiapp.com/dashboard#${target}-${encodeURIComponent(candidate.match_id)}`;
 return { subject, html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0b3b2e"><h1 style="font-size:24px">${subject}</h1><p><b>${escapeHtml(candidate.route)}</b></p><p style="line-height:1.6">${body}</p><a href="${href}" style="display:inline-block;background:#0b3b2e;color:white;padding:14px 20px;border-radius:12px;text-decoration:none">${button}</a></div>` };
}

/** Reuse the existing job and global reminder cooldown. No sends during preview. */
export async function sendDeliveryFollowups(admin: SupabaseClient, nowNotified: Set<string>, dryRun: boolean) {
 const { data, error } = await admin.rpc('delivery_followup_candidates');
 if (error) throw error;
 let sent = 0;
 const planned: Record<string, number> = {};
 for (const candidate of (data ?? []) as Candidate[]) {
  if (nowNotified.has(candidate.recipient_id)) continue;
  // Recheck the pending action just before sending: collection, receipts,
  // reviews, cancellations and reports can arrive while the job is running.
  const { data: fresh, error: readError } = await admin.rpc('delivery_followup_candidates', { p_match_id: candidate.match_id });
  if (readError) throw readError;
  if (!(fresh as Candidate[] | null)?.some(row => row.recipient_id === candidate.recipient_id && row.stage === candidate.stage)) continue;
  const { data: user, error: userError } = await admin.auth.admin.getUserById(candidate.recipient_id);
  if (userError) throw userError;
  const email = user?.user?.email;
  if (!email || /\+test/i.test(email)) continue;
  const content = followupEmail(candidate);
  const ok = dryRun || await sendTrackedEmail(admin, {
   key: `delivery-followup/${candidate.match_id}/${candidate.stage}/${candidate.recipient_id}`,
   recipientId: candidate.recipient_id, kind: `delivery_${candidate.stage}`, matchId: candidate.match_id,
   reminder: true, to: email, ...content,
  });
  if (ok) {
   nowNotified.add(candidate.recipient_id);
   const kind = `delivery_${candidate.stage}`;
   planned[kind] = (planned[kind] ?? 0) + 1;
   if (!dryRun) sent++;
  }
 }
 return { sent, planned };
}
