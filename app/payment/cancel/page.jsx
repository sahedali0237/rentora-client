"use client";

import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const BG = "#F5F6F2";
const INK = "#12201B";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: BG, color: INK }}
    >
      <div className="rounded-2xl border border-[#d9ddd4] bg-white p-10 text-center max-w-md">
        <div className="mx-auto mb-4 p-3 rounded-full bg-[#fdecea] text-[#b91c1c]">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold mb-2">Payment not completed</h2>
        <p className="text-gray-600 mb-6">
          Your payment wasn't completed. No charge was made to your card.
        </p>
        <Button
          onClick={() => router.back()}
          className="w-full bg-[#12201B] text-white hover:bg-[#12201B]/90"
        >
          Go back and retry
        </Button>
      </div>
    </div>
  );
}
