import type { Metadata } from "next";
import { PricingSection } from "@/components/marketing/pricing-section";
import { Faq } from "@/components/marketing/faq";
import { CtaFooter } from "@/components/marketing/cta-footer";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free with a curated starter library and 10 cutouts of your own each month. Go Pro for 300 cutouts a month and premium edge quality.",
};

export default function PricingPage() {
  return (
    <>
      <PricingSection />
      <Faq />
      <CtaFooter />
    </>
  );
}
