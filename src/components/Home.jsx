"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  Zap,
  ArrowRight,
  TrendingUp,
  Clock,
  Target,
  Medal,
  Lightbulb,
} from "lucide-react"
import { useUser } from "@clerk/clerk-react"

export default function HomePage() {
  const { user } = useUser()
  const [userName] = useState(user?.firstName || "Student")

  // Dashboard cards with key metrics
  const dashboardCards = [
    {
      title: "Quizzes Completed",
      value: "3",
      change: "+2 this month",
      icon: BookOpen,
      color: "bg-blue-500",
      href: "/quiz/stage-1",
    },
    {
      title: "Career Matches",
      value: "5",
      change: "Top: Software Engineer",
      icon: Briefcase,
      color: "bg-purple-500",
      href: "/simulator",
    },
    {
      title: "Colleges Saved",
      value: "8",
      change: "IIT, NIT, and others",
      icon: GraduationCap,
      color: "bg-green-500",
      href: "/colleges",
    },
    {
      title: "Study Progress",
      value: "65%",
      change: "Keep it up!",
      icon: TrendingUp,
      color: "bg-orange-500",
      href: "/content",
    },
  ]

  const quickLinks = [
    {
      label: "Take Quiz",
      icon: Target,
      href: "/quiz/stage-1",
      description: "Discover your strengths",
    },
    {
      label: "Career Simulator",
      icon: Zap,
      href: "/simulator",
      description: "Explore career paths",
    },
    {
      label: "Browse Colleges",
      icon: GraduationCap,
      href: "/colleges",
      description: "View college details",
    },
    {
      label: "Study Materials",
      icon: BookOpen,
      href: "/content",
      description: "Access resources",
    },
    {
      label: "Timeline Tracker",
      icon: Clock,
      href: "/timeline",
      description: "Plan your journey",
    },
    // {
    //   label: "My Bookmarks",
    //   icon: Medal,
    //   href: "/bookmarks",
    //   description: "View saved items",
    // },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Welcome Section */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Welcome back, {userName}!</h1>
            <p className="text-slate-600">Continue your journey towards your dream career and college</p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dashboard Cards */}
        <section className="mb-12">
          {/* <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Recommendations</h2> */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardCards.map((card, idx) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${card.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-slate-600 text-sm font-medium mb-1">{card.title}</h3>
                  <div className="mb-3">
                    <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{card.change}</p>
                  </div>
                  <Link to={card.href}>
                    <button className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 py-2 rounded-lg transition-colors">
                      View →
                    </button>
                  </Link>
                </motion.div>
              )
            })}
          </div> */}
        </section>

        {/* Quick Links Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link, idx) => {
              const Icon = link.icon
              return (
                <Link key={idx} to={link.href}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-lg border border-slate-200 p-5 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-100 rounded-lg">
                        <Icon className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{link.label}</p>
                        <p className="text-xs text-slate-500">{link.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Recommended Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Next Steps</h2>
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 flex items-start gap-4"
            >
              <div className="p-3 bg-blue-100 rounded-lg">
                <Lightbulb className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Take the Aptitude Quiz</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Get personalized recommendations based on your strengths and interests.
                </p>
                <Link to="/quiz">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Start Quiz →</button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 flex items-start gap-4"
            >
              <div className="p-3 bg-green-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Complete Your Profile</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Add more details to get better college and career recommendations.
                </p>
                <Link to="/profile">
                  <button className="text-sm font-medium text-green-600 hover:text-green-700">Edit Profile →</button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}
