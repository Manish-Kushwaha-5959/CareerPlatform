// Create a new file: src/components/chat/AIMentorFloatingChat.jsx

import { useEffect, useState, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Minus } from "lucide-react"
import axios from "axios"

const AIMentorFloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your assistant. Ask me about courses, exams, or colleges." },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Open AI Career Mentor Chat"
        >
          <span className="text-2xl">🤖</span>
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-hidden"
          >
            <Card className="h-full rounded-none border-none">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white flex flex-row items-center justify-between px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">🤖</span> AI Career Mentor
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-blue-600 p-1"
                  aria-label="Minimize chat"
                >
                  <Minus className="h-6 w-6" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 flex flex-col h-[calc(100%-4rem)]">
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-sm max-w-[85%] ${
                        msg.from === "bot"
                          ? "bg-gray-100 text-gray-800 self-start"
                          : "bg-blue-500 text-white self-end"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-xl text-sm max-w-[85%] self-start">
                      <span className="animate-pulse">Typing...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AIMentorFloatingChat;