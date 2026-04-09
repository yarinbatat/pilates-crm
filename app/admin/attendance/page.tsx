import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { markAttendanceAction } from "@/app/admin/classes/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatDateIL,
  formatTimeIL,
  getJerusalemDateInputValue,
  jerusalemLocalToUtc,
} from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function toDateRangeForJerusalem(dateInput: string) {
  const [y, m, d] = dateInput.split("-").map(Number);
  const start = jerusalemLocalToUtc(y, m, d, 0, 0, 0);
  const end = jerusalemLocalToUtc(y, m, d, 23, 59, 59);
  return { start, end };
}

export default async function AdminAttendancePage({ searchParams }: Props) {
  const params = await searchParams;
  const error = pick(params.error);
  const success = pick(params.success);
  const selectedDate = pick(params.date) || getJerusalemDateInputValue(new Date());
  const selectedTrainerId = pick(params.trainerId);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const prismaUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!prismaUser || prismaUser.role !== UserRole.ADMIN) {
    redirect("/admin?error=אין+לך+גישה+ניהולית");
  }

  const [trainers, bookings] = await Promise.all([
    prisma.user.findMany({
      where: { role: UserRole.TRAINER, isActive: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    (async () => {
      const { start, end } = toDateRangeForJerusalem(selectedDate);
      return prisma.booking.findMany({
        where: {
          status: { in: ["BOOKED", "ATTENDED"] },
          studioClass: {
            startAt: { gte: start, lte: end },
            ...(selectedTrainerId ? { trainerId: selectedTrainerId } : {}),
          },
        },
        include: {
          user: { select: { fullName: true } },
          studioClass: {
            select: {
              title: true,
              startAt: true,
              trainer: { select: { fullName: true } },
            },
          },
        },
        orderBy: { studioClass: { startAt: "asc" } },
      });
    })(),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6fbf7] via-[#fcfbf8] to-[#fffdf9] p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-4 text-right">
        <DashboardHeader
          role="ADMIN"
          links={[
            { href: "/admin", label: "לוח בקרה" },
            { href: "/admin/classes", label: "ניהול שיעורים" },
            { href: "/admin/attendance", label: "ניהול נוכחות" },
          ]}
        />

        <Card className="border-[#dfe9e1] bg-white/90">
          <CardHeader>
            <CardTitle className="text-[#223228]">סינון הזמנות</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="get" className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="date">תאריך</Label>
                <Input id="date" name="date" type="date" defaultValue={selectedDate} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trainerId">מדריך/ה</Label>
                <select
                  id="trainerId"
                  name="trainerId"
                  defaultValue={selectedTrainerId}
                  className="h-10 rounded-md border border-[#dfe9e1] bg-white px-3 text-sm text-[#2a3a31]"
                >
                  <option value="">כל המדריכים</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full bg-[#3f7d62] text-white hover:bg-[#356b54]">
                  החל סינון
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <Card className="border-[#dfe9e1] bg-white/90">
          <CardHeader>
            <CardTitle className="text-[#223228]">הזמנות ליום הנבחר</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookings.length === 0 ? (
              <p className="rounded-md border border-[#e8eee9] bg-[#fbfdfb] p-3 text-sm text-[#617268]">
                לא נמצאו הזמנות בתאריך זה.
              </p>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col gap-2 rounded-xl border border-[#e8eee9] bg-[#fbfdfb] p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-[#223228]">{booking.user.fullName}</p>
                    <p className="text-sm text-[#66776d]">
                      {booking.studioClass.title} • {booking.studioClass.trainer.fullName}
                    </p>
                    <p className="text-sm text-[#6b7c73]">
                      {formatDateIL(booking.studioClass.startAt)} • {formatTimeIL(booking.studioClass.startAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        booking.status === "ATTENDED"
                          ? "bg-[#dff0e5] text-[#2f5a47]"
                          : "bg-[#f0e8de] text-[#775b3f]"
                      }
                    >
                      {booking.status === "ATTENDED" ? "נכח/ה" : "מוזמן/ת"}
                    </Badge>
                    {booking.status !== "ATTENDED" ? (
                      <form action={markAttendanceAction}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <input type="hidden" name="returnTo" value={`/admin/attendance?date=${encodeURIComponent(selectedDate)}&trainerId=${encodeURIComponent(selectedTrainerId)}`} />
                        <Button type="submit" className="bg-[#3f7d62] text-white hover:bg-[#356b54]">
                          סימון כנכח/ה
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

