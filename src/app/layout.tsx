import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rezerwacje – Świetlica i Tereny Zielone",
  description: "Zarezerwuj świetlicę lub tereny zielone online. Szybko, prosto, bez rejestracji.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
