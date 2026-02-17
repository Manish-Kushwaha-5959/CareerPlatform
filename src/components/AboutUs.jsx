"use client"
import { motion } from "framer-motion"
import { Users, Target, Zap, Shield, Globe, Lightbulb, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "./ui/button"
import { Link } from "react-router-dom"

const AboutUs = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  // Hero Section
  const HeroSection = () => (
    <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white py-20 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h1
          className="text-5xl md:text-6xl font-bold mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Apni Disha
        </motion.h1>
        <motion.p
          className="text-2xl md:text-3xl text-blue-200 mb-4 font-medium"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Your Personal AI Mentor for a Better Tomorrow
        </motion.p>
        <motion.p
          className="text-lg text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          A government-backed career guidance platform empowering students from class 9-12 to discover their strengths,
          explore the right career paths, and receive personalized guidance powered by scientific assessments and AI
          innovation.
        </motion.p>
        <motion.div
          className="text-blue-200 text-sm font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Clarity Today, Confidence Tomorrow
        </motion.div>
      </div>
    </div>
  )

  // Problem-Solution Section
  const ProblemSolutionSection = () => (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">The Challenge & Our Solution</h2>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Problem */}
          <motion.div
            className="bg-gradient-to-br from-red-50 to-orange-50 p-8 rounded-xl"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-6">The Problem</h3>
            <ul className="space-y-4">
              {[
                "Students feel confused about which career to choose",
                "No access to proper guidance in most schools",
                "Parents and peers create pressure, not clarity",
                "Students follow trends instead of discovering their true strengths",
                "Information is scattered, unverified, and overwhelming",
              ].map((item, idx) => (
                <motion.li
                  key={idx}
                  className="flex gap-3 items-start"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-600 font-bold text-sm">✕</span>
                  </div>
                  <span className="text-slate-700">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Solution */}
          <motion.div
            className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Our Solution</h3>
            <ul className="space-y-4">
              {[
                "AI-powered mentorship that guides students step by step",
                "Psychometric assessment based on the Holland scientific method",
                "Personalized career pathways built for each student",
                "Instant recommendations from our AI Mentor",
                "Easy-to-understand reports made for both students and parents",
              ].map((item, idx) => (
                <motion.li
                  key={idx}
                  className="flex gap-3 items-start"
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0" />
                  <span className="text-slate-700">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )

  // Mission & Vision Section
  const MissionVisionSection = () => (
    <section className="py-16 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="grid md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Mission Card */}
          <motion.div className="bg-white p-10 rounded-xl shadow-lg border-l-4 border-blue-600" variants={itemVariants}>
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-bold text-slate-900">Our Mission</h3>
            </div>
            <p className="text-slate-700 leading-relaxed text-lg">
              Our mission is to make world-class career guidance accessible to every student, helping them discover who
              they are and what they can become — with clarity, confidence, and the power of AI.
            </p>
          </motion.div>

          {/* Vision Card */}
          <motion.div
            className="bg-white p-10 rounded-xl shadow-lg border-l-4 border-purple-600"
            variants={itemVariants}
          >
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-8 h-8 text-purple-600" />
              <h3 className="text-2xl font-bold text-slate-900">Our Vision</h3>
            </div>
            <p className="text-slate-700 leading-relaxed text-lg">
              Our vision is to empower every student in India with the knowledge, direction, and guidance they deserve,
              building a future where career confusion is replaced with confidence and purpose.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )

  // Timeline Section
  const TimelineSection = () => (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">Our Journey So Far</h2>

        <div className="relative">
          {/* Timeline line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-purple-600 transform -translate-x-1/2"></div>

          {/* Timeline items */}
          <div className="space-y-12">
            {[
              {
                number: "1",
                title: "Understanding Students",
                description: "We started by studying the real challenges students face while choosing a career.",
                icon: Users,
              },
              {
                number: "2",
                title: "Building the Psychometric Engine",
                description: "We integrated Holland's scientific method to create accurate, meaningful assessments.",
                icon: Zap,
              },
              {
                number: "3",
                title: "Developing the AI Mentor",
                description:
                  "We trained an AI system to guide students like a real-life mentor — available anytime, anywhere.",
                icon: Lightbulb,
              },
              {
                number: "4",
                title: "Helping Schools & Students",
                description: "We now aim to support lakhs of students across India with personalized guidance.",
                icon: Globe,
              },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={idx}
                  className={`flex gap-8 md:gap-0 ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  {/* Content */}
                  <div className={`flex-1 ${idx % 2 === 0 ? "md:text-right md:pr-12" : "md:text-left md:pl-12"}`}>
                    <div className="bg-slate-50 p-6 rounded-lg">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-slate-600">{item.description}</p>
                    </div>
                  </div>

                  {/* Timeline point */}
                  <div className="flex justify-center md:flex-col">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold relative z-10 flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Empty space */}
                  <div className="flex-1 hidden md:block"></div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )

  // Core Values Section
  const ValuesSection = () => (
    <section className="py-16 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">What We Stand For</h2>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {[
            {
              title: "Student First",
              desc: "Everything we build is designed around student needs.",
              icon: Users,
              color: "blue",
            },
            {
              title: "Scientific Accuracy",
              desc: "Based on proven psychological frameworks.",
              icon: Zap,
              color: "purple",
            },
            {
              title: "Simplicity",
              desc: "Guidance explained in easy, friendly language.",
              icon: Lightbulb,
              color: "yellow",
            },
            { title: "Innovation", desc: "AI-powered tools that keep getting smarter.", icon: Globe, color: "green" },
            {
              title: "Accessibility",
              desc: "Great mentorship for every student, everywhere.",
              icon: Shield,
              color: "red",
            },
            {
              title: "Trust & Transparency",
              desc: "No confusion, no pressure — only clarity.",
              icon: Target,
              color: "indigo",
            },
          ].map((value, idx) => {
            const Icon = value.icon
            const colorMap = {
              blue: "from-blue-100 to-blue-50 border-blue-200 text-blue-600",
              purple: "from-purple-100 to-purple-50 border-purple-200 text-purple-600",
              yellow: "from-yellow-100 to-yellow-50 border-yellow-200 text-yellow-600",
              green: "from-green-100 to-green-50 border-green-200 text-green-600",
              red: "from-red-100 to-red-50 border-red-200 text-red-600",
              indigo: "from-indigo-100 to-indigo-50 border-indigo-200 text-indigo-600",
            }

            return (
              <motion.div
                key={idx}
                className={`bg-gradient-to-br ${colorMap[value.color]} p-8 rounded-lg border-l-4`}
                variants={itemVariants}
              >
                <div
                  className={`w-12 h-12 rounded-lg ${colorMap[value.color].split(" ")[0]} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-slate-700">{value.desc}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )

  // Impact Section
  const ImpactSection = () => (
    <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">The Impact We Aim to Create</h2>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {[
            { number: "1,00,000+", label: "Students to Be Guided" },
            { number: "10,000+", label: "Schools to Be Reached" },
            { number: "94%", label: "Accuracy using Holland Method" },
            { number: "Minutes", label: "For Personalized AI Reports" },
          ].map((stat, idx) => (
            <motion.div key={idx} className="text-center" variants={itemVariants}>
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
              <p className="text-blue-100">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )

  // CTA Section
  const CTASection = () => (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          className="text-4xl font-bold mb-6 text-slate-900"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Ready to Discover Your True Career Path?
        </motion.h2>
        <motion.p
          className="text-xl text-slate-600 mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Take the first step toward clarity — let our AI Mentor guide you through personalized career assessment and
          guidance.
        </motion.p>
        <motion.div
          className="flex gap-4 justify-center flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link to="/quiz">
            <Button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg">
              Start Career Assessment <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link to="/contact">
            <Button className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 text-lg">
              Get in Touch
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )

  return (
    <main className="bg-white">
      <HeroSection />
      <ProblemSolutionSection />
      <MissionVisionSection />
      <TimelineSection />
      <ValuesSection />
      <ImpactSection />
      <CTASection />
    </main>
  )
}

export default AboutUs;
