'use client';

import { useState } from 'react';
import { Sparkles, Zap, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { startCheckout } from '@/lib/billing-client';
import { PLANS } from '@/lib/plans';
import type { Me } from '@/lib/me';

interface UpgradeProProps {
  me: Me | null;
  /** "card" for the desktop sidebar, "bar" for the mobile top-of-list callout. */
  variant: 'card' | 'bar';
  className?: string;
}

/**
 * Free-plan upsell that sends the user straight to Stripe checkout (no detour
 * through /pricing). Renders nothing for Pro users or before the plan loads.
 */
export function UpgradePro({ me, variant, className }: UpgradeProProps) {
  const [busy, setBusy] = useState(false);
  if (!me || me.plan === 'pro') return null;

  const pro = PLANS.pro;

  async function go() {
    setBusy(true);
    // startCheckout redirects to Stripe on success; we only get here on failure.
    await startCheckout();
    setBusy(false);
  }

  if (variant === 'bar') {
    return (
      <button
        type='button'
        onClick={go}
        disabled={busy}
        className={clsx(
          'flex w-full items-center gap-2.5 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-left transition-colors hover:bg-primary/15 disabled:opacity-60',
          className,
        )}
      >
        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20'>
          {busy ? (
            <Loader2 className='h-4 w-4 animate-spin text-primary' />
          ) : (
            <Zap className='h-4 w-4 text-primary' />
          )}
        </span>
        <span className='flex-1'>
          <span className='block text-sm font-semibold'>Go Pro</span>
          <span className='block text-xs text-muted-foreground'>
            {pro.cutoutsPerMonth} cutouts a month
          </span>
        </span>
        <span className='shrink-0 text-sm font-semibold text-primary'>
          ${pro.priceMonthly}/mo
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
        onClick={go}
        disabled={busy}
        className='mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60'
      >
        {busy ? (
          <Loader2 className='h-3.5 w-3.5 animate-spin' />
        ) : (
          <Zap className='h-3.5 w-3.5' />
        )}
        Go Pro
      </button>
    </div>
  );
}
