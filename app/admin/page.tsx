import { CalendarDays, Clock3, Users } from "lucide-react";
import { UserRole } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  formatDateIL,
  formatTimeIL,
  getJerusalemDateInputValue,
  getJerusalemWeekRange,
  jerusalemLocalToUtc,
} from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!me || me.role !== UserRole.ADMIN) {
    redirect("/admin?error=אין+לך+גישה+ניהולית");
  }

  const now = new Date();
  const { start: weekStart, end: weekEnd } = getJerusalemWeekRange(now);
  const todayInput = getJerusalemDateInputValue(now);
  const [y, m, d] = todayInput.split("-").map(Number);
  const dayStart = jerusalemLocalToUtc(y, m, d, 0, 0, 0);
  const dayEnd = jerusalemLocalToUtc(y, m, d, 23, 59, 59);

  const [totalActiveCustomers, classesToday, weeklyBookings, todayClasses] = await Promise.all([
    prisma.user.count({
      where: { role: "CUSTOMER", isActive: true },
    }),
    prisma.studioClass.count({
      where: { isCancelled: false, startAt: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.booking.count({
      where: {
        status: { in: ["BOOKED", "ATTENDED"] },
        studioClass: { startAt: { gte: weekStart, lte: weekEnd } },
      },
    }),
    prisma.studioClass.findMany({
      where: {
        isCancelled: false,
        startAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        trainer: { select: { fullName: true } },
        bookings: {
          where: { status: { in: ["BOOKED", "ATTENDED"] } },
          select: { id: true },
        },
      },
      orderBy: { startAt: "asc" },
      take: 8,
    }),
  ]);

  const statsCards = [
    { title: "סה\"כ מתאמנים פעילים", value: String(totalActiveCustomers), icon: Users },
    { title: "שיעורים להיום", value: String(classesToday), icon: CalendarDays },
    { title: "הזמנות השבוע", value: String(weeklyBookings), icon: Clock3 },
  ] as const;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6fbf7] via-[#fcfbf8] to-[#fffdf9] p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <DashboardHeader
          title="לוח בקרה ניהולי"
          subtitle="סקירה מהירה על הפעילות השבועית והיומית בסטודיו."
          links={[
            { href: "/admin", label: "לוח בקרה" },
            { href: "/admin/classes", label: "ניהול שיעורים" },
            { href: "/admin/attendance", label: "ניהול נוכחות" },
          ]}
        />

        <section className="grid gap-4 md:grid-cols-3">
          {statsCards.map((card) => (
            <Card key={card.title} className="border-[#dde8df] bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#52675b]">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-[#678572]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-[#1f2e25]">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4">
          <Card className="border-[#dde8df] bg-white/90">
            <CardHeader>
              <CardTitle className="text-[#2a3a31]">שיעורים להיום</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayClasses.length === 0 ? (
                <p className="rounded-md border border-[#e8eee9] bg-[#fbfdfb] p-3 text-sm text-[#617268]">
                  לא נמצאו שיעורים להיום.
                </p>
              ) : (
                todayClasses.map((studioClass, index) => {
                  const occupancy = Math.round((studioClass.bookings.length / studioClass.capacity) * 100);
                  return (
                    <div key={studioClass.id} className="space-y-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium text-[#223228]">{studioClass.title}</p>
                          <p className="text-sm text-[#6b7c73]">{studioClass.trainer.fullName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-[#edf5ef] text-[#3c6a52]">
                            <Clock3 className="mr-1 h-3 w-3" />
                            {formatDateIL(studioClass.startAt)} {formatTimeIL(studioClass.startAt)} -{" "}
                            {formatTimeIL(studioClass.endAt)}
                          </Badge>
                          <Badge
                            className={
                              occupancy >= 90 ? "bg-[#3f7d62] text-white" : "bg-[#f0e8de] text-[#775b3f]"
                            }
                          >
                            {studioClass.bookings.length}/{studioClass.capacity}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={occupancy} className="h-2 bg-[#e8efe9]" />
                      {index < todayClasses.length - 1 ? <Separator className="bg-[#e5ece7]" /> : null}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
