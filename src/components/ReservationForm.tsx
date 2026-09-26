"use client";

import { useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { Facility } from "@/lib/supabase";
import type { BusySlot } from "./ReservationCalendar";

interface Props {
  selectedDate?: Date;
  selectedFacility: Facility;
  onSuccess: () => void;
  onCancel: () => void;
  busySlots?: BusySlot[];
}

const FACILITY_NAMES: Record<Facility, string> = {
  swietlica: "Świetlica",
  tereny_zielone: "Tereny Zielone",
};

const PURPOSE_OPTIONS = [
  { value: "uroczystosc", label: "🎉 Uroczystość rodzinna" },
  { value: "spotkanie", label: "🤝 Spotkanie / zebranie" },
  { value: "impreza", label: "🎊 Impreza okolicznościowa" },
  { value: "inne", label: "📋 Inne" },
];

function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let h = 7; h <= 22; h++) {
    times.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 22) times.push(`${String(h).padStart(2, "0")}:30`);
  }
  return times;
}

const TIME_OPTIONS = generateTimeOptions();

export default function ReservationForm({
  selectedDate,
  selectedFacility,
  onSuccess,
  onCancel,
  busySlots = [],
}: Props) {
  const [timeFrom, setTimeFrom] = useState("10:00");
  const [timeTo, setTimeTo] = useState("14:00");
  const [purpose, setPurpose] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate) return;
    setError(null);

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const dateFrom = new Date(`${dateStr}T${timeFrom}:00`);
    const dateTo = new Date(`${dateStr}T${timeTo}:00`);

    if (dateTo <= dateFrom) {
      setError("Godzina zakończenia musi być późniejsza niż rozpoczęcia.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facility: selectedFacility,
          date_from: dateFrom.toISOString(),
          date_to: dateTo.toISOString(),
          purpose,
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Wystąpił błąd. Spróbuj ponownie.");
        return;
      }
      onSuccess();
    } catch {
      setError("Błąd połączenia. Sprawdź internet i spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Nagłówek */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-green-600 uppercase tracking-wide font-semibold mb-0.5">Rezerwacja</p>
            <p className="text-lg font-semibold text-green-900" style={{ fontFamily: "var(--font-display)" }}>
              {FACILITY_NAMES[selectedFacility]}
            </p>
          </div>
          {selectedDate && (
            <div className="text-right">
              <p className="text-xl font-bold text-green-800" style={{ fontFamily: "var(--font-display)" }}>
                {format(selectedDate, "d MMM", { locale: pl })}
              </p>
              <p className="text-sm text-green-600 capitalize">
                {format(selectedDate, "EEEE", { locale: pl })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Zajęte godziny w tym dniu */}
      {busySlots.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-xs font-semibold text-amber-800 mb-1.5">⚠️ Zajęte godziny w tym dniu:</p>
          {busySlots.map((s, i) => (
            <p key={i} className="text-xs text-amber-700">
              {s.timeFrom}–{s.timeTo}
              {s.label ? <span className="text-amber-500 ml-1">({s.label})</span> : null}
            </p>
          ))}
          <p className="text-xs text-amber-600 mt-1.5">Wybierz godziny poza powyższymi przedziałami.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Godziny */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Godziny rezerwacji</label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Od</label>
              <select value={timeFrom} onChange={e => setTimeFrom(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="text-gray-400 mt-5">→</div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Do</label>
              <select value={timeTo} onChange={e => setTimeTo(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Cel wynajmu */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Cel wynajmu</label>
          <div className="grid grid-cols-2 gap-2">
            {PURPOSE_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setPurpose(opt.value)}
                className={`px-3 py-2.5 rounded-lg border-2 text-sm text-left transition-all duration-150 ${
                  purpose === opt.value
                    ? "border-green-500 bg-green-50 text-green-800 font-medium"
                    : "border-stone-200 bg-white text-gray-600 hover:border-green-300"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Numer telefonu <span className="text-red-500">*</span>
          </label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="np. 600 123 456" required minLength={9} maxLength={20}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400" />
          <p className="text-xs text-gray-400 mt-1">Administrator skontaktuje się z Tobą telefonicznie</p>
        </div>

        {/* Błąd */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 animate-fade-in">
            ⚠️ {error}
          </div>
        )}

        {/* Przyciski */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="flex-1 px-4 py-3 border-2 border-stone-300 rounded-xl text-sm font-medium text-gray-600 hover:border-stone-400 hover:bg-stone-50 transition-all duration-150">
            Wróć
          </button>
          <button type="submit" disabled={loading || !purpose || !phone || !selectedDate}
            className="flex-1 px-6 py-3 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Wysyłanie...
              </span>
            ) : "Wyślij wniosek →"}
          </button>
        </div>
      </form>
    </div>
  );
}
