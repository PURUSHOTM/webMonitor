import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Globe, 
  Bell, 
  Shield, 
  Zap, 
  Clock, 
  Users, 
  Star,
  CheckCircle,
  ArrowRight
} from "lucide-react";

export default function ImprovedLanding() {
  const features = [
    {
      icon: Globe,
      title: "Global Monitoring",
      desc: "Track uptime and performance across multiple regions to spot issues before your users do.",
    },
    {
      icon: Bell,
      title: "Instant Alerts",
      desc: "Get notified via email, SMS, or Slack the moment your website goes down or slows down.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      desc: "Your data is isolated per account with end-to-end encryption and secure authentication.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      desc: "Check your websites every 30 seconds with our high-performance monitoring infrastructure.",
    },
    {
      icon: Clock,
      title: "24/7 Monitoring",
      desc: "Never miss a beat with round-the-clock monitoring and support from our global team.",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      desc: "Share dashboards and alerts with your team for seamless incident response.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "CTO at TechStart",
      content: "WebMonitor Pro cut our downtime by 90% and helped us identify performance bottlenecks we never knew existed.",
      avatar: "SJ",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "DevOps Lead at Global Inc",
      content: "The real-time alerts saved us from a major outage during our product launch. Worth every penny!",
      avatar: "MC",
      rating: 5,
    },
    {
      name: "Emma Rodriguez",
      role: "Founder of StartupHub",
      content: "As a small business owner, I needed something simple yet powerful. WebMonitor Pro delivers exactly that.",
      avatar: "ER",
      rating: 5,
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$9",
      period: "per month",
      description: "Perfect for small websites and personal projects",
      features: [
        "Monitor up to 5 websites",
        "Check every 5 minutes",
        "Email alerts",
        "Basic analytics",
        "SSL monitoring"
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Professional",
      price: "$29",
      period: "per month",
      description: "Ideal for growing businesses",
      features: [
        "Monitor up to 25 websites",
        "Check every 1 minute",
        "Email & SMS alerts",
        "Advanced analytics",
        "SSL & domain monitoring",
        "Team collaboration (5 users)",
        "API access"
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "per month",
      description: "For large organizations with complex needs",
      features: [
        "Unlimited websites",
        "Check every 30 seconds",
        "All alert types",
        "Advanced analytics & reporting",
        "Multi-location monitoring",
        "Unlimited team members",
        "Priority support",
        "SLA guarantee",
        "Custom integrations"
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              WebMonitor Pro
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <span className="mr-2 h-2 w-2 rounded-full bg-primary"></span>
                Trusted by 5,000+ companies worldwide
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
            >
              Monitor Your Websites <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                24/7, 365 Days a Year
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Uptime, response times, and instant alerts when things go wrong. 
              Fast, reliable, and privacy-friendly website monitoring.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 px-8 py-6 text-base">
                  Start Free 14-Day Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 py-6 text-base">
                  Schedule a Demo
                </Button>
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 text-sm text-muted-foreground"
            >
              <p>No credit card required • Set up in 2 minutes</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Logo Cloud */}
      <section className="py-12 bg-secondary/10">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-10">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Trusted by innovative teams
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center justify-center">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
                <div className="h-8 w-32 bg-muted rounded flex items-center justify-center font-medium text-muted-foreground">
                  Company {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Everything you need to monitor your websites
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg text-muted-foreground"
            >
              Powerful features designed to keep your websites up and running
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-secondary/10">
        <div className="container px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Loved by developers and teams
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg text-muted-foreground"
            >
              Join thousands of satisfied customers who trust WebMonitor Pro
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="p-6 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <span className="text-primary font-medium">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Simple, transparent pricing
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg text-muted-foreground"
            >
              Choose the plan that works best for you and your team
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`rounded-xl border bg-card p-6 relative ${
                  plan.popular 
                    ? "border-primary ring-2 ring-primary/20 shadow-lg" 
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground"> {plan.period}</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-primary mr-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/register" className="block">
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700" 
                        : ""
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-blue-600">
        <div className="container px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4"
            >
              Ready to get started?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg text-primary-foreground/90 mb-8"
            >
              Join thousands of businesses that trust WebMonitor Pro to keep their websites up and running.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register">
                <Button size="lg" variant="secondary" className="px-8 py-6 text-base">
                  Start Free 14-Day Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-8 py-6 text-base">
                  Contact Sales
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">WebMonitor Pro</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-muted-foreground">
                © {new Date().getFullYear()} WebMonitor Pro. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}