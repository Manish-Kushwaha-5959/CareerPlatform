// src/components/profile/ModernProfilePage.jsx

import  { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Globe,
  Medal,
  Dumbbell,
  BookOpen,
  TrendingUp,
  Bookmark,
  Flame,
  Puzzle,
  Award,
  MessageSquare,
  Trophy,
  Sparkles,
  User,
  X,CalendarIcon,
  Camera,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useUser, useClerk } from "@clerk/clerk-react";
import { data } from "autoprefixer";
import { formatDistanceToNowStrict, isFuture, parseISO } from "date-fns";
/* ------------------ FALLBACK DEFAULT DATA ------------------ */
const fallbackUser = {
  summary:
    "Enthusiastic learner exploring coding, quizzes, and new challenges.",
  tags: ["Learning", "Coding"],
  school: "Not set",
  class: "Not set",
  grade: "Not set",

  beyondAcademics: {
    hobbies: ["Reading", "Music"],
    extracurriculars: ["Community Group"],
    certifications: ["Cybersecurity Basics"],
    sports: ["Badminton"],
  },

  metrics: [
    {
      label: "Quizzes",
      value: 22,
      icon: BookOpen,
      color: "from-sky-400 to-blue-500",
    },
    {
      label: "Avg Score",
      value: "86%",
      icon: TrendingUp,
      color: "from-emerald-400 to-green-500",
    },
    {
      label: "Bookmarks",
      value: 15,
      icon: Bookmark,
      color: "from-fuchsia-400 to-purple-500",
    },
    {
      label: "Streak",
      value: "11d",
      icon: Flame,
      color: "from-amber-400 to-orange-500",
    },
  ],
};

/* ------------------ SAMPLE FEED ------------------ */
const feed = [
  {
    id: 1,
    icon: Puzzle,
    title: "Solved 10 new DSA problems",
    time: "2h ago",
    note: "Focus: stacks, queues, sliding window",
  },
  {
    id: 2,
    icon: Award,
    title: "Ranked top 5% in Logic Quiz",
    time: "1d ago",
    note: "Score 92% • 30 questions",
  },
  {
    id: 3,
    icon: MessageSquare,
    title: "Posted a guide on Git basics",
    time: "3d ago",
    note: "Got 24 upvotes from peers",
  },
];

/* Helper to merge Clerk + MongoDB lists */
const buildList = (clerkList, mongoString, fallbackList = []) => {
  if (Array.isArray(clerkList) && clerkList.length > 0) return clerkList;
  if (typeof mongoString === "string" && mongoString.trim() !== "") {
    return mongoString.split(",").map((s) => s.trim());
  }
  return fallbackList;
};

export default function ModernProfilePage() {
  const { user: clerkUser } = useUser();
  const { client } = useClerk(); 

  const [mongoStudent, setMongoStudent] = useState(null);
const navigate = useNavigate();
const [subscribedEvents, setSubscribedEvents] = useState([]);
const [nextEvent, setNextEvent] = useState(null);

  const [userState, setUserState] = useState({
    name: "Loading...",
    email: "",
    avatar: "",
    location: "Not set",
    summary: fallbackUser.summary,
    tags: fallbackUser.tags,
    school: fallbackUser.school,
    class: fallbackUser.class,
    grade: fallbackUser.grade,
    beyondAcademics: fallbackUser.beyondAcademics,
    metrics: fallbackUser.metrics,
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(userState);
  const [originalForm, setOriginalForm] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [showMore, setShowMore] = useState({
    hobbies: false,
    extracurriculars: false,
    certifications: false,
    sports: false,
  });

  const hasUnsavedChanges =
    originalForm && JSON.stringify(form) !== JSON.stringify(originalForm);

  useEffect(() => {
    if (!clerkUser) return;

    const fetchStudent = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8080/api/students/${clerkUser.id}`
        );
        if (!res.ok) {
          console.warn("No Mongo student profile yet");
          return;
        }
        const data = await res.json();
        console.log(data);
        // Expecting: { success: true, student: { ... } }
        if (data?.success && data.student) {
          setMongoStudent(data.student);
        }
      } catch (err) {
        console.error("Error fetching Mongo student:", err);
      }
    };

    fetchStudent();
  }, [clerkUser]);

useEffect(() => {
  if (!clerkUser) return;

  const userId = clerkUser.id; // or localStorage.getItem('uid') if that's what you use

  const loadSubscribed = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/subscribed/${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      const events = data.events || [];
      setSubscribedEvents(events);

      // find next upcoming event (future, earliest date)
      const upcoming = events
        .map(e => ({ ...e, dateObj: new Date(e.date) }))
        .filter(e => e.dateObj > new Date())
        .sort((a, b) => a.dateObj - b.dateObj);

      if (upcoming.length > 0) {
        setNextEvent(upcoming[0]);
      } else {
        setNextEvent(null);
      }
    } catch (err) {
      console.error("Failed to load subscribed events for profile:", err);
    }
  };

  loadSubscribed();
}, [clerkUser]);



useEffect(() => {
  if (!clerkUser) return;

  const unsafe = clerkUser.unsafeMetadata || {};
  const mongo = mongoStudent || {};
  const clerkBeyond = unsafe.beyondAcademics || {};
  const fallbackBeyond = fallbackUser.beyondAcademics;

  // Fix: Convert MongoDB string fields → arrays safely
  const mongoHobbies = mongo.hobbies
    ? mongo.hobbies.split(",").map((s) => s.trim())
    : [];

  const mongoExtra = mongo.extracurriculars
    ? mongo.extracurriculars.split(",").map((s) => s.trim())
    : [];

  const mongoSports = mongo.sports
    ? mongo.sports.split(",").map((s) => s.trim())
    : [];

  const mongoInterests = mongo.interests
    ? mongo.interests.split(",").map((s) => s.trim())
    : [];

  // Final Beyond Academics Logic
  const mergedBeyond = {
    hobbies:
      mongoHobbies.length > 0
        ? mongoHobbies
        : clerkBeyond.hobbies?.length > 0
        ? clerkBeyond.hobbies
        : fallbackBeyond.hobbies,

    extracurriculars:
      mongoExtra.length > 0
        ? mongoExtra
        : clerkBeyond.extracurriculars?.length > 0
        ? clerkBeyond.extracurriculars
        : fallbackBeyond.extracurriculars,

    sports:
      mongoSports.length > 0
        ? mongoSports
        : clerkBeyond.sports?.length > 0
        ? clerkBeyond.sports
        : fallbackBeyond.sports,

    certifications:
      clerkBeyond.certifications?.length > 0
        ? clerkBeyond.certifications
        : fallbackBeyond.certifications,
  };

  // Merge final state
  const merged = {
    name: clerkUser.fullName || mongo.name || "Unnamed User",
    email:
      clerkUser.primaryEmailAddress?.emailAddress ||
      mongo.email ||
      "Not set",
    avatar: clerkUser.imageUrl || "",

    location: unsafe.location || "Not set",
    summary: unsafe.summary || fallbackUser.summary,

    tags:
      unsafe.tags?.length > 0
        ? unsafe.tags
        : mongoInterests.length > 0
        ? mongoInterests
        : fallbackUser.tags,

    school: mongo.school || fallbackUser.school,
    class: mongo.class || fallbackUser.class,
    grade: mongo.grade || fallbackUser.grade,

    beyondAcademics: mergedBeyond,
    metrics: fallbackUser.metrics,
  };

  setUserState(merged);
  setForm(merged);
}, [clerkUser, mongoStudent]);


  /* ------------------ EDITING EFFECT (LOCK SCROLL) ------------------ */
  useEffect(() => {
    if (editing) {
      setOriginalForm(form);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [editing, form]);

  /* ------------------ HANDLERS ------------------ */

  const toggleShow = (section) => {
    setShowMore((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBeyondChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      beyondAcademics: {
        ...prev.beyondAcademics,
        [key]: value.split("\n"),
      },
    }));
  };

  const handleSave = async () => {
    try {
      // Clean tags & beyondAcademics for Clerk
      const cleanTags =
        typeof form.tags === "string"
          ? form.tags.split(",").map((t) => t.trim())
          : form.tags;

      const cleanBeyond = {};
      for (let key in form.beyondAcademics) {
        const val = form.beyondAcademics[key];
        cleanBeyond[key] =
          typeof val === "string"
            ? val
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : Array.isArray(val)
            ? val
            : [];
      }

      // ⭐ 1) Update Clerk unsafeMetadata
      await clerkUser.update({
        unsafeMetadata: {
          location: form.location,
          summary: form.summary,
          tags: cleanTags,
          beyondAcademics: cleanBeyond,
        },
      });

      try {
        await fetch(
          `http://127.0.0.1:8080/api/students/${clerkUser.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: clerkUser.id,
              name: form.name,
              email: form.email,
              class: form.class,
              grade: form.grade,
              school: form.school,
              hobbies: cleanBeyond.hobbies?.join(", "),
              extracurriculars: cleanBeyond.extracurriculars?.join(", "),
              interests: cleanTags?.join(", "),
              sports: cleanBeyond.sports?.join(", "),
            }),
          }
        );
      
        

      } catch (err) {
        console.error("MongoDB update failed:", err);
      }
     
      

      setUserState({
        ...form,
        tags: cleanTags,
        beyondAcademics: cleanBeyond,
      });

      setEditing(false);
    } catch (err) {
      console.error("Profile save error:", err);
    }
  };

  /* ------------------ UI ------------------ */

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* HEADER */}
      <section className="bg-gradient-to-r from-[#DEF6CA] via-[#F8BDC4] to-[#F65BE3] text-gray-800 shadow-md rounded-b-3xl">
  {/* TOP BAR — Title + Actions */}
  <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
        Dashboard
      </h1>
      <div className="flex items-center gap-3">
        {/* <Button
          onClick={() => navigate("/timeline/subscribed-events")}
          className="bg-white/90 backdrop-blur-md text-indigo-700 font-semibold hover:bg-white shadow-lg px-6 py-2 rounded-xl transition-shadow"
          size="sm"
        >
          My Events
        </Button> */}
        <Button
          onClick={() => setEditing(true)}
          className="bg-white text-pink-600 hover:bg-pink-50 shadow-lg px-6 py-2 rounded-xl font-semibold"
          size="sm"
        >
          Edit Profile
        </Button>
      </div>
    </div>
  </div>

  {/* USER INFO + EVENT CARD — Formal Row Layout */}
  <div className="max-w-7xl mx-auto px-6 pb-10">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
      
      {/* LEFT: User Profile Card */}
      <div className="flex items-center gap-6 flex-1 bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50">
        {/* Avatar */}
        <div className="h-20 w-20 rounded-full border-4 border-white shadow-lg overflow-hidden">
          {userState.avatar ? (
            <img
              src={userState.avatar}
              alt={userState.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-gray-600 mx-auto mt-6" />
          )}
        </div>

        {/* User Details */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">{userState.name}</h1>
            <Badge variant="secondary" className="text-xs px-2 py-1 bg-gray-100 text-gray-700">
              Class {userState.class}
            </Badge>
          </div>

          <p className="text-sm text-gray-600">
            {userState.email} • {userState.phone || 'Not set'}
          </p>

          <p className="text-sm font-medium text-gray-700">
            🎓 {userState.school || 'Not set'}
          </p>

          <p className="text-gray-600 leading-relaxed line-clamp-2">
            {userState.summary}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-2">
            {userState.tags.slice(0, 3).map((tag, i) => (
              <Badge
                key={i}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs px-3 py-1"
              >
                {tag}
              </Badge>
            ))}
            {userState.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-3 py-1">
                +{userState.tags.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Next Event Card */}
      <div className="w-full lg:w-80 bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-white/50">
        <div className="flex items-center gap-3 mb-3">
          <CalendarIcon className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-800 text-lg">Next Event</h3>
        </div>

        {nextEvent ? (
          <>
            <h4 className="font-bold text-gray-900 text-base mb-2 line-clamp-1">
              {nextEvent.title}
            </h4>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {nextEvent.description}
            </p>
            <div className="text-xs text-gray-500 mb-4">
              {formatDate(nextEvent.date)} • {nextEvent.location}
            </div>
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/timeline/subscribed-events")}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                View
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  // Calendar add logic
                  const event = nextEvent;
                  const title = encodeURIComponent(event.title);
                  const details = encodeURIComponent(event.description || "");
                  const location = encodeURIComponent(event.location || "");

                  const start = new Date(event.date)
                    .toISOString()
                    .replace(/[-:]/g, "")
                    .split(".")[0] + "Z";

                  const endDate = new Date(event.date);
                  endDate.setHours(endDate.getHours() + 1);

                  const end = endDate
                    .toISOString()
                    .replace(/[-:]/g, "")
                    .split(".")[0] + "Z";

                  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${start}/${end}`;
                  window.open(url, "_blank");
                }}
                className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Add to Calendar
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CalendarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No upcoming events</p>
          </div>
        )}
      </div>
    </div>
  </div>
</section>



      {/* BODY */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {userState.metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <Card key={i} className="shadow-md rounded-2xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{m.value}</div>
                    <p className="text-sm text-gray-500">{m.label}</p>
                  </div>
                  <div
                    className={`p-3 rounded-xl text-white bg-gradient-to-r ${m.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ACTIVITY + ACHIEVEMENTS */}
        <div className="grid lg:grid-cols-3 gap-6 mt-10">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(showAll ? feed : feed.slice(0, 2)).map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.id}
                    className="flex items-start gap-3 p-4 rounded-xl border hover:bg-gray-50"
                  >
                    <div className="h-10 w-10 rounded-full bg-pink-50 grid place-items-center">
                      <Icon className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{f.title}</div>
                      <div className="text-sm text-gray-600">{f.note}</div>
                    </div>
                    <span className="text-xs text-gray-500">{f.time}</span>
                  </div>
                );
              })}

              {feed.length > 2 && (
                <Button
                  variant="outline"
                  onClick={() => setShowAll((s) => !s)}
                  className="w-full rounded-xl"
                >
                  {showAll ? "Show Less" : "Show More"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  icon: Trophy,
                  title: "Quiz Master",
                  desc: "5 scores above 90%",
                  points: 100,
                },
                {
                  icon: Sparkles,
                  title: "Consistency",
                  desc: "10-day learning streak",
                  points: 60,
                },
                {
                  icon: Award,
                  title: "Community Helper",
                  desc: "Helped 10 peers",
                  points: 40,
                },
              ].map((a, i) => {
                const Icon = a.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 rounded-xl border hover:bg-gray-50"
                  >
                    <div className="h-12 w-12 rounded-full bg-yellow-100 grid place-items-center">
                      <Icon className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{a.title}</div>
                      <div className="text-sm text-gray-600">{a.desc}</div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      +{a.points}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* BEYOND ACADEMICS */}
        <div className="mt-10">
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Beyond Academics</CardTitle>
              <p className="text-sm text-gray-500">
                Your hobbies, extracurriculars & certifications.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.keys(userState.beyondAcademics).map((key, idx) => {
                  const items = userState.beyondAcademics[key] || [];
                  const isExpanded = showMore[key];
                  const itemsToShow = isExpanded ? items : items.slice(0, 3);

                  const iconMap = {
                    hobbies: Heart,
                    extracurriculars: Globe,
                    certifications: Medal,
                    sports: Dumbbell,
                  };
                  const colorMap = {
                    hobbies: "from-pink-400 to-rose-500",
                    extracurriculars: "from-indigo-400 to-purple-500",
                    certifications: "from-emerald-400 to-green-500",
                    sports: "from-amber-400 to-orange-500",
                  };

                  const Icon = iconMap[key];

                  return (
                    <div
                      key={idx}
                      className="p-6 rounded-2xl shadow bg-white hover:shadow-lg transition flex flex-col"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${colorMap[key]} text-white grid place-items-center`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold capitalize">
                        {key}
                      </h3>

                      <ul className="mt-3 space-y-2 list-disc list-inside flex-1 text-sm text-gray-700">
                        {items.length > 0 ? (
                          itemsToShow.map((item, i) => <li key={i}>{item}</li>)
                        ) : (
                          <li className="italic text-gray-400 list-none">
                            No {key} added
                          </li>
                        )}
                      </ul>

                      {items.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-blue-600 hover:text-blue-800"
                          onClick={() => toggleShow(key)}
                        >
                          {isExpanded ? "Show Less" : "Show More"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {editing && (
        <div className="fixed inset-x-0 top-24 bottom-0 flex items-start justify-center z-50 pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl overflow-hidden">
            <div className="bg-pink-500 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Edit Profile</h2>
              <button onClick={() => setEditing(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex justify-center">
                <label className="relative cursor-pointer">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-pink-300 shadow">
                    {form.avatar ? (
                      <img
                        src={form.avatar}
                        alt="avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-pink-500 m-auto mt-6" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <div className="absolute -bottom-2 -right-2 bg-pink-600 text-white p-2 rounded-full shadow">
                    <Camera className="h-4 w-4" />
                  </div>
                </label>
              </div>

              {/* Name + Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="mt-1 px-3 py-2 w-full border rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    name="email"
                    value={form.email}
                    disabled
                    className="mt-1 px-3 py-2 w-full border rounded-lg bg-gray-100"
                  />
                </div>
              </div>

              {/* School / Class / Grade */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">School</label>
                  <input
                    name="school"
                    value={form.school}
                    onChange={handleChange}
                    className="mt-1 px-3 py-2 w-full border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Class</label>
                  <input
                    name="class"
                    value={form.class}
                    onChange={handleChange}
                    className="mt-1 px-3 py-2 w-full border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Grade</label>
                  <input
                    name="grade"
                    value={form.grade}
                    onChange={handleChange}
                    className="mt-1 px-3 py-2 w-full border rounded-lg"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium">Location</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="mt-1 px-3 py-2 w-full border rounded-lg"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="text-sm font-medium">Summary</label>
                <textarea
                  name="summary"
                  value={form.summary}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 px-3 py-2 w-full border rounded-lg"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium">
                  Tags (comma separated)
                </label>
                <input
                  name="tags"
                  value={
                    Array.isArray(form.tags)
                      ? form.tags.join(", ")
                      : form.tags || ""
                  }
                  onChange={handleChange}
                  className="mt-1 px-3 py-2 w-full border rounded-lg"
                />
              </div>

              {/* Beyond Academics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(form.beyondAcademics).map((key) => (
                  <div key={key}>
                    <label className="text-sm font-medium capitalize">
                      {key}
                    </label>
                    <textarea
                      rows={3}
                      value={(form.beyondAcademics[key] || []).join("\n")}
                      onChange={(e) => handleBeyondChange(key, e.target.value)}
                      className="mt-1 px-3 py-2 w-full border rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button className="bg-pink-600 text-white" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
