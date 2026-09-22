import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, formatDate, ORDER_STATUS_LABELS, PAYMENT_LABELS } from '@/lib/format';

/** Récapitulatif de commande partagé par la confirmation et le suivi. */
export default function OrderSummary({ order, settings, showBank = false }) {
  const isQuote = order.type === 'devis';
  const remainingDeposit = Math.max(order.depositAmount - order.paidAmount, 0);
  const cancelled = order.status === 'annulee';

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-md bg-mist p-5">
          <p className="text-sm text-stone">Numéro</p>
          <p className="display mt-1 text-xl">{order.number}</p>
        </div>
        <div className="rounded-md bg-mist p-5">
          <p className="text-sm text-stone">Statut</p>
          <p className={`mt-1 text-xl font-bold ${cancelled ? 'text-danger' : 'text-pine'}`}>{ORDER_STATUS_LABELS[order.status] || order.status}</p>
        </div>
        <div className="rounded-md bg-mist p-5">
          <p className="text-sm text-stone">{isQuote ? 'Type' : 'Montant'}</p>
          <p className="mt-1 text-xl font-bold">{isQuote ? 'Demande de devis' : formatPrice(order.subtotal)}</p>
        </div>
      </div>

      {!isQuote && !cancelled && remainingDeposit > 0 && (order.paymentMethod === 'virement' || showBank) && settings?.bank?.iban && (
        <section className="rounded-md border-2 border-sun p-6">
          <h2 className="text-xl">Réglez l’acompte de {formatPrice(remainingDeposit, { cents: true })} par virement</h2>
          <p className="mt-2 text-stone">Indiquez le numéro {order.number} en libellé. Votre commande est confirmée à réception.</p>
          <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-[8rem_1fr]">
            {settings.bank.holder && (<><dt className="text-stone">Titulaire</dt><dd className="font-medium">{settings.bank.holder}</dd></>)}
            <dt className="text-stone">IBAN</dt>
            <dd className="font-medium tabular-nums">{settings.bank.iban}</dd>
            {settings.bank.bic && (<><dt className="text-stone">BIC</dt><dd className="font-medium">{settings.bank.bic}</dd></>)}
          </dl>
        </section>
      )}

      {!isQuote && !cancelled && remainingDeposit > 0 && order.paymentMethod === 'rendez_vous' && (
        <p className="rounded-md bg-sun-soft p-5">
          Nous vous appelons pour fixer un rendez-vous. L’acompte de {formatPrice(order.depositAmount, { cents: true })} sera réglé à cette occasion.
        </p>
      )}

      {order.paidAmount > 0 && (
        <p className="rounded-md bg-mist p-5 font-medium text-ok">Acompte reçu : {formatPrice(order.paidAmount, { cents: true })}.</p>
      )}

      <section>
        <h2 className="text-xl">Articles</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-mist">
                {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                {i.slug ? (
                  <Link href={`/produit/${i.slug}`} className="font-semibold hover:text-pine">{i.title}</Link>
                ) : (
                  <p className="font-semibold">{i.title}</p>
                )}
                <p className="text-sm text-stone">Réf. {i.reference}{i.quantity > 1 ? `, quantité ${i.quantity}` : ''}</p>
              </div>
              <p className="font-semibold">{i.unitPrice === null ? 'Sur devis' : formatPrice(i.unitPrice * i.quantity)}</p>
            </li>
          ))}
        </ul>
        {!isQuote && (
          <dl className="mt-4 ml-auto max-w-xs space-y-1">
            <div className="flex justify-between"><dt className="text-stone">Total TTC</dt><dd className="font-bold">{formatPrice(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">Acompte</dt><dd>{formatPrice(order.depositAmount, { cents: true })}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">Paiement</dt><dd className="text-right">{PAYMENT_LABELS[order.paymentMethod]}</dd></div>
          </dl>
        )}
        {order.hasQuoteItems && (
          <p className="mt-4 text-sm text-stone">Les articles sur devis vous seront chiffrés par e-mail ou par téléphone.</p>
        )}
      </section>

      {order.events?.length > 0 && (
        <section>
          <h2 className="text-xl">Historique</h2>
          <ol className="mt-4 space-y-4 border-l-2 border-line pl-5">
            {order.events.map((e, idx) => (
              <li key={idx} className="relative">
                <span aria-hidden="true" className="absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-white bg-pine" />
                <p className="font-semibold">{ORDER_STATUS_LABELS[e.status] || e.status}</p>
                <p className="text-sm text-stone">{formatDate(e.createdAt, true)}{e.note ? `, ${e.note}` : ''}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
