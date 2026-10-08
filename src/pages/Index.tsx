// src/pages/Index.tsx
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Services } from "@/components/landing/Services";
import { Trust } from "@/components/landing/Trust";
import { ForCaregivers } from "@/components/landing/ForCaregivers";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <HowItWorks />
      <Services />
      <Trust />
      <ForCaregivers />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}