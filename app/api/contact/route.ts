import { NextResponse } from "next/server";
import { db } from "@/lib/auth";

const contactMessagesCollection = () => db.collection("contactMessages");

/**
 * POST /api/contact
 * Public endpoint — any visitor can submit a contact message.
 * No authentication required.
 *
 * Body:
 *   {
 *     firstName: string,
 *     lastName: string,
 *     email: string,
 *     phone?: string,
 *     subject: string,
 *     message: string
 *   }
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  // Validate required fields
  const firstName =
    typeof data.firstName === "string" ? data.firstName.trim() : "";
  const lastName =
    typeof data.lastName === "string" ? data.lastName.trim() : "";
  const email =
    typeof data.email === "string" ? data.email.trim() : "";
  const phone =
    typeof data.phone === "string" ? data.phone.trim() : "";
  const subject =
    typeof data.subject === "string" ? data.subject.trim() : "";
  const message =
    typeof data.message === "string" ? data.message.trim() : "";

  if (!firstName || !lastName || !email || !subject || !message) {
    return NextResponse.json(
      { error: "firstName, lastName, email, subject, and message are required" },
      { status: 400 },
    );
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "A valid email address is required" },
      { status: 400 },
    );
  }

  // Sanitize message length
  if (message.length > 2000) {
    return NextResponse.json(
      { error: "Message must not exceed 2000 characters" },
      { status: 400 },
    );
  }

  const doc = {
    firstName,
    lastName,
    email,
    phone: phone || undefined,
    subject,
    message,
    createdAt: new Date(),
  };

  try {
    const result = await contactMessagesCollection().insertOne(doc);
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error("POST /api/contact failed:", err);
    return NextResponse.json(
      { error: "Failed to save your message. Please try again." },
      { status: 500 },
    );
  }
}
