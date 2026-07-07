import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { MarketingNav } from '@/components/marketing/marketing-nav';

export const metadata: Metadata = {
  title: 'Cutout Aura: Clean Cutouts of Anything',
  description:
    'Search anything, get a crisp transparent PNG in seconds, and build a library you can pull from forever. Starter cutouts included on day one.',
  openGraph: {
    title: 'Cutout Aura',
    description: 'Clean cutouts of anything. Search it, cut it, keep it forever.',
    url: '/',
    siteName: 'Cutout Aura',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cutout Aura',
    description: 'Clean cutouts of anything. Search it, cut it, keep it forever.',
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className='flex min-h-dvh flex-col'>
      <MarketingNav />

      <main className='flex-1'>{children}</main>

      <footer className='border-t border-border'>
        <div className='mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
          <div>
            <Logo className='text-sm' markClassName='h-5 w-5' />
            <p className='mt-1 text-xs text-muted-foreground'>
              Clean cutouts of anything.
            </p>
          </div>
          <div className='flex gap-6 text-xs text-muted-foreground'>
            <Link href='/pricing' className='hover:text-foreground'>
              Pricing
            </Link>
            <Link href='/login' className='hover:text-foreground'>
              Sign in
            </Link>
            <Link href='/terms' className='hover:text-foreground'>
              Terms
            </Link>
            <Link href='/privacy' className='hover:text-foreground'>
              Privacy
            </Link>
          </div>
          <p className='text-xs text-muted-foreground'>
            {new Date().getFullYear()} Cutout Aura
          </p>
        </div>
      </footer>
    </div>
  );
}
