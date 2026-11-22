import { LegalDoc } from "@/lib/legal-types";

export async function getTerms(): Promise<LegalDoc> {
  return {
    brandName: "Rentora",
    contactEmail: "hello@rentora.com",
    lastUpdatedLabel: "November 22, 2026",
    sections: [
      {
        id: "introduction",
        title: "Introduction",
        blocks: [
          {
            text: 'Welcome to Rentora. These Terms of Service ("Terms") govern your use of the Rentora platform and related services (the "Service"). By accessing or using Rentora, you agree to these Terms. If you do not agree, you may not use the Service.',
          },
        ],
      },
      {
        id: "acceptance",
        title: "Acceptance of Terms",
        blocks: [
          {
            text: "By creating an account or using the Service, you agree to be bound by these Terms, our Privacy Policy, and any additional terms that apply to specific features.",
          },
          {
            text: "You must be at least 18 years old to use Rentora. If you are accepting these Terms on behalf of an organization, you represent that you have authority to bind it.",
          },
        ],
      },
      {
        id: "eligibility-and-accounts",
        title: "Eligibility & Accounts",
        blocks: [
          {
            text: "To list equipment or make bookings you must register an account with accurate and complete information.",
          },
          {
            heading: "Account responsibilities",
            bullets: [
              {
                detail:
                  "You are responsible for maintaining the confidentiality of your password and for all activity under your account.",
              },
              {
                detail:
                  "Notify us immediately of any unauthorized use of your account.",
              },
              {
                detail:
                  "You may not create multiple accounts to evade restrictions or gain unfair advantage.",
              },
            ],
          },
          {
            text: "We may suspend or deactivate accounts that violate these Terms.",
          },
        ],
      },
      {
        id: "use-of-service",
        title: "Use of Service",
        blocks: [
          {
            text: "You may use the Service only for lawful purposes. You agree not to:",
          },
          {
            bullets: [
              {
                detail:
                  "Post inaccurate, misleading, or fraudulent listings or content.",
              },
              {
                detail:
                  "Interfere with, disrupt, or attempt to gain unauthorized access to the Service.",
              },
              {
                detail:
                  "Use the Service to harass, defame, or discriminate against any person.",
              },
              {
                detail:
                  "Violate any applicable law, regulation, or third-party right.",
              },
            ],
          },
          {
            text: "Rentora may remove content or suspend access in response to violations.",
          },
        ],
      },
      {
        id: "listings-and-bookings",
        title: "Listings & Bookings",
        blocks: [
          {
            text: "Owners are solely responsible for the accuracy, condition, and availability of their listings. Listing details are public on the marketplace.",
          },
          {
            heading: "Bookings",
            bullets: [
              {
                detail:
                  "A booking confirmation constitutes a rental agreement between the renter and the owner.",
              },
              {
                detail:
                  "Renters must return equipment in the condition received, normal wear excepted.",
              },
              {
                detail:
                  "Owners may set their own rental prices, security deposits, and availability.",
              },
            ],
          },
          {
            text: "Rentora facilitates bookings but is not a party to the rental agreement between users.",
          },
        ],
      },
      {
        id: "payments-and-fees",
        title: "Payments & Fees",
        blocks: [
          {
            text: "Payments are processed through Stripe. Rentora does not collect or store full credit or debit card numbers.",
          },
          {
            bullets: [
              {
                label: "Service fee.",
                detail: "Rentora may charge a service fee on each completed booking, disclosed before payment.",
              },
              {
                label: "Payouts.",
                detail: "Owners receive payouts after the rental period ends, subject to Stripe's settlement schedule.",
              },
              {
                label: "Refunds.",
                detail: "Refunds follow the cancellation policy shown on the listing at the time of booking.",
              },
            ],
          },
          {
            text: "You are responsible for any applicable taxes on your earnings or rentals.",
          },
        ],
      },
      {
        id: "user-content",
        title: "User Content",
        blocks: [
          {
            text: "You retain ownership of content you post on Rentora. By posting content, you grant Rentora a non-exclusive license to host, display, and distribute it as necessary to operate the Service.",
          },
          {
            text: "You may not post content that is unlawful, infringing, or that you do not have the right to share.",
          },
        ],
      },
      {
        id: "intellectual-property",
        title: "Intellectual Property",
        blocks: [
          {
            text: "The Rentora platform, software, trademarks, and similar materials are owned by Rentora or its licensors and are protected by copyright and trademark law.",
          },
          {
            text: "You may not copy, modify, or distribute any part of the Service without our express written permission.",
          },
        ],
      },
      {
        id: "third-party-services",
        title: "Third-Party Services",
        blocks: [
          {
            text: "The Service may include links to or integrate with third-party services such as Stripe and mapping providers. Your use of those services is subject to their own terms.",
          },
          {
            text: "Rentora is not responsible for third-party services or any loss or damage arising from your use of them.",
          },
        ],
      },
      {
        id: "termination",
        title: "Termination",
        blocks: [
          {
            text: "We may suspend or terminate your account and access to the Service at any time, without notice, for conduct we believe violates these Terms or is harmful to other users.",
          },
          {
            text: "Upon termination, your right to use the Service ends immediately. Sections that by their nature should survive will survive termination.",
          },
        ],
      },
      {
        id: "disclaimers",
        title: "Disclaimers",
        blocks: [
          {
            text: "The Service is provided on an \"as is\" and \"as available\" basis. Rentora does not warrant that the Service will be uninterrupted, error-free, or free of harmful components.",
          },
          {
            text: "To the fullest extent permitted by law, we disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.",
          },
        ],
      },
      {
        id: "limitation-of-liability",
        title: "Limitation of Liability",
        blocks: [
          {
            text: "To the fullest extent permitted by law, Rentora and its affiliates are not liable for indirect, incidental, consequential, or punitive damages, or for loss of profits, data, or goodwill.",
          },
          {
            text: "Our aggregate liability arising out of or relating to these Terms will not exceed the amount you paid Rentora in the six months preceding the claim.",
          },
        ],
      },
      {
        id: "indemnification",
        title: "Indemnification",
        blocks: [
          {
            text: "You agree to indemnify and hold Rentora and its officers, employees, and agents harmless from claims, losses, or expenses (including reasonable attorneys' fees) arising from your breach of these Terms or your violation of law or third-party rights.",
          },
        ],
      },
      {
        id: "governing-law",
        title: "Governing Law",
        blocks: [
          {
            text: "These Terms are governed by the laws of Bangladesh, without regard to conflict-of-law principles. Disputes will be resolved in the courts located in Dhaka, Bangladesh.",
          },
        ],
      },
      {
        id: "changes",
        title: "Changes to These Terms",
        blocks: [
          {
            text: "We may revise these Terms from time to time. The \"Last updated\" date at the top reflects the most recent revision. Your continued use of Rentora after changes are posted means you accept the updated Terms.",
          },
        ],
      },
    ],
  };
}
