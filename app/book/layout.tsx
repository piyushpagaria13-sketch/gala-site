import Image from "next/image";
import {
  ContinueDock,
  HeaderTrailing,
} from "@/components/flow/ContinueButton";
import { CompSeatsHost } from "@/components/flow/CompSeatsHost";
import { ExitButton } from "@/components/flow/ExitModal";
import { FlowBreadcrumb } from "@/components/flow/FlowBreadcrumb";
import { BookingDraftProvider } from "@/lib/bookingDraft";

/**
 * Booking flow shell — Figma frame "D1a · Student name — empty (dark)"
 * (252:15, 800×832). Webview-style frame: header with ×/back, content
 * area, sticky Continue at the bottom with a black fade over scrolling
 * content. Full-screen on mobile, centered 800×832 card on larger
 * screens, with the ballroom artwork filling the page behind the card.
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
        <div className="relative z-10 flex h-dvh w-full flex-col overflow-hidden bg-[#131008] sm:h-[832px] sm:max-w-[800px] sm:rounded-card-lg sm:shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          <header className="relative z-30 flex w-full shrink-0 items-center justify-between px-7 pt-[26px]">
            <ExitButton />
            <FlowBreadcrumb />
            <HeaderTrailing />
          </header>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
              <div className="flex flex-col items-center pb-10">
                {children}
              </div>
            </div>
            <ContinueDock />
          </div>
        </div>
        <CompSeatsHost />
      </div>
    </BookingDraftProvider>
  );
}
