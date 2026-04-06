"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isValidIsraeliPhone, normalizeIsraeliPhone } from "@/lib/validators";
import { UserRole } from "@prisma/client";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

async function syncUserToPrisma(args: {
  supabaseUserId: string;
  email: string;
  role: unknown;
  fullName: string;
  phone?: string;
  healthNotes?: string;
}) {
  const normalizedPhone = args.phone ? normalizeIsraeliPhone(args.phone) : undefined;
  const roleNormalized = String(args.role ?? "").toUpperCase();
  const role =
    roleNormalized === "ADMIN"
      ? UserRole.ADMIN
      : roleNormalized === "TRAINER"
        ? UserRole.TRAINER
        : UserRole.CUSTOMER;

  await prisma.user.upsert({
    where: { id: args.supabaseUserId },
    update: {
      email: args.email,
      fullName: args.fullName,
      phone: normalizedPhone || null,
      role,
      isActive: true,
    },
    create: {
      id: args.supabaseUserId,
      email: args.email,
      fullName: args.fullName,
      phone: normalizedPhone || null,
      role,
      isActive: true,
    },
  });

  if (role === UserRole.CUSTOMER) {
    await prisma.customerProfile.upsert({
      where: { userId: args.supabaseUserId },
      update: {
        healthNotes: args.healthNotes || null,
      },
      create: {
        userId: args.supabaseUserId,
        healthNotes: args.healthNotes || null,
      },
    });
  }
}

export async function registerCustomerAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const fullName = asString(formData.get("fullName"));
  const email = asString(formData.get("email")).toLowerCase();
  const phone = asString(formData.get("phone"));
  const password = asString(formData.get("password"));
  const confirmPassword = asString(formData.get("confirmPassword"));
  const healthNotes = asString(formData.get("healthNotes"));

  if (!fullName || !email || !password || !confirmPassword) {
    redirect("/register?error=נא+למלא+את+כל+שדות+החובה");
  }

  if (password.length < 8) {
    redirect("/register?error=הסיסמה+חייבת+להכיל+לפחות+8+תווים");
  }

  if (password !== confirmPassword) {
    redirect("/register?error=הסיסמאות+אינן+תואמות");
  }

  if (phone && !isValidIsraeliPhone(phone)) {
    redirect("/register?error=מספר+טלפון+ישראלי+לא+תקין");
  }
  const normalizedPhone = phone ? normalizeIsraeliPhone(phone) : "";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: normalizedPhone,
        role: "CUSTOMER",
        health_notes: healthNotes,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  // Persist to PostgreSQL immediately (useful even if email confirmation is required).
  const supabaseUser = data.user;
  if (supabaseUser) {
    await syncUserToPrisma({
      supabaseUserId: supabaseUser.id,
      email: supabaseUser.email ?? email,
      role: "CUSTOMER",
      fullName,
      phone: normalizedPhone || undefined,
      healthNotes: healthNotes || undefined,
    });
  }

  redirect("/login?success=נשלח+מייל+לאישור+החשבון");
}

export async function loginAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const email = asString(formData.get("email")).toLowerCase();
  const password = asString(formData.get("password"));
  const redirectTo = asString(formData.get("redirectTo"));

  if (!email || !password) {
    redirect("/login?error=אימייל+וסיסמה+הם+שדות+חובה");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const role = data.user.user_metadata?.role;
  const fullName = String(data.user.user_metadata?.full_name ?? "");
  const phone = data.user.user_metadata?.phone ? String(data.user.user_metadata?.phone) : undefined;
  const healthNotes = data.user.user_metadata?.health_notes
    ? String(data.user.user_metadata?.health_notes)
    : undefined;

  // Ensure our local user/profile tables exist (works even if registration happened earlier).
  await syncUserToPrisma({
    supabaseUserId: data.user.id,
    email: data.user.email ?? email,
    role,
    fullName: fullName || email.split("@")[0] || "Customer",
    phone,
    healthNotes,
  });

  if (redirectTo) {
    redirect(redirectTo);
  }

  if (role === "ADMIN") {
    redirect("/admin");
  }

  if (role === "TRAINER") {
    redirect("/trainer");
  }

  redirect("/customer");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
