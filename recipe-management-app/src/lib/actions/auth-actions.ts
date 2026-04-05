"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/app/api/auth/[...nextauth]/auth";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function registerUser(
  email: string,
  password: string,
  name: string | null
) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  return user;
}

export async function authenticateUser(email: string, password: string) {
  const result = await signIn("credentials", {
    redirect: false,
    email,
    password,
  });

  return result;
}

export async function logoutUser() {
  await signOut({ redirectTo: "/" });
}

export async function getUser() {
  const session = await auth();

  if (!session || !session.user) {
    console.error("No session found");
    return null;
  }

  return session.user;
}

export async function redirectToLogin() {
  return redirect("/login");
}
