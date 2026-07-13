import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistisk omdirigering basert på sesjons-cookie.
// Reell tilgangskontroll skjer alltid på serversiden (krevBruker m.fl.).
export function proxy(request: NextRequest) {
  const harSesjon = !!getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const authSider = ["/logg-inn", "/registrer", "/glemt-passord", "/tilbakestill-passord"];
  const erAuthSide = authSider.some((s) => pathname === s || pathname.startsWith(s + "/"));

  if (harSesjon && erAuthSide && !pathname.startsWith("/logg-inn/to-faktor")) {
    return NextResponse.redirect(new URL("/tunet", request.url));
  }
  if (!harSesjon && !erAuthSide && pathname !== "/") {
    return NextResponse.redirect(new URL("/logg-inn", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|opplastinger).*)",
  ],
};
