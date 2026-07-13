import nodemailer from "nodemailer";

// I dev uten SMTP-server logges e-poster til konsollen i stedet for å feile.
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

export async function sendEpost(opts: {
  til: string;
  emne: string;
  tekst: string;
  html?: string;
}) {
  try {
    await transport.sendMail({
      from: process.env.EPOST_FRA || "Heimet <ikke-svar@heimet.no>",
      to: opts.til,
      subject: opts.emne,
      text: opts.tekst,
      html: opts.html,
    });
  } catch (feil) {
    if (process.env.NODE_ENV === "production") throw feil;
    console.log(
      `\n📧 [epost-fallback] Til: ${opts.til}\nEmne: ${opts.emne}\n${opts.tekst}\n`
    );
  }
}

export function epostRamme(tittel: string, innhold: string) {
  return `<!doctype html>
<html lang="nb">
  <body style="margin:0;padding:0;background:#f5efe3;font-family:Georgia,'Times New Roman',serif;color:#2b2620;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="text-align:center;padding-bottom:20px;font-size:26px;">🏔️ <strong>Heimet</strong></div>
      <div style="background:#fffdf8;border:1px solid #e3d9c6;border-radius:12px;padding:28px;">
        <h1 style="font-size:20px;margin:0 0 16px;">${tittel}</h1>
        ${innhold}
      </div>
      <p style="text-align:center;font-size:12px;color:#8a8171;padding-top:16px;">
        Heimet — et norsk fellesskap. Vi selger aldri dataene dine.
      </p>
    </div>
  </body>
</html>`;
}
