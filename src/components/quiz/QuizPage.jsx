// Updated QuizPage.jsx — fixes for intermittent question loading and stale-state bugs
"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardHeader, CardContent, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Alert, AlertDescription } from "../ui/alert"
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Trophy, Loader2, Phone, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Confetti from "react-dom-confetti"
import axios from "axios"

// Configurable constants (match backend)
const NUM_OPEN = 12
const NUM_RIASEC = 5
const NUM_OCEAN = 5
const TOTAL_QUESTIONS = NUM_OPEN + NUM_RIASEC + NUM_OCEAN

const API_BASE_URL = "http://127.0.0.1:8080/api/quiz"
const CALL_API_URL = "http://127.0.0.1:8080/api/trigger-call"

/* -------------------------
   Small presentational helpers
   ------------------------- */
const StepDot = ({ active }) => (
  <div className={`w-3 h-3 rounded-full ${active ? "bg-blue-600" : "bg-gray-200"}`} aria-hidden="true" />
)

const ProgressRing = ({ progress }) => {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" aria-hidden="true">
      <svg width="100" height="100" className="transform -rotate-90">
        <circle cx="50" cy="50" r={radius} stroke="#e5e7eb" strokeWidth="8" fill="transparent" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="url(#gradient)"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{progress}%</span>
      </div>
    </div>
  )
}

const LikertEmoji = ({ value, selected, onClick }) => {
  const emojis = ["😞", "🙁", "😐", "🙂", "😊"]
  return (
    <motion.button
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(value)}
      aria-pressed={selected}
      aria-label={`Rate ${value}`}
      className={`text-4xl p-3 rounded-full transition-all focus:outline-none focus:ring-2 ${
        selected ? "bg-blue-100 scale-110 shadow-lg" : "hover:bg-gray-100"
      }`}
    >
      {emojis[value - 1]}
    </motion.button>
  )
}

/* -------------------------
   Phone Call Modal Component
   ------------------------- */
const PhoneCallModal = ({ isOpen, onClose, onStartCall }) => {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isCalling, setIsCalling] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!phoneNumber.trim()) {
      setError("Please enter your mobile number.")
      return
    }
    // Simple validation for phone number (e.g., Indian format: 10 digits)
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(phoneNumber.replace(/\D/g, ""))) {
      setError("Please enter a valid 10-digit mobile number.")
      return
    }

    setError("")
    setIsCalling(true)

    try {
      const response = await axios.post(CALL_API_URL, { phone: `+91${phoneNumber}` })
      if (response.data.status === "call placed") {
        onStartCall(response.data.call_sid)
        onClose()
      } else {
        throw new Error("Failed to initiate call.")
      }
    } catch (err) {
      console.error("Call initiation error:", err)
      setError("Failed to start the call. Please try again.")
    } finally {
      setIsCalling(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Start Voice Quiz Call
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-blue-100 mt-2">Enter your mobile number to receive a call for the voice-based career quiz.</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., 9876543210"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCalling}
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <Button
                type="submit"
                disabled={isCalling || !phoneNumber.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 rounded-xl"
              >
                {isCalling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initiating Call...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Start Call
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

/* -------------------------
   Main QuizPage component
   ------------------------- */
const QuizPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([]) // Track loaded questions for UI
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [points, setPoints] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false) // New: Track completion

  // Phone call modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [callStatus, setCallStatus] = useState("")

  // Chat / mentor states
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your assistant. Ask me about courses, exams, or colleges." },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)
  const focusErrorRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Start quiz session and load first question
  useEffect(() => {
    const startQuiz = async () => {
      try {
        const startRes = await axios.post(`${API_BASE_URL}/start`)
        const sid = startRes.data.session_id
        if (sid) {
          // set state AND immediately use the returned session id to fetch the first question.
          setSessionId(sid)
          console.log("Session started with ID:", sid)
          // IMPORTANT: pass sid directly rather than relying on state-update timing
          await loadQuestion(sid)
        } else {
          throw new Error("Failed to start quiz session")
        }
      } catch (err) {
        console.error("Error starting quiz:", err)
        setError("Could not start quiz. Please check your connection.")
      } finally {
        setLoading(false)
      }
    }

    startQuiz()
  }, [])

  // loadQuestion now accepts an optional session id so caller can pass the id returned by the start endpoint.
  const loadQuestion = async (sidParam) => {
    const sid = sidParam || sessionId
    if (!sid) return
    setLoading(true)

    try {
      const response = await axios.post(`${API_BASE_URL}/question`, { session_id: sid })
      console.log("Loaded question response:", response.data) // Debug log for full response

      if (response.data.stage === "done") {
        console.log("Quiz is complete - no more questions.")
        setQuizComplete(true)
        setLoading(false)
        return
      }

      const qData = response.data
      const questionBase = {
        stage: qData.stage,
        number: qData.question_number,
        totalInStage: qData.total_in_stage,
        text: qData.question,
        type: qData.type,
        trait: qData.trait || null,
        icon: getStageIcon(qData.stage, qData.trait),
      }

      // Use functional updater to avoid stale closure over `questions` length
      setQuestions((prev) => {
        const idx = prev.length
        const qWithId = { ...questionBase, id: `q${idx}` }
        // update current to new index
        setCurrent(idx)
        return [...prev, qWithId]
      })
    } catch (err) {
      console.error("Error loading question:", err)
      setError("Failed to load next question.")
    } finally {
      setLoading(false)
    }
  }

  // Helper to get icon based on stage/trait
  const getStageIcon = (stage, trait) => {
    const icons = {
      open: "💭",
      riasec: { R: "🔧", I: "🔬", A: "🎨", S: "👥", E: "💼", C: "📊" },
      ocean: { O: "🌊", C: "🎭", E: "⚡", A: "😊", N: "🌀" },
    }
    if (stage === "open") return icons.open
    if (stage === "riasec" && trait) return icons.riasec[trait] || "❓"
    if (stage === "ocean" && trait) return icons.ocean[trait] || "❓"
    return "❓"
  }

  /* -------------------------
     Chat helpers (unchanged)
  ------------------------- */
  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg = { from: "user", text: input }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    try {
      const payload = {
        messages: [
          { role: "system", content: "You are a friendly career advisor chatbot." },
          { role: "user", content: input },
        ],
      }

      const res = await axios.post("http://127.0.0.1:8080/api/chat", payload, {
        headers: { "Content-Type": "application/json" },
      })

      const botReply = res.data?.reply || res.data?.content || "Hmm... I couldn't process that. Please try again."

      setMessages((prev) => [...prev, { from: "bot", text: botReply }])
    } catch (err) {
      console.error("Chat API Error:", err)
      setMessages((prev) => [...prev, { from: "bot", text: "Sorry, I couldn't connect to the server." }])
    } finally {
      setIsTyping(false)
    }
  }

  /* -------------------------
     Quiz helpers
  ------------------------- */
  const answeredCount = Object.keys(answers).length
  const progress = TOTAL_QUESTIONS === 0 ? 0 : Math.round((answeredCount / TOTAL_QUESTIONS) * 100)
  const q = questions[current] || null

  const validateAnswerValue = (question, value) => {
    if (!question) return false
    if (question.type === "text") {
      return typeof value === "string" && value.trim().length > 0
    }
    if (question.type === "rating") {
      const v = Number(value)
      return Number.isInteger(v) && v >= 1 && v <= 5
    }
    return false
  }

  // setAnswer uses functional update to avoid stale answers state and to update points reliably
  const setAnswer = (qid, value) => {
    setAnswers((prev) => {
      const exists = Object.prototype.hasOwnProperty.call(prev, qid)
      if (!exists) {
        // increment points once when first answering this question
        setPoints((p) => p + 10)
      }
      return { ...prev, [qid]: value }
    })
    setError("")
  }

  const next = async () => {
    if (!q) {
      setError("No question loaded. Please refresh.")
      return
    }

    const answerValue = answers[q.id]
    if (!validateAnswerValue(q, answerValue)) {
      setError("Please provide a valid response for this question.")
      focusErrorRef.current?.focus?.()
      return
    }
    setError("")

    try {
      setLoading(true)
      // Submit answer and get next question (or done)
      const response = await axios.post(`${API_BASE_URL}/answer`, {
        session_id: sessionId,
        answer: answerValue,
      })
      console.log("Answer response (next question or done):", response.data) // Debug

      if (response.data.stage === "done") {
        console.log("Quiz completed after answer submission.")
        setQuizComplete(true)
      } else {
        const qData = response.data
        const questionBase = {
          stage: qData.stage,
          number: qData.question_number,
          totalInStage: qData.total_in_stage,
          text: qData.question,
          type: qData.type,
          trait: qData.trait || null,
          icon: getStageIcon(qData.stage, qData.trait),
        }

        // Use functional updater to append next question and advance current index
        setQuestions((prev) => {
          const idx = prev.length
          const qWithId = { ...questionBase, id: `q${idx}` }
          setCurrent(idx)
          return [...prev, qWithId]
        })
      }
    } catch (err) {
      console.error("Error submitting answer:", err)
      setError("Failed to save your answer. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const prev = () => {
    setError("")
    if (current > 0) setCurrent((c) => c - 1)
  }

  const submit = async () => {
    setSubmitting(true)
    setShowConfetti(true)

    try {
      // Get recommendations
      const recResponse = await axios.post(`${API_BASE_URL}/recommend`, { session_id: sessionId })
      console.log("Recommendations Response:", recResponse.data) // Log recommendations for check
      if (recResponse.data) {
        // Store results in sessionStorage
        sessionStorage.setItem("quizResults", JSON.stringify(recResponse.data))

        setTimeout(() => {
          navigate("/quiz/results/demo-attempt")
        }, 1200)
      } else {
        throw new Error("No recommendations received")
      }
    } catch (err) {
      console.error("Submit Error:", err)
      setError("Could not generate recommendations. Please check your connection.")
      setShowConfetti(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStartCall = (callSid) => {
    setCallStatus(`Call initiated! Call SID: ${callSid}. You'll receive a call shortly.`)
    setTimeout(() => setCallStatus(""), 5000)
  }

  /* -------------------------
     Render loading state
  ------------------------- */
  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Starting your personalized quiz...</p>
        </div>
      </div>
    )
  }

  /* -------------------------
     Render main quiz
  ------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-[2fr_1fr] gap-8">
          <main>
            {/* Disclaimer */}
            <Alert className="mb-6 bg-yellow-50 border-yellow-200 rounded-xl">
              <AlertDescription className="text-yellow-800 text-sm">
                <strong>Important:</strong> For the most accurate career recommendations tailored to your unique profile, please answer all questions honestly and thoughtfully. Your genuine responses will help us provide insights that truly align with your interests, personality, and goals.
              </AlertDescription>
            </Alert>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
                {/* <span className="text-sm text-gray-500">
                  Est. {Math.round(TOTAL_QUESTIONS * 3)} mins
                </span> */}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">Comprehensive Career Assessment</h1>
              <p className="text-gray-600 mb-4">
                Share your thoughts openly, rate your interests, and reflect on your personality to discover fitting career paths.
              </p>

              {/* Progress and Points */}
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ProgressRing progress={progress} />
                  <div className="flex items-center gap-1">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold text-gray-800">{points} pts</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap" aria-hidden="true">
                  {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <StepDot active={!!answers[`q${idx}`]} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Question Card */}
            {!q ? (
              <Card className="mb-6 rounded-xl shadow-md p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">No Questions Loaded</h3>
                <p className="text-gray-600 mb-4">Please refresh the page and try again.</p>
                <Button onClick={() => window.location.reload()}>Reload Quiz</Button>
              </Card>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.45 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <Card className="mb-6 rounded-xl shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-white to-blue-50">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl" aria-hidden="true">
                          {q.icon}
                        </span>
                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                          {q.stage.toUpperCase()} ({q.number}/{q.totalInStage})
                        </span>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 leading-tight">{q.text}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {q.type === "text" && (
                        <div className="mt-6">
                          <textarea
                            value={answers[q.id] || ""}
                            onChange={(e) => setAnswer(q.id, e.target.value)}
                            placeholder="Share your thoughts here..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      )}

                      {q.type === "rating" && (
                        <div className="flex gap-4 mt-6 justify-center" role="radiogroup" aria-label="Rating scale">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <LikertEmoji
                              key={val}
                              value={val}
                              selected={answers[q.id] === val}
                              onClick={(v) => setAnswer(q.id, v)}
                            />
                          ))}
                          <div className="flex flex-col justify-center text-center text-sm text-gray-500 ml-4">
                            {/* <span>Strongly Disagree</span> */}
                            {/* <span className="text-xs">→</span> */}
                            {/* <span>Strongly Agree</span> */}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Inline error message */}
            {error && (
              <div
                ref={focusErrorRef}
                tabIndex={-1}
                aria-live="assertive"
                className="text-red-600 text-sm font-medium mt-2"
              >
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  onClick={prev}
                  disabled={current === 0 || loading}
                  className="bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400 rounded-2xl px-8 py-3 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-disabled={current === 0 || loading}
                >
                  Previous
                </Button>
              </motion.div>

              {quizComplete ? (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={submit}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 rounded-2xl px-8 py-3 font-bold shadow-lg flex items-center disabled:opacity-60"
                      disabled={submitting || loading}
                      aria-disabled={submitting || loading}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating Report...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" /> Get Recommendations
                        </>
                      )}
                    </Button>
                  </motion.div>

                  <div className="ml-4">
                    <Confetti
                      active={showConfetti}
                      config={{
                        angle: 90,
                        spread: 90,
                        startVelocity: 40,
                        elementCount: 100,
                        dragFriction: 0.1,
                        duration: 3000,
                        stagger: 3,
                        width: "8px",
                        height: "8px",
                        colors: ["#aabbff", "#99ddff", "#7799ee"],
                      }}
                    />
                  </div>
                </>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={next}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 rounded-2xl px-8 py-3 font-bold shadow-lg disabled:opacity-60"
                    disabled={!q || !validateAnswerValue(q, answers[q.id]) || loading}
                    aria-disabled={!q || !validateAnswerValue(q, answers[q.id]) || loading}
                  >
                    {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                    Next <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </motion.div>
              )}
            </div>
          </main>

          {/* AI Mentor */}
          <aside className="hidden md:block sticky top-8 self-start">
            <Card className="rounded-2xl shadow-lg border-2 border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-2xl">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span> AI assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 overflow-y-auto mb-4 space-y-3">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-sm ${
                        msg.from === "bot" ? "bg-gray-100 text-gray-800" : "bg-blue-500 text-white ml-8"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-xl text-sm">
                      <span className="animate-pulse">Typing...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isTyping}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4"
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {/* Floating Phone Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg flex items-center justify-center z-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Start voice quiz via phone call"
      >
        <Phone className="h-6 w-6" />
      </motion.button>

      {/* Call Status Toast */}
      {callStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50"
        >
          {callStatus}
        </motion.div>
      )}

      {/* Phone Call Modal */}
      <PhoneCallModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onStartCall={handleStartCall}
      />
    </div>
  )
}

export default QuizPage
