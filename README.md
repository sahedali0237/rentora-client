This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Roles & Dashboards

Every account has a `roles` array and an `activeRole` (both managed by Better Auth `additionalFields`):

| Role  | Dashboard | Notes |
| ----- | --------- | ----- |
| `renter` | `/renter` | Default on sign-up. Find, book and pay for equipment. |
| `owner`  | `/owner`  | Added via "Become an Owner". List equipment, manage bookings, earnings. |
| `admin`  | `/admin`  | Separate role; cannot be self-assigned or switched to (see below). |

A single account can hold both `renter` and `owner` and switch modes from the avatar menu in the navbar (Fiverr-style). Authorization is enforced on the server: each dashboard layout calls `requireRole(...)` and the API routes validate the session, so hiding UI is cosmetic only.

### Creating an admin

There is no public endpoint that creates admins. Use the script from the project root (Node 22.6+ runs TypeScript natively):

```bash
node scripts/make-admin.ts admin@example.com
```

The script sets `roles: ["admin"]`, `activeRole: "admin"` for that user. It reads `MONGODB_URI` from the environment or from `.env.local` / `.env`. The user must have signed up at least once, and must sign out and back in after promotion.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
