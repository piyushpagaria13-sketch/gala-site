import { loadAdminBooking } from "@/lib/adminData";
import { sendCancellationEmail, sendReminderEmail, sendTicketEmail } from "@/lib/adminMail";
import { CONFIRM_CANCEL_EMAIL } from "@/lib/config";
import {
  runCancel,
  runConfirm,
  runRemind,
  type AdminBooking,
} from "@/lib/adminRules";
import { exportAll } from "@/lib/sheetExport";
import { getSupabaseServiceClient } from "@/lib/supabase";

export type AdminActionResult = {
  ok: boolean;
  booking: AdminBooking | null;
  message?: string;
  /** Set when Supabase saved and the Sheet mirror did not. */
  exportError?: string;
  /** Set when the booking was saved and the family email did not send. */
  emailError?: string;
};

async function exportAfterSave(): Promise<string | undefined> {
  try {
    await exportAll();
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : "Sheet export failed";
  }
}

async function requireBooking(ref: string): Promise<AdminBooking> {
  const booking = await loadAdminBooking(ref);
  if (!booking) throw new Error("Couldn't find that booking");
  return booking;
}

export async function confirmAndSendTicket(ref: string): Promise<AdminActionResult> {
  const booking = await requireBooking(ref);
  const supabase = getSupabaseServiceClient();
  const result = await runConfirm(booking, {
    now: new Date().toISOString(),
    send: () => sendTicketEmail(booking),
    savePaid: async (at) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "paid", ticket_sent_at: at })
        .eq("ref", ref);
      if (error) throw error;
    },
  });
  const exportError = result.sent ? await exportAfterSave() : undefined;
  const fresh = (await loadAdminBooking(ref)) ?? result.booking;
  return { ok: !result.message, booking: fresh, message: result.message, exportError };
}

export async function remindToPay(ref: string): Promise<AdminActionResult> {
  const booking = await requireBooking(ref);
  const supabase = getSupabaseServiceClient();
  const result = await runRemind(booking, {
    now: new Date().toISOString(),
    send: () => sendReminderEmail(booking),
    saveReminder: async (at) => {
      const { error } = await supabase
        .from("bookings")
        .update({ reminder_sent_at: at })
        .eq("ref", ref);
      if (error) throw error;
    },
  });
  const fresh = (await loadAdminBooking(ref)) ?? result.booking;
  return { ok: !result.message, booking: fresh, message: result.message };
}

export async function cancelBooking(ref: string): Promise<AdminActionResult> {
  const booking = await requireBooking(ref);
  const supabase = getSupabaseServiceClient();
  const result = await runCancel(booking, {
    now: new Date().toISOString(),
    saveCancelled: async (at) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled", cancelled_at: at })
        .eq("ref", ref);
      if (error) throw error;
    },
    exportSheet: () => exportAll().then(() => undefined),
  });
  let emailError: string | undefined;
  if (CONFIRM_CANCEL_EMAIL && booking.email.trim()) {
    try {
      await sendCancellationEmail(booking);
    } catch (error) {
      emailError = error instanceof Error ? error.message : "Couldn't send that email";
    }
  }
  const fresh = (await loadAdminBooking(ref)) ?? result.booking;
  return { ok: true, booking: fresh, exportError: result.exportError, emailError };
}
