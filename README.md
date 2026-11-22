# Rentora

**Rent the gear. Skip the ownership.**

Rentora is an equipment rental marketplace where owners list their equipment and customers browse, book, and pay to rent it for a specific period. It covers equipment management, rental booking, secure online payments with Stripe, and full administrative control.

**Live site:** https://rentora-client-seven.vercel.app

| Repository        | Link                                           |
| ----------------- | ---------------------------------------------- |
| Client (frontend) | https://github.com/sahedali0237/rentora-client |
| Server (backend)  | https://github.com/sahedali0237/rentora-server |

---

## Purpose

Expensive equipment such as cameras, construction tools, vehicles, and farm machinery is often needed only for a short time. Rentora connects people who own such equipment with people who need it, with verified owners, flexible rental periods (daily, weekly, monthly), and secure payments.

---

## Key Features

### Public

- Responsive landing page with Banner, Featured Equipment, Categories, Why Choose Us, Customer Reviews, and extra sections, animated with Framer Motion
- All Equipment page showing approved equipment in a 3-column grid
- Backend search (name, location), filters (category, rental type, price range, availability), and sorting (price low to high, high to low, recently added)
- Custom loading page and 404 error page

### Authentication and Authorization

- Registration with name, email, photo (link or imgbb upload), and password validation (uppercase, lowercase, minimum 6 characters)
- Email/password login and Google social login (Google users get the Customer role by default)
- JWT-based sessions with role-based access control: **Customer**, **Owner**, **Admin**
- Protected routes and API endpoints with custom middlewares (`verifyToken`, `verifyRenter`, `verifyOwner`, `verifyAdmin`)

### Customer

- Equipment details page with owner information and rental terms
- Add and remove favorites (stored in the database)
- Book Now modal: start date, end date, quantity, contact number, delivery address, notes
- Automatic total calculation from duration and quantity, plus availability check
- Stripe Checkout payment, with payment success and cancel pages
- Dashboard: My Rentals, Favorites, Profile

### Owner

- Add Equipment with imgbb image upload (new listings start as Pending)
- My Equipment table with Update, Delete, and View Details
- My Equipment Rental table to track bookings on owned equipment
- Dashboard analytics: total listed equipment, completed rentals, total earnings, monthly earnings

### Admin

- All Users: change roles (Customer / Owner / Admin) and manage users
- All Equipment: Approve, Reject, Update, Delete
- All Rentals: monitor all rental activity
- Dashboard analytics: total users, total equipment, total bookings, pending approvals, completed rentals, total revenue, monthly booking statistics

### Booking and Payment Rules

- Booking is created as `pending` with payment status `unpaid`
- Renters see a **Pay** button while a booking is unpaid
- Owners can cancel a booking only while it is unpaid
- A successful Stripe payment automatically sets the booking to `confirmed`, records the transaction in the `payments` collection, and updates the payment status

---

## Tech Stack

| Layer          | Technology                                            |
| -------------- | ----------------------------------------------------- |
| Frontend       | Next.js (App Router), React, Tailwind CSS, shadcn/ui  |
| Authentication | Better Auth (MongoDB adapter), JWT, role-based access |
| Backend        | Node.js, Express.js                                   |
| Database       | MongoDB (native driver)                               |
| Payments       | Stripe Checkout                                       |
| Animation      | Framer Motion                                         |
| Image upload   | imgbb                                                 |

---

## npm Packages Used

> Please double-check this list against the `package.json` files in each repository and adjust before submitting.

### Client

- `next`, `react`, `react-dom`
- `better-auth`
- `framer-motion`
- `tailwindcss`
- `shadcn/ui` (Radix UI primitives), `lucide-react`
- `@stripe/stripe-js`
- `recharts` (dashboard charts)
- `react-hot-toast` or `sweetalert2` (notifications)

### Server

- `express`
- `mongodb`
- `cors`
- `dotenv`
- `jsonwebtoken`
- `stripe`

---

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A MongoDB database (Atlas or local)
- A Stripe account (test keys are fine)
- An imgbb API key
- Google OAuth credentials (for social login)

### 1. Clone the repositories

```bash
git clone https://github.com/sahedali0237/rentora-client.git
git clone https://github.com/sahedali0237/rentora-server.git
```

### 2. Run the server

```bash
cd rentora-server
npm install
npm run dev
```

Create a `.env` file in `rentora-server`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:3000
```

### 3. Run the client

```bash
cd rentora-client
npm install
npm run dev
```

Create a `.env.local` file in `rentora-client`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_IMGBB_KEY=your_imgbb_api_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

The client runs at `http://localhost:3000` and the server at `http://localhost:5000`.

> All secrets and database credentials are kept in environment variables and are never committed to the repositories.

---

## Roles and Access

| Role     | Access                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------- |
| Customer | Browse, favorite, book, and pay for equipment; My Rentals, Favorites, Profile                  |
| Owner    | Everything a Customer can do, plus Add Equipment, My Equipment, My Equipment Rental, analytics |
| Admin    | All Users, All Equipment, All Rentals, platform-wide analytics                                 |

---

## Admin Access (for reviewers)

|          |                       |
| -------- | --------------------- |
| Email    | `your-admin-email`    |
| Password | `your-admin-password` |

---

## Deployment Notes

- Client deployed on Vercel, server deployed separately
- CORS is configured to allow the client origin
- Private routes keep the user logged in on reload
- Reloading from any route works without errors

---

## Author

**Sahed Ali**, web developer, Satkhira, Bangladesh
GitHub: [sahedali0237](https://github.com/sahedali0237)
