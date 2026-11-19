import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userIdFilter, usersCollection } from "@/lib/users";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const user = await usersCollection().findOne({
    _id: userIdFilter(session.user.id),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user._id?.toString() ?? session.user.id,
      name: user.name ?? session.user.name ?? "",
      email: user.email ?? session.user.email ?? "",
      image: user.image ?? null,
      phone: user.phone ?? "",
      address: user.address ?? "",
      activeRole: user.activeRole ?? session.user.activeRole,
    },
  });
}

export async function PATCH(request: Request) {
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

  const { name, phone, address, image } = body as {
    name?: string;
    phone?: string;
    address?: string;
    image?: string;
  };

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (phone !== undefined) update.phone = phone;
  if (address !== undefined) update.address = address;
  if (image !== undefined) update.image = image;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await usersCollection().updateOne(
    { _id: userIdFilter(session.user.id) },
    { $set: update },
  );

  return NextResponse.json({ success: true });
}
