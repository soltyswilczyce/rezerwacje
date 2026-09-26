"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import type { Reservation } from "@/lib/supabase";

const FACILITY_NAMES: Record<string, string> = {
  swietlica: "Świetlica",
  tereny_zielone: "Tereny Zielone",
};

const PURPOSE_OPTIONS = [
  { value: "uroczystosc", label: "Uroczystość rodzinna" },
  { value: "spotkanie", label: "Spotkanie / zebranie" },
  { value: "impreza", label: "Impreza okolicznościowa" },
  { value: "inne", label: "Inne" },
];

type TabStatus = "pending" | "approved" | "rejected";

// ─── FORMAT HELPERS ────────────────────────────────────────
function fmtDate(iso: string) {
  return format(parseISO(iso), "d MMM yyyy", { locale: pl });
}
function fmtTime(iso: string) {
  return format(parseISO(iso), "HH:mm");
}
function toLocalInput(iso: string) {
  // datetime-local input wymaga formatu "YYYY-MM-DDTHH:mm"
  return iso.slice(0, 16);
}

// ─── LOGIN ─────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) { onLogin(); }
      else { const d = await res.json(); setError(d.error || "Nieprawidłowe hasło"); }
    } catch { setError("Błąd połączenia"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-cream)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-green-900">
            <span className="text-white text-xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-green-900" style={{ fontFamily: "var(--font-display)" }}>
            Panel Administratora
          </h1>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hasło</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoFocus
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-green-700 text-white rounded-xl font-semibold text-sm hover:bg-green-800 transition-colors disabled:opacity-50">
              {loading ? "Logowanie..." : "Zaloguj się"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL EDYCJI ──────────────────────────────────────────
function EditModal({ reservation, onSave, onClose }: {
  reservation: Reservation;
  onSave: () => void;
  onClose: () => void;
}) {
  const [dateFrom, setDateFrom] = useState(toLocalInput(reservation.date_from));
  const [dateTo, setDateTo] = useState(toLocalInput(reservation.date_to));
  const [phone, setPhone] = useState(reservation.phone);
  const [purpose, setPurpose] = useState(reservation.purpose);
  const [label, setLabel] = useState(reservation.label || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (new Date(dateTo) <= new Date(dateFrom)) {
      setError("Data zakończenia musi być późniejsza niż rozpoczęcia.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reservation.id,
          action: "edit",
          date_from: new Date(dateFrom).toISOString(),
          date_to: new Date(dateTo).toISOString(),
          phone,
          purpose,
          label,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Błąd zapisu"); return; }
      onSave();
    } catch { setError("Błąd połączenia"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 className="font-bold text-gray-900 text-lg" style={{ fontFamily: "var(--font-display)" }}>
            Edytuj rezerwację
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Obiekt (tylko informacyjnie) */}
          <div className="bg-green-50 rounded-lg px-4 py-2.5 text-sm font-medium text-green-800">
            {FACILITY_NAMES[reservation.facility]}
          </div>

          {/* Daty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Od</label>
              <input type="datetime-local" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Do</label>
              <input type="datetime-local" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {/* Cel */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Cel wynajmu</label>
            <select value={purpose} onChange={e => setPurpose(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              {PURPOSE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Telefon</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          {/* Etykieta */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Etykieta na kalendarzu <span className="font-normal text-gray-400">(max 2 słowa)</span>
            </label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)}
              placeholder='np. "Wesele Kowalskich"' maxLength={30}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">⚠️ {error}</div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 border-2 border-stone-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-stone-50 transition-colors">
            Anuluj
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors disabled:opacity-50">
            {loading ? "Zapisywanie..." : "Zapisz zmiany"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KARTA REZERWACJI ──────────────────────────────────────
function ReservationCard({ reservation, onAction, onEdit, onDelete }: {
  reservation: Reservation;
  onAction: (id: string, action: "approve" | "reject", label?: string) => Promise<void>;
  onEdit: (r: Reservation) => void;
  onDelete: (id: string) => void;
}) {
  const [label, setLabel] = useState(reservation.label || "");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handle(action: "approve" | "reject") {
    setLoading(true);
    await onAction(reservation.id, action, action === "approve" ? label : undefined);
    setLoading(false);
  }

  const isPending = reservation.status === "pending";
  const isApproved = reservation.status === "approved";

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
      {/* Nagłówek */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div>
          <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-1.5">
            {FACILITY_NAMES[reservation.facility]}
          </span>
          <p className="font-semibold text-gray-900 capitalize" style={{ fontFamily: "var(--font-display)" }}>
            {fmtDate(reservation.date_from)}
          </p>
          <p className="text-sm text-gray-500">
            {fmtTime(reservation.date_from)} – {fmtTime(reservation.date_to)}
            {/* Jeśli wielodniowa */}
            {fmtDate(reservation.date_from) !== fmtDate(reservation.date_to) && (
              <span className="ml-1 text-xs text-amber-600 font-medium">
                (do {fmtDate(reservation.date_to)})
              </span>
            )}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-400">
            zgłoszono {format(parseISO(reservation.created_at), "d MMM, HH:mm", { locale: pl })}
          </p>
        </div>
      </div>

      {/* Dane */}
      <div className="grid grid-cols-2 gap-2 px-4 pb-3">
        <div className="bg-stone-50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400">Cel</p>
          <p className="text-sm font-medium text-gray-700">
            {PURPOSE_OPTIONS.find(o => o.value === reservation.purpose)?.label || reservation.purpose}
          </p>
        </div>
        <div className="bg-stone-50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400">Telefon</p>
          <a href={`tel:${reservation.phone}`} className="text-sm font-bold text-green-700 hover:underline">
            {reservation.phone}
          </a>
        </div>
      </div>

      {/* Akcje */}
      <div className="px-4 pb-4 space-y-2">
        {/* Status badge */}
        {!isPending && (
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg mb-2
            ${isApproved ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {isApproved ? "✓ Zaakceptowano" : "✕ Odrzucono"}
            {reservation.label && <span className="text-gray-500 ml-1">· {reservation.label}</span>}
          </div>
        )}

        {/* Etykieta (tylko dla pending przy akceptacji) */}
        {isPending && (
          <input
            type="text" value={label} onChange={e => setLabel(e.target.value)}
            placeholder='Etykieta na kalendarzu (np. "Wesele")' maxLength={30}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs bg-stone-50 focus:outline-none focus:ring-1 focus:ring-green-400 placeholder-gray-400"
          />
        )}

        {/* Przyciski główne */}
        {isPending && (
          <div className="flex gap-2">
            <button onClick={() => handle("reject")} disabled={loading}
              className="flex-1 py-2 border-2 border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
              ✕ Odrzuć
            </button>
            <button onClick={() => handle("approve")} disabled={loading}
              className="flex-[2] py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 shadow-sm">
              {loading ? "..." : "✓ Akceptuj"}
            </button>
          </div>
        )}

        {/* Edytuj + Usuń (dla wszystkich statusów) */}
        <div className="flex gap-2">
          <button onClick={() => onEdit(reservation)}
            className="flex-1 py-2 border border-stone-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-1">
            ✏️ Edytuj
          </button>

          {confirmDelete ? (
            <div className="flex-1 flex gap-1">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 border border-stone-200 text-gray-500 rounded-lg text-xs hover:bg-stone-50 transition-colors">
                Nie
              </button>
              <button onClick={() => onDelete(reservation.id)}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors">
                Tak, usuń
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="flex-1 py-2 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
              🗑️ Usuń
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────
function AdminDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<TabStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const fetchReservations = useCallback(async (status: TabStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reservations?status=${status}`);
      if (res.ok) setReservations(await res.json());
    } finally { setLoading(false); }
  }, []);

  const fetchCounts = useCallback(async () => {
    const statuses: TabStatus[] = ["pending", "approved", "rejected"];
    const results = await Promise.all(
      statuses.map(s =>
        fetch(`/api/admin/reservations?status=${s}`)
          .then(r => r.json())
          .then(d => [s, Array.isArray(d) ? d.length : 0] as [TabStatus, number])
      )
    );
    setCounts(Object.fromEntries(results) as typeof counts);
  }, []);

  useEffect(() => {
    fetchReservations(activeTab);
    fetchCounts();
  }, [activeTab, fetchReservations, fetchCounts]);

  async function handleAction(id: string, action: "approve" | "reject", label?: string) {
    const res = await fetch("/api/admin/reservations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, label }),
    });
    if (res.ok) {
      showToast(action === "approve" ? "✓ Rezerwacja zaakceptowana" : "Rezerwacja odrzucona");
      await fetchReservations(activeTab);
      await fetchCounts();
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/reservations?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("🗑️ Rezerwacja usunięta");
      await fetchReservations(activeTab);
      await fetchCounts();
    }
  }

  async function handleEditSave() {
    setEditingReservation(null);
    showToast("✏️ Rezerwacja zaktualizowana");
    await fetchReservations(activeTab);
    await fetchCounts();
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  }

  const TABS: { key: TabStatus; label: string }[] = [
    { key: "pending", label: "Oczekujące" },
    { key: "approved", label: "Zaakceptowane" },
    { key: "rejected", label: "Odrzucone" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-cream)" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* Edit Modal */}
      {editingReservation && (
        <EditModal
          reservation={editingReservation}
          onSave={handleEditSave}
          onClose={() => setEditingReservation(null)}
        />
      )}

      {/* Header */}
      <header style={{ backgroundColor: "var(--color-forest-deep)" }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
              Panel Administratora
            </h1>
            <p className="text-white/60 text-xs">Zarządzanie rezerwacjami</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-white/70 text-xs hover:text-white transition-colors">← Strona publiczna</a>
            <button onClick={handleLogout}
              className="px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-colors">
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-stone-200 p-1 mb-6">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150
                ${activeTab === tab.key ? "bg-green-700 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-stone-50"}`}>
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center
                  ${activeTab === tab.key ? "bg-white/30 text-white" : "bg-stone-200 text-gray-600"}`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">{activeTab === "pending" ? "📭" : "📋"}</div>
            <p className="font-medium">
              {activeTab === "pending" ? "Brak oczekujących rezerwacji" : "Brak rezerwacji w tej kategorii"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map(r => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onAction={handleAction}
                onEdit={setEditingReservation}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── STRONA GŁÓWNA ─────────────────────────────────────────
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/reservations?status=pending")
      .then(res => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  return <AdminDashboard />;
}
