export type PolicyBullet = {
  label?: string;
  detail: string;
};

export type PolicyBlock = {
  heading?: string;
  text?: string;
  bullets?: PolicyBullet[];
};

export type PrivacySection = {
  id: string;
  title: string;
  blocks: PolicyBlock[];
};

export type PrivacyPolicyData = {
  brandName: string;
  contactEmail: string;
  location: string;
  lastUpdatedISO: string;
  lastUpdatedLabel: string;
  sections: PrivacySection[];
};

export async function getPrivacyPolicy(): Promise<PrivacyPolicyData> {
  return {
    brandName: "Rentora",
    contactEmail: "hello@rentora.com",
    location: "Dhaka, Bangladesh",
    lastUpdatedISO: "2026-11-22",
    lastUpdatedLabel: "November 22, 2026",
    sections: [
      {
        id: "overview",
        title: "Overview",
        blocks: [
          {
            text: 'Rentora ("we", "us", or "our") operates an equipment rental marketplace that connects people who need equipment with owners who rent it out. This Privacy Policy explains what personal information we collect, how we use and share it, and the choices available to you. By accessing or using Rentora, you agree to the practices described in this policy.',
          },
        ],
      },
      {
        id: "information-we-collect",
        title: "Information we collect",
        blocks: [
          {
            text: "We collect information you provide directly, information generated through your use of the platform, and information from service providers acting on our behalf.",
          },
          {
            heading: "Account information",
            text: "When you create an account we collect your name, email address, password (stored as a hash), phone number, location, role (renter, owner, or admin), and optional profile details.",
          },
          {
            heading: "Listings",
            text: "Owners provide equipment details such as title, description, category, photos, rental price, and availability. This information is public on the marketplace so renters can discover and book it.",
          },
          {
            heading: "Bookings",
            text: "We collect booking details including rental dates, booking status, messages exchanged between renter and owner, and payment status.",
          },
          {
            heading: "Payments (Stripe)",
            text: "Payments are processed by Stripe. Rentora does not collect, process, or store full credit or debit card numbers. Card details are entered directly on Stripe's secure infrastructure; we only receive payment confirmation and limited details such as the last four digits and a transaction reference.",
          },
          {
            heading: "Technical information",
            text: 'We automatically collect your IP address, browser type, device information, pages visited, and interaction data through cookies and local storage (see "Cookies and local storage").',
          },
        ],
      },
      {
        id: "how-we-use-your-information",
        title: "How we use your information",
        blocks: [
          {
            text: "We use your information to:",
            bullets: [
              { detail: "Create and manage your account" },
              {
                detail:
                  "Process bookings, availability, and communication between renters and owners",
              },
              { detail: "Facilitate payments through Stripe" },
              {
                detail:
                  "Send service messages (booking confirmations, reminders, receipts)",
              },
              {
                detail:
                  "Improve the platform, troubleshoot issues, and prevent fraud or misuse",
              },
              { detail: "Comply with legal obligations and enforce our terms" },
            ],
          },
          {
            text: "We do not use your personal information for third-party advertising.",
          },
        ],
      },
      {
        id: "who-we-share-with",
        title: "Who we share information with",
        blocks: [
          {
            bullets: [
              {
                label: "Other users.",
                detail:
                  "When a booking is made, the renter and owner see each other's name and contact details needed to complete the rental. Listing details submitted by owners are public.",
              },
              {
                label: "Stripe.",
                detail:
                  "Payment information is shared with Stripe to process payments; see Stripe's Privacy Policy for details.",
              },
              {
                label: "Hosting and database providers.",
                detail:
                  "Our infrastructure providers process data on our behalf to operate the platform.",
              },
              {
                label: "Legal requests.",
                detail:
                  "We may disclose information when required by law, a court order, or to protect safety, rights, or property.",
              },
            ],
          },
          {
            text: "We do not sell your personal information.",
          },
        ],
      },
      {
        id: "cookies-and-local-storage",
        title: "Cookies and local storage",
        blocks: [
          {
            bullets: [
              {
                label: "Session cookie.",
                detail:
                  "A session cookie keeps you signed in as you navigate the site.",
              },
              {
                label: "Theme preference.",
                detail:
                  "Your light/dark theme choice is stored in localStorage so it persists across visits.",
              },
              {
                label: "No advertising cookies.",
                detail:
                  "We do not set advertising or cross-site tracking cookies.",
              },
            ],
          },
          {
            text: "You can manage or disable cookies in your browser settings. Disabling session cookies will prevent signing in.",
          },
        ],
      },
      {
        id: "data-retention",
        title: "How long we keep your data",
        blocks: [
          {
            bullets: [
              {
                label: "Account data.",
                detail:
                  "Retained while your account is active. If you delete your account, personal data is removed or anonymized, except records we must keep for legal or financial reasons.",
              },
              {
                label: "Booking and transaction records.",
                detail:
                  "Retained as needed to support rentals and comply with tax and financial obligations.",
              },
              {
                label: "Logs and technical data.",
                detail:
                  "Retained for a limited period for security and operations.",
              },
            ],
          },
          {
            text: 'You may request deletion of your data at any time (see "Your choices and rights").',
          },
        ],
      },
      {
        id: "security",
        title: "Security",
        blocks: [
          {
            text: "We protect your information with encryption in transit (TLS) and rely on our hosting providers' encryption at rest. Payment card data is handled entirely by Stripe, a PCI DSS-compliant service, and is never stored on Rentora's systems. Access to personal data is limited to authorized personnel who need it to operate the platform.",
          },
          {
            text: "No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.",
          },
        ],
      },
      {
        id: "your-choices-and-rights",
        title: "Your choices and rights",
        blocks: [
          {
            bullets: [
              {
                detail: "Access, correct, or delete your personal information.",
              },
              {
                detail: "Request a copy of your data in a portable format.",
              },
              {
                detail:
                  "Opt out of marketing emails (service messages continue to be sent).",
              },
              { detail: "Control cookies through your browser settings." },
            ],
          },
          {
            text: 'To exercise any of these rights, contact us using the details in "Contact us." We will respond within a reasonable timeframe.',
          },
        ],
      },
      {
        id: "children",
        title: "Children (18+)",
        blocks: [
          {
            text: "Rentora is not directed to individuals under 18, and we do not knowingly collect personal information from children under 18. If you are under 18, please do not create an account or use the platform. If we learn that we have collected personal information from someone under 18, we will delete it promptly.",
          },
        ],
      },
      {
        id: "changes-to-this-policy",
        title: "Changes to this policy",
        blocks: [
          {
            text: 'We may update this policy from time to time. The "Last updated" date at the top reflects the most recent revision. Changes are effective when posted, and your continued use of Rentora after changes are posted means you accept the updated policy.',
          },
        ],
      },
      {
        id: "contact-us",
        title: "Contact us",
        blocks: [
          {
            text: "Questions about this policy or your data? Contact us at:",
          },
        ],
      },
    ],
  };
}
