import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const { register, handleSubmit } = useForm<LoginForm>();
  const [, navigate] = useLocation();

  async function onSubmit(values: LoginForm) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });
    if (res.ok) {
      // Wait for session to be established and /api/auth/me to return authenticated user
      const maxAttempts = 6;
      let ok = false;
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const meRes = await fetch("/api/auth/me", { credentials: "include" });
          if (meRes.ok) {
            ok = true;
            break;
          }
        } catch (e) {
          // ignore
        }
        await new Promise((r) => setTimeout(r, 150));
      }

      if (ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        navigate("/dashboard");
      } else {
        alert("Login succeeded but session couldn't be verified. Please try again.");
      }
    } else {
      const text = await res.text();
      alert(text || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md p-6 rounded-xl border border-border bg-card shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Welcome back</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <Input type="email" required placeholder="you@example.com" {...register("email")} />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <Input type="password" required placeholder="••••••••" {...register("password")} />
          </div>
          <Button type="submit" className="w-full">Log in</Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Don’t have an account? <Link href="/register" className="text-primary">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
