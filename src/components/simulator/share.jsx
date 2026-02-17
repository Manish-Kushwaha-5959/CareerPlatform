import { useState } from "react";
import { Share2, Mail, MessageCircle, Copy, Check, X, Facebook, Twitter, Linkedin } from "lucide-react";

/**
 * ShareModule Component
 * Handles sharing career summary via multiple channels
 * 
 * Props:
 * - summaryText: The text content to share
 * - summaryUrl: Optional URL to share (if hosted online)
 * - onClose: Callback when share modal is closed
 */
export default function ShareModule({ summaryText, summaryUrl, onClose }) {
  const [showModal, setShowModal] = useState(true);
  const [copied, setCopied] = useState(false);

  // Check if Web Share API is available (mostly mobile)
  const hasNativeShare = typeof navigator !== 'undefined' && navigator.share;

  const handleNativeShare = async () => {
    if (!hasNativeShare) return;
    
    try {
      await navigator.share({
        title: 'My Career Analysis Report',
        text: summaryText,
        url: summaryUrl || window.location.href,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Share failed:', err);
      }
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = summaryText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent('My Career Analysis Report');
    const body = encodeURIComponent(summaryText);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(summaryText);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(summaryUrl || window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent('Check out my Career Analysis Report!');
    const url = encodeURIComponent(summaryUrl || window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
  };

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(summaryUrl || window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(summaryText);
    window.open(`https://t.me/share/url?url=${summaryUrl || window.location.href}&text=${text}`, '_blank');
  };

  const handleSMSShare = () => {
    const text = encodeURIComponent(summaryText);
    // iOS uses different format than Android
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS) {
      window.open(`sms:&body=${text}`);
    } else {
      window.open(`sms:?body=${text}`);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    if (onClose) onClose();
  };

  if (!showModal) return null;

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
            <button
              onClick={closeModal}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-sm opacity-90">
            Share your career analysis with parents, mentors, or friends
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Native Share (if available) */}
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 transition group"
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

          {/* Copy to Clipboard */}
          <button
            onClick={handleCopyToClipboard}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition group"
          >
            <div className="p-3 bg-gray-100 rounded-xl text-gray-700 group-hover:bg-gray-200">
              {copied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6" />}
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-900">
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </div>
              <div className="text-sm text-gray-500">
                {copied ? 'Text copied successfully' : 'Copy text to paste anywhere'}
              </div>
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
              <div className="text-sm text-gray-500">Send via email app</div>
            </div>
          </button>

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
              <div className="text-sm text-gray-500">Share on WhatsApp</div>
            </div>
          </button>

          {/* SMS */}
          <button
            onClick={handleSMSShare}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition group"
          >
            <div className="p-3 bg-purple-100 rounded-xl text-purple-600 group-hover:bg-purple-200">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-900">SMS</div>
              <div className="text-sm text-gray-500">Send via text message</div>
            </div>
          </button>

          {/* Telegram */}
          <button
            onClick={handleTelegramShare}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition group"
          >
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:bg-blue-200">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-900">Telegram</div>
              <div className="text-sm text-gray-500">Share on Telegram</div>
            </div>
          </button>

          {/* Social Media Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Social Media</h3>
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
  );
}