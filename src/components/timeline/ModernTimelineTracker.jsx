import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Search, Bell, Calendar1, ExternalLink } from "lucide-react";
import { toast } from "sonner";

// 🔗 Hardcoded backend URL
const API_URL = "http://127.0.0.1:8080/api/timeline";

/* ----------------------------------------------------
   🎓 DEGREE → SHORT NAME MAPPER
------------------------------------------------------*/
const mapDegreeToShortName = (degree) => {
  if (!degree) return null;
  const d = degree.toLowerCase();

  if (d.includes("b.tech")) return "BTECH";
  if (d.includes("b.sc")) return "BSC";
  if (d.includes("bca")) return "BCA";
  if (d.includes("b.com")) return "BCOM";
  if (d.includes("ba")) return "BA";
  if (d.includes("b.arch")) return "BARCH";
  if (d.includes("b.des")) return "B.DESIGN";

  return null;
};

/* ----------------------------------------------------
   🗓 PROPER DATE FORMATTER (Range Kept As-Is)
------------------------------------------------------*/
const formatDateProper = (dateText) => {
  if (!dateText) return "Date Not Available";
  // Just beautify hyphens a bit
  return dateText.replace(/-/g, "–");
};

/* ----------------------------------------------------
   🧠 DATE PARSER FOR SORTING (Nearest Exam First)
------------------------------------------------------*/
const monthIndex = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const parseExamDate = (dateText) => {
  if (!dateText) return null;
  let s = dateText.trim();

  // Case 1: ISO style "2026-03-24" or "2026-03-24 to 2026-03-25"
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const firstPart = s.split("to")[0].trim();
    const d = new Date(firstPart);
    return isNaN(d) ? null : d;
  }

  // Find year
  const yearMatch = s.match(/(\d{4})/);
  if (!yearMatch) return null;
  const yearStr = yearMatch[1];
  const year = parseInt(yearStr, 10);
  const yearIndexPos = s.indexOf(yearStr);

  // Find month name
  const monthRegex =
    /January|February|March|April|May|June|July|August|September|October|November|December/i;
  const monthMatch = s.match(monthRegex);
  let month = 0;
  if (monthMatch) {
    month = monthIndex[monthMatch[0].toLowerCase()] ?? 0;
  }

  // Find day BEFORE the year (so "2026" doesn't become the day)
  const beforeYear = s.slice(0, yearIndexPos);
  const dayMatch = beforeYear.match(/(\d{1,2})/);
  const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;

  const d = new Date(year, month, day);
  return isNaN(d) ? null : d;
};

const getExamSortDate = (examObj) => {
  if (!examObj?.events || !Array.isArray(examObj.events)) {
    return Number.POSITIVE_INFINITY;
  }

  let best = Number.POSITIVE_INFINITY;

  for (const ev of examObj.events) {
    const d = parseExamDate(ev.date);
    if (d) {
      const t = d.getTime();
      if (t < best) best = t;
    }
  }

  return best;
};

/* ----------------------------------------------------
   🎭 CATEGORY BADGE FROM SHORT NAMES
------------------------------------------------------*/
const getExamCategory = (shortNamesArr = []) => {
  const names = shortNamesArr.map((s) => s.toUpperCase());

  const hasAny = (...keys) => keys.some((k) => names.includes(k));

  if (hasAny("BTECH", "ENGINEERING", "BE", "MCA", "BCA", "IT", "PCM"))
    return "Engineering";

  if (hasAny("BARCH", "ARCHITECTURE")) return "Architecture";

  if (hasAny("B.DESIGN", "DESIGN", "NIFT", "NID", "FASHION"))
    return "Design";

  if (
    hasAny(
      "MBBS",
      "MEDICAL",
      "BDS",
      "NURSING",
      "BAMS",
      "BVSC",
      "PHARMA",
      "PCB"
    )
  )
    return "Medical";

  if (hasAny("LAW", "LLB", "LLB_3YR", "LLB_5YR", "NLLU")) return "Law";

  if (
    hasAny(
      "CA",
      "CMA",
      "CS",
      "B.COM",
      "BCOM",
      "MBA",
      "MMS",
      "MANAGEMENT"
    )
  )
    return "Commerce & Management";

  return "General";
};

const categoryStyles = {
  Engineering: {
    bg: "bg-blue-100",
    text: "text-blue-800",
  },
  Architecture: {
    bg: "bg-amber-100",
    text: "text-amber-800",
  },
  Design: {
    bg: "bg-purple-100",
    text: "text-purple-800",
  },
  Medical: {
    bg: "bg-green-100",
    text: "text-green-800",
  },
  Law: {
    bg: "bg-red-100",
    text: "text-red-800",
  },
  "Commerce & Management": {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
  },
  General: {
    bg: "bg-gray-100",
    text: "text-gray-800",
  },
};

/* ----------------------------------------------------
   📆 Small Confirm Modal Component
------------------------------------------------------*/
function CalendarConfirmModal({ open, onClose, onConfirm, examName }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-80">
        <h2 className="text-lg font-semibold text-gray-800">
          Add to Google Calendar?
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          You’re about to add <b>{examName}</b> to your Google Calendar.
        </p>

        <div className="flex justify-end gap-3 mt-5">
          <button
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
            onClick={onClose}
          >
            No
          </button>

          <button
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onConfirm}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}

const ModernTimelineTracker = () => {
  const [events, setEvents] = useState([]); // exams list
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); // whole exam object

  const [detailsModal, setDetailsModal] = useState(null); // exam object for details

  // Store which short_names we used for fetching (for tiny labels)
  const [matchedShortNames, setMatchedShortNames] = useState([]);

  /* ----------------------------------------------------
     🧠 FETCH ALL EXAMS BASED ON MULTIPLE DEGREES
  ------------------------------------------------------*/
  const fetchEvents = async () => {
    try {
      setLoading(true);

      const raw = localStorage.getItem("apnidisha_student_profile");
      let degreesList = [];

      if (raw) {
        const user = JSON.parse(raw);
        const recommendations = user?.quiz_results?.recommendations || [];

        // Extract all degrees from all recommendations
        recommendations.forEach((rec) => {
          rec.degrees.forEach((d) => {
            if (d.degree) degreesList.push(d.degree);
          });
        });
      }

      // Convert to short_names
      let shortNames = degreesList
        .map((d) => mapDegreeToShortName(d))
        .filter(Boolean);

      // Remove duplicates
      shortNames = [...new Set(shortNames)];

      console.log("All short_names generated:", shortNames);
      setMatchedShortNames(shortNames);

      if (shortNames.length === 0) {
        toast.error("No degrees detected for exam matching");
        setEvents([]);
        return;
      }

      // Fetch API for each short_name in parallel
      const requests = shortNames.map((sn) =>
        fetch(`${API_URL}?short_name=${sn}`).then((res) => res.json())
      );

      const results = await Promise.all(requests);

      // Merge results
      let merged = [];
      results.forEach((res) => {
        if (Array.isArray(res)) merged.push(...res);
      });

      // Remove duplicates by exam name
      const unique = {};
      merged.forEach((exam) => {
        unique[exam.exam] = exam;
      });

      const finalList = Object.values(unique);

      console.log("Final merged exam timeline:", finalList);

      setEvents(finalList);
    } catch (error) {
      console.error("Timeline fetch failed:", error);
      toast.error("Failed to load exams");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  /* ----------------------------------------------------
     🔔 Bell → Google Calendar
  ------------------------------------------------------*/
  const handleBellClick = (examObj) => {
    setSelectedEvent(examObj);
    setShowCalendarModal(true);
  };

  const addToGoogleCalendar = (examObj) => {
    if (!examObj) return;

    const title = encodeURIComponent(examObj.exam || "Exam Reminder");
    const details = encodeURIComponent(
      examObj.verification_method || examObj.conducting_body || ""
    );

    // For now, generic time block (you can later refine using parsed date)
    const start = "20260101T090000Z";
    const end = "20260101T100000Z";

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${start}/${end}`;
    window.open(url, "_blank");
  };

  /* ----------------------------------------------------
     🔍 Search Filter + Sorting (Ascending by earliest exam)
  ------------------------------------------------------*/
  const filteredEvents = events.filter((exam) => {
    const search = searchQuery.toLowerCase();
    return (
      exam.exam.toLowerCase().includes(search) ||
      exam.conducting_body?.toLowerCase().includes(search)
    );
  });

  const sortedEvents = [...filteredEvents].sort(
    (a, b) => getExamSortDate(a) - getExamSortDate(b)
  );

  /* ----------------------------------------------------
     ⏳ Loading Skeleton (nice UI)
  ------------------------------------------------------*/
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-9 bg-gray-200 rounded-lg w-1/3" />
            <div className="h-5 bg-gray-200 rounded-lg w-1/2" />
            <div className="flex gap-3 mt-4">
              <div className="h-10 bg-gray-200 rounded-lg flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
     🎨 Main UI (Original Style A + New Badges + Labels)
  ------------------------------------------------------*/
  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Timeline Tracker
            </h1>
            <p className="text-gray-600 text-lg">
              Stay updated with all important entrance exams based on your
              recommended paths.
            </p>
          </div>

          {/* Search */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search exams or conducting bodies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Calendar confirm modal */}
          <CalendarConfirmModal
            open={showCalendarModal}
            examName={selectedEvent?.exam}
            onClose={() => setShowCalendarModal(false)}
            onConfirm={() => {
              addToGoogleCalendar(selectedEvent);
              setShowCalendarModal(false);
            }}
          />

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEvents.map((examObj, idx) => {
              const firstEvent = examObj.events?.[0];
              const displayDate = formatDateProper(firstEvent?.date);

              const category = getExamCategory(examObj.short_name || []);
              const catStyle =
                categoryStyles[category] || categoryStyles["General"];

              // Tiny degree labels: intersection of exam short_name with matchedShortNames
              const degreeLabels = (examObj.short_name || []).filter((tag) =>
                matchedShortNames.includes(tag)
              );

              return (
                <Card
                  key={idx}
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border-0 shadow-md bg-white/80 backdrop-blur-sm flex flex-col"
                >
                  <CardHeader className="pb-4 p-6 flex-shrink-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {/* Type Tag */}
                        <Badge className="bg-orange-100 text-orange-800 rounded-full px-3 py-1 text-xs font-medium">
                          Exam
                        </Badge>
                        {/* Category Tag */}
                        <Badge
                          className={`${catStyle.bg} ${catStyle.text} rounded-full px-3 py-1 text-xs font-medium`}
                        >
                          {category}
                        </Badge>
                      </div>

                      {/* Bell → Calendar */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBellClick(examObj)}
                        className="ml-2 -mt-1"
                      >
                        <Bell className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>

                    <CardTitle className="text-lg font-semibold text-gray-900 leading-tight mb-1 line-clamp-2">
                      {examObj.exam}
                    </CardTitle>
                    {examObj.conducting_body && (
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {examObj.conducting_body}
                      </p>
                    )}

                    {/* Degree labels: BTECH • BARCH • B.DESIGN */}
                    {degreeLabels.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {degreeLabels.join(" • ")}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-between">
                    {/* Info Bar */}
                    <div className="mb-4">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-1 min-w-fit">
                          <Calendar1 className="h-4 w-4" />
                          <span>{displayDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Official website */}
                    {examObj.official_website && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs border-gray-200 text-blue-700 hover:bg-blue-50"
                        >
                          <a
                            href={examObj.official_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Official Website
                          </a>
                        </Button>
                      </div>
                    )}

                    {/* View details */}
                    <div className="mt-auto pt-4">
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          className="flex-1 rounded-xl"
                          variant="outline"
                          onClick={() => setDetailsModal(examObj)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {sortedEvents.length === 0 && (
            <div className="text-center py-12 col-span-full">
              <Calendar1 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No exams found
              </h3>
              <p className="text-gray-600">
                Try changing your search or check back later for new updates.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal (card style) */}
      {detailsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {detailsModal.exam}
            </h2>

            {detailsModal.conducting_body && (
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Conducting Body:</span>{" "}
                {detailsModal.conducting_body}
              </p>
            )}

            {detailsModal.official_website && (
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Official Website:</span>{" "}
                <a
                  href={detailsModal.official_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {detailsModal.official_website}
                </a>
              </p>
            )}

            {detailsModal.verification_method && (
              <p className="text-gray-700 mb-4">
                <span className="font-semibold">Verification:</span>{" "}
                {detailsModal.verification_method}
              </p>
            )}

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Exam Events
            </h3>

            <div className="space-y-3">
              {detailsModal.events?.map((ev, idx) => {
                const niceDate = formatDateProper(ev.date);
                const firstLink =
                  Array.isArray(ev.sources) && ev.sources.length > 0
                    ? ev.sources[0]
                    : null;

                return (
                  <div
                    key={idx}
                    className="border border-gray-100 rounded-xl bg-gray-50 p-3"
                  >
                    <p className="font-medium text-gray-900 mb-1">
                      {ev.event}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Date:</span> {niceDate}
                    </p>
                    {ev.status && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Status:</span>{" "}
                        {ev.status}
                      </p>
                    )}
                    {firstLink && (
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-semibold">Source:</span>{" "}
                        <a
                          href={firstLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {firstLink}
                        </a>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setDetailsModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModernTimelineTracker;
