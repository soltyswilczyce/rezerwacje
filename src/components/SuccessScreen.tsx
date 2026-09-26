"use client";

interface Props {
  onReset: () => void;
}

export default function SuccessScreen({ onReset }: Props) {
  return (
    <div className="animate-fade-in text-center py-8">
      <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <span className="text-3xl">✓</span>
      </div>
      <h2
        className="text-2xl font-bold text-forest-900 mb-3"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Wniosek złożony!
      </h2>
      <p className="text-gray-600 mb-2 text-sm leading-relaxed max-w-xs mx-auto">
        Twój wniosek o rezerwację został wysłany do administratora.
      </p>
      <p className="text-gray-500 text-sm mb-8">
        Skontaktuje się z Tobą telefonicznie w celu potwierdzenia.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-8 text-left">
        <div className="flex gap-2">
          <span>ℹ️</span>
          <div>
            <p className="font-semibold mb-0.5">Co dalej?</p>
            <p className="text-amber-700">
              Rezerwacja pojawi się w kalendarzu dopiero po akceptacji przez
              administratora. Do tego czasu termin pozostaje dostępny.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="px-6 py-3 bg-forest-600 text-white rounded-xl text-sm font-semibold hover:bg-forest-700 transition-colors"
      >
        Złóż kolejną rezerwację
      </button>
    </div>
  );
}
