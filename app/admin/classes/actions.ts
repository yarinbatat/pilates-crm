"use server";

import { redirect } from "next/navigation";

import { ClassCategory, UserRole } from "@prisma/client";

import { jerusalemLocalToUtc } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function createClassAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=יש+להתחבר+תחילה");
  }

  const prismaUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!prismaUser || prismaUser.role !== UserRole.ADMIN) {
    redirect("/admin/classes?error=רק+מנהל+יכול+ליצור+שיעורים");
  }

  const name = asString(formData.get("name"));
  const type = asString(formData.get("type"));
  const trainerId = asString(formData.get("trainerId"));
  const date = asString(formData.get("date"));
  const time = asString(formData.get("time"));
  const maxCapacityRaw = asString(formData.get("maxCapacity"));

  if (!name || !type || !trainerId || !date || !time || !maxCapacityRaw) {
    redirect("/admin/classes?error=יש+למלא+את+כל+השדות");
  }

  const maxCapacity = Number(maxCapacityRaw);
  if (!Number.isInteger(maxCapacity) || maxCapacity <= 0) {
    redirect("/admin/classes?error=קיבולת+מירבית+חייבת+להיות+מספר+חיובי");
  }

  const category = type === "REFORMER" ? ClassCategory.REFORMER : ClassCategory.MAT_PILATES;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const startAt = jerusalemLocalToUtc(year, month, day, hour, minute, 0);
  if (Number.isNaN(startAt.getTime())) {
    redirect("/admin/classes?error=תאריך+או+שעה+לא+תקינים");
  }

  const endAt = new Date(startAt.getTime() + 50 * 60 * 1000);

  await prisma.studioClass.create({
    data: {
      title: name,
      category,
      trainerId,
      startAt,
      endAt,
      capacity: maxCapacity,
    },
  });

  redirect("/admin/classes?success=השיעור+נוצר+בהצלחה");
}

export async function markAttendanceAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?error=יש+להתחבר+תחילה");

  const prismaUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!prismaUser || prismaUser.role !== UserRole.ADMIN) {
    redirect("/admin/classes?error=אין+הרשאה+לסמן+נוכחות");
  }

  const bookingId = asString(formData.get("bookingId"));
  const returnTo = asString(formData.get("returnTo")) || "/admin/classes";
  if (!bookingId) {
    redirect(`${returnTo}?error=חסרה+זהות+הזמנה`);
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "ATTENDED",
      checkInAt: new Date(),
    },
  });

  redirect(`${returnTo}?success=הנוכחות+סומנה+בהצלחה`);
}

