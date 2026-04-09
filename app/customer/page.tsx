import { CalendarClock, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { cancelBookingAction } from "@/app/customer/schedule/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { BookingStatus, ClassCategory, MembershipType } from "@prisma/client";
import { formatDateIL, formatTimeIL, getJerusalemWeekRange } from "@/lib/datetime";

function membershipTypeLabel(type: MembershipType) {
  switch (type) {
    case MembershipType.PUNCH_CARD:
      return "כרטיסייה";
    case MembershipType.WEEKLY_LIMITED:
      return "תוכנית שבועית";
    default:
      return "חברות";
  }
}

function classCategoryLabel(category: ClassCategory) {
  switch (category) {
    case ClassCategory.REFORMER:
      return "רפורמר";
    case ClassCategory.MAT_PILATES:
      return "מזרן";
    case ClassCategory.NUTRITION_CONSULTATION:
      return "תזונה";
    case ClassCategory.PRIVATE_SESSION:
      return "פרטי";
    case ClassCategory.OTHER:
    default:
      return "שיעור";
  }
}

const mockMembership = {
  type: MembershipType.PUNCH_CARD,
  totalCredits: 10,
  remainingCredits: 7,
  startsAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  endsAt: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
};

const mockUpcomingBookedClasses = [
  {
    classId: "mock-1",
    title: "רפורמר בוקר",
    category: ClassCategory.REFORMER,
    startAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
    endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000 + 50 * 60 * 1000),
    trainerName: "סופיה חן",
    canCancel: false,
  },
  {
    classId: "mock-2",
    title: "מזרן - ליבה",
    category: ClassCategory.MAT_PILATES,
    startAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000 + 30 * 60 * 1000),
    endAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000 + 30 * 60 * 1000 + 50 * 60 * 1000),
    trainerName: "ליאו מרטינס",
    canCancel: false,
  },
  {
    classId: "mock-3",
    title: "ייעוץ תזונה",
    category: ClassCategory.NUTRITION_CONSULTATION,
    startAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
    endAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 45 * 60 * 1000),
    trainerName: "ד\"ר אנה רושה",
    canCancel: false,
  },
];

export default async function CustomerDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const now = new Date();
  const { start: weekStart, end: weekEnd } = getJerusalemWeekRange(now);

  // Fetch active membership + usage (if booking logic has not yet created records,
  // this will naturally fall back to mock data).
  const activeMembership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    orderBy: { endsAt: "desc" },
  });

  let membershipSummary:
    | { kind: "punch"; text: string; progress: number; remaining: number; total: number; endsAt: Date }
    | { kind: "weekly"; text: string; progress: number; used: number; limit: number; endsAt: Date }
    | null = null;

  if (activeMembership) {
    if (activeMembership.type === MembershipType.PUNCH_CARD) {
      const total = activeMembership.totalCredits ?? 10;
      const used = await prisma.booking.count({
        where: {
          userId: user.id,
          membershipId: activeMembership.id,
          status: { in: [BookingStatus.BOOKED, BookingStatus.ATTENDED] },
          studioClass: {
            startAt: {
              gte: activeMembership.startsAt,
              lte: now,
            },
          },
        },
      });

      const remaining = Math.max(0, total - used);
      membershipSummary = {
        kind: "punch",
        text: `${membershipTypeLabel(activeMembership.type)}: נותרו ${remaining}/${total} שיעורים`,
        progress: Math.round((used / Math.max(1, total)) * 100),
        remaining,
        total,
        endsAt: activeMembership.endsAt,
      };
    }

    if (activeMembership.type === MembershipType.WEEKLY_LIMITED) {
      const limit = activeMembership.weeklyLimit ?? 2;
      const usedThisWeek = await prisma.booking.count({
        where: {
          userId: user.id,
          membershipId: activeMembership.id,
          status: { in: [BookingStatus.BOOKED, BookingStatus.ATTENDED] },
          studioClass: {
            startAt: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
        },
      });

      membershipSummary = {
        kind: "weekly",
        text: `${membershipTypeLabel(activeMembership.type)}: נוצלו ${usedThisWeek}/${limit} שיעורים השבוע`,
        progress: Math.round((usedThisWeek / Math.max(1, limit)) * 100),
        used: usedThisWeek,
        limit,
        endsAt: activeMembership.endsAt,
      };
    }
  }

  const upcomingBookedBookings = await prisma.booking.findMany({
    where: {
      userId: user.id,
      status: BookingStatus.BOOKED,
      studioClass: {
        startAt: { gte: now },
        isCancelled: false,
      },
    },
    include: {
      studioClass: {
        include: {
          trainer: true,
        },
      },
    },
    orderBy: {
      studioClass: {
        startAt: "asc",
      },
    },
    take: 10,
  });

  const upcomingBookedClasses =
    upcomingBookedBookings.length > 0
      ? upcomingBookedBookings.map((b) => ({
          classId: b.classId,
          title: b.studioClass.title,
          category: b.studioClass.category,
          startAt: b.studioClass.startAt,
          endAt: b.studioClass.endAt,
          trainerName: b.studioClass.trainer.fullName,
          canCancel: true,
        }))
      : mockUpcomingBookedClasses;

  const finalMembershipSummary =
    membershipSummary ?? {
      kind: activeMembership?.type === MembershipType.WEEKLY_LIMITED ? "weekly" : "punch",
      text: mockMembership.remainingCredits
        ? `${membershipTypeLabel(mockMembership.type)}: נותרו ${mockMembership.remainingCredits}/${mockMembership.totalCredits} שיעורים`
        : `${membershipTypeLabel(mockMembership.type)}`,
      progress: Math.round(((mockMembership.totalCredits - mockMembership.remainingCredits) / mockMembership.totalCredits) * 100),
      remaining: mockMembership.remainingCredits ?? 0,
      total: mockMembership.totalCredits ?? 10,
      used: mockMembership.totalCredits - (mockMembership.remainingCredits ?? 0),
      limit: 2,
      endsAt: mockMembership.endsAt,
    };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6fbf7] via-[#fcfbf8] to-[#fffdf9] p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <DashboardHeader
          role="CUSTOMER"
          links={[
            { href: "/customer", label: "לוח בקרה" },
            { href: "/customer/schedule", label: "מערכת שעות" },
            { href: "/customer/store", label: "רכישת מנוי 💳" }
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1 border-[#dfe9e1] bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#223228]">
                <CalendarClock className="h-5 w-5 text-[#3f7d62]" />
                חברות פעילה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-[#e8eee9] bg-[#fbfdfb] p-4">
                <div className="text-sm font-medium text-[#223228]">{finalMembershipSummary.text}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-[#6a7a71]">
                  <span>
                    התקדמות: <span className="font-medium text-[#3c6a52]">{Math.min(100, finalMembershipSummary.progress)}%</span>
                  </span>
                  <span>
                    תוקף עד{" "}
                    <span className="font-medium text-[#3c6a52]">
                      {formatDateIL(finalMembershipSummary.endsAt)}
                    </span>
                  </span>
                </div>
                <div className="mt-3">
                  <Progress value={finalMembershipSummary.progress} className="bg-[#e8efe9]" />
                </div>
              </div>

              <div className="rounded-xl border border-[#e8eee9] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#223228]">שומרים על רצף</p>
                  <Sparkles className="h-4 w-4 text-[#678572]" />
                </div>
                <p className="mt-2 text-sm text-[#617268]">
                  הזמינו את השיעור הבא כדי להישאר במסגרת התוכנית שלכם.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-[#dfe9e1] bg-white/90">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[#223228]">שיעורים מוזמנים קרובים</CardTitle>
              <Badge variant="secondary" className="bg-[#edf5ef] text-[#3c6a52]">
                {upcomingBookedClasses.length} מתוכננים
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingBookedClasses.length === 0 ? (
                <div className="rounded-xl border border-[#e8eee9] bg-[#fbfdfb] p-4 text-sm text-[#617268]">
                  עדיין אין הזמנות עתידיות. לאחר הזמנה, השיעור יופיע כאן.
                </div>
              ) : (
                upcomingBookedClasses.map((studioClass, idx) => (
                  <div key={`${studioClass.title}-${studioClass.startAt.toISOString()}`} className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-[#223228]">{studioClass.title}</p>
                        <p className="text-sm text-[#6b7c73]">
                          {classCategoryLabel(studioClass.category)} • {studioClass.trainerName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-[#edf5ef] text-[#3c6a52]">
                          {formatDateIL(studioClass.startAt)} • {formatTimeIL(studioClass.startAt)} - {formatTimeIL(studioClass.endAt)}
                        </Badge>
                        {studioClass.canCancel ? (
                          <form action={cancelBookingAction}>
                            <input type="hidden" name="classId" value={studioClass.classId} />
                            <Button type="submit" variant="outline">
                              ביטול
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                    {idx < upcomingBookedClasses.length - 1 ? <Separator className="bg-[#e5ece7]" /> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
