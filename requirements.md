# Equipment Rental Platform: Requirements

**Source:** Assignment 9, Category 003 (second-round project)
**Requirement video:** B14-A9-C003.mp4 (https://drive.google.com/file/d/1XezoIxj3lUOYInq6P-UYDu1HYD2U4cOO/view?usp=drive_link)

---

## 1. Project Overview

The **Equipment Rental Platform** is a marketplace where equipment owners list equipment for rent and customers browse, book, and pay to rent it for a specific period. It includes equipment management, rental booking, secure online payments (Stripe), and administrative management.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), Hero UI / DaisyUI / shadcn UI, TypeScript or JavaScript |
| Auth | BetterAuth, MongoDB Adapter, JWT with role-based authentication |
| Backend | Express.js, MongoDB, TypeScript (optional) or JavaScript |
| Payment | Stripe |
| Animation | Framer Motion |
| Image upload | imgbb |

---

## 3. Mandatory Submission Rules (for 100% marks)

- [ ] At least **20 meaningful commits on the client** and **12 on the server**, with descriptive messages
- [ ] README with project name, purpose, live URL, key features, and npm packages used
- [ ] Frontend config keys secured via **environment variables**
- [ ] MongoDB credentials secured via **environment variables**
- [ ] Recruiter-friendly design: good color contrast, proper alignment and spacing, no clumsy ("gobindo") look
- [ ] Project must **not** resemble any module, conceptual-session, or earlier assignment project (otherwise 0 marks and possible loss of future rewards)

### Deployment Guidelines (failure = 0 marks)

- [ ] Server works in production with **no CORS / 404 / 504 errors**
- [ ] Live link loads without errors on the landing page
- [ ] No errors when **reloading from any route**
- [ ] A logged-in user is **not redirected to Login** when reloading a private route

### What to Submit

- Admin email
- Admin password
- Live site link
- GitHub repository (server)
- GitHub repository (client)

---

## 4. Layout & Page Structure

Main section updates dynamically with route changes:

1. Header
2. Dynamic content
3. Footer

---

## 5. Authentication & Authorization

### 5.1 Registration

Fields: **Name, Email, Photo** (direct image link or imgbb upload), **Password**, plus a link to the Login page.

Password validation:
- At least one uppercase letter
- At least one lowercase letter
- Minimum length of 6 characters
- Show an error message or toast if any rule fails

Show a toast or SweetAlert after successful login or registration.

### 5.2 Login

- JWT-based authentication; generate an access token on successful login to manage sessions
- Google social login
- Google registrations receive the **Customer** role by default
- Link to the Register page

### 5.3 Role-Based Access Control (RBAC)

Roles: **Customer, Owner, Admin**

- Middleware to check roles and permissions
- Protect private routes and API endpoints by role
- Users can only access their own dashboard features

> **Do not** implement email verification or forgot-password. They may be added after the result.

---

## 6. Public and Private Pages

### 6.1 Home Page (Public)

**Navbar:** Logo, website name, Home, All Equipment, About Us (optional), Contact Us (optional), How It Works (optional), Login, Register, Dashboard (if logged in), Logout (if logged in)

**Sections:**

| Section | Requirement |
|---|---|
| Banner | High-quality image, attractive title, short description of the platform |
| Featured Equipment | 6 approved items using MongoDB `limit`; card layout. "View Details" goes to Login if logged out, otherwise to Equipment Details |
| Categories | Construction, Photography, Vehicles & Transportation, Agriculture, Electronics, Event Equipment |
| Why Choose Us | Platform benefits (affordable prices, verified owners, flexible rental periods, secure payments) |
| Customer Reviews | At least 4 reviews, with name, rating, and comment |
| Extra Sections | At least 2 more (e.g. Popular Equipment, Recently Added, How It Works, Trusted Owners) |

**Framer Motion animations:** required in Banner, Featured Equipment, and Categories; optional in Reviews and Extra Sections.

### 6.2 Equipment Details (Private)

**Information shown:** name, description, category, rental price, rental type (Daily / Weekly / Monthly), location, available quantity, image, owner information, rental terms and conditions.

**Add to Favorites**
- Customers can add and remove favorites
- Saved in the database
- Shown in the Customer Dashboard

**Book Equipment:** "Book Now" opens a modal with:
- Rental start date, rental end date, required quantity
- Contact number, delivery address, additional notes

After confirmation:
- Calculate the total amount from duration and quantity
- Check availability
- Redirect to the payment page

**Payment (Stripe)**
- Customer is redirected to **Stripe Checkout**
- After successful payment: create the booking record, save transaction details, update the booking's payment status, record the transaction in the `payments` collection
- Redirect to the payment success page

### 6.3 All Equipment (Public)

- Show all **approved** equipment in a **3-column grid**
- Card contents: image, name, category, rental price, rental type, location, availability status, View Details button

| Feature | Options |
|---|---|
| Search | Equipment name, location |
| Filters | Category, rental type, price range, availability |
| Sorting | Price low to high, price high to low, recently added |

**Filtering and sorting must be done on the backend.**

---

## 7. Dashboards (Private)

### 7.1 Customer Dashboard

Routes: **My Rentals, Favorites, Profile**

**My Rentals** (table): equipment name, start date, end date, booking date, total amount, payment status, booking status

**Favorites** (table): actions are View Details and Remove Favorite

**Profile** (all roles): name, email, profile image, phone number, address; users can update their information

### 7.2 Owner Dashboard

Routes: **Add Equipment, My Equipment, My Equipment Rental, My Profile**

**Add Equipment** fields: name, description, category (dropdown), location, rental price, rental type (Daily / Weekly / Monthly), available quantity, condition, brand, model, image (imgbb upload), rental terms and conditions, status (Pending), owner information

**My Equipment** (table): name, category, rental price, available quantity, status (default Pending); actions are Update, Delete, View Details

**My Equipment Rental** (table): customer info, equipment info, rental duration, required quantity, booking amount, payment status, booking status

### 7.3 Admin Dashboard

Routes: **All Users, All Equipment, All Rentals, My Profile**

**All Users** (table): name, email, role, registration date; actions are Change Role (Customer / Owner / Admin) and Manage Users. Backend implementation is required.

**All Equipment** (table): statuses are Pending, Approved, Rejected; actions are Approve, Reject, Update, Delete

**All Rentals** (table): customer info, owner info, equipment name, rental duration, booking amount, payment status, booking status. Admin can monitor and manage all rental activity.

---

## 8. Additional Requirements

- Loading page
- Error page (e.g. 404)
- Other requirements as needed

---

## 9. UI / UX Requirements

### Website

1. Unique design, not similar to any past, module, or conceptual-session project (use ThemeForest etc. for inspiration)
2. Consistent main heading style (font, size, color) across sections
3. Balanced paragraph spacing and readable text
4. Uniform image sizes and spacing
5. Same button style as on the home page
6. Good spacing and proper alignment
7. Navbar heading/logo same style and size as on the home page
8. Grid layouts with equal image sizes
9. All cards equal height and width
10. Use the new **X logo** (not the old Twitter bird)
11. Fully responsive: mobile, tablet, desktop

### Dashboard

- Responsive for mobile and tablet
- Consistent color theme
- Full-width dashboard
- **Charts and graphs** for quick data visualization
- User profile section

### Resources

- https://uiverse.io/
- https://devmeetsdevs.com/
- https://bootcamp.uxdesign.cc/free-images-and-resources-collection-for-website-c77f2fc46ce5
- https://themeforest.net/
- https://codecanyon.net/

---

## 10. Challenges

### Challenge 1: Server-side search and filter (All Equipment)
- Dynamic server-side search by **title or category**
- Filter by **category and availability**

### Challenge 2: JWT verification and role-based middlewares
Secure backend routes with custom Express middlewares:
- `verifyToken`
- `verifyRenter`
- `verifyOwner`
- `verifyAdmin`

Each role may only access the routes and actions permitted for it.

### Challenge 3: Admin and Owner dashboard analytics

**Admin** (from users, equipment, bookings, payments): total users, total equipment, total bookings, pending approvals, completed rentals, total revenue, monthly booking statistics

**Owner** (from own equipment, bookings, payments): total listed equipment, completed rentals, total earnings, monthly earnings

---

## 11. Optional Requirements

1. **Pagination** on All Equipment and Booking History pages
2. **Theme toggle** (dark / light), with the preference saved in Local Storage
3. **Cron job** (`node-cron`) to automatically update booking status after the rental end date passes
4. **Email notifications** to Renters and Owners when a booking is completed

---

## 12. Notes and Ambiguities to Confirm

- The brief uses **"Customer"** and **"Renter"** interchangeably (the role list says Customer; the middleware says `verifyRenter`). Treat them as the same role and keep the naming consistent in the code.
- The brief lists both **BetterAuth** and **JWT**, so decide how the two fit together (BetterAuth session on the client, JWT access token verified by the Express server).
- The brief says the Home page shows only **approved** equipment, so make sure the backend enforces that.
- The requirement video may contain details not in the document. Check it before finalizing.
