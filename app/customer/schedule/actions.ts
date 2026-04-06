"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { BookingStatus, MembershipType } from "@prisma/client";

import { getJerusalemWeekRange } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function bookClassAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=יש+להתחבר+כדי+להזמין+שיעור");
  }

  const classId = asString(formData.get("classId"));
  if (!classId) {
    redirect("/customer/schedule?error=חסרה+זהות+שיעור");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const studioClass = await tx.studioClass.findUnique({
        where: { id: classId },
        select: {
          id: true,
          capacity: true,
          startAt: true,
          isCancelled: true,
        },
      });

      if (!studioClass) throw new Error("השיעור לא נמצא");
      if (studioClass.isCancelled) throw new Error("השיעור בוטל");
      if (studioClass.startAt <= new Date()) throw new Error("השיעור כבר התחיל");

      const existing = await tx.booking.findUnique({
        where: {
          userId_classId: {
            userId: user.id,
            classId: studioClass.id,
          },
        },
        select: { id: true, status: true },
      });

      if (existing && existing.status !== BookingStatus.CANCELLED) {
        throw new Error("כבר ביצעת הזמנה לשיעור זה");
      }

      const bookedCount = await tx.booking.count({
        where: {
          classId: studioClass.id,
          status: { in: [BookingStatus.BOOKED, BookingStatus.ATTENDED] },
        },
      });
      if (bookedCount >= studioClass.capacity) {
        throw new Error("השיעור מלא");
      }

      const now = new Date();
      const membership = await tx.membership.findFirst({
        where: {
          userId: user.id,
          status: "ACTIVE",
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
        orderBy: { endsAt: "asc" },
      });

      if (!membership) {
        throw new Error("לא נמצאה חברות פעילה");
      }

      if (membership.type === MembershipType.PUNCH_CARD) {
        const remaining = membership.remainingCredits ?? membership.totalCredits ?? 0;
        if (remaining <= 0) {
          throw new Error("לא נותרו ניקובים בכרטיסייה");
        }

        await tx.booking.upsert({
          where: { userId_classId: { userId: user.id, classId: studioClass.id } },
          create: {
            userId: user.id,
            classId: studioClass.id,
            membershipId: membership.id,
            status: BookingStatus.BOOKED,
          },
          update: {
            membershipId: membership.id,
            status: BookingStatus.BOOKED,
            canceledAt: null,
            cancellationReason: null,
          },
        });

        await tx.membership.update({
          where: { id: membership.id },
          data: { remainingCredits: remaining - 1 },
        });
      } else if (membership.type === MembershipType.WEEKLY_LIMITED) {
        const weeklyLimit = membership.weeklyLimit ?? 0;
        if (weeklyLimit <= 0) {
          throw new Error("Weekly plan limit is not configured");
        }

        const { start, end } = getJerusalemWeekRange(now);
        const bookedThisWeek = await tx.booking.count({
          where: {
            userId: user.id,
            membershipId: membership.id,
            status: { in: [BookingStatus.BOOKED, BookingStatus.ATTENDED] },
            studioClass: {
              startAt: {
                gte: start,
                lte: end,
              },
            },
          },
        });

        if (bookedThisWeek >= weeklyLimit) {
          throw new Error("הגעת למגבלת התוכנית השבועית");
        }

        await tx.booking.upsert({
          where: { userId_classId: { userId: user.id, classId: studioClass.id } },
          create: {
            userId: user.id,
            classId: studioClass.id,
            membershipId: membership.id,
            status: BookingStatus.BOOKED,
          },
          update: {
            membershipId: membership.id,
            status: BookingStatus.BOOKED,
            canceledAt: null,
            cancellationReason: null,
          },
        });
      } else {
        throw new Error("סוג חברות לא נתמך");
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "לא ניתן להשלים את ההזמנה";
    redirect(`/customer/schedule?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/customer");
  revalidatePath("/customer/schedule");
  redirect("/customer/schedule?success=השיעור+הוזמן+בהצלחה");
}

export async function cancelBookingAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=יש+להתחבר+כדי+לבטל+הזמנה");
  }

  const classId = asString(formData.get("classId"));
  if (!classId) {
    redirect("/customer/schedule?error=חסרה+זהות+שיעור");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: {
          userId_classId: {
            userId: user.id,
            classId,
          },
        },
        include: {
          studioClass: {
            select: { startAt: true },
          },
          membership: true,
        },
      });

      if (!booking || booking.status !== BookingStatus.BOOKED) {
        throw new Error("לא נמצאה הזמנה פעילה לביטול");
      }

      if (booking.studioClass.startAt <= new Date()) {
        throw new Error("לא ניתן לבטל שיעור שכבר התחיל");
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          canceledAt: new Date(),
          cancellationReason: "בוטל על ידי הלקוח",
        },
      });

      // Refund one credit for punch-card memberships.
      if (booking.membership?.type === MembershipType.PUNCH_CARD) {
        const current = booking.membership.remainingCredits ?? booking.membership.totalCredits ?? 0;
        const max = booking.membership.totalCredits ?? current;
        await tx.membership.update({
          where: { id: booking.membership.id },
          data: {
            remainingCredits: Math.min(max, current + 1),
          },
        });
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "לא ניתן לבטל את ההזמנה";
    redirect(`/customer/schedule?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/customer");
  revalidatePath("/customer/schedule");
  redirect("/customer/schedule?success=ההזמנה+בוטלה+בהצלחה");
}


