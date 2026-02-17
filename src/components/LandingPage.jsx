"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  GraduationCap,
  BookOpen,
  Compass,
  CheckCircle,
  ArrowRight,
  Award,
  Users,
  TrendingUp,
  Globe,
  ChevronLeft,
  ChevronRight,
  Shield,
  Target,
} from "lucide-react"
import Footer from "./layout/Footer"

const LandingPage = () => {
  const [stats, setStats] = useState({
    studentsGuided: 10000,
    collegesListed: 500,
    careerPaths: 50,
    studyResources: 1000,
  })
  const [loading, setLoading] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Aptitude Assessment",
      description:
        "Comprehensive career aptitude quiz designed by education experts to identify your strengths and interests.",
    },
    {
      icon: <Compass className="h-8 w-8" />,
      title: "Career Path Guidance",
      description: "Personalized career pathways based on your profile, stream, and government college availability.",
    },
    {
      icon: <GraduationCap className="h-8 w-8" />,
      title: "College Directory",
      description:
        "Explore 500+ government colleges with detailed information on courses, eligibility, and admissions.",
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Study Resources",
      description: "Curated study materials and resources to help you excel in your board exams and competitive exams.",
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Expert Guidance",
      description: "AI-powered recommendations and advice from education professionals to guide your journey.",
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Progress Tracking",
      description: "Monitor your academic progress and career preparation with personalized timelines.",
    },
  ]

  const testimonials = [
    {
      name: "Rahul Sharma",
      class: "Class 12 Student",
      school: "Government Senior Secondary School",
      text: "This platform helped me choose the right stream and college. The guidance was clear and based on actual career data.",
      rating: 5,
    },
    {
      name: "Ananya Patel",
      class: "Class 10 Student",
      school: "Central Government School",
      text: "The aptitude quiz was really helpful. It gave me insights about career options I had never considered.",
      rating: 5,
    },
    {
      name: "Rohan Mehta",
      class: "Class 11 Student",
      school: "Government School",
      text: "Finally a trustworthy platform for career guidance. Recommended by my school counselor!",
      rating: 5,
    },
  ]

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-slate-600 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="mb-6 inline-block">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-sm font-medium">
                <Shield className="h-4 w-4" />
                Government Career Guidance Initiative
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">Your Future Starts Here</h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Discover the right career path with personalized guidance, expert insights, and comprehensive college
              information.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Start Your Journey
                </Button>
              </Link>
              <Link to="/colleges">
                <Button
                  variant="outline"
                  className="border-2 border-blue-400 text-white hover:bg-blue-500/10 px-8 py-6 text-lg font-semibold rounded-lg backdrop-blur-sm w-full sm:w-auto bg-transparent"
                >
                  <Compass className="mr-2 h-5 w-5" />
                  Explore Colleges
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Comprehensive Career Guidance</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to make informed decisions about your education and career
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 bg-white">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Trusted by Students Across India</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              { number: "10K+", label: "Students Guided", icon: <Users className="h-8 w-8" /> },
              { number: "500+", label: "Colleges Listed", icon: <GraduationCap className="h-8 w-8" /> },
              { number: "50+", label: "Career Paths", icon: <TrendingUp className="h-8 w-8" /> },
              { number: "1K+", label: "Study Resources", icon: <BookOpen className="h-8 w-8" /> },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-center mb-4 text-blue-600">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{stat.number}</div>
                <div className="text-slate-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 bg-blue-50 px-6 py-4 rounded-lg border border-blue-200">
              <Award className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-slate-900">Government Approved</span>
            </div>
            <div className="flex items-center gap-3 bg-green-50 px-6 py-4 rounded-lg border border-green-200">
              <Shield className="h-6 w-6 text-green-600" />
              <span className="font-semibold text-slate-900">Verified Content</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 px-6 py-4 rounded-lg border border-slate-200">
              <CheckCircle className="h-6 w-6 text-slate-600" />
              <span className="font-semibold text-slate-900">Expert Guidance</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Student Success Stories</h2>
            <p className="text-lg text-slate-600">See how students like you are achieving their career goals</p>
          </motion.div>

          <div className="relative">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white border border-slate-200 shadow-lg">
                <CardContent className="p-10">
                  <div className="flex justify-start gap-1 mb-6">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <div key={i} className="text-yellow-400 text-xl">
                        ★
                      </div>
                    ))}
                  </div>
                  <blockquote className="text-lg text-slate-700 mb-8 leading-relaxed">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>
                  <div className="border-t pt-6">
                    <div className="font-semibold text-slate-900 text-lg">{testimonials[currentTestimonial].name}</div>
                    <div className="text-slate-600 text-sm">{testimonials[currentTestimonial].class}</div>
                    <div className="text-slate-500 text-sm">{testimonials[currentTestimonial].school}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="flex justify-center items-center mt-8 gap-6">
              <Button variant="outline" size="sm" onClick={prevTestimonial} className="rounded-full bg-transparent">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentTestimonial ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  />
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={nextTestimonial} className="rounded-full bg-transparent">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Discover Your Career?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students making informed decisions about their future. Start your free aptitude
              assessment today.
            </p>
            <Link to="/login">
              <Button className="bg-white text-blue-600 hover:bg-slate-100 px-10 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      {/* <footer className="bg-slate-900 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-white mb-4">About</h4>
              <p className="text-sm leading-relaxed">
                Government-backed career guidance platform for students in class 9-12.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="text-sm space-y-2">
                <li>
                  <a href="/colleges" className="hover:text-white transition">
                    Colleges
                  </a>
                </li>
                <li>
                  <a href="/quiz" className="hover:text-white transition">
                    Quizzes
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Study Materials
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="text-sm space-y-2">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="/about" className="hover:text-white transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Help Center
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="text-sm space-y-2">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-sm">
            <p>&copy; 2025 ApniDisha - Government Career Guidance Initiative. All rights reserved.</p>
          </div>
        </div>
      </footer> */}
      <Footer/>
      
    </div>
  )
}

export default LandingPage;
