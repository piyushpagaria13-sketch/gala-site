import Image from "next/image";
import Link from "next/link";

/**
 * Landing hero — full-bleed poster from the Figma frame "MacBook Air - 1"
 * (1280×832). The poster artwork (including the Get Tickets pill) is baked
 * into /hero/image-19.png; a transparent Link overlay sits exactly on the
 * pill so the CTA is a real, clickable, keyboard-focusable link.
 * Percentage coordinates keep the hotspot on the pill at every size.
 */
export function Hero() {
  return (
    <section className="flex w-full justify-center">
      <div className="relative aspect-[1280/832] w-full max-w-[1280px]">
        <Image
          src="/hero/image-19.png"
          alt="UWCSEA Dover Class of 2027 Graduation Gala Dinner — Saturday, 22 May 2027, 7:30 PM, world-class grand ballroom"
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-contain"
        />
        <Link
          href="/book"
          aria-label="Get tickets"
          className="absolute left-[39.5%] top-[88.4%] h-[8.2%] w-[21%] rounded-pill transition-shadow hover:shadow-[0_0_24px_rgba(212,175,55,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        />
      </div>
    </section>
  );
}
