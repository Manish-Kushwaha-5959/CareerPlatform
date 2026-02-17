import { useState } from "react";
import VerticalRoadmap from "./VerticalRoadmap";
import fullStackJson from "../../data/full_stack_roadmap.json";
import {
  parseMarkdownToAST,
  astToRoadmapJSON,
} from "../../utils/parseMarkdown";

export default function RoadmapPage() {
  const [json, setJson] = useState(fullStackJson);
  const [topic, setTopic] = useState("AI Engineer");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/roadmap/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_profile: "Beginner",
          career_choice: topic,
        }),
      });
      const data = await res.json();
      if (!data) {
        alert("No data returned");
        return;
      }
      if (data.markdown) {
        const ast = await parseMarkdownToAST(data.markdown);
        const roadmap = astToRoadmapJSON(ast);
        setJson(roadmap);
      } else {
        alert("No markdown returned", typeof data);
        console.log(typeof data, data);
      }
    } catch (err) {
      console.error(err);
      alert("Broooo Failed to generate: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ padding: 8, fontSize: 16, width: 300 }}
          placeholder="Enter career path..."
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ padding: "8px 16px", fontSize: 16, cursor: "pointer" }}
        >
          {loading ? "Generating..." : "Generate Roadmap"}
        </button>
      </div>
      <h1>{json.title || "Roadmap"}</h1>
      <VerticalRoadmap json={json} />
    </div>
  );
}
