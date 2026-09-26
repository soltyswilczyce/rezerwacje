import nodemailer from "nodemailer";
import { Reservation } from "./supabase";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true dla port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FACILITY_NAMES: Record<string, string> = {
  swietlica: "Świetlica",
  tereny_zielone: "Tereny Zielone",
};

const PURPOSE_NAMES: Record<string, string> = {
  uroczystosc: "Uroczystość rodzinna",
  spotkanie: "Spotkanie/zebranie",
  impreza: "Impreza okolicznościowa",
  inne: "Inne",
};

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Email do administratora - nowa rezerwacja oczekuje na akceptację
export async function sendAdminNotification(reservation: Reservation) {
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin`;

  await transporter.sendMail({
    from: `"System Rezerwacji" <${process.env.EMAIL_FROM}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `🔔 Nowa rezerwacja: ${FACILITY_NAMES[reservation.facility]} – ${new Date(reservation.date_from).toLocaleDateString("pl-PL")}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 8px;">
        <h2 style="color: #1f4622; border-bottom: 2px solid #5ea863; padding-bottom: 12px;">
          Nowa rezerwacja oczekuje na akceptację
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr style="background: white;">
            <td style="padding: 12px 16px; font-weight: bold; color: #555; width: 40%;">Obiekt</td>
            <td style="padding: 12px 16px; color: #1f4622; font-weight: bold;">${FACILITY_NAMES[reservation.facility]}</td>
          </tr>
          <tr style="background: #f0f7f0;">
            <td style="padding: 12px 16px; font-weight: bold; color: #555;">Od</td>
            <td style="padding: 12px 16px;">${formatDate(reservation.date_from)}</td>
          </tr>
          <tr style="background: white;">
            <td style="padding: 12px 16px; font-weight: bold; color: #555;">Do</td>
            <td style="padding: 12px 16px;">${formatDate(reservation.date_to)}</td>
          </tr>
          <tr style="background: #f0f7f0;">
            <td style="padding: 12px 16px; font-weight: bold; color: #555;">Cel wynajmu</td>
            <td style="padding: 12px 16px;">${PURPOSE_NAMES[reservation.purpose] || reservation.purpose}</td>
          </tr>
          <tr style="background: white;">
            <td style="padding: 12px 16px; font-weight: bold; color: #555;">Numer telefonu</td>
            <td style="padding: 12px 16px; font-size: 18px; font-weight: bold;">${reservation.phone}</td>
          </tr>
        </table>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="${adminUrl}" 
             style="background: #3d8c42; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
            Przejdź do panelu admina →
          </a>
        </div>
        
        <p style="color: #888; font-size: 12px; margin-top: 32px; text-align: center;">
          ID rezerwacji: ${reservation.id}
        </p>
      </div>
    `,
  });
}

// Email potwierdzający dla wnioskującego (opcjonalnie, jeśli podadzą e-mail)
export async function sendApprovalNotification(
  reservation: Reservation,
  approved: boolean
) {
  // Możesz rozszerzyć formularz o pole e-mail i tu wysyłać potwierdzenie
  // Na razie logujemy tylko dla dewelopera
  console.log(
    `Rezerwacja ${reservation.id} została ${approved ? "zaakceptowana" : "odrzucona"}`
  );
}
