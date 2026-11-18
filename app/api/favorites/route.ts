import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/auth";
import { userIdFilter } from "@/lib/users";

const favoritesCollection = () => db.collection("favorites");

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const favorites = await favoritesCollection()
    .find({ renterId: session.user.id })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ favorites });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { equipmentId } = body as { equipmentId?: string };

  if (!equipmentId) {
    return NextResponse.json({ error: "equipmentId is required" }, { status: 400 });
  }

  const existing = await favoritesCollection().findOne({
    renterId: session.user.id,
    equipmentId,
  });

  if (existing) {
    return NextResponse.json({ error: "Already favorited" }, { status: 400 });
  }

  await favoritesCollection().insertOne({
    renterId: session.user.id,
    equipmentId,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const equipmentId = searchParams.get("equipmentId");

  if (!equipmentId) {
    return NextResponse.json({ error: "equipmentId is required" }, { status: 400 });
  }

  await favoritesCollection().deleteOne({
    renterId: session.user.id,
    equipmentId,
  });

  return NextResponse.json({ success: true });
}