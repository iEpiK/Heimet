"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { authClient } from "@/lib/auth-client";
import { authFeil } from "@/lib/auth-feil";
import { Kort } from "@/components/ui/Kort";
import { Knapp } from "@/components/ui/Knapp";
import { Inputfelt } from "@/components/ui/Felt";

function ByttPassord() {
  const [gammelt, setGammelt] = useState("");
  const [nytt, setNytt] = useState("");
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null);
  const [venter, setVenter] = useState(false);

  async function bytt(e: React.FormEvent) {
    e.preventDefault();
    setMelding(null);
    setVenter(true);
    const { error } = await authClient.changePassword({
      currentPassword: gammelt,
      newPassword: nytt,
      revokeOtherSessions: true,
    });
    setVenter(false);
    if (error) return setMelding({ ok: false, tekst: authFeil(error) });
    setMelding({ ok: true, tekst: "Passordet er byttet. Andre enheter er logget ut." });
    setGammelt("");
    setNytt("");
  }

  return (
    <Kort className="p-6">
      <h2 className="text-lg font-semibold">Bytt passord</h2>
      <form onSubmit={bytt} className="mt-4 space-y-4">
        <Inputfelt
          etikett="Nåværende passord"
          type="password"
          value={gammelt}
          onChange={(e) => setGammelt(e.target.value)}
          required
          autoComplete="current-password"
        />
        <Inputfelt
          etikett="Nytt passord (minst 10 tegn)"
          type="password"
          value={nytt}
          onChange={(e) => setNytt(e.target.value)}
          required
          minLength={10}
          autoComplete="new-password"
        />
        {melding && (
          <p className={`text-sm ${melding.ok ? "text-positiv" : "text-negativ"}`}>{melding.tekst}</p>
        )}
        <Knapp type="submit" disabled={venter}>
          {venter ? "Bytter…" : "Bytt passord"}
        </Knapp>
      </form>
    </Kort>
  );
}

function ToFaktor({ aktiv }: { aktiv: boolean }) {
  const router = useRouter();
  const [passord, setPassord] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [reservekoder, setReservekoder] = useState<string[] | null>(null);
  const [kode, setKode] = useState("");
  const [feil, setFeil] = useState<string | null>(null);
  const [venter, setVenter] = useState(false);

  useEffect(() => {
    if (totpUri) QRCode.toDataURL(totpUri, { margin: 1, width: 220 }).then(setQr);
  }, [totpUri]);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setFeil(null);
    setVenter(true);
    const { data, error } = await authClient.twoFactor.enable({ password: passord });
    setVenter(false);
    if (error) return setFeil(authFeil(error));
    setTotpUri(data.totpURI);
    setReservekoder(data.backupCodes);
  }

  async function bekreft(e: React.FormEvent) {
    e.preventDefault();
    setFeil(null);
    setVenter(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code: kode.trim() });
    setVenter(false);
    if (error) return setFeil(authFeil(error));
    setTotpUri(null);
    router.refresh();
  }

  async function skruAv(e: React.FormEvent) {
    e.preventDefault();
    setFeil(null);
    setVenter(true);
    const { error } = await authClient.twoFactor.disable({ password: passord });
    setVenter(false);
    if (error) return setFeil(authFeil(error));
    setPassord("");
    router.refresh();
  }

  return (
    <Kort className="p-6">
      <h2 className="text-lg font-semibold">
        Tofaktor-autentisering {aktiv && <span className="text-sm text-positiv">— aktiv ✓</span>}
      </h2>
      <p className="mt-1 text-sm text-dus">
        Et ekstra lag sikkerhet: kode fra en autentiserings-app i tillegg til passordet.
      </p>

      {!aktiv && !totpUri && (
        <form onSubmit={start} className="mt-4 space-y-4">
          <Inputfelt
            etikett="Bekreft med passordet ditt"
            type="password"
            value={passord}
            onChange={(e) => setPassord(e.target.value)}
            required
            autoComplete="current-password"
          />
          {feil && <p className="text-sm text-negativ">{feil}</p>}
          <Knapp type="submit" disabled={venter}>
            {venter ? "Klargjør…" : "Slå på 2FA"}
          </Knapp>
        </form>
      )}

      {totpUri && (
        <div className="mt-4 space-y-4">
          <p className="text-sm">1. Skann QR-koden med appen din (f.eks. Aegis, 1Password, Google Authenticator):</p>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR-kode for 2FA" className="rounded-lg border border-kant bg-white p-2" />
          )}
          {reservekoder && (
            <div className="rounded-lg border border-kant bg-flate-dyp p-4">
              <p className="text-sm font-medium">2. Lagre reservekodene et trygt sted:</p>
              <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">
                {reservekoder.map((k) => (
                  <span key={k}>{k}</span>
                ))}
              </div>
            </div>
          )}
          <form onSubmit={bekreft} className="space-y-4">
            <Inputfelt
              etikett="3. Skriv inn koden fra appen for å bekrefte"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              required
              inputMode="numeric"
              placeholder="123456"
            />
            {feil && <p className="text-sm text-negativ">{feil}</p>}
            <Knapp type="submit" disabled={venter}>
              {venter ? "Bekrefter…" : "Bekreft og aktiver"}
            </Knapp>
          </form>
        </div>
      )}

      {aktiv && (
        <form onSubmit={skruAv} className="mt-4 space-y-4">
          <Inputfelt
            etikett="Bekreft med passordet ditt for å skru av"
            type="password"
            value={passord}
            onChange={(e) => setPassord(e.target.value)}
            required
            autoComplete="current-password"
          />
          {feil && <p className="text-sm text-negativ">{feil}</p>}
          <Knapp variant="farlig" type="submit" disabled={venter}>
            {venter ? "Skrur av…" : "Skru av 2FA"}
          </Knapp>
        </form>
      )}
    </Kort>
  );
}

function Passnokler() {
  const [nokler, setNokler] = useState<{ id: string; name?: string | null; createdAt?: Date }[]>([]);
  const [feil, setFeil] = useState<string | null>(null);
  const [venter, setVenter] = useState(false);

  async function hent() {
    const { data } = await authClient.passkey.listUserPasskeys();
    setNokler(data ?? []);
  }

  useEffect(() => {
    hent();
  }, []);

  async function leggTil() {
    setFeil(null);
    setVenter(true);
    const res = await authClient.passkey.addPasskey({ name: "Min enhet" });
    setVenter(false);
    if (res?.error) return setFeil(authFeil(res.error));
    hent();
  }

  async function slett(id: string) {
    await authClient.passkey.deletePasskey({ id });
    hent();
  }

  return (
    <Kort className="p-6">
      <h2 className="text-lg font-semibold">Passnøkler</h2>
      <p className="mt-1 text-sm text-dus">
        Logg inn uten passord — med fingeravtrykk, ansikt eller sikkerhetsnøkkel.
      </p>
      {nokler.length > 0 && (
        <ul className="mt-4 space-y-2">
          {nokler.map((n) => (
            <li key={n.id} className="flex items-center justify-between rounded-lg border border-kant px-3 py-2 text-sm">
              <span>🔑 {n.name || "Passnøkkel"}</span>
              <button
                onClick={() => slett(n.id)}
                className="text-xs text-negativ hover:underline cursor-pointer"
              >
                Fjern
              </button>
            </li>
          ))}
        </ul>
      )}
      {feil && <p className="mt-3 text-sm text-negativ">{feil}</p>}
      <Knapp variant="sekundar" onClick={leggTil} disabled={venter} className="mt-4">
        {venter ? "Følg instruksene…" : "➕ Legg til passnøkkel"}
      </Knapp>
    </Kort>
  );
}

export function SikkerhetPanel({ toFaktorAktiv }: { toFaktorAktiv: boolean }) {
  return (
    <div className="space-y-4">
      <ByttPassord />
      <ToFaktor aktiv={toFaktorAktiv} />
      <Passnokler />
    </div>
  );
}
