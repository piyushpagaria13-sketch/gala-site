import { Faq } from "@/components/site/Faq";
import { Hero } from "@/components/site/Hero";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Faq />
      {/* TODO: Highlights, Banner, Footer sections (see components/site) —
          not yet designed in Figma. */}
    </main>
  );
}
