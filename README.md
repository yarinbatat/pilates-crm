# Lisa Pilates - Studio Management CRM 🧘‍♂️

A full-stack, production-ready CRM system built for a Boutique Pilates Studio. This project demonstrates a modern web architecture with a focus on business logic, localization (RTL), and automated infrastructure.

## 🚀 Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Hosted on Supabase)
- **ORM:** Prisma v7
- **Authentication:** Supabase Auth (Server-side & Middleware)
- **UI & Styling:** Tailwind CSS, shadcn/ui, Lucide Icons
- **Localization:** Full Hebrew (RTL) support with Jerusalem Timezone logic

## ✨ Key Features

### For Customers
- **Personal Dashboard:** View active memberships, remaining credits, and upcoming classes.
- **Class Booking:** Real-time booking system with credit validation.
- **Membership Management:** Supports both "Punch Cards" (Credits) and "Weekly Limited" plans.
- **Cancelation Logic:** Easy one-click cancelation with automatic credit refund.

### For Admins (Studio Manager)
- **Dashboard Analytics:** Real-time stats on active users, today's classes, and weekly bookings.
- **Class Management:** Create and schedule classes (Reformer, Mat, etc.) with capacity limits.
- **Attendance Tracking:** Check-in system to mark students as "Attended" or "No-show".
- **Trainer Views:** Filter schedule and attendance by specific trainers.

## 🛠 DevOps & Architecture Highlights
- **Schema Management:** Complex relational database schema using Prisma with custom migrations.
- **Environment Parity:** Strict environment variable management via `.env.local`.
- **Data Seeding:** Automated scripts to populate the environment with demo trainers, classes, and users.
- **Timezone Safety:** All scheduling logic is handled via `Asia/Jerusalem` UTC offsets to prevent server-client mismatches.
- **Docker Ready:** Includes a multi-stage `Dockerfile` for optimized container deployment.

## 🏁 Getting Started

1. **Clone the repo:**
   ```bash
   git clone [https://github.com/yarinbatat/pilates-crm.git](https://github.com/yarinbatat/pilates-crm.git)
   cd pilates-crm


Install dependencies:

Bash
npm install
Environment Setup:
Create a .env.local file based on .env.example with your Supabase and Postgres credentials.

Sync Database:

Bash
npx prisma db push
Seed Demo Data:

Bash
npm run db:seed -- --email=your-email@example.com
Run Development Server:

Bash
npm run dev


Created by Yarin Batat
