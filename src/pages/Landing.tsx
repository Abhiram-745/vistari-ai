import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Calendar, 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  Zap,
  BookOpen,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.3], [0, -100]);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Scheduling",
      description: "Let AI create the perfect study schedule tailored to your needs, test dates, and homework deadlines.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Focus on What Matters",
      description: "Automatically prioritize difficult topics and allocate more time where you need it most.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Smart Event Integration",
      description: "Events and commitments automatically block study times. Never double-book yourself again.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Track Your Progress",
      description: "Monitor your study sessions, completion rates, and see your improvement over time.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Study Groups",
      description: "Collaborate with friends, share timetables, and stay motivated together.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Flexible & Adaptive",
      description: "Easily reschedule sessions with drag-and-drop. Your timetable adapts to your life.",
      color: "from-indigo-500 to-purple-500"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Study Sessions Completed" },
    { value: "95%", label: "Student Satisfaction" },
    { value: "4.8/5", label: "Average Rating" },
    { value: "50+", label: "Schools Using" }
  ];

  const scrollingIcons = [
    { icon: <BookOpen />, label: "Smart Planning" },
    { icon: <Clock />, label: "Time Management" },
    { icon: <Award />, label: "Achievement System" },
    { icon: <Calendar />, label: "Event Blocking" },
    { icon: <Brain />, label: "AI Insights" },
    { icon: <TrendingUp />, label: "Progress Tracking" },
    { icon: <Users />, label: "Study Groups" },
    { icon: <Sparkles />, label: "Gamification" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
      {/* Hero Section with Parallax */}
      <motion.section 
        ref={heroRef}
        style={{ opacity, scale }}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          style={{ y }}
          className="relative z-10 max-w-5xl mx-auto text-center space-y-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Study Planning</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight"
          >
            Master Your <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">Studies</span>
            <br />
            With AI Precision
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto"
          >
            The intelligent study planner that adapts to your schedule, prioritizes your topics, and helps you ace your exams.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 group"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6"
            >
              View Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="space-y-1">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Auto-scrolling Icons */}
      <div className="relative py-12 overflow-hidden border-y bg-muted/30 backdrop-blur-sm">
        <motion.div
          animate={{
            x: [0, -1920]
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...scrollingIcons, ...scrollingIcons, ...scrollingIcons].map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-card border"
            >
              <div className="text-primary">{item.icon}</div>
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Features Section with Scroll Animations */}
      <section ref={featuresRef} className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold">
              Everything You Need to <span className="text-primary">Succeed</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make studying easier, more efficient, and actually enjoyable.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold">
              Loved by Students Everywhere
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of students achieving their academic goals
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "This app completely transformed how I study. I went from struggling to top of my class!",
                author: "Sarah J.",
                role: "A-Level Student"
              },
              {
                quote: "The AI scheduling is incredible. It knows exactly when I need to focus on difficult topics.",
                author: "Michael T.",
                role: "GCSE Student"
              },
              {
                quote: "I love how it integrates with my events. No more scheduling conflicts!",
                author: "Emma R.",
                role: "University Student"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="p-6 rounded-2xl bg-card border hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center space-y-8 p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border"
        >
          <h2 className="text-4xl sm:text-5xl font-bold">
            Ready to Transform Your Studies?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of students who are studying smarter, not harder.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 group"
            >
              Start Free Today
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Free forever
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              No credit card
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Setup in 2 minutes
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 StudyPlanner AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ feature, index }: { feature: any; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      className="group relative p-6 rounded-2xl bg-card border hover:shadow-xl transition-all duration-300"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 rounded-2xl bg-gradient-to-br ${feature.color} transition-opacity duration-300`} />
      
      <div className="relative z-10 space-y-4">
        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg`}>
          {feature.icon}
        </div>
        <h3 className="text-xl font-bold">{feature.title}</h3>
        <p className="text-muted-foreground">{feature.description}</p>
      </div>
    </motion.div>
  );
};

export default Landing;
