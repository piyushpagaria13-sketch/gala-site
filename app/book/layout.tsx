import Image from "next/image";
import { ContinueButton } from "@/components/flow/ContinueButton";
import { CompSeatsHost } from "@/components/flow/CompSeatsHost";
import { ExitButton } from "@/components/flow/ExitModal";
import { FlowBreadcrumb } from "@/components/flow/FlowBreadcrumb";
import { BookingDraftProvider } from "@/lib/bookingDraft";

/**
 * Booking flow shell — Figma frame "D1a · Student name — empty (dark)"
 * (252:15, 800×832). Webview-style frame: header with × exit button and
 * Continue CTA (disabled until the step is valid), content area, footer.
 * Full-screen on mobile, centered 800×832 card on larger screens, with the
 * ballroom artwork filling the page behind the card.
 */
export default function BookLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BookingDraftProvider>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden sm:p-6">
        <Image
          src="/book/booking-backdrop.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="relative z-10 flex h-dvh w-full flex-col bg-[#131008] sm:h-[832px] sm:max-w-[800px] sm:rounded-card-lg sm:shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          <header className="relative flex w-full items-center justify-between px-7 pt-[26px]">
            <ExitButton />
            <FlowBreadcrumb />
            <ContinueButton />
          </header>

          <div className="flex min-h-0 flex-1 flex-col items-center overflow-auto">
            {children}
          </div>

          <footer className="pb-5 text-center text-[12px] text-[#5d4c2b]">
            UWCSEA Dover · Graduation Gala Dinner
          </footer>
        </div>
        <CompSeatsHost />
      </div>
    </BookingDraftProvider>
  );
}
