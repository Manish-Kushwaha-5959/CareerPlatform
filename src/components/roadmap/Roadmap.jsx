import { useState, useEffect } from "react";
import VerticalRoadmap from "./VerticalRoadmap";
import fullStackJson from "../../data/full_stack_roadmap.json";
import {
  parseMarkdownToAST,
  astToRoadmapJSON,
} from "../../utils/parseMarkdown";

// Theme
const theme = {
  primaryGreen: "#00A676",
  secondaryBlue: "#1D9BF0",
  lightGray: "#F7F9FA",
  mediumGray: "#E1E8ED",
  darkGray: "#657786",
  white: "#FFFFFF",
  textDark: "#0F1419",
  borderRadius: "12px",
  shadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
};

export default function RoadmapPage() {
  const [json, setJson] = useState(fullStackJson);
  const [loading, setLoading] = useState(false);

  const [careers, setCareers] = useState([]);
  const [topic, setTopic] = useState("");
  const [customCareer, setCustomCareer] = useState("");

  // 🔹 Load careers from localStorage (NO auto-select)
  useEffect(() => {
    const raw = localStorage.getItem("apnidisha_student_profile");
    if (!raw) return;

    try {
      const profile = JSON.parse(raw);
      const recommendations = profile?.quiz_results?.recommendations || [];
      const careerList = recommendations.map((r) => r.career);
      setCareers(careerList);
    } catch (err) {
      console.error("Failed to parse student profile:", err);
    }
  }, []);

  const handleGenerate = async () => {
    const finalCareer = customCareer.trim() || topic.trim();

    if (!finalCareer) {
      alert("Please select or enter a career");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/roadmap/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_profile: "Beginner",
          career_choice: finalCareer,
        }),
      });

      const data = await res.json();

      if (!data || !data.markdown) {
        alert("No roadmap returned");
        setLoading(false);
        return;
      }

      const ast = await parseMarkdownToAST(data.markdown);
      const roadmap = astToRoadmapJSON(ast);
      setJson(roadmap);

    } catch (err) {
      console.error(err);
      alert("Failed to generate roadmap: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: theme.lightGray,
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "32px",
          paddingBottom: "16px",
          borderBottom: `1px solid ${theme.mediumGray}`,
        }}
      >
        <div
          style={{
           
          }}
        >
          
        </div>
        
      </div>

      {/* Input Card */}
      <div
        style={{
          backgroundColor: theme.white,
          padding: "24px",
          borderRadius: theme.borderRadius,
          boxShadow: theme.shadow,
          marginBottom: "32px",
        }}
      >
        <h1 style={{ marginBottom: "16px" }}>Personalized Roadmap</h1>
        <p style={{ marginBottom: "24px", color: theme.darkGray }}>
          Choose a recommended career or enter a custom one
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxWidth: "420px",
          }}
        >
          {/* Dropdown */}
          <select
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setCustomCareer("");
            }}
            disabled={customCareer.trim().length > 0}
            style={{
              padding: "12px 16px",
              fontSize: "16px",
              border: `1px solid ${theme.mediumGray}`,
              borderRadius: theme.borderRadius,
              backgroundColor:
                customCareer.trim().length > 0 ? "#f0f0f0" : theme.white,
            }}
          >
            <option value="">Select a recommended career</option>
            {careers.map((career, idx) => (
              <option key={idx} value={career}>
                {career}
              </option>
            ))}
          </select>

          {/* Custom Career Input */}
          <input
            type="text"
            placeholder="Or enter a custom career (e.g., AI Engineer)"
            value={customCareer}
            onChange={(e) => {
              setCustomCareer(e.target.value);
              if (e.target.value.trim()) setTopic("");
            }}
            disabled={topic.trim().length > 0}
            style={{
              padding: "12px 16px",
              fontSize: "16px",
              border: `1px solid ${theme.mediumGray}`,
              borderRadius: theme.borderRadius,
              backgroundColor:
                topic.trim().length > 0 ? "#f0f0f0" : theme.white,
            }}
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: "12px",
              fontSize: "16px",
              fontWeight: "600",
              backgroundColor: theme.secondaryBlue,
              color: theme.white,
              border: "none",
              borderRadius: theme.borderRadius,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Generating..." : "Generate Roadmap"}
          </button>
        </div>
      </div>

      {/* Roadmap Container (NO CUT-OFF) */}
      <div
        style={{
          backgroundColor: theme.white,
          padding: "24px",
          borderRadius: theme.borderRadius,
          boxShadow: theme.shadow,
          overflowX: "auto",
          overflowY: "visible",
          minHeight: "400px",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          {json.title || "Your Career Roadmap"}
        </h2>
        <VerticalRoadmap json={json} />
      </div>
    </div>
  );
}
