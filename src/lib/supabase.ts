import { createClient } from "@supabase/supabase-js";

// Klient publiczny - do odczytu kalendarza i składania rezerwacji
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Klient z uprawnieniami administratora - tylko po stronie serwera!
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type Facility = "swietlica" | "tereny_zielone";
export type ReservationStatus = "pending" | "approved" | "rejected";

export interface Reservation {
  id: string;
  facility: Facility;
  date_from: string;
  date_to: string;
  purpose: string;
  phone: string;
  status: ReservationStatus;
  label?: string;
  created_at: string;
}

export interface CalendarSlot {
  id: string;
  facility: Facility;
  date_from: string;
  date_to: string;
  display_label: string;
}
