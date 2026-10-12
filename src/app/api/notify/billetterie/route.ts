import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

// -------------------------------------------------------------------
// POST /api/notify/billetterie
// Saves the email to DB (optional) and sends confirmation via Brevo
// -------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Email invalide' }, { status: 400 });
    }

    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      return NextResponse.json({ success: false, error: 'Clé API Brevo manquante' }, { status: 500 });
    }

    // 1. Sauvegarder l'email en base (table ticket_waitlist)
    try {
      await queryDb(
        `CREATE TABLE IF NOT EXISTS public.ticket_waitlist (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          email TEXT UNIQUE NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );`,
        []
      );
      await queryDb(
        `INSERT INTO public.ticket_waitlist (email) VALUES ($1) ON CONFLICT (email) DO NOTHING;`,
        [email]
      );
    } catch {
      // Continue even if DB fails — email sending is the priority
    }

    // 2. Envoyer un email de confirmation via Brevo API
    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Inscription confirmée – VoteMoi Billetterie</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#5b3df5 0%,#8b5cf6 100%);padding:36px 40px;text-align:center;">
              <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
                Vote<span style="color:#f9c74f;">Moi</span> ✨
              </div>
              <div style="color:rgba(255,255,255,0.75);font-size:12px;font-weight:600;margin-top:4px;letter-spacing:2px;text-transform:uppercase;">
                Billetterie Officielle
              </div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:36px 40px;text-align:center;">
              <div style="width:64px;height:64px;background:rgba(91,61,245,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                <span style="font-size:28px;">🎟️</span>
              </div>
              <h1 style="font-size:22px;font-weight:800;color:#1e1e2e;margin:0 0 12px;">
                Vous êtes sur la liste prioritaire !
              </h1>
              <p style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 24px;">
                Bonjour, merci de votre inscription.<br/>
                Dès que la billetterie sera ouverte, vous recevrez une notification <strong style="color:#5b3df5;">en avant-première</strong> à cette adresse.
              </p>

              <!-- BADGE -->
              <div style="display:inline-block;background:rgba(91,61,245,0.08);border:1.5px solid rgba(91,61,245,0.25);border-radius:99px;padding:10px 24px;font-weight:700;color:#5b3df5;font-size:14px;margin-bottom:28px;">
                🔔 &nbsp; Accès Prioritaire Réservé
              </div>

              <!-- DIVIDER -->
              <hr style="border:none;border-top:1px solid #f0f0f5;margin:0 0 24px;"/>

              <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                Vous recevez cet email car vous avez soumis votre adresse email sur la page billetterie de <strong>VoteMoi</strong>.<br/>
                Si ce n'est pas vous, ignorez simplement ce message.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f0f0f5;">
              <p style="font-size:12px;color:#9ca3af;margin:0;">
                © ${new Date().getFullYear()} VoteMoi · Plateforme de vote et billetterie officielle
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'VoteMoi Billetterie',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@votemoi.com',
        },
        to: [{ email }],
        subject: '🎟️ Votre place prioritaire est réservée – Billetterie VoteMoi',
        htmlContent: emailHtml,
      }),
    });

    if (!brevoRes.ok) {
      const errData = await brevoRes.json().catch(() => ({}));
      console.error('Erreur Brevo:', errData);
      return NextResponse.json(
        { success: false, error: 'Erreur envoi email Brevo', details: errData },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Email de confirmation envoyé !' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
