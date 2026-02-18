"use client";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, BellOff, Calendar1, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import RoadmapPOV from "./roadmapPOV";

export default function SubscribedEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // ⭐ Replace with your actual user ID system
  const userId = localStorage.getItem("uid");

  useEffect(() => {
    async function fetchSubscribedEvents() {
      try {
        const res = await fetch(`http://localhost:5000/api/events/subscribed/${userId}`);
        if (!res.ok) throw new Error("No subscribed events");
        const data = await res.json();
        // Sort by date (ascending)
        const sortedEvents = (data.events || []).sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(sortedEvents);
      } catch (err) {
        console.error("Failed to load subscribed events:", err);
        // Mock data for subscribed events
        const mockSubscribedEvents = [
          {
            _id: 'mock1',
            title: 'JEE Main 2025 Registration Opens',
            description: 'Registration for JEE Main 2025 now open - prepare your documents.',
            date: new Date('2024-11-01T10:00:00'),
            type: 'exam',
            category: 'Registration',
            location: 'Online',
            isActive: true,
            link: 'https://example.com/jee-main-reg',
          },
          {
            _id: 'mock2',
            title: 'NEET UG 2025 Mock Test Series',
            description: 'Free mock test series for NEET UG 2025 preparation.',
            date: new Date('2024-11-15T14:00:00'),
            type: 'exam',
            category: 'Preparation',
            location: 'Online',
            isActive: true,
            link: 'https://example.com/neet-mock-tests',
          },
          {
            _id: 'mock3',
            title: 'KVPY Scholarship Exam Date Announced',
            description: 'KVPY 2025 exam date and registration details released.',
            date: new Date('2024-12-01T11:00:00'),
            type: 'scholarship',
            category: 'Announcement',
            location: 'Various',
            isActive: true,
            link: 'https://example.com/kvpy-2025',
          },
          {
            _id: 'mock4',
            title: 'IIT Bombay Open House',
            description: 'Virtual open house for prospective students and parents.',
            date: new Date('2024-12-10T16:00:00'),
            type: 'event',
            category: 'Open House',
            location: 'Online',
            isActive: true,
            link: 'https://example.com/iitb-open-house',
          },
          {
            _id: 'mock5',
            title: 'CUET UG 2025 Syllabus Update',
            description: 'Updated syllabus for CUET UG 2025 released - check changes.',
            date: new Date('2024-12-20T09:30:00'),
            type: 'exam',
            category: 'Update',
            location: 'Online',
            isActive: true,
            link: 'https://example.com/cuet-syllabus',
          },
          {
            _id: 'mock6',
            title: 'INSPIRE Scholarship Results',
            description: 'Results for INSPIRE scholarship 2024 announced.',
            date: new Date('2025-01-05T12:00:00'),
            type: 'scholarship',
            category: 'Results',
            location: 'Online',
            isActive: true,
            link: 'https://example.com/inspire-results',
          },
          {
            _id: 'mock7',
            title: 'BITSAT 2025 Registration',
            description: 'BITSAT 2025 registration portal opens for session 1.',
            date: new Date('2025-01-15T10:00:00'),
            type: 'admission',
            category: 'Registration',
            location: 'Online',
            isActive: true,
            link: 'https://example.com/bitsat-reg',
          },
        ];
        setEvents(mockSubscribedEvents);
      }
      setLoading(false);
    }

    fetchSubscribedEvents();
  }, [userId]);

  const handleUnsubscribe = async (eventId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/unsubscribe/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e._id !== eventId));
        toast.success("Unsubscribed successfully!");
      }
    } catch (err) {
      console.error("Unsubscribe failed:", err);
      toast.error("Failed to unsubscribe. Try again.");
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-600">Loading your roadmap...</p>;

  // Calculate progress
  const totalEvents = events.length;
  const completedEvents = events.filter(e => new Date(e.date) < new Date()).length;
  const progress = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Your Career Roadmap</h1>
        </div>

        <Button onClick={() => navigate("/timeline")}>
          Explore More Events
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center mt-20">
          <Calendar1 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Roadmap is Empty</h3>
          <p className="text-gray-600 mb-6">Subscribe to events to build your personalized career timeline.</p>
          <Button onClick={() => navigate("/timeline")}>
            Start Subscribing
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Progress Indicator */}
          <div className="mb-6 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Roadmap Progress</h3>
              <div className="text-sm text-gray-600">
                {completedEvents}/{totalEvents} completed
              </div>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="text-center text-sm text-gray-500 mt-2">
              {progress === 100 ? "Congratulations! Full roadmap complete." : `${Math.round(progress)}% complete`}
            </div>
          </div>

          {/* Roadmap Container */}
          <RoadmapPOV events={events} initialIndex={0} />

          {/* Mobile Scroll Hint */}
          <div className="text-center mt-6 text-sm text-gray-500">
            <p>Scroll horizontally to see your full roadmap →</p>
          </div>
        </div>
      )}
    </div>
  );
}