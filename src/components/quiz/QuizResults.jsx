// Updated QuizResults.jsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardHeader, CardContent, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import {
  ArrowLeft,
  BookOpen,
  Target,
  GraduationCap,
  Award,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"

/**
 * QuizResults.jsx
 * - Displays results from backend API (/recommend)
 * - Shows categories with reasons
 * - Detailed recommendations: career, reason, stream, degrees/specializations, advice, confidence
 * - Removed RIASEC radar chart and top traits (no scores in new JSON)
 * - Logs results to console and updates student profile with quiz_results
 */

const API_BASE_URL = "http://127.0.0.1:8080/api"

const QuizResults = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState(null)
  const [error, setError] = useState("")
  const [expandedCareer, setExpandedCareer] = useState(null)
  const [updating, setUpdating] = useState(false)

  // Fetch user_id from localStorage "apnidisha_student_profile"
  const getUserIdFromLocalStorage = () => {
    try {
      const studentProfile = JSON.parse(localStorage.getItem("apnidisha_student_profile") || "{}")
      return studentProfile.user_id || null
    } catch (err) {
      console.error("Error parsing student profile from localStorage:", err)
      return null
    }
  }

  const userId = getUserIdFromLocalStorage()

  useEffect(() => {
    const storedResults = sessionStorage.getItem("quizResults")
    if (storedResults) {
      try {
        const parsed = JSON.parse(storedResults)
        setResults(parsed)
      } catch (err) {
        console.error("Failed to parse results:", err)
        setError("Failed to load quiz results.")
      }
    } else {
      setError("No quiz results found. Please take the quiz first.")
    }
    setLoading(false)
  }, [])

  // Update student profile with quiz results after loading
  useEffect(() => {
    if (results && userId) {
      console.log("Quiz Results:", results)
      updateStudentProfile(results)
    } else if (results) {
      console.log("Quiz Results (no update - missing user_id):", results)
    }
  }, [results, userId])

  const updateStudentProfile = async (quizData) => {
    if (!userId) {
      console.warn("Skipping update: user_id not available")
      return
    }

    setUpdating(true)
    try {
      // Use existing PUT /api/students/<user_id> route to update with quiz_results field
      const response = await axios.put(`${API_BASE_URL}/students/${userId}`, {
        quiz_results: quizData,
        updated_at: new Date().toISOString(), // Optional: add timestamp
      })

      if (response.data.success) {
        console.log("Student profile updated successfully with quiz results")
      } else {
        console.error("Update failed:", response.data.message)
      }
    } catch (err) {
      console.error("Error updating student profile:", err)
    } finally {
      setUpdating(false)
    }
  }

  const categories = results?.categories || []
  const recommendations = results?.recommendations || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading Results...</p>
        </div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto text-center py-24">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Results Unavailable</h2>
          <p className="text-gray-700 mb-6">{error || "Something went wrong."}</p>
          <Button onClick={() => navigate("/quiz")} className="px-6 py-3">
            Take the Quiz
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Back button */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => navigate("/quiz")}
            className="bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to Assessments
          </Button>
          {updating && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
        </div>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Your Personalized Career Assessment Report</h1>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Based on your open-ended responses, RIASEC interests, and OCEAN personality traits, we've analyzed your profile to recommend tailored career paths for your journey in Classes 9–12 and beyond.
          </p>
        </div>

        {/* Career Categories */}
        {categories.length > 0 && (
          <Card className="overflow-hidden rounded-3xl shadow-xl border border-blue-300">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-center">
              <CardTitle className="text-3xl font-extrabold text-white flex justify-center items-center gap-3">
                <Target className="h-7 w-7 text-white" />
                Identified Career Categories
              </CardTitle>
            </div>
            <CardContent className="p-8 bg-white">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-md"
                  >
                    <h3 className="font-bold text-xl text-blue-800 mb-3">{cat.name}</h3>
                    <p className="text-gray-700 leading-relaxed text-sm">{cat.reason}</p>
                  </motion.div>
                ))}
              </div>
              <p className="text-gray-600 max-w-xl mx-auto text-center mt-6 italic">
                These categories are derived from your interests, personality, and preferences, ensuring a holistic match.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Career Recommendations */}
        <Card className="rounded-3xl shadow-xl hover:shadow-2xl transition-all bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <BookOpen className="h-6 w-6 text-green-600" /> Top Career Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <div className="text-center text-gray-600 p-8">No career recommendations available.</div>
            ) : (
              <div className="space-y-6">
                {recommendations.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border-2 border-gray-200 hover:border-green-300 transition-all"
                  >
                    {/* Rank Badge with Confidence */}
                    <div className="absolute -top-3 -left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full w-12 h-12 flex flex-col items-center justify-center font-bold shadow-lg text-sm">
                      <span>#{idx + 1}</span>
                      <span className="text-xs mt-1">{rec.confidence}%</span>
                    </div>

                    {/* Career Header */}
                    <div className="flex items-start justify-between mb-4 ml-6">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-900 mb-2">{rec.career}</h3>

                        {/* Category Badge */}
                        {rec.category && (
                          <span className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-md mb-3">
                            {rec.category}
                          </span>
                        )}

                        {/* Stream Badge */}
                        {rec.stream && (
                          <span className="inline-block bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-md mb-3 ml-2">
                            {rec.stream} Stream
                          </span>
                        )}

                        {/* Career Type */}
                        {rec.career_type && (
                          <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md mb-3 ml-2">
                            {rec.career_type}
                          </span>
                        )}

                        {/* Reason */}
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">{rec.reason}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedCareer(expandedCareer === idx ? null : idx)}
                        className="ml-4"
                      >
                        {expandedCareer === idx ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>

                    {/* Expandable: Advice, Degrees & Specializations */}
                    <AnimatePresence>
                      {expandedCareer === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden ml-6"
                        >
                          <div className="border-t border-gray-200 pt-4 mt-2 space-y-4">
                            {/* Advice */}
                            {rec.advice && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                  🎯 Personalized Advice
                                </h4>
                                <p className="text-gray-700 text-sm">{rec.advice}</p>
                              </div>
                            )}

                            {/* Degrees & Specializations */}
                            {rec.degrees && rec.degrees.length > 0 && (
                              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100">
                                <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                  <GraduationCap className="h-5 w-5 text-purple-500" />
                                  Recommended Degrees & Specializations
                                </h4>
                                <div className="space-y-3">
                                  {rec.degrees.map((degreeObj, dIdx) => (
                                    <div key={dIdx} className="bg-white p-3 rounded-lg border border-gray-200">
                                      <div className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                                        <Award className="h-4 w-4" />
                                        {degreeObj.degree}
                                      </div>
                                      {degreeObj.specializations && degreeObj.specializations.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                          {degreeObj.specializations.map((spec, sIdx) => (
                                            <span
                                              key={sIdx}
                                              className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm border border-purple-200"
                                            >
                                              {spec}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Show expand hint if expandable content exists */}
                    {(rec.degrees && rec.degrees.length > 0) || rec.advice ? (
                      <div className="ml-6 mt-2 text-sm text-blue-600">
                        Click to view detailed advice and degrees
                      </div>
                    ) : null}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-6">
          <Button
            onClick={() => {
              sessionStorage.removeItem("quizResults")
              navigate("/quiz")
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 rounded-2xl px-8 py-3 font-bold shadow-lg"
          >
            Retake Quiz
          </Button>

          <Button
            onClick={() => {
              
              navigate("/roadmap")
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 rounded-2xl px-8 py-3 font-bold shadow-lg"
          >
            Generate Roadmap
          </Button>
        </div>
      </div>
    </div>
  )
}

export default QuizResults