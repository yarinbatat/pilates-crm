import { BookingStatus, ClassCategory } from "@prisma/client";
import { redirect } from "next/navigation";

import { bookClassAction, cancelBookingAction } from "@/app/customer/schedule/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  if (type === ClassCategory.NUTRITION_CONSULTATION) return "תזונה";
  return "שיעור";
}

export default async function CustomerSchedulePage({ searchParams }: Props) {
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

  const classes = await prisma.studioClass.findMany({
    where: {
      startAt: { gte: new Date() },
      isCancelled: false,
    },
    include: {
      trainer: {
        select: { fullName: true },
      },
      bookings: {
        where: { status: { in: [BookingStatus.BOOKED, BookingStatus.ATTENDED] } },
        select: {
          id: true,
          userId: true,
          status: true,
        },
      },
    },
    orderBy: { startAt: "asc" },
    take: 30,
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6fbf7] via-[#fcfbf8] to-[#fffdf9] p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <DashboardHeader
          title="מערכת שעות"
          subtitle="צפו בשיעורים הקרובים, הזמינו ובטלו בקלות."
          links={[
            { href: "/customer", label: "לוח בקרה" },
            { href: "/customer/schedule", label: "מערכת שעות" },
          ]}
        />

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
        ) : null}

        <Card className="border-[#dfe9e1] bg-white/90">
          <CardHeader>
            <CardTitle className="text-[#223228]">שיעורים קרובים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {classes.length === 0 ? (
              <div className="rounded-xl border border-[#e8eee9] bg-[#fbfdfb] p-4 text-sm text-[#617268]">
                  אין כרגע שיעורים קרובים.
              </div>
            ) : (
              classes.map((studioClass) => {
                const bookedCount = studioClass.bookings.length;
                const spotsLeft = Math.max(0, studioClass.capacity - bookedCount);
                const userBooking = studioClass.bookings.find((booking) => booking.userId === user.id);
                const isBookedByUser = Boolean(userBooking);

                return (
                  <div
                    key={studioClass.id}
                    className="flex flex-col gap-3 rounded-xl border border-[#e8eee9] bg-[#fbfdfb] p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-[#223228]">{studioClass.title}</p>
                      <p className="text-sm text-[#66776d]">
                        {classTypeLabel(studioClass.category)} • {studioClass.trainer.fullName}
                      </p>
                      <p className="mt-1 text-sm text-[#6b7c73]">
                        {formatDateIL(studioClass.startAt)} • {formatTimeIL(studioClass.startAt)} - {formatTimeIL(studioClass.endAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          spotsLeft > 0 ? "bg-[#edf5ef] text-[#3c6a52]" : "bg-[#f7e9e9] text-[#8b3a3a]"
                        }
                      >
                        {spotsLeft > 0 ? `${spotsLeft} מקומות פנויים` : "מלא"}
                      </Badge>

                      {isBookedByUser ? (
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="secondary" className="bg-[#dfeee4] text-[#2f5a47]">
                            הוזמן
                          </Button>
                          {userBooking?.status === BookingStatus.BOOKED ? (
                            <form action={cancelBookingAction}>
                              <input type="hidden" name="classId" value={studioClass.id} />
                              <Button type="submit" variant="outline">
                                ביטול הזמנה
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      ) : (
                        <form action={bookClassAction}>
                          <input type="hidden" name="classId" value={studioClass.id} />
                          <Button
                            type="submit"
                            disabled={spotsLeft <= 0}
                            className="bg-[#3f7d62] text-white hover:bg-[#356b54]"
                          >
                            הזמנת שיעור
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

