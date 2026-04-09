import { ClassCategory, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { createClassAction, markAttendanceAction } from "@/app/admin/classes/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { formatDateIL, formatTimeIL } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function classTypeLabel(type: ClassCategory) {
  if (type === ClassCategory.REFORMER) return "רפורמר";
  if (type === ClassCategory.MAT_PILATES) return "מזרן";
  return "אחר";
}

export default async function AdminClassesPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = pick(params.error);
  const success = pick(params.success);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const prismaUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!prismaUser || prismaUser.role !== UserRole.ADMIN) {
    redirect("/admin?error=אין+לך+גישה+ניהולית");
  }

  const [trainers, upcomingClasses, todayBookings] = await Promise.all([
    prisma.user.findMany({
      where: { role: UserRole.TRAINER, isActive: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    prisma.studioClass.findMany({
      where: { startAt: { gte: new Date() }, isCancelled: false },
      include: {
        trainer: {
          select: { fullName: true },
        },
        bookings: {
          where: { status: { in: ["BOOKED", "ATTENDED"] } },
          select: { id: true },
        },
      },
      orderBy: { startAt: "asc" },
      take: 12,
    }),
    prisma.booking.findMany({
      where: {
        status: "BOOKED",
        studioClass: {
          startAt: {
            gte: new Date(Date.now() - 12 * 60 * 60 * 1000),
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
      },
      include: {
        user: { select: { fullName: true } },
        studioClass: { select: { title: true, startAt: true } },
      },
      orderBy: {
        studioClass: { startAt: "asc" },
      },
      take: 20,
    }),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6fbf7] via-[#fcfbf8] to-[#fffdf9] p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <DashboardHeader
          role="ADMIN"
          links={[
            { href: "/admin", label: "לוח בקרה" },
            { href: "/admin/classes", label: "ניהול שיעורים" },
            { href: "/admin/attendance", label: "ניהול נוכחות" },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-2 border-[#dfe9e1] bg-white/90">
            <CardHeader>
              <CardTitle className="text-[#223228]">יצירת שיעור חדש</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createClassAction} className="space-y-4">
                {error ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                ) : null}
                {success ? (
                  <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {success}
                  </p>
                ) : null}

                <div className="grid gap-2">
                  <Label htmlFor="name">שם השיעור</Label>
                  <Input id="name" name="name" placeholder="רפורמר בוקר" required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">סוג שיעור</Label>
                  <select
                    id="type"
                    name="type"
                    className="h-10 rounded-md border border-[#dfe9e1] bg-white px-3 text-sm text-[#2a3a31]"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled>
                      בחרו סוג
                    </option>
                    <option value="REFORMER">רפורמר</option>
                    <option value="MAT_PILATES">מזרן</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="trainerId">מדריך/ה</Label>
                  <select
                    id="trainerId"
                    name="trainerId"
                    className="h-10 rounded-md border border-[#dfe9e1] bg-white px-3 text-sm text-[#2a3a31]"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled>
                      בחרו מדריך/ה
                    </option>
                    {trainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="date">תאריך</Label>
                    <Input id="date" name="date" type="date" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">שעה</Label>
                    <Input id="time" name="time" type="time" required />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="maxCapacity">קיבולת מקסימלית</Label>
                  <Input id="maxCapacity" name="maxCapacity" type="number" min={1} required />
                </div>

                <Button className="w-full bg-[#3f7d62] text-white hover:bg-[#356b54]" type="submit">
                  יצירת שיעור
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border-[#dfe9e1] bg-white/90">
            <CardHeader>
              <CardTitle className="text-[#223228]">שיעורים קרובים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingClasses.length === 0 ? (
                <p className="rounded-md border border-[#e8eee9] bg-[#fbfdfb] p-3 text-sm text-[#617268]">
                  עדיין אין שיעורים. צרו שיעור ראשון כדי להתחיל בהזמנות.
                </p>
              ) : (
                upcomingClasses.map((studioClass) => {
                  const booked = studioClass.bookings.length;
                  const spotsLeft = Math.max(0, studioClass.capacity - booked);
                  return (
                    <div
                      key={studioClass.id}
                      className="flex flex-col gap-2 rounded-xl border border-[#e8eee9] bg-[#fbfdfb] p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-[#223228]">{studioClass.title}</p>
                        <p className="text-sm text-[#66776d]">
                          {classTypeLabel(studioClass.category)} • {studioClass.trainer.fullName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-[#edf5ef] text-[#3c6a52]">
                          {formatDateIL(studioClass.startAt)} {formatTimeIL(studioClass.startAt)}
                        </Badge>
                        <Badge className="bg-[#f0e8de] text-[#775b3f]">{spotsLeft} מקומות פנויים</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#dfe9e1] bg-white/90">
          <CardHeader>
            <CardTitle className="text-[#223228]">סימון נוכחות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayBookings.length === 0 ? (
              <p className="rounded-md border border-[#e8eee9] bg-[#fbfdfb] p-3 text-sm text-[#617268]">
                אין הזמנות זמינות לסימון כרגע.
              </p>
            ) : (
              todayBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col gap-2 rounded-xl border border-[#e8eee9] bg-[#fbfdfb] p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-[#223228]">{booking.user.fullName}</p>
                    <p className="text-sm text-[#66776d]">
                      {booking.studioClass.title} • {formatDateIL(booking.studioClass.startAt)} {formatTimeIL(booking.studioClass.startAt)}
                    </p>
                  </div>
                  <form action={markAttendanceAction}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="returnTo" value="/admin/classes" />
                    <Button type="submit" className="bg-[#3f7d62] text-white hover:bg-[#356b54]">
                      סימון נוכחות
                    </Button>
                  </form>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

