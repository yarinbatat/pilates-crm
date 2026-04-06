import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: "env.local", override: false });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL for seeding");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function daysFromNow(days, hour, minute = 0) {
  const now = new Date();
  const dt = new Date(now);
  dt.setDate(now.getDate() + days);
  dt.setHours(hour, minute, 0, 0);
  return dt;
}

function resolveTargetEmail() {
  const cliArg = process.argv.find((arg) => arg.startsWith("--email="));
  const fromArg = cliArg ? cliArg.replace("--email=", "").trim().toLowerCase() : "";
  const fromEnv = (process.env.SEED_USER_EMAIL || "").trim().toLowerCase();
  const email = fromArg || fromEnv;
  if (!email) {
    throw new Error("Missing target user email. Use --email=<your-email> or set SEED_USER_EMAIL.");
  }
  return email;
}

async function main() {
  const targetEmail = resolveTargetEmail();

  const admin = await prisma.user.upsert({
    where: { email: "admin@pilates.co.il" },
    update: { fullName: "Admin", role: "ADMIN", isActive: true },
    create: {
      email: "admin@pilates.co.il",
      fullName: "Admin",
      role: "ADMIN",
      isActive: true,
    },
  });

  const lisa = await prisma.user.upsert({
    where: { email: "lisa@pilates.co.il" },
    update: { fullName: "Lisa", role: "TRAINER", isActive: true },
    create: {
      email: "lisa@pilates.co.il",
      fullName: "Lisa",
      role: "TRAINER",
      isActive: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: targetEmail },
    update: { role: "CUSTOMER", isActive: true },
    create: {
      email: targetEmail,
      fullName: "Registered User",
      role: "CUSTOMER",
      isActive: true,
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
    },
  });

  const punchMembership = await prisma.membership.upsert({
    where: { id: `seed-membership-punch-${customer.id}` },
    update: {
      userId: customer.id,
      status: "ACTIVE",
      startsAt: daysFromNow(-1, 0),
      endsAt: daysFromNow(30, 23, 59),
      totalCredits: 10,
      remainingCredits: 10,
      weeklyLimit: null,
    },
    create: {
      id: `seed-membership-punch-${customer.id}`,
      userId: customer.id,
      name: "Punch Card 10",
      type: "PUNCH_CARD",
      status: "ACTIVE",
      startsAt: daysFromNow(-1, 0),
      endsAt: daysFromNow(30, 23, 59),
      totalCredits: 10,
      remainingCredits: 10,
      priceCents: 100000,
      currency: "ILS",
    },
  });

  const classTemplates = [
    { id: "seed-class-1", title: "Reformer Fundamentals", category: "REFORMER", dayOffset: 1, hour: 8, minute: 0, capacity: 10 },
    { id: "seed-class-2", title: "Mat Pilates Core", category: "MAT_PILATES", dayOffset: 2, hour: 10, minute: 30, capacity: 12 },
    { id: "seed-class-3", title: "Reformer Flow", category: "REFORMER", dayOffset: 3, hour: 13, minute: 0, capacity: 10 },
    { id: "seed-class-4", title: "Mat Pilates Stretch", category: "MAT_PILATES", dayOffset: 4, hour: 17, minute: 30, capacity: 14 },
    { id: "seed-class-5", title: "Reformer Evening", category: "REFORMER", dayOffset: 5, hour: 19, minute: 0, capacity: 10 },
  ];

  for (const cls of classTemplates) {
    const startAt = daysFromNow(cls.dayOffset, cls.hour, cls.minute);
    const endAt = new Date(startAt.getTime() + 50 * 60 * 1000);
    await prisma.studioClass.upsert({
      where: { id: cls.id },
      update: {
        title: cls.title,
        category: cls.category,
        trainerId: lisa.id,
        startAt,
        endAt,
        capacity: cls.capacity,
        isCancelled: false,
      },
      create: {
        id: cls.id,
        title: cls.title,
        category: cls.category,
        trainerId: lisa.id,
        startAt,
        endAt,
        capacity: cls.capacity,
      },
    });
  }

  const existingSeedTx = await prisma.transaction.findFirst({
    where: {
      externalRef: `seed-punch-purchase-${customer.id}`,
    },
    select: { id: true },
  });
  if (!existingSeedTx) {
    await prisma.transaction.create({
      data: {
        userId: customer.id,
        membershipId: punchMembership.id,
        type: "PURCHASE",
        status: "COMPLETED",
        amountCents: 100000,
        currency: "ILS",
        processedById: admin.id,
        note: "Seed purchase transaction",
        externalRef: `seed-punch-purchase-${customer.id}`,
      },
    });
  }

  console.log(`Seed completed successfully for ${targetEmail}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

