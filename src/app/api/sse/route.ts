import { NextRequest } from "next/server";
import { hentBruker } from "@/lib/session";
import { abonner } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const meg = await hentBruker();
  if (!meg) return new Response(null, { status: 401 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Strømmen er lukket
        }
      };

      send({ type: "tilkoblet" });
      const avmeld = abonner(meg.id, send);

      // Hjerteslag holder tilkoblingen i live gjennom proxier
      const hjerteslag = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: hjerteslag\n\n`));
        } catch {
          clearInterval(hjerteslag);
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(hjerteslag);
        avmeld();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
