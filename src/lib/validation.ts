// Sanityzacja danych wejściowych - ochrona przed XSS i injection
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Usuwa tagi HTML
    .slice(0, 500); // Limit długości
}

export function sanitizePhone(input: unknown): string {
  if (typeof input !== "string") return "";
  // Zostawia tylko cyfry, spacje, +, -, ()
  return input.replace(/[^0-9+\-() ]/g, "").trim().slice(0, 20);
}

export function validateReservationInput(data: {
  facility: unknown;
  date_from: unknown;
  date_to: unknown;
  purpose: unknown;
  phone: unknown;
}): {
  valid: boolean;
  error?: string;
  sanitized?: {
    facility: string;
    date_from: string;
    date_to: string;
    purpose: string;
    phone: string;
  };
} {
  const ALLOWED_FACILITIES = ["swietlica", "tereny_zielone"];
  const ALLOWED_PURPOSES = ["uroczystosc", "spotkanie", "impreza", "inne"];

  const facility = sanitizeString(data.facility);
  const purpose = sanitizeString(data.purpose);
  const phone = sanitizePhone(data.phone);

  if (!ALLOWED_FACILITIES.includes(facility)) {
    return { valid: false, error: "Nieprawidłowy obiekt" };
  }

  if (!ALLOWED_PURPOSES.includes(purpose)) {
    return { valid: false, error: "Nieprawidłowy cel wynajmu" };
  }

  if (!phone || phone.length < 9) {
    return { valid: false, error: "Nieprawidłowy numer telefonu" };
  }

  // Walidacja dat
  const dateFrom = new Date(data.date_from as string);
  const dateTo = new Date(data.date_to as string);
  const now = new Date();

  if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
    return { valid: false, error: "Nieprawidłowy format daty" };
  }

  if (dateFrom < now) {
    return { valid: false, error: "Data nie może być w przeszłości" };
  }

  if (dateTo <= dateFrom) {
    return {
      valid: false,
      error: "Data zakończenia musi być późniejsza niż rozpoczęcia",
    };
  }

  // Max 7 dni rezerwacji
  const maxDuration = 7 * 24 * 60 * 60 * 1000;
  if (dateTo.getTime() - dateFrom.getTime() > maxDuration) {
    return { valid: false, error: "Rezerwacja nie może przekraczać 7 dni" };
  }

  return {
    valid: true,
    sanitized: {
      facility,
      purpose,
      phone,
      date_from: dateFrom.toISOString(),
      date_to: dateTo.toISOString(),
    },
  };
}
