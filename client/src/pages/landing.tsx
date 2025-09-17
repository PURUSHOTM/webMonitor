import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { TrendingUp, Globe, Bell, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">WebMonitor Pro</span>
        </div>
        <div className="space-x-2">
          <Link href="/login"><Button variant="outline">Log in</Button></Link>
          <Link href="/register"><Button>Get Started</Button></Link>
        </div>
      </header>

      <main className="px-6">
        <section className="max-w-5xl mx-auto py-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            Monitor your websites in real-time
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto"
          >
            Uptime, response times, and instant alerts when things go wrong. Fast, reliable, and privacy-friendly.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex items-center justify-center space-x-4"
          >
            <Link href="/register"><Button size="lg">Start Monitoring</Button></Link>
            <Link href="/login"><Button size="lg" variant="outline">I already have an account</Button></Link>
          </motion.div>
        </section>

        <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
          {[{
            icon: Globe,
            title: 'Global Checks',
            desc: 'Track uptime and performance across regions to spot issues early.'
          },{
            icon: Bell,
            title: 'Smart Alerts',
            desc: 'Get email and SMS alerts when downtime or slow responses occur.'
          },{
            icon: Shield,
            title: 'Secure by Design',
            desc: 'Your data is isolated per account with secure session auth.'
          }].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-6 rounded-xl border border-border bg-card shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} WebMonitor Pro. All rights reserved.
      </footer>
    </div>
  );
}
