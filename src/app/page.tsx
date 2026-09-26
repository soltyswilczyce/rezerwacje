"use client";

import { useState } from "react";
import ReservationCalendar, { BusySlot } from "@/components/ReservationCalendar";
import ReservationForm from "@/components/ReservationForm";
import SuccessScreen from "@/components/SuccessScreen";
import type { Facility } from "@/lib/supabase";

type Step = "calendar" | "form" | "success";

export default function HomePage() {
  const [step, setStep] = useState<Step>("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedFacility, setSelectedFacility] = useState<Facility>("swietlica");
  const [dayBusySlots, setDayBusySlots] = useState<BusySlot[]>([]);

  function handleDateSelect(date: Date | undefined, slots?: BusySlot[]) {
    setSelectedDate(date);
    setDayBusySlots(slots || []);
    if (date) {
      setTimeout(() => setStep("form"), 150);
    }
  }

  function handleReset() {
    setStep("calendar");
    setSelectedDate(undefined);
    setDayBusySlots([]);
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-cream)" }}>
      <header className="border-b border-stone-200" style={{ backgroundColor: "var(--color-forest-deep)" }}>
        <div className="max-w-lg mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📅</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                Rezerwacje
              </h1>
              <p className="text-white/60 text-xs">Świetlica & Tereny Zielone</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {step === "calendar" && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-display)" }}>
                Wybierz termin
              </h2>
              <p className="text-sm text-gray-500">
                Kliknij wolny lub częściowo zajęty dzień, żeby złożyć wniosek
              </p>
            </div>

            <ReservationCalendar
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
              selectedFacility={selectedFacility}
              onFacilityChange={setSelectedFacility}
            />

            <div className="mt-6 bg-white rounded-xl border border-stone-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm" style={{ fontFamily: "var(--font-display)" }}>
                Jak to działa?
              </h3>
              <ol className="space-y-1.5 text-sm text-gray-500">
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">1.</span>
                  Wybierz obiekt i kliknij dzień
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">2.</span>
                  Podaj godziny, cel i numer telefonu
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">3.</span>
                  Administrator potwierdzi telefonicznie
                </li>
              </ol>
            </div>
          </div>
        )}

        {step === "form" && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <button onClick={() => setStep("calendar")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4">
                ← Wróć do kalendarza
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-display)" }}>
                Szczegóły rezerwacji
              </h2>
              <p className="text-sm text-gray-500">Uzupełnij formularz, aby złożyć wniosek</p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <ReservationForm
                selectedDate={selectedDate}
                selectedFacility={selectedFacility}
                onSuccess={() => setStep("success")}
                onCancel={() => setStep("calendar")}
                busySlots={dayBusySlots}
              />
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <SuccessScreen onReset={handleReset} />
          </div>
        )}
      </div>

      <footer className="max-w-lg mx-auto px-4 py-8 mt-4">
        <p className="text-center text-xs text-gray-400">
          Rezerwacje podlegają akceptacji administratora
        </p>
      </footer>
    </main>
  );
}
