import { Hero } from "@/components/marketing/hero";
import { AppDemo } from "@/components/marketing/app-demo";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PricingSection } from "@/components/marketing/pricing-section";
import { Faq } from "@/components/marketing/faq";
import { CtaFooter } from "@/components/marketing/cta-footer";

export const revalidate = 3600;

export default function LandingPage() {
  return (
    <>
      <Hero />
      <AppDemo />
      <HowItWorks />
      <PricingSection />
      <Faq />
      <CtaFooter />
    </>
  );
}
