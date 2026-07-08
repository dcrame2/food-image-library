'use client';

import { useState } from 'react';
import { Sparkles, Zap, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { startCheckout } from '@/lib/billing-client';
import { PLANS, type BillingInterval } from '@/lib/plans';
import type { Me } from '@/lib/me';

const YEARLY_SAVINGS = PLANS.pro.priceMonthly * 12 - PLANS.pro.priceYearly;

/**
 * Two equal, selectable plan rows plus one Go Pro button. Same picker pattern
 * as the engine options in the Add dialog, so the choice reads as a choice
 * instead of a primary button with fine print. Used in the sidebar card and
 * on the Settings billing section.
 */
export function PlanPicker({ className }: { className?: string }) {
  const [interval, setInterval] = useState<BillingInterval>('year');
  const [busy, setBusy] = useState(false);

  const pro = PLANS.pro;

  async function go() {
    setBusy(true);
    // startCheckout redirects to Stripe on success; we only get here on failure.
    await startCheckout(interval);
    setBusy(false);
  }

  const options = [
    {
      id: 'year' as const,
      label: 'Yearly',
      price: `$${pro.priceYearly / 12}/mo`,
      sub: (
        <>
          ${pro.priceYearly} a year.{' '}
          <span className='font-medium text-primary'>Save ${YEARLY_SAVINGS}</span>
        </>
      ),
    },
    {
      id: 'month' as const,
      label: 'Monthly',
      price: `$${pro.priceMonthly}/mo`,
      sub: 'Cancel anytime',
    },
  ];

  return (
    <div className={className}>
      <div className='space-y-2'>
        {options.map((opt) => (
          <button
            key={opt.id}
            type='button'
            onClick={() => setInterval(opt.id)}
            className={clsx(
              'flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
              interval === opt.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-foreground/25',
            )}
          >
            <span
              className={clsx(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                interval === opt.id ? 'border-primary' : 'border-muted-foreground/50',
              )}
            >
              {interval === opt.id && (
                <span className='h-2 w-2 rounded-full bg-primary' />
              )}
            </span>
            <span className='min-w-0 flex-1'>
              <span className='flex items-baseline justify-between gap-2'>
                <span className='text-sm font-semibold'>{opt.label}</span>
                <span className='shrink-0 text-sm font-semibold whitespace-nowrap'>
                  {opt.price}
                </span>
              </span>
              <span className='mt-1 block text-xs whitespace-nowrap text-muted-foreground'>
                {opt.sub}
              </span>
            </span>
          </button>
        ))}
      </div>

      <button
        type='button'
        onClick={go}
        disabled={busy}
        className='mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60'
      >
        {busy ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <Zap className='h-4 w-4' />
        )}
        Go Pro
      </button>
    </div>
  );
}

interface UpgradeProProps {
  me: Me | null;
  /** "card" for the desktop sidebar, "bar" for the mobile top-of-list callout. */
  variant: 'card' | 'bar';
  /** Opens the shared UpgradeDialog with both plan options. */
  onOpen: () => void;
  className?: string;
}

/**
 * Free-plan upsell. Both variants are compact triggers that open the shared
 * upgrade dialog, where the plan picker has room to breathe. Renders nothing
 * for Pro users or before the plan loads.
 */
export function UpgradePro({ me, variant, onOpen, className }: UpgradeProProps) {
  if (!me || me.plan === 'pro') return null;

  const pro = PLANS.pro;

  if (variant === 'bar') {
    return (
      <button
        type='button'
        onClick={onOpen}
        className={clsx(
          'flex w-full items-center gap-2.5 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-left transition-colors hover:bg-primary/15',
          className,
        )}
      >
        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20'>
          <Zap className='h-4 w-4 text-primary' />
        </span>
        <span className='flex-1'>
          <span className='block text-sm font-semibold'>Go Pro</span>
          <span className='block text-xs text-muted-foreground'>
            {pro.cutoutsPerMonth} cutouts a month
          </span>
        </span>
        <span className='shrink-0 text-sm font-semibold text-primary'>
          from ${pro.priceYearly / 12}/mo
        </span>
      </button>
    );
  }

  return (
    <div
      className={clsx(
        'rounded-xl border border-primary/30 bg-primary/5 p-3.5',
        className,
      )}
    >
      <div className='flex items-center gap-2'>
        <span className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/15'>
          <Sparkles className='h-4 w-4 text-primary' />
        </span>
        <p className='text-sm font-semibold'>Upgrade to Pro</p>
      </div>
      <p className='mt-2 text-xs text-muted-foreground'>
        {pro.cutoutsPerMonth} cutouts a month plus unlimited bulk saves.
      </p>
      <button
        type='button'
        onClick={onOpen}
        className='mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90'
      >
        <Zap className='h-4 w-4' />
        Go Pro
      </button>
      <p className='mt-1.5 text-center text-[11px] text-muted-foreground'>
        From ${pro.priceYearly / 12}/mo billed yearly
      </p>
    </div>
  );
}
