"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient, usernameClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/logg-inn/to-faktor";
      },
    }),
    passkeyClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
