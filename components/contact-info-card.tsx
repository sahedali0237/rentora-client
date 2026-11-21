import { Mail, Phone, MapPin, Clock } from "lucide-react";

const CONTACT_INFO = {
  email: "hello@rentora.com",
  phone: "+880 1234-567890",
  location: "Dhaka, Bangladesh",
  supportHours: "Monday – Friday, 9:00 AM – 6:00 PM",
};

const items = [
  {
    icon: Mail,
    label: "Email",
    value: CONTACT_INFO.email,
    href: `mailto:${CONTACT_INFO.email}`,
    sub: "We reply within 1–2 business days",
  },
  {
    icon: Phone,
    label: "Phone",
    value: CONTACT_INFO.phone,
    href: `tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`,
    sub: "Call during support hours",
  },
  {
    icon: MapPin,
    label: "Location",
    value: CONTACT_INFO.location,
    sub: "We serve customers nationwide",
  },
  {
    icon: Clock,
    label: "Support Hours",
    value: "Monday – Friday",
    sub: "9:00 AM – 6:00 PM (BST)",
  },
];

export function ContactInfoCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#1a4a40] dark:bg-[#10352c] sm:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Contact Information
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Reach us directly through any of these channels.
        </p>
      </div>

      <ul className="space-y-5" aria-label="Contact details">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-4">
            {/* Icon badge */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {item.label}
              </p>
              {"href" in item && item.href ? (
                <a
                  href={item.href}
                  className="mt-0.5 block text-[15px] font-medium text-gray-900 transition-colors hover:text-amber-600 dark:text-white dark:hover:text-amber-400"
                >
                  {item.value}
                </a>
              ) : (
                <p className="mt-0.5 text-[15px] font-medium text-gray-900 dark:text-white">
                  {item.value}
                </p>
              )}
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {item.sub}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
