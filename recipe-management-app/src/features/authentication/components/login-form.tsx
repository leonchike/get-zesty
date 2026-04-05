"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authenticateUser } from "@/lib/actions/auth-actions";
import { useRouter } from "next/navigation";

// Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RightArrowIcon } from "@/components/ui/icons/custom-icons";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm({
  callbackUrl = "/",
}: {
  callbackUrl?: string;
}) {
  const [error, setError] = useState("");
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authenticateUser(data.email, data.password);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      setError("An error occurred during login");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-foreground font-medium">
          Email
        </Label>
        <Input
          {...register("email")}
          type="email"
          id="email"
          className="h-11 bg-surface border-border focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-foreground font-medium">
          Password
        </Label>
        <Input
          {...register("password")}
          type="password"
          id="password"
          className="h-11 bg-surface border-border focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-11 group">
        <span className="flex items-center gap-2 text-white">
          Log in
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            <RightArrowIcon width={18} height={18} />
          </span>
        </span>
      </Button>
    </form>
  );
}
