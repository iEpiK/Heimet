import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { twoFactor, username } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { prisma } from "./prisma";
import { sendEpost, epostRamme } from "./epost";

// Fungerer også uten BETTER_AUTH_URL (f.eks. Vercel-preview): utled fra VERCEL_URL
const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const auth = betterAuth({
  appName: "Heimet",
  baseURL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
    sendResetPassword: async ({ user, url }) => {
      await sendEpost({
        til: user.email,
        emne: "Tilbakestill passordet ditt på Heimet",
        tekst: `Hei ${user.name}!\n\nNoen (forhåpentligvis du) ba om å tilbakestille passordet ditt.\nÅpne lenken for å velge nytt passord:\n${url}\n\nHvis dette ikke var deg, kan du trygt ignorere denne e-posten.`,
        html: epostRamme(
          "Tilbakestill passordet ditt",
          `<p>Hei ${user.name}!</p>
           <p>Noen (forhåpentligvis du) ba om å tilbakestille passordet ditt på Heimet.</p>
           <p style="text-align:center;margin:24px 0;"><a href="${url}" style="background:#1f3d2b;color:#fffdf8;padding:12px 24px;border-radius:8px;text-decoration:none;">Velg nytt passord</a></p>
           <p style="font-size:13px;color:#8a8171;">Hvis dette ikke var deg, kan du trygt ignorere denne e-posten.</p>`
        ),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEpost({
        til: user.email,
        emne: "Velkommen til Heimet — bekreft e-posten din",
        tekst: `Hei ${user.name}!\n\nVelkommen heim! Bekreft e-postadressen din ved å åpne lenken:\n${url}`,
        html: epostRamme(
          "Velkommen heim! 🏔️",
          `<p>Hei ${user.name}!</p>
           <p>Så hyggelig at du vil være med i Heimet. Bekreft e-postadressen din, så er du i gang:</p>
           <p style="text-align:center;margin:24px 0;"><a href="${url}" style="background:#1f3d2b;color:#fffdf8;padding:12px 24px;border-radius:8px;text-decoration:none;">Bekreft e-post</a></p>`
        ),
      });
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/forget-password": { window: 300, max: 3 },
    },
  },

  session: {
    cookieCache: { enabled: true, maxAge: 60 },
  },

  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
    }),
    twoFactor({ issuer: "Heimet" }),
    passkey({
      rpID: new URL(baseURL).hostname,
      rpName: "Heimet",
    }),
    nextCookies(), // må være siste plugin
  ],
});

export type Session = typeof auth.$Infer.Session;
