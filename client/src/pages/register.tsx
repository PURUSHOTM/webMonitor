import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

interface RegisterForm {
  email: string;
  password: string;
}

export default function Register() {
  const { register, handleSubmit } = useForm<RegisterForm>();
  const [, navigate] = useLocation();

  async function onSubmit(values: RegisterForm) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });
    if (res.ok) {
      const maxAttempts = 6;
      let ok = false;
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const meRes = await fetch("/api/auth/me", { credentials: "include" });
          if (meRes.ok) {
            ok = true;
            break;
          }
        } catch (e) {}
        await new Promise((r) => setTimeout(r, 150));
      }

      if (ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        navigate("/dashboard");
      } else {
        alert("Registration succeeded but session couldn't be verified. Please try logging in.");
      }
    } else {
      const text = await res.text();
      alert(text || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md p-6 rounded-xl border border-border bg-card shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Create your account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <Input type="email" required placeholder="you@example.com" {...register("email")} />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <Input type="password" required placeholder="At least 8 characters" {...register("password")} />
          </div>
          <Button type="submit" className="w-full">Create account</Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Already have an account? <Link href="/login" className="text-primary">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
