import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { MarketingNav } from '@/components/marketing/marketing-nav';

export const metadata: Metadata = {
  // absolute: suppress the root "%s | Cutout Aura" template, which would
  // otherwise double the brand in the home page title.
  title: { absolute: 'Cutout Aura: Clean Cutouts of Anything' },
  description:
    'Search anything, get a crisp transparent PNG in seconds, and build a library you can pull from forever. Starter cutouts included on day one.',
  openGraph: {
    title: 'Cutout Aura',
    description: 'Clean cutouts of anything. Search it, cut it, keep it forever.',
    url: '/',
    siteName: 'Cutout Aura',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Cutout Aura: Clean Cutouts of Anything',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cutout Aura',
    description: 'Clean cutouts of anything. Search it, cut it, keep it forever.',
    images: ['/opengraph-image'],
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className='flex min-h-dvh flex-col'>
      <MarketingNav />

      {/* overflow-x-clip: contains decorative blurs/marquees that intentionally
          bleed past the viewport edges, so the page never scrolls sideways on
          mobile. clip (not hidden) does not create a scroll container, so the
          sticky nav keeps working. */}
      <main className='flex-1 overflow-x-clip'>{children}</main>

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
            &copy; {new Date().getFullYear()} Cutout Aura
          </p>
        </div>
      </footer>
    </div>
  );
}
