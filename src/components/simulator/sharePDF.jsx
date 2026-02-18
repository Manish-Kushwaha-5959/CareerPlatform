"use client"

import { useState } from "react"
import { Share2, Mail, MessageCircle, Copy, Check, X, Facebook, Twitter, Linkedin, Download } from "lucide-react"

/**
 * SharePdfModule Component
 * Handles sharing career summary PDF via multiple channels
 *
 * Props:
 * - pdfBlob: The PDF blob to share
 * - fileName: Name of the PDF file (default: 'career-summary.pdf')
 * - onClose: Callback when share modal is closed
 */
export default function SharePdfModule({ pdfBlob, fileName = "career-summary.pdf", onClose }) {
  const [showModal, setShowModal] = useState(true)
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

  // Check if Web Share API is available (mostly mobile)
  const hasNativeShare = typeof navigator !== "undefined" && navigator.share

  // Helper: Download PDF locally
  const downloadPdf = () => {
    try {
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.warn("Download failed:", err)
    }
  }

  const handleNativeShare = async () => {
    if (!hasNativeShare) return

    try {
      setSharing(true)

      // Check if Web Share API supports files
      if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName)] })) {
        await navigator.share({
          files: [new File([pdfBlob], fileName)],
          title: "My Career Analysis Report",
        })
      } else {
        // Fallback to generic share
        await navigator.share({
          title: "My Career Analysis Report",
          text: "Check out my career analysis report!",
          url: window.location.href,
        })
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.warn("Share failed:", err)
      }
    } finally {
      setSharing(false)
    }
  }

  const handleEmailShare = async () => {
    try {
      downloadPdf()
      setTimeout(() => {
        const subject = encodeURIComponent("My Career Analysis Report")
        const body = encodeURIComponent(
          "Please find my career analysis report attached. (Note: PDF was downloaded separately and should be attached manually)",
        )
        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank")
      }, 500)
    } catch (err) {
      console.warn("Email share failed:", err)
    }
  }

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      "📊 Check out my Career Analysis Report! 🎓\n\n" +
        "I've analyzed my career path and created a detailed report. " +
        "Download it from the app to view my complete analysis including courses, " +
        "colleges, skills, and projected outcomes.",
    )

    // Open WhatsApp with message
    window.open(`https://wa.me/?text=${message}`, "_blank")

    // Also trigger PDF download so user can share it
    setTimeout(() => {
      downloadPdf()
    }, 300)
  }

  const handleTelegramShare = () => {
    const message = encodeURIComponent(
      "📊 Check out my Career Analysis Report! 🎓\n\n" +
        "I've created a comprehensive career analysis document. " +
        "Download and share!",
    )
    window.open(`https://t.me/share/url?text=${message}&url=${window.location.href}`, "_blank")

    // Also trigger PDF download
    setTimeout(() => {
      downloadPdf()
    }, 300)
  }

  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.href)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400")

    // Download PDF for manual sharing
    setTimeout(() => {
      downloadPdf()
    }, 300)
  }

  const handleTwitterShare = () => {
    const text = encodeURIComponent("📊 Check out my Career Analysis Report! 🎓 #CareerPlanning #FutureReady")
    const url = encodeURIComponent(window.location.href)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "width=600,height=400")

    // Download PDF for manual sharing
    setTimeout(() => {
      downloadPdf()
    }, 300)
  }

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(window.location.href)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "width=600,height=400")

    // Download PDF for manual sharing
    setTimeout(() => {
      downloadPdf()
    }, 300)
  }

  const handleDownloadDirect = () => {
    downloadPdf()
  }

  const handleCopyDownloadLink = async () => {
    try {
      const text = `Career Analysis Report - ${fileName}`
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.warn("Copy failed:", err)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    if (onClose) onClose()
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Share2 className="w-6 h-6" />
              <h2 className="text-xl font-bold">Share Your Report</h2>
            </div>
            <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-sm opacity-90">Share your career analysis PDF with others</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Native Share (if available) */}
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              disabled={sharing}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 transition group disabled:opacity-50"
            >
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white">
                <Share2 className="w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-gray-900">Share via...</div>
                <div className="text-sm text-gray-500">Use native share options</div>
              </div>
            </button>
          )}

          {/* Direct Download */}
          <button
            onClick={handleDownloadDirect}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition group"
          >
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:bg-blue-200">
              <Download className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-900">Download PDF</div>
              <div className="text-sm text-gray-500">Save to your device</div>
            </div>
          </button>

          {/* Copy File Name */}
          <button
            onClick={handleCopyDownloadLink}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition group"
          >
            <div className="p-3 bg-gray-100 rounded-xl text-gray-700 group-hover:bg-gray-200">
              {copied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6" />}
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-900">{copied ? "Copied!" : "Copy File Name"}</div>
              <div className="text-sm text-gray-500">{copied ? "File name copied" : "Share file name with others"}</div>
            </div>
          </button>

          {/* Email */}
          <button
            onClick={handleEmailShare}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition group"
          >
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:bg-blue-200">
              <Mail className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-900">Email</div>
              <div className="text-sm text-gray-500">Send via email (downloads first)</div>
            </div>
          </button>

          {/* Messaging Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Messaging Apps</h3>
            <div className="space-y-3">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition group"
              >
                <div className="p-3 bg-green-100 rounded-xl text-green-600 group-hover:bg-green-200">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">WhatsApp</div>
                  <div className="text-sm text-gray-500">Share with automatic download</div>
                </div>
              </button>

              {/* Telegram */}
              <button
                onClick={handleTelegramShare}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition group"
              >
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:bg-blue-200">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">Telegram</div>
                  <div className="text-sm text-gray-500">Share with automatic download</div>
                </div>
              </button>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Social Media</h3>
            <p className="text-xs text-gray-500 mb-3">
              ℹ️ Share the link with your network. PDF will auto-download for easy sharing.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {/* Facebook */}
              <button
                onClick={handleFacebookShare}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition"
              >
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Facebook className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-gray-700">Facebook</span>
              </button>

              {/* Twitter */}
              <button
                onClick={handleTwitterShare}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-sky-500 hover:bg-sky-50 transition"
              >
                <div className="p-2 bg-sky-100 rounded-lg text-sky-600">
                  <Twitter className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-gray-700">Twitter</span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={handleLinkedInShare}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-700 hover:bg-blue-50 transition"
              >
                <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                  <Linkedin className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-gray-700">LinkedIn</span>
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">💡 Pro Tip:</span> For best results, download the PDF first, then share it
              directly through your preferred app.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={closeModal}
            className="w-full py-3 bg-white border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
