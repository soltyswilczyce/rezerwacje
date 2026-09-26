"use client";

import { useState, useEffect, useCallback } from "react";
import {
  format, isSameDay, isSameMonth, isToday, isPast, parseISO,
  addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval
} from "date-fns";
import { pl } from "date-fns/locale";
import type { Facility, CalendarSlot } from "@/lib/supabase";

export interface BusySlot {
  timeFrom: string;
  timeTo: string;
  label: string;
}

interface Props {
  onDateSelect: (date: Date | undefined, slots?: BusySlot[]) => void;
  selectedDate?: Date;
  selectedFacility: Facility;
  onFacilityChange: (facility: Facility) => void;
}

const FACILITY_CONFIG = {
  swietlica: { label: "Świetlica", icon: "🏛️", description: "Sala na imprezy i spotkania" },
  tereny_zielone: { label: "Tereny Zielone", icon: "🌿", description: "Ogród i tereny rekreacyjne" },
};

const DAY_NAMES = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

interface DayInfo {
  fullyBusy: boolean;
  partialSlots: BusySlot[];
}

export default function ReservationCalendar({
  onDateSelect,
  selectedDate,
  selectedFacility,
  onFacilityChange,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [busySlots, setBusySlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; slots: BusySlot[] } | null>(null);

  const fetchBusySlots = useCallback(async (month: Date) => {
    setLoading(true);
    try {
      const monthStr = format(month, "yyyy-MM");
      const res = await fetch(`/api/reservations?facility=${selectedFacility}&month=${monthStr}`);
      if (res.ok) setBusySlots(await res.json());
    } catch (err) {
      console.error("Failed to fetch slots:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedFacility]);

  useEffect(() => {
    fetchBusySlots(currentMonth);
  }, [fetchBusySlots, currentMonth]);

  function getDayInfo(date: Date): DayInfo {
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    const dayMinutes = 24 * 60;
    let busyMinutes = 0;
    const partialSlots: BusySlot[] = [];

    busySlots.forEach(slot => {
      const from = parseISO(slot.date_from);
      const to = parseISO(slot.date_to);
      const overlapStart = from < dayStart ? dayStart : from;
      const overlapEnd = to > dayEnd ? dayEnd : to;
      if (overlapEnd > overlapStart) {
        busyMinutes += (overlapEnd.getTime() - overlapStart.getTime()) / 60000;
        const displayFrom = from < dayStart ? "00:00" : format(from, "HH:mm");
        const displayTo = to > dayEnd ? "24:00" : format(to, "HH:mm");
        partialSlots.push({
          label: slot.display_label,
          timeFrom: displayFrom,
          timeTo: displayTo,
        });
      }
    });

    return {
      fullyBusy: busyMinutes >= dayMinutes - 1,
      partialSlots,
    };
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  function handleDayClick(date: Date, dayInfo: DayInfo) {
    if (isPast(date) && !isToday(date)) return;
    if (dayInfo.fullyBusy) return;
    onDateSelect(date, dayInfo.partialSlots);
  }

  return (
    <div className="animate-fade-in">
      {/* Przełącznik obiektów */}
      <div className="flex gap-3 mb-6">
        {(Object.keys(FACILITY_CONFIG) as Facility[]).map((f) => {
          const cfg = FACILITY_CONFIG[f];
          const active = selectedFacility === f;
          return (
            <button
              key={f}
              onClick={() => { onFacilityChange(f); onDateSelect(undefined); }}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                active ? "border-green-700 bg-green-50 shadow-sm" : "border-gray-200 bg-white hover:border-green-300"
              }`}
            >
              <span className="text-2xl">{cfg.icon}</span>
              <div className="text-left">
                <div className={`font-semibold text-sm ${active ? "text-green-900" : "text-gray-700"}`}>{cfg.label}</div>
                <div className="text-xs text-gray-500 hidden sm:block">{cfg.description}</div>
              </div>
              {active && <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />}
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
          <span>Zajęty cały dzień</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
          <span>Częściowo zajęty</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-600" />
          <span>Wybrany</span>
        </div>
      </div>

      {/* Kalendarz */}
      <div className="relative bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        {loading && (
          <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Nawigacja */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 text-lg">
            ‹
          </button>
          <h3 className="font-semibold text-gray-900 capitalize">
            {format(currentMonth, "LLLL yyyy", { locale: pl })}
          </h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 text-lg">
            ›
          </button>
        </div>

        {/* Nagłówki dni tygodnia */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Siatka dni */}
        <div className="grid grid-cols-7 gap-0.5">
          {calDays.map(date => {
            const inMonth = isSameMonth(date, currentMonth);
            const dayInfo = inMonth ? getDayInfo(date) : { fullyBusy: false, partialSlots: [] };
            const past = isPast(date) && !isToday(date);
            const selected = selectedDate != null && isSameDay(date, selectedDate);
            const today = isToday(date);
            const hasPartial = dayInfo.partialSlots.length > 0 && !dayInfo.fullyBusy;
            const clickable = inMonth && !dayInfo.fullyBusy && !past;

            return (
              <div key={date.toISOString()} className="relative">
                <button
                  onClick={() => { if (clickable) handleDayClick(date, dayInfo); }}
                  disabled={!clickable}
                  onMouseEnter={(e) => {
                    if (!inMonth || dayInfo.partialSlots.length === 0) return;
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setTooltip({ x: rect.left + rect.width / 2, y: rect.top, slots: dayInfo.partialSlots });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  className={[
                    "w-full aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all duration-150",
                    !inMonth ? "text-gray-200 cursor-default" : "",
                    inMonth && past ? "text-gray-300 cursor-not-allowed" : "",
                    inMonth && !past && !dayInfo.fullyBusy && !selected ? "hover:bg-green-50 hover:text-green-800 cursor-pointer text-gray-700" : "",
                    dayInfo.fullyBusy ? "bg-red-50 text-red-700 font-semibold cursor-not-allowed" : "",
                    hasPartial && !selected ? "bg-amber-50 text-amber-800" : "",
                    selected ? "bg-green-600 text-white font-bold shadow-sm" : "",
                    today && !selected ? "font-bold ring-1 ring-green-400" : "",
                  ].join(" ")}
                >
                  <span>{inMonth ? date.getDate() : ""}</span>
                  {inMonth && dayInfo.partialSlots.length > 0 && !selected && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayInfo.partialSlots.slice(0, 3).map((_, i) => (
                        <span key={i} className={`w-1 h-1 rounded-full ${dayInfo.fullyBusy ? "bg-red-400" : "bg-amber-400"}`} />
                      ))}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip globalny */}
      {tooltip && (
        <div className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -110%)" }}>
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
            <p className="font-semibold mb-1 text-gray-300">Zajęte godziny:</p>
            {tooltip.slots.map((s, i) => (
              <p key={i} className={i > 0 ? "mt-0.5" : ""}>
                {s.timeFrom}–{s.timeTo}
                {s.label ? <span className="text-gray-400 ml-1">({s.label})</span> : null}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
