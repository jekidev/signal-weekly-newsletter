import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NewsletterChatAssistant } from "@/components/NewsletterChatAssistant";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Zap,
  TrendingUp,
  Users,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Signal Weekly transformed how I stay updated with AI trends. The insights are always actionable and relevant.",
    author: "Sarah Chen",
    role: "AI Product Manager",
  },
  {
    quote:
      "Finally, a newsletter that cuts through the noise. Every issue is packed with genuine value and fresh perspectives.",
    author: "Marcus Johnson",
    role: "Tech Entrepreneur",
  },
  {
    quote:
      "The quality of analysis is exceptional. I've learned more from Signal Weekly than from any other tech newsletter.",
    author: "Emma Rodriguez",
    role: "Data Scientist",
  },
];

const features = [
  {
    icon: Zap,
    title: "Weekly Insights",
    description:
      "Curated AI news and trends delivered every week, distilled from thousands of sources.",
  },
  {
    icon: TrendingUp,
    title: "Market Analysis",
    description:
      "Deep dives into emerging AI technologies and their real-world applications.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Join thousands of AI enthusiasts, researchers, and professionals worldwide.",
  },
];

const sampleArticles = [
  {
    title: "The Rise of Multimodal AI",
    excerpt:
      "Exploring how AI models that process text, images, and audio are reshaping the industry.",
    date: "Jan 8, 2026",
    readTime: "8 min read",
  },
  {
    title: "Enterprise AI Adoption in 2026",
    excerpt:
      "Key trends and challenges as organizations scale AI solutions across departments.",
    date: "Jan 1, 2026",
    readTime: "12 min read",
  },
  {
    title: "Open Source AI Models Explained",
    excerpt:
      "A comprehensive guide to the latest open-source models and how to use them.",
    date: "Dec 25, 2025",
    readTime: "10 min read",
  },
];

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [heroEmail, setHeroEmail] = useState("");
  const [heroAge, setHeroAge] = useState("");

  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      toast.success("Welcome to Signal Weekly!");
      setHeroEmail("");
      setHeroAge("");
    },
    onError: (error) => {
      if (error.message.includes("already subscribed")) {
        toast.error("This email is already subscribed");
      } else {
        toast.error("Failed to subscribe. Please try again.");
      }
    },
  });

  const handleHeroSubscribe = (e: React.FormEvent) => {
    e.preventDefault();

    const age = parseInt(heroAge);
    if (!heroEmail || isNaN(age) || age < 13 || age > 150) {
      toast.error("Please enter a valid email and age (13-150)");
      return;
    }

    subscribeMutation.mutate({
      email: heroEmail,
      age,
      source: "hero",
    });
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Signal Weekly</h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              className="text-foreground hover:text-accent transition-colors"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="text-foreground hover:text-accent transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#archive"
              className="text-foreground hover:text-accent transition-colors"
            >
              Archive
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Stay Ahead with{" "}
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              AI Insights
            </span>
          </h2>
          <p className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto">
            Get weekly curated insights on AI trends, breakthroughs, and market
            analysis delivered straight to your inbox.
          </p>

          {/* Signup Form */}
          <form onSubmit={handleHeroSubscribe} className="max-w-lg mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={heroEmail}
                    onChange={(e) => setHeroEmail(e.target.value)}
                    className="w-full rounded-lg border-border"
                    required
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Your age (13-150)"
                    value={heroAge}
                    onChange={(e) => setHeroAge(e.target.value)}
                    min="13"
                    max="150"
                    className="w-full rounded-lg border-border"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 text-accent-foreground font-semibold py-6 rounded-lg transition-all"
                >
                  {subscribeMutation.isPending
                    ? "Subscribing..."
                    : "Get Weekly Insights"}
                </Button>
              </div>
              <p className="text-sm text-foreground/50 mt-4">
                No spam, just pure AI insights. Unsubscribe anytime.
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold text-center text-foreground mb-16">
            What You'll Get
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className="p-8 border-border hover:shadow-lg transition-all duration-300 hover:border-accent rounded-2xl"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h4>
                  <p className="text-foreground/70">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sample Articles Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold text-center text-foreground mb-16">
            Latest from Our Archive
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {sampleArticles.map((article, idx) => (
              <Card
                key={idx}
                className="p-6 border-border hover:shadow-lg transition-all duration-300 hover:border-accent rounded-2xl flex flex-col"
              >
                <h4 className="text-lg font-semibold text-foreground mb-3">
                  {article.title}
                </h4>
                <p className="text-foreground/70 mb-4 flex-1">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-foreground/50">
                  <span>{article.date}</span>
                  <span>{article.readTime}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-4xl font-bold text-center text-foreground mb-16">
            What Our Readers Say
          </h3>
          <div className="relative">
            <Card className="p-12 border-border rounded-2xl min-h-64 flex flex-col justify-between">
              <p className="text-xl text-foreground/80 mb-8 italic">
                "{testimonials[currentTestimonial].quote}"
              </p>
              <div>
                <p className="font-semibold text-foreground">
                  {testimonials[currentTestimonial].author}
                </p>
                <p className="text-foreground/60">
                  {testimonials[currentTestimonial].role}
                </p>
              </div>
            </Card>

            {/* Carousel Controls */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                onClick={prevTestimonial}
                variant="outline"
                size="icon"
                className="rounded-full border-border hover:bg-accent hover:text-accent-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex gap-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTestimonial(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentTestimonial
                        ? "bg-accent w-8"
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <Button
                onClick={nextTestimonial}
                variant="outline"
                size="icon"
                className="rounded-full border-border hover:bg-accent hover:text-accent-foreground"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="archive" className="bg-foreground text-accent-foreground py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold mb-4">Signal Weekly</h4>
              <p className="text-sm opacity-70">
                Your weekly source for AI insights and market analysis.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Newsletter</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    Latest Issue
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    Archive
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    Subscribe
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="hover:opacity-70 transition-opacity"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="hover:opacity-70 transition-opacity"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="hover:opacity-70 transition-opacity"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-accent-foreground/20 pt-8 text-center text-sm opacity-70">
            <p>
              © 2026 Signal Weekly. All rights reserved. Made with ❤️ for AI
              enthusiasts.
            </p>
          </div>
        </div>
      </footer>

      {/* Chat Assistant */}
      <NewsletterChatAssistant />
    </div>
  );
}
