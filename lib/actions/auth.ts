"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn as authSignIn, signOut as authSignOut } from "@/auth";
import { sql } from "@/lib/db";

export async function signIn(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await authSignIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }
    throw error;
  }

  redirect("/dashboard");
}

export async function signUp(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!fullName || !email) {
    return { error: "Le nom et l'email sont obligatoires." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const existing = await sql`select 1 from users where email = ${email} limit 1`;
  if (existing.length > 0) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await sql`
    insert into users (full_name, email, password_hash)
    values (${fullName}, ${email}, ${passwordHash})
  `;

  try {
    await authSignIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Compte créé, mais la connexion automatique a échoué — connectez-vous manuellement." };
    }
    throw error;
  }

  redirect("/onboarding");
}

export async function signOut() {
  await authSignOut({ redirect: false });
  redirect("/login");
}
