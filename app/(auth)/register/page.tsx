import Link from "next/link";

import { registerCustomerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickQueryValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function RegisterPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = pickQueryValue(params.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#f6fbf7] via-[#fcfbf8] to-[#fffdf9] px-4 py-8">
      <Card className="w-full max-w-xl border-[#dfe9e1] bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-[#223228]">יצירת חשבון לקוח</CardTitle>
          <CardDescription className="text-[#64756b]">
            התחילו להזמין שיעורי פילאטיס וייעוץ תזונה תוך דקות.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={registerCustomerAction} className="space-y-4">
            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="fullName">שם מלא</Label>
              <Input id="fullName" name="fullName" placeholder="נועה כהן" required />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">אימייל</Label>
                <Input id="email" name="email" type="email" placeholder="noa@email.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">טלפון</Label>
                <Input id="phone" name="phone" type="tel" placeholder="0501234567 או +972501234567" pattern="^(\+972|972|0)5\d{8}$" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="healthNotes">הערות רפואיות (אופציונלי)</Label>
              <Textarea
                id="healthNotes"
                name="healthNotes"
                placeholder="פציעות, מגבלות או הערות חשובות למדריכים."
                className="min-h-24"
              />
            </div>

            <Button className="w-full bg-[#3f7d62] text-white hover:bg-[#356b54]" type="submit">
              פתיחת חשבון
            </Button>
          </form>

          <p className="mt-4 text-sm text-[#64756b]">
            כבר יש לכם חשבון?{" "}
            <Link href="/login" className="font-medium text-[#365646] hover:underline">
              התחברות
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
