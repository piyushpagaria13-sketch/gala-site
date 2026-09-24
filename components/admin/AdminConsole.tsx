"use client";

import { useMemo, useState } from "react";
import {
  buttonState,
  cancelCopy,
  guestSummary,
  whatsAppHref,
  type AdminBooking,
  type AdminStatus,
} from "@/lib/adminRules";

type Filter = "all" | AdminStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "claims_paid", label: "Needs review" },
  { id: "awaiting_payment", label: "Unpaid" },
  { id: "cancelled", label: "Cancelled" },
];

const CHIP: Record<AdminStatus, string> = {
  paid: "bg-[#1e3d2f] text-[#8dcea8]",
  claims_paid: "bg-[#3a3014] text-[#e3c46a]",
  awaiting_payment: "bg-[#1a2c44] text-[#9ec0e8]",
  cancelled: "bg-[#3a221c] text-[#e0937d]",
};

function stamp(label: string, value: string | null): string | null {
  if (!value) return null;
  const when = new Date(value).toLocaleString("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `${label} ${when}`;
}

export function AdminConsole({
  initialBookings,
  loadedAt,
}: {
  initialBookings: AdminBooking[];
  loadedAt: string;
}) {
  const [rows, setRows] = useState(initialBookings);
  const [filter, setFilter] = useState<Filter>("all");
  const [syncedAt, setSyncedAt] = useState(loadedAt);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<AdminBooking | null>(null);
  const [inlineNote, setInlineNote] = useState<Record<string, string>>({});

  const visible = useMemo(() => {
    const list = filter === "all" ? rows : rows.filter((row) => row.status === filter);
    return list.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [rows, filter]);

  const active = rows.filter((row) => row.status !== "cancelled");
  const seats = active.reduce((sum, row) => sum + row.partySize, 0);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  };

  const replaceRow = (booking: AdminBooking) => {
    setRows((current) =>
      current.map((row) => (row.ref === booking.ref ? booking : row)),
    );
  };

  const callAction = async (
    path: string,
    booking: AdminBooking,
    success: (next: AdminBooking) => void,
  ) => {
    setBusy(booking.ref + path);
    setInlineNote((notes) => ({ ...notes, [booking.ref]: "" }));
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: booking.ref }),
      });
      const body = (await response.json()) as {
        error?: string;
        message?: string;
        booking?: AdminBooking;
        ok?: boolean;
      };
      if (!response.ok) {
        showToast(body.error ?? "Something went wrong");
        return;
      }
      if (body.booking) replaceRow(body.booking);
      if (body.message) {
        setInlineNote((notes) => ({ ...notes, [booking.ref]: body.message ?? "" }));
        return;
      }
      if (body.booking) success(body.booking);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const reexport = async () => {
    setBusy("export");
    try {
      const response = await fetch("/api/admin/export", { method: "POST" });
      const body = (await response.json()) as { error?: string; syncedAt?: string };
      if (!response.ok) {
        showToast(body.error ?? "Export failed");
        return;
      }
      if (body.syncedAt) setSyncedAt(body.syncedAt);
      showToast("Sheet re-exported");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  const syncedLabel = new Date(syncedAt).toLocaleString("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="min-h-screen bg-[#131008] px-4 py-6 text-[#e8d9a8] sm:px-8">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-[32px] font-medium text-[#e3c46a]">
              Bookings admin
            </h1>
            <p className="mt-1 text-[13px] text-[#9a7f3e]">last synced {syncedLabel}</p>
            <p className="mt-2 text-[15px] text-[#d9bd6f]">
              {active.length} bookings · {seats} seats booked
            </p>
          </div>
          <button
            type="button"
            onClick={() => void reexport()}
            disabled={busy === "export"}
            className="rounded-pill border border-[#d4af37] px-4 py-2 text-[14px] font-semibold text-[#e3c46a] disabled:opacity-40"
          >
            ↻ Re-export Sheet
          </button>
        </header>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-pill px-4 py-1.5 text-[13px] ${
                filter === item.id
                  ? "bg-[#d4af37] font-semibold text-[#241a06]"
                  : "border border-[#6e5a2b] text-[#d9bd6f]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {visible.length === 0 && (
            <p className="rounded-card border border-[#6e5a2b] bg-[#1a1610] px-5 py-6 text-[#9a7f3e]">
              No bookings in this view.
            </p>
          )}
          {visible.map((booking) => {
            const actions = buttonState(booking.status);
            const phone = whatsAppHref(booking.contact);
            const stamps = [
              stamp("Ticket sent", booking.ticketSentAt),
              stamp("Reminder sent", booking.reminderSentAt),
              stamp("Cancelled", booking.cancelledAt),
            ].filter(Boolean);
            const copy = cancelCopy(booking);
            return (
              <article
                key={booking.ref}
                className={`grid grid-cols-1 gap-3 rounded-card border border-[#6e5a2b] bg-[#1a1610] px-4 py-4 transition-opacity duration-300 md:grid-cols-[1.1fr_1.1fr_1.5fr_auto_auto] md:items-start ${
                  actions.dimmed ? "opacity-45" : "opacity-100"
                }`}
              >
                <div>
                  <p className="font-display text-[22px] text-[#e3c46a]">{booking.ref}</p>
                  <p className="text-[14px] text-[#d9bd6f]">
                    Table {booking.tableNo} · {booking.partySize} seats
                  </p>
                </div>
                <div>
                  <p className="text-[15px] text-[#e8d9a8]">{booking.studentName || "—"}</p>
                  {phone ? (
                    <a href={phone} className="text-[14px] text-[#d4af37] underline">
                      {booking.contact}
                    </a>
                  ) : (
                    <p className="text-[14px] text-[#9a7f3e]">{booking.contact || "No phone"}</p>
                  )}
                </div>
                <div className="text-[14px] text-[#d9bd6f]">
                  <p>{guestSummary(booking.guests) || "No guests"}</p>
                  <p className="mt-1 text-[#9a7f3e]">
                    Bus {booking.busSeats} · Cars {booking.cars}
                    {booking.compSeats > 0 ? ` · ${booking.compSeats} comp seats` : ""}
                  </p>
                </div>
                <p className="font-display text-[22px] text-[#e3c46a]">S${booking.amount}</p>
                <div className="flex flex-col items-start gap-2">
                  <span className={`rounded-pill px-3 py-1 text-[12px] font-medium ${CHIP[booking.status]}`}>
                    {booking.status.replaceAll("_", " ")}
                  </span>
                  {stamps.map((line) => (
                    <p key={line} className="text-[12px] text-[#9a7f3e]">
                      {line}
                    </p>
                  ))}
                  {inlineNote[booking.ref] && (
                    <p className="text-[12px] text-[#e0937d]">{inlineNote[booking.ref]}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!actions.confirm || busy !== null}
                      onClick={() =>
                        void callAction("/api/admin/confirm", booking, () =>
                          showToast(`Ticket sent for ${booking.ref}`),
                        )
                      }
                      className="rounded-pill bg-[#d4af37] px-3 py-1.5 text-[13px] font-semibold text-[#241a06] disabled:opacity-35"
                    >
                      Confirm & send ticket
                    </button>
                    <button
                      type="button"
                      disabled={!actions.remind || busy !== null}
                      onClick={() =>
                        void callAction("/api/admin/remind", booking, () =>
                          showToast(`Reminder sent for ${booking.ref}`),
                        )
                      }
                      className="rounded-pill border border-[#d4af37] px-3 py-1.5 text-[13px] font-semibold text-[#e3c46a] disabled:opacity-35"
                    >
                      Remind
                    </button>
                    <button
                      type="button"
                      disabled={!actions.cancel || busy !== null}
                      onClick={() => setPendingCancel(booking)}
                      className="rounded-pill border border-[#e0937d] px-3 py-1.5 text-[13px] font-semibold text-[#e0937d] disabled:opacity-35"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {pendingCancel?.ref === booking.ref && (
                  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 md:col-span-5">
                    <div
                      role="dialog"
                      aria-modal="true"
                      className="w-full max-w-[460px] rounded-card-lg border border-[rgba(212,175,55,0.4)] bg-[#1c1710] px-7 py-7"
                    >
                      <h2 className="font-display text-[24px] text-[#e3c46a]">{copy.title}</h2>
                      <p className="mt-3 text-[15px] text-[#e8d9a8]">{copy.line}</p>
                      <p className="mt-3 text-[14px] leading-relaxed text-[#9a7f3e]">{copy.body}</p>
                      {copy.refundNote && (
                        <p className="mt-3 text-[14px] text-[#e0937d]">{copy.refundNote}</p>
                      )}
                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setPendingCancel(null)}
                          className="rounded-[12px] border border-[#8a6f35] px-4 py-2 text-[15px] text-[#e8d9a8]"
                        >
                          Keep booking
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const target = booking;
                            setPendingCancel(null);
                            void callAction("/api/admin/cancel", target, (next) =>
                              showToast(
                                `${next.partySize} seats at Table ${next.tableNo} released.`,
                              ),
                            );
                          }}
                          className="rounded-[12px] bg-[#e0937d] px-4 py-2 text-[15px] font-semibold text-[#241a06]"
                        >
                          Yes, cancel & release seats
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
      {toast && (
        <p className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-pill bg-[#1a1610] px-5 py-3 text-[14px] text-[#e3c46a] shadow-lg">
          {toast}
        </p>
      )}
    </main>
  );
}
