import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

const EMAIL_HTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>La billetterie VoteMoi arrive bientôt</title>
</head>
<body style="margin:0;padding:0;background:#ECEBF7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ECEBF7;">
<tr><td align="center" style="padding:28px 12px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:18px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#1C1647;box-shadow:0 8px 30px rgba(39,20,159,0.15);">

<!-- En-tête -->
<tr><td align="center" style="background:#27149F;background-image:linear-gradient(135deg,#1B0E78 0%,#27149F 50%,#4B2CE0 100%);padding:44px 36px 40px 36px;">
<img src="https://miss-template.netlify.app/images/logo.png" width="230" alt="VoteMoi" style="display:block;width:230px;max-width:100%;height:auto;border:0;margin:0 auto 28px auto;font-size:32px;font-weight:700;color:#FFFFFF;">
<p style="margin:0 0 10px 0;font-size:48px;line-height:1;">🎟️</p>
<h1 style="margin:0 0 12px 0;font-size:30px;line-height:1.2;font-weight:700;color:#FFFFFF;">La billetterie arrive bientôt</h1>
<p style="margin:0 0 22px 0;font-size:16px;line-height:1.5;color:#D9D4FA;">Vos billets d'événements, au même endroit que vos votes.</p>
<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#FFFFFF;border-radius:24px;padding:9px 22px;font-size:14px;font-weight:700;color:#27149F;">Bientôt disponible</td></tr></table>
</td></tr>

<!-- Message -->
<tr><td style="padding:38px 40px 6px 40px;font-size:16px;line-height:1.75;">
<p style="margin:0 0 14px 0;font-size:18px;"><strong>Bonjour,</strong></p>
<p style="margin:0 0 14px 0;">Merci de votre intérêt pour <strong style="color:#27149F;">VoteMoi</strong>. Nous mettons la touche finale à la <strong>billetterie</strong> de la plateforme.</p>
<p style="margin:0;">Bientôt, vous pourrez acheter vos billets en ligne, en quelques secondes, pour les événements que vous aimez.</p>
</td></tr>

<!-- Billet -->
<tr><td style="padding:28px 40px 6px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#27149F;background-image:linear-gradient(135deg,#1B0E78 0%,#27149F 55%,#4B2CE0 100%);border-radius:16px;">
<tr>
<td valign="middle" style="padding:26px 24px;">
<p style="margin:0 0 6px 0;font-size:12px;letter-spacing:3px;font-weight:700;color:#BDB6EE;">BILLET D'ENTRÉE</p>
<p style="margin:0 0 6px 0;font-size:28px;line-height:1.1;font-weight:700;color:#FFFFFF;">VoteMoi</p>
<p style="margin:0;font-size:14px;line-height:1.5;color:#D9D4FA;">Votre place pour vivre l'événement.</p>
</td>
<td width="1" style="border-left:2px dashed #8F84F0;font-size:0;line-height:0;">&nbsp;</td>
<td width="130" align="center" valign="middle" style="padding:26px 12px;">
<p style="margin:0 0 6px 0;font-size:38px;line-height:1;">🎟️</p>
<p style="margin:0;font-size:13px;font-weight:700;color:#FFFFFF;">Bientôt</p>
</td>
</tr>
</table>
</td></tr>

<!-- Avantages -->
<tr><td style="padding:18px 40px 6px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="33%" align="center" valign="top" style="padding:0 5px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF0FC;border-radius:12px;"><tr><td align="center" style="padding:16px 6px;">
<p style="margin:0 0 6px 0;font-size:26px;line-height:1;">📱</p>
<p style="margin:0;font-size:13px;line-height:1.4;font-weight:700;color:#27149F;">Achat en ligne</p>
</td></tr></table>
</td>
<td width="33%" align="center" valign="top" style="padding:0 5px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF0FC;border-radius:12px;"><tr><td align="center" style="padding:16px 6px;">
<p style="margin:0 0 6px 0;font-size:26px;line-height:1;">⚡</p>
<p style="margin:0;font-size:13px;line-height:1.4;font-weight:700;color:#27149F;">En quelques secondes</p>
</td></tr></table>
</td>
<td width="33%" align="center" valign="top" style="padding:0 5px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF0FC;border-radius:12px;"><tr><td align="center" style="padding:16px 6px;">
<p style="margin:0 0 6px 0;font-size:26px;line-height:1;">🎉</p>
<p style="margin:0;font-size:13px;line-height:1.4;font-weight:700;color:#27149F;">Avec vos votes</p>
</td></tr></table>
</td>
</tr>
</table>
</td></tr>

<!-- Étapes -->
<tr><td style="padding:30px 40px 6px 40px;">
<h2 style="margin:0 0 16px 0;font-size:20px;color:#27149F;">Comment ça se passe ?</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:15px;line-height:1.55;">
<tr>
<td width="46" valign="top" style="padding-bottom:16px;"><div style="width:34px;height:34px;border-radius:17px;background:#27149F;color:#FFFFFF;text-align:center;line-height:34px;font-size:15px;font-weight:700;">1</div></td>
<td valign="top" style="padding:6px 0 16px 0;"><strong>Nous finalisons</strong> la billetterie.</td>
</tr>
<tr>
<td width="46" valign="top" style="padding-bottom:16px;"><div style="width:34px;height:34px;border-radius:17px;background:#27149F;color:#FFFFFF;text-align:center;line-height:34px;font-size:15px;font-weight:700;">2</div></td>
<td valign="top" style="padding:6px 0 16px 0;"><strong>Vous recevez une notification</strong> dès qu'elle est disponible, d'ici peu.</td>
</tr>
<tr>
<td width="46" valign="top"><div style="width:34px;height:34px;border-radius:17px;background:#27149F;color:#FFFFFF;text-align:center;line-height:34px;font-size:15px;font-weight:700;">3</div></td>
<td valign="top" style="padding:6px 0 0 0;"><strong>Vous achetez vos billets</strong> en ligne, sans rien de plus à faire.</td>
</tr>
</table>
</td></tr>

<!-- Contact -->
<tr><td style="padding:30px 40px 8px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF0FC;border-radius:14px;">
<tr><td align="center" style="padding:20px;">
<p style="margin:0;font-size:15px;line-height:1.6;color:#4B4780;">Une question ? Écrivez-nous à<br><strong style="color:#27149F;font-size:17px;">MKProg.support@gmail.com</strong></p>
</td></tr>
</table>
</td></tr>

<!-- Signature -->
<tr><td style="padding:24px 40px 34px 40px;font-size:16px;line-height:1.6;">
<p style="margin:0 0 4px 0;">À très bientôt,</p>
<p style="margin:0;"><strong style="color:#27149F;">L'équipe MK PROG</strong></p>
</td></tr>

<!-- Pied de page -->
<tr><td align="center" style="background:#1B0E78;padding:22px 36px;font-size:13px;line-height:1.7;color:#BDB6EE;">
<p style="margin:0;">VoteMoi, conçu et développé par MK PROG.<br>
Instagram : @mk__prog &nbsp;|&nbsp; MKProg.support@gmail.com<br>
© 2026 VoteMoi. Tous droits réservés.</p>
</td></tr>

</table>

</td></tr>
</table>
</body>
</html>
`;

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
          email: 'kerildarel@gmail.com',
        },
        to: [{ email }],
        subject: '🎟️ La billetterie VoteMoi arrive bientôt – Vous serez parmi les premiers !',
        htmlContent: EMAIL_HTML,
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
