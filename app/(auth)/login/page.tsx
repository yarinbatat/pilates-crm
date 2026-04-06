import Link from "next/link";

import { loginAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickQueryValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = pickQueryValue(params.error);
  const success = pickQueryValue(params.success);
  const redirectTo = pickQueryValue(params.redirectTo);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#f6fbf7] via-[#fcfbf8] to-[#fffdf9] px-4 py-8">
      <Card className="w-full max-w-md border-[#dfe9e1] bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-[#223228]">ברוכים הבאים</CardTitle>
          <CardDescription className="text-[#64756b]">
            התחברו כדי להמשיך ללוח הבקרה של הסטודיו.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            <Button className="w-full bg-[#3f7d62] text-white hover:bg-[#356b54]" type="submit">
              התחברות
            </Button>
          </form>

          <p className="mt-4 text-sm text-[#64756b]">
            לקוח חדש?{" "}
            <Link href="/register" className="font-medium text-[#365646] hover:underline">
              יצירת חשבון
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
