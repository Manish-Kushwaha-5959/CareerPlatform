// src/components/RoadmapPOV.jsx
"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, ArrowLeft } from "lucide-react";

/*
  RoadmapPOV
  Props:
    - events: array of event objects (each must have _id, title, description, date, link)
    - initialIndex (optional)
*/

export default function RoadmapPOV({ events = [], initialIndex = 0 }) {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const rafRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [viewportHeight, setViewportHeight] = useState(0);

  // helper clamp
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  useEffect(() => {
    setViewportHeight(window.innerHeight);
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // keep refs array length in sync
  itemRefs.current = events.map((_, i) => itemRefs.current[i] ?? React.createRef());

  // Scroll to an index smoothly
  const scrollToIndex = (i) => {
    if (!containerRef.current || !itemRefs.current[i]) return;
    const el = itemRefs.current[i];
    const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : el.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    // we want the element center to align at 40% from top (a little above center)
    const target = containerRef.current.scrollTop + (rect.top - containerRect.top) - (containerRect.height * 0.4) + rect.height / 2;
    containerRef.current.scrollTo({ top: target, behavior: "smooth" });
  };

  // Next / Prev navigation
  const goNext = () => {
    const next = clamp(activeIndex + 1, 0, events.length - 1);
    setActiveIndex(next);
    scrollToIndex(next);
  };
  const goPrev = () => {
    const prev = clamp(activeIndex - 1, 0, events.length - 1);
    setActiveIndex(prev);
    scrollToIndex(prev);
  };

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowDown") goNext();
      if (e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, events.length]);

  // On scroll we compute each card's distance from the "camera" center and update transforms
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const cameraY = containerRect.top + containerRect.height * 0.45; // point where cards feel "closest"

    let nearestIndex = 0;
    let nearestDistance = Infinity;

    events.forEach((_, i) => {
      const el = itemRefs.current[i];
      if (!el) return;
      const node = el; // node is the actual DOM element (we used refs as plain nodes)
      const rect = node.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const distance = Math.abs(itemCenter - cameraY);

      // determine "depth" factor: normalize distance to [0..1] where 0 = camera, 1 = far
      const maxDistance = containerRect.height * 0.9; // max considered distance
      const norm = clamp(distance / maxDistance, 0, 1);

      // scale: near -> 1.0..1.0? far -> 0.5 (smaller)
      const scale = 1 - norm * 0.55; // between 1 and 0.45

      // blur: near -> 0, far -> 6px
      const blurPx = Math.round(norm * 6);

      // grayscale: near -> 0, far -> 0.35
      const grayscale = norm * 0.35;

      // horizontal offset along a curve: use sin to create wavy left-right
      // use index parity to alternate side
      const side = (i % 2 === 0) ? -1 : 1;
      const curveOffset = Math.sin((i / Math.max(1, events.length - 1)) * Math.PI) * 220; // amplitude
      const xOffset = side * curveOffset * (0.5 + (1 - norm) * 0.6) * (window.innerWidth < 768 ? 0.45 : 1);

      // z-index: near elements should appear on top
      const zIndex = Math.round((1 - norm) * 1000);

      // opacity slight: far -> 0.85
      const opacity = 1 - norm * 0.2;

      // apply styles
      node.style.transform = `translateX(${xOffset}px) scale(${scale}) perspective(1200px) translateZ(${(1 - norm) * 200}px)`;
      node.style.filter = `blur(${blurPx}px) grayscale(${grayscale})`;
      node.style.zIndex = zIndex;
      node.style.opacity = opacity;

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    });

    if (nearestIndex !== activeIndex) {
      setActiveIndex(nearestIndex);
    }
  }, [events, activeIndex]);

  // bind scroll using rAF for smoother perf
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        handleScroll();
      });
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    // initial call
    handleScroll();
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

  // initial scroll to the active index
  useEffect(() => {
    scrollToIndex(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add to Google Calendar helper
  const addToGoogleCalendar = (event) => {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description || "");
    const location = encodeURIComponent(event.location || "");
    const start = new Date(event.date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const endDate = new Date(event.date); endDate.setHours(endDate.getHours() + 1);
    const end = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${start}/${end}`;
    window.open(url, "_blank");
  };

  // style helpers
  const roadSvg = (
    <svg viewBox="0 0 800 2000" preserveAspectRatio="none" className="w-full h-full">
      {/* Create a curved "road" that narrows toward top */}
      <defs>
        <linearGradient id="roadGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.0" />
          <stop offset="40%" stopColor="#e6eefc" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#eef2ff" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      <path d="M150,0 C110,250 90,500 80,900 C75,1200 120,1500 200,1800 L600,1800 C700,1500 740,1200 720,900 C710,500 690,250 650,0 Z"
        fill="url(#roadGrad)" opacity="0.65" />
      {/* road center line */}
      <g stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" strokeDasharray="18 18" opacity="0.7">
        <path d="M380,40 C370,260 355,520 345,900 C340,1200 360,1500 400,1780" fill="none" />
      </g>
    </svg>
  );

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Your Roadmap (POV)</h2>

        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="px-3 py-2 rounded bg-white/80 shadow"> <ArrowLeft size={16} /> </button>
          <div className="text-sm text-gray-600">{activeIndex + 1} / {events.length}</div>
          <button onClick={goNext} className="px-3 py-2 rounded bg-white/80 shadow"> <ArrowRight size={16} /> </button>
        </div>
      </div>

      {/* Perspective container */}
      <div
        ref={containerRef}
        className="relative h-[78vh] md:h-[80vh] overflow-y-auto overflow-x-hidden rounded-3xl shadow-xl border border-gray-100 bg-gradient-to-b from-slate-50 to-indigo-50"
        style={{ perspective: 1200, perspectiveOrigin: "50% 10%" }}
      >
        {/* Road artwork */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="w-full h-full">{roadSvg}</div>
        </div>

        {/* Column to center the content and give space for curve */}
        <div className="relative z-10 min-h-[120%] py-12">
          <div className="flex flex-col items-center gap-12 pt-8 pb-20">
            {events.map((event, i) => {
              // compute static left-right baseline offset along a gentle curve (used when JS hasn't painted yet)
              const side = (i % 2 === 0) ? -1 : 1;
              const curveBaseline = Math.sin((i / Math.max(1, events.length - 1)) * Math.PI) * 140;
              const fallbackX = side * curveBaseline;

              return (
                <div
                  key={event._id}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  className="w-[86%] max-w-xl lg:max-w-2xl mx-auto transform transition-transform duration-300"
                  style={{
                    // initial style before JS updates transforms
                    transform: `translateX(${fallbackX}px)`,
                  }}
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className={`relative rounded-2xl p-6 shadow-2xl border border-gray-200`}
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))",
                      backdropFilter: "saturate(120%) blur(2px)",
                    }}
                  >
                    {/* small badge/time at top-left */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-500 font-medium">
                        {new Date(event.date).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">{formatDistanceToNow(new Date(event.date), { addSuffix: true })}</div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                    <div className="flex gap-3">
                      <a href={event.link || "#"} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium">Details</a>
                      <button onClick={() => addToGoogleCalendar(event)} className="px-3 py-2 rounded-md border border-gray-200 text-sm">Add to Calendar</button>
                      <button onClick={() => {
                        // quick "focus" this event
                        setActiveIndex(i);
                        scrollToIndex(i);
                      }} className="ml-auto text-sm text-indigo-600">Focus</button>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* hint */}
      <div className="mt-4 text-center text-sm text-gray-500">Scroll vertically — far events are small & blurred, near events are larger and clear.</div>
    </div>
  );
}
