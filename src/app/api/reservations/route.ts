import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { validateReservationInput } from "@/lib/validation";
import { sendAdminNotification } from "@/lib/email";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const facility = searchParams.get("facility");
  const month = searchParams.get("month");

  if (!facility || !["swietlica", "tereny_zielone"].includes(facility)) {
    return NextResponse.json({ error: "Nieprawidłowy obiekt" }, { status: 400 });
  }

  let dateFrom: Date;
  let dateTo: Date;

  if (month) {
    dateFrom = new Date(`${month}-01T00:00:00`);
    dateTo = new Date(dateFrom);
    dateTo.setMonth(dateTo.getMonth() + 1);
  } else {
    dateFrom = new Date();
    dateFrom.setDate(1);
    dateTo = new Date(dateFrom);
    dateTo.setMonth(dateTo.getMonth() + 3);
  }

  const { data, error } = await supabase
    .from("public_calendar")
    .select("id, facility, date_from, date_to, display_label")
    .eq("facility", facility)
    .gte("date_to", dateFrom.toISOString())
    .lte("date_from", dateTo.toISOString())
    .order("date_from");

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: "Błąd bazy danych" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  let body: {
    facility: unknown;
    date_from: unknown;
    date_to: unknown;
    purpose: unknown;
    phone: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy format danych" }, { status: 400 });
  }

  const validation = validateReservationInput(body);
  if (!validation.valid || !validation.sanitized) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { facility, date_from, date_to, purpose, phone } = validation.sanitized;

  const { data: conflicts } = await supabaseAdmin
    .from("reservations")
    .select("id, date_from, date_to")
    .eq("facility", facility)
    .neq("status", "rejected")
    .lt("date_from", date_to)
    .gt("date_to", date_from);

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json(
      { error: "Ten termin nakłada się na istniejącą rezerwację. Proszę wybrać inny termin." },
      { status: 409 }
    );
  }

  const { data: newReservation, error: insertError } = await supabaseAdmin
    .from("reservations")
    .insert({ facility, date_from, date_to, purpose, phone, status: "pending" })
    .select()
    .single();

  if (insertError) {
    if (insertError.message?.includes("nakłada się")) {
      return NextResponse.json({ error: "Ten termin jest już zajęty." }, { status: 409 });
    }
    console.error("Insert error:", insertError);
    return NextResponse.json({ error: "Błąd zapisu" }, { status: 500 });
  }

  sendAdminNotification(newReservation).catch((err) => {
    console.error("Email send failed:", err);
  });

  return NextResponse.json(
    { success: true, message: "Rezerwacja złożona pomyślnie.", id: newReservation.id },
    { status: 201 }
  );
}
