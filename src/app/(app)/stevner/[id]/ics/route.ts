import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hentBruker } from "@/lib/session";
import { kanSeStevne, lagICal } from "@/lib/stevner";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meg = await hentBruker();
  if (!meg) return new NextResponse(null, { status: 401 });

  const stevne = await prisma.stevne.findUnique({ where: { id } });
  if (!stevne || !(await kanSeStevne(stevne, meg.id))) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(lagICal(stevne), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="stevne-${stevne.id}.ics"`,
    },
  });
}
