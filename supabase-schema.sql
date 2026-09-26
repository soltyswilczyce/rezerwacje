-- ============================================
-- URUCHOM TEN SKRYPT W: Supabase > SQL Editor
-- ============================================

-- Tabela rezerwacji
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility TEXT NOT NULL CHECK (facility IN ('swietlica', 'tereny_zielone')),
  date_from TIMESTAMPTZ NOT NULL,
  date_to TIMESTAMPTZ NOT NULL,
  purpose TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  label TEXT, -- max 2 słowa wyświetlane na kalendarzu (wypełniane przez admina przy akceptacji)
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Walidacja: data końcowa musi być po dacie początkowej
  CONSTRAINT valid_date_range CHECK (date_to > date_from)
);

-- Indeksy dla wydajności zapytań kalendarza
CREATE INDEX IF NOT EXISTS idx_reservations_facility_dates 
  ON reservations (facility, date_from, date_to);
  
CREATE INDEX IF NOT EXISTS idx_reservations_status 
  ON reservations (status);

-- Funkcja zapobiegająca nakładającym się rezerwacjom (double booking)
-- Działa na poziomie bazy danych jako dodatkowe zabezpieczenie
CREATE OR REPLACE FUNCTION check_reservation_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE facility = NEW.facility
      AND status != 'rejected'
      AND id != NEW.id
      AND (
        (NEW.date_from, NEW.date_to) OVERLAPS (date_from, date_to)
      )
  ) THEN
    RAISE EXCEPTION 'Rezerwacja nakłada się na istniejącą rezerwację dla obiektu %', NEW.facility;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger uruchamiany przed każdym INSERT i UPDATE
CREATE TRIGGER prevent_double_booking
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION check_reservation_overlap();

-- Row Level Security - tabela widoczna publicznie tylko do odczytu zaakceptowanych rezerwacji
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Polityka: wszyscy mogą czytać zaakceptowane rezerwacje (na kalendarz)
CREATE POLICY "Publiczny odczyt zaakceptowanych rezerwacji"
  ON reservations FOR SELECT
  USING (status = 'approved');

-- Polityka: wszyscy mogą dodawać nowe rezerwacje (formularz publiczny)
CREATE POLICY "Publiczne dodawanie rezerwacji"
  ON reservations FOR INSERT
  WITH CHECK (status = 'pending');

-- Polityka: tylko service_role (backend admina) może aktualizować status
-- (service_role key omija RLS, więc nie potrzebujemy dodatkowej polityki dla UPDATE)

-- Widok pomocniczy - zajęte sloty na kalendarz (bez danych osobowych)
CREATE OR REPLACE VIEW public_calendar AS
  SELECT 
    id,
    facility,
    date_from,
    date_to,
    COALESCE(label, purpose) AS display_label
  FROM reservations
  WHERE status = 'approved';

GRANT SELECT ON public_calendar TO anon;
