import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { TrendingUp, Globe, Bell, Shield, Star } from "lucide-react";

export default function Landing() {
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
  ];

  const stats = [
    { value: "99.99%", label: "Uptime Guarantee" },
    { value: "5,000+", label: "Happy Customers" },
    { value: "24/7", label: "Support" },
    { value: "< 30s", label: "Average Response" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-indigo-100/50 bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                SiteWatch
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 px-5 py-2 rounded-lg font-medium">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-16 md:py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 mb-6 mx-auto">
                <span className="mr-2 h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
                Now with 24/7 monitoring
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
                Monitor your websites <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  in real-time
                </span>
              </h1>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-4"
            >
              Uptime, response times, and instant alerts when things go wrong.
              Fast, reliable, and privacy-friendly.
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-500 mb-10 mx-auto"
            >
              No credit card required • 14-day free trial
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl px-8 py-6 text-base rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-2 border-gray-300 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 px-8 py-6 text-base rounded-xl font-semibold">
                  I already have an account
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="text-center p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 mx-auto w-full"
                >
                  <p className="text-3xl font-bold text-indigo-600">{stat.value}</p>
                  <p className="text-gray-600 mt-2">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful monitoring features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to keep your websites up and running
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group text-center mx-auto w-full"
              >
                <div className="w-14 h-14 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 mx-auto">
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Trusted by developers</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust SiteWatch
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex Johnson",
                role: "Frontend Developer",
                content: "SiteWatch helped us reduce downtime by 90%. The alerts are instant and reliable.",
                avatar: "AJ",
                rating: 5,
              },
              {
                name: "Maria Garcia",
                role: "DevOps Engineer",
                content: "The dashboard is intuitive and the performance metrics are incredibly detailed.",
                avatar: "MG",
                rating: 5,
              },
              {
                name: "David Kim",
                role: "Startup Founder",
                content: "As a small business owner, I needed something simple yet powerful. This is exactly that.",
                avatar: "DK",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm mx-auto w-full max-w-md"
              >
                <div className="flex items-center justify-center mb-5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic text-center">"{testimonial.content}"</p>
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                    <span className="text-indigo-600 font-bold">{testimonial.avatar}</span>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Ready to get started?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
              Join thousands of businesses that trust SiteWatch to keep their websites up and running.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl px-8 py-6 text-base rounded-xl font-semibold transition-all duration-300">
                  Start Free 14-Day Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-2 border-gray-300 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 px-8 py-6 text-base rounded-xl font-semibold">
                  Schedule a Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SiteWatch</span>
            </div>
            <p className="text-gray-600 text-center">© {new Date().getFullYear()} SiteWatch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
