import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import DemoSection from "@/components/landing/DemoSection";
import PricingSection from "@/components/landing/PricingSection";
import PrivacySection from "@/components/landing/PrivacySection";
import FAQSection from "@/components/landing/FAQSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Index() {
  return (
    <div dir="rtl" className="min-h-screen bg-background overflow-hidden">
      <LandingNav />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <DemoSection />
      <PricingSection />
      <PrivacySection />
      <FAQSection />
      <LandingFooter />
    </div>
  );
}
