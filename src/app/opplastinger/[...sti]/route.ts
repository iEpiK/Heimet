import { NextRequest, NextResponse } from "next/server";
import { lesBilde } from "@/lib/lagring";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sti: string[] }> }
) {
  const { sti } = await params;
  if (sti.length !== 1) return new NextResponse(null, { status: 404 });
  const data = await lesBilde(sti[0]);
  if (!data) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
