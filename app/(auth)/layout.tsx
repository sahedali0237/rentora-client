import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-zinc-950">
      <div className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden border-r border-zinc-800">
        <div className="absolute inset-0 z-0">
          <Image
            src="/auth-bg.jpg"
            alt="Rentora showcase"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
          <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay" />
        </div>

        {/* Top: Logo */}
        <Link
          href="/"
          className="relative z-10 flex items-center gap-2 text-white font-medium text-xl"
        >
          <Image
            src="/faveicon.png"
            alt="Rentora Logo"
            width={40}
            height={40}
          />{" "}
          Rentora
        </Link>

        {/* Bottom: Info/Testimonial Card */}
        <div className="relative z-10 max-w-md p-6 rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-700/50 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">
            Unlock experiences, <br /> not ownership.
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            From high-end cameras to luxury vehicles and event decor. Join
            Rentora to access premium equipment for your day-to-day needs
            without the commitment of buying.
          </p>
        </div>
      </div>

      {/* Right Panel: The Form */}
      <div className="flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 relative z-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
