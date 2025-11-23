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
  BookOpen,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Star,
  Heart,
  Zap
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -30, 0],
            rotate: [0, 5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 40, 0],
            rotate: [0, -5, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-10 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
        />
      </div>

      {/* Hero Section - Problem First */}
      <motion.section 
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex items-center justify-center px-6 pt-20 pb-32"
      >
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-12 text-center"
          >
            {/* Problem statement */}
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/20 border border-secondary/30"
              >
                <Sparkles className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium text-secondary-foreground">Trusted by 10,000+ students</span>
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.1]">
                Feeling overwhelmed
                <br />
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  by revision?
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Exams in two weeks? Six subjects to cover? We get it. 
                <br className="hidden sm:block" />
                Here's your plan — one you'll actually stick to.
              </p>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg px-10 py-7 bg-gradient-to-r from-primary to-secondary hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg group rounded-full"
              >
                Start your plan now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-sm text-muted-foreground">Free forever · No credit card · 2 min setup</p>
            </motion.div>

            {/* Floating cards with animations */}
            <div className="relative h-64 mt-20">
              <motion.div
                initial={{ opacity: 0, y: 40, rotate: -5 }}
                animate={{ opacity: 1, y: 0, rotate: -5 }}
                transition={{ duration: 1, delay: 0.8 }}
                whileHover={{ rotate: 0, scale: 1.05, y: -10 }}
                className="absolute left-0 top-0 bg-card border border-border rounded-3xl p-6 shadow-lg max-w-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Monday, 9:00 AM</p>
                    <p className="text-sm text-muted-foreground">Biology: Cell Division</p>
                    <p className="text-xs text-muted-foreground mt-1">60 mins · Moderate</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40, rotate: 5 }}
                animate={{ opacity: 1, y: 0, rotate: 5 }}
                transition={{ duration: 1, delay: 1 }}
                whileHover={{ rotate: 0, scale: 1.05, y: -10 }}
                className="absolute right-0 top-10 bg-card border border-border rounded-3xl p-6 shadow-lg max-w-xs"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Week Progress</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-semibold">12/15 sessions</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "80%" }}
                      transition={{ duration: 1.5, delay: 1.2 }}
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 1.2 }}
                className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 rounded-2xl px-6 py-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  <p className="text-sm font-medium">Math exam: Ready! 🎉</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Testimonial Highlight */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative bg-gradient-to-br from-card to-primary/5 border border-border rounded-[2rem] p-12 shadow-xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-accent text-accent" />
                ))}
              </div>
              <blockquote className="text-2xl sm:text-3xl font-display font-semibold leading-relaxed mb-8">
                "This site helped me stop procrastinating and actually revise on time. I had 6 exams in 3 weeks and honestly felt lost. Now I have a plan and I'm sticking to it!"
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
                  S
                </div>
                <div>
                  <p className="font-semibold text-lg">Sarah Mitchell</p>
                  <p className="text-muted-foreground">Year 12 Student · Got an A* in Biology</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* User Story Section */}
      <section className="py-32 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold mb-6">
              How real learners use it
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Meet Sarah — she had 6 exams in 3 weeks. Here's how she used it.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "List everything",
                description: "Sarah added all 6 subjects, marked difficult topics, and set her exam dates. Took 3 minutes.",
                icon: <BookOpen className="w-6 h-6" />,
                color: "from-primary to-primary-light"
              },
              {
                step: "2",
                title: "Get a smart plan",
                description: "The app created a personalized schedule — extra time on tricky topics, breaks between sessions, and no cramming the day before exams.",
                icon: <Brain className="w-6 h-6" />,
                color: "from-secondary to-accent"
              },
              {
                step: "3",
                title: "Actually stick to it",
                description: "Push notifications, progress tracking, and visual rewards kept Sarah motivated. She completed 95% of sessions and aced her exams.",
                icon: <Target className="w-6 h-6" />,
                color: "from-accent to-primary"
              }
            ].map((item, index) => (
              <StoryCard key={index} item={item} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid - Less card-heavy */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20 space-y-6"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold">
              Everything you need to
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ace your exams
              </span>
            </h2>
          </motion.div>

          <div className="space-y-32">
            {/* Feature 1 */}
            <FeatureRow
              title="Plans that adapt to your life"
              description="Got football practice? Family dinner? Friend's birthday? Your study plan automatically works around your schedule. No conflicts. No stress."
              icon={<Calendar className="w-12 h-12" />}
              gradient="from-primary to-primary-light"
              direction="left"
            />

            {/* Feature 2 */}
            <FeatureRow
              title="Focus on what you struggle with"
              description="Mark topics as difficult and get extra practice time. The smart algorithm ensures you master tough concepts before exam day."
              icon={<Target className="w-12 h-12" />}
              gradient="from-secondary to-accent"
              direction="right"
            />

            {/* Feature 3 */}
            <FeatureRow
              title="Study with friends"
              description="Create study groups, share plans, compete on leaderboards, and motivate each other. Learning is better together."
              icon={<Users className="w-12 h-12" />}
              gradient="from-accent to-primary"
              direction="left"
            />
          </div>
        </div>
      </section>

      {/* More Testimonials */}
      <section className="py-32 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold mb-6">
              Students love it
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                quote: "I went from feeling completely lost to having a clear path forward. Got A's in all my subjects!",
                author: "Michael Thompson",
                role: "GCSE Student",
                initial: "M"
              },
              {
                quote: "The smart scheduling is incredible. It knows exactly when I need breaks and when to push harder.",
                author: "Emma Rodriguez",
                role: "A-Level Student",
                initial: "E"
              },
              {
                quote: "Love how it blocks out my events automatically. No more double-booking study sessions with my part-time job!",
                author: "James Wilson",
                role: "Year 11 Student",
                initial: "J"
              },
              {
                quote: "Study groups feature is brilliant. We all share our plans and keep each other accountable.",
                author: "Priya Patel",
                role: "University Student",
                initial: "P"
              }
            ].map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center space-y-10 p-16 rounded-[3rem] bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold">
              Ready to stop stressing?
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of students who are studying smarter, not harder.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-12 py-8 bg-gradient-to-r from-primary to-secondary hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-xl group rounded-full"
            >
              Create your plan — it's free
              <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg">StudyPlanAI</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              <a href="#" className="hover:text-foreground transition-colors">Help</a>
            </div>
            
            <p className="text-sm text-muted-foreground">© 2025 StudyPlanAI. Made with <Heart className="w-4 h-4 inline text-secondary" /> for students</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const StoryCard = ({ item, index }: { item: any; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      className="relative"
    >
      <div className="absolute -top-6 -left-6 w-16 h-16 rounded-2xl bg-gradient-to-br shadow-lg flex items-center justify-center text-white font-display font-bold text-2xl z-10"
        style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
      >
        <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
          {item.step}
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-3xl p-8 pt-12 hover:shadow-lg transition-all duration-300 h-full">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-6`}>
          {item.icon}
        </div>
        <h3 className="text-2xl font-display font-bold mb-4">{item.title}</h3>
        <p className="text-muted-foreground leading-relaxed">{item.description}</p>
      </div>
    </motion.div>
  );
};

const FeatureRow = ({ title, description, icon, gradient, direction }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: direction === "left" ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8 }}
      className={`flex flex-col ${direction === "right" ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-16`}
    >
      <div className="flex-1 space-y-6">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <h3 className="text-3xl sm:text-4xl font-display font-bold leading-tight">{title}</h3>
        <p className="text-xl text-muted-foreground leading-relaxed">{description}</p>
      </div>
      
      <div className="flex-1">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`aspect-video rounded-3xl bg-gradient-to-br ${gradient} opacity-20 shadow-2xl`}
        />
      </div>
    </motion.div>
  );
};

const TestimonialCard = ({ testimonial, index }: { testimonial: any; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className="bg-card border border-border rounded-3xl p-8 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex gap-1 mb-6">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-accent text-accent" />
        ))}
      </div>
      <p className="text-lg text-foreground leading-relaxed mb-6">"{testimonial.quote}"</p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
          {testimonial.initial}
        </div>
        <div>
          <p className="font-semibold">{testimonial.author}</p>
          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Landing;
