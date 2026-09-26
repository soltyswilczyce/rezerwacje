import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/auth";
import { sanitizeString, sanitizePhone } from "@/lib/validation";

// GET /api/admin/reservations?status=pending
export async function GET(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Brak dostępu" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .select("*")
    .eq("status", status)
    .order("date_from", { ascending: true });

  if (error) return NextResponse.json({ error: "Błąd bazy danych" }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/admin/reservations - akceptuj / odrzuć / edytuj
export async function PATCH(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Brak dostępu" }, { status: 401 });

  let body: {
    id: string;
    action: "approve" | "reject" | "edit";
    label?: string;
    date_from?: string;
    date_to?: string;
    phone?: string;
    purpose?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  const { id, action } = body;
  if (!id || !["approve", "reject", "edit"].includes(action)) {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  // ── EDYCJA ──────────────────────────────────────────────
  if (action === "edit") {
    const updates: Record<string, unknown> = {};

    if (body.date_from) {
      const d = new Date(body.date_from);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Nieprawidłowa data od" }, { status: 400 });
      updates.date_from = d.toISOString();
    }
    if (body.date_to) {
      const d = new Date(body.date_to);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Nieprawidłowa data do" }, { status: 400 });
      updates.date_to = d.toISOString();
    }
    if (body.phone) updates.phone = sanitizePhone(body.phone);
    if (body.label !== undefined) updates.label = sanitizeString(body.label).slice(0, 30);
    if (body.purpose) {
      const ALLOWED = ["uroczystosc", "spotkanie", "impreza", "inne"];
      if (!ALLOWED.includes(body.purpose)) return NextResponse.json({ error: "Nieprawidłowy cel" }, { status: 400 });
      updates.purpose = body.purpose;
    }

    // Walidacja dat jeśli obie podane
    if (updates.date_from && updates.date_to) {
      if (new Date(updates.date_to as string) <= new Date(updates.date_from as string)) {
        return NextResponse.json({ error: "Data zakończenia musi być późniejsza niż rozpoczęcia" }, { status: 400 });
      }
    }

    // Sprawdź konflikty z innymi rezerwacjami (pomijając edytowaną)
    if (updates.date_from || updates.date_to) {
      // Pobierz aktualną rezerwację żeby mieć pełne daty
      const { data: current } = await supabaseAdmin
        .from("reservations")
        .select("date_from, date_to, facility, status")
        .eq("id", id)
        .single();

      if (current) {
        const checkFrom = (updates.date_from as string) || current.date_from;
        const checkTo = (updates.date_to as string) || current.date_to;

        const { data: conflicts } = await supabaseAdmin
          .from("reservations")
          .select("id")
          .eq("facility", current.facility)
          .neq("status", "rejected")
          .neq("id", id)
          .lt("date_from", checkTo)
          .gt("date_to", checkFrom);

        if (conflicts && conflicts.length > 0) {
          return NextResponse.json(
            { error: "Nowy termin nakłada się na inną rezerwację." },
            { status: 409 }
          );
        }
      }
    }

    const { error } = await supabaseAdmin
      .from("reservations")
      .update(updates)
      .eq("id", id);

    if (error) return NextResponse.json({ error: "Błąd zapisu" }, { status: 500 });
    return NextResponse.json({ success: true, message: "Rezerwacja zaktualizowana" });
  }

  // ── AKCEPTUJ / ODRZUĆ ───────────────────────────────────
  const newStatus = action === "approve" ? "approved" : "rejected";
  const sanitizedLabel = body.label ? sanitizeString(body.label).slice(0, 30) : null;

  const { error } = await supabaseAdmin
    .from("reservations")
    .update({
      status: newStatus,
      ...(sanitizedLabel && { label: sanitizedLabel }),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Błąd aktualizacji" }, { status: 500 });

  return NextResponse.json({
    success: true,
    message: `Rezerwacja ${action === "approve" ? "zaakceptowana" : "odrzucona"}`,
  });
}

// DELETE /api/admin/reservations - usuń rezerwację
export async function DELETE(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Brak dostępu" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Brak ID" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("reservations")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Błąd usuwania" }, { status: 500 });
  return NextResponse.json({ success: true, message: "Rezerwacja usunięta" });
}
