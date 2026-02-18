// src/components/VerticalRoadmap.jsx
import { useEffect, useRef, useState } from "react";
import { computeTimelineLayout } from "../../utils/layoutTimeline";
import domtoimage from "dom-to-image-more";
import { jsPDF } from "jspdf";
import "svg2pdf.js";

// Color palettes for phases - These can be customized for different themes
const PHASE_COLORS = [
  { fill: "#3b82f6", stroke: "#2563eb", text: "#ffffff" }, // Blue for foundational phases
  { fill: "#f97316", stroke: "#ea580c", text: "#ffffff" }, // Orange for intermediate
  { fill: "#10b981", stroke: "#059669", text: "#ffffff" }, // Emerald for advanced
  { fill: "#8b5cf6", stroke: "#7c3aed", text: "#ffffff" }, // Violet for expert/specialization
];

// Default options for layout - Can be passed as props for customization
const DEFAULT_OPTIONS = {
  phaseRadius: 60,
  stepWidth: 300,
  phaseGap: 250,   // Renamed and increased
  branchPadding: 50,
  fontFamily: "system-ui, -apple-system, sans-serif", // Modern font stack
};

export default function VerticalRoadmap({ json, options = DEFAULT_OPTIONS }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [layout, setLayout] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Compute layout when json or options change
  useEffect(() => {
    if (!json || dimensions.width === 0) return;

    const pos = computeTimelineLayout(json, {
      ...options,
      canvasWidth: dimensions.width - 48  // match container padding
    });

    setLayout(pos);
  }, [json, options, dimensions.width]);

  // Handle resizing for responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Render SVG when layout or dimensions change
  useEffect(() => {
    if (!layout || dimensions.width === 0) return;
    renderSVG(layout, dimensions);
    // eslint-disable-next-line
  }, [layout, dimensions]);

  // Utility to clear existing SVG content
  function clearSvg(svgElement) {
    while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
    }
  }

  // Helper function to estimate bullet lines (same as layout)
  function estimateBulletLines(bullets, maxChars = 45) {
    let totalLines = 0;
    (bullets || []).forEach((bullet) => {
      const words = bullet.split(" ");
      let numLines = 0;
      let current = "";
      words.forEach((word) => {
        const test = current ? current + " " + word : word;
        if (test.length > maxChars) {
          if (current) numLines++;
          current = word;
        } else {
          current = test;
        }
      });
      if (current) numLines++;
      totalLines += numLines;
    });
    return totalLines;
  }

  // Main rendering function - Draws the entire roadmap as SVG
  function renderSVG(pos, dims) {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    clearSvg(svgEl);

    // Make SVG responsive: Use viewBox for scaling, set width/height to container size
    svgEl.removeAttribute("width");
    svgEl.removeAttribute("height");

    svgEl.setAttribute("viewBox", `0 0 ${pos.canvasWidth} ${pos.canvasHeight}`);
    svgEl.setAttribute("preserveAspectRatio", "xMidYMin meet");

    svgEl.style.width = "100%";
    svgEl.style.height = "auto";
    svgEl.style.display = "block";


    // Render components in layers for better visual hierarchy
    renderBackground(svgEl, pos);
    addDefs(svgEl); // Add filters and patterns
    renderConnectors(svgEl, pos);
    renderRootNode(svgEl, pos);
    renderPhaseNodes(svgEl, pos);
    renderStepNodes(svgEl, pos);
  }

  // Render light background for the canvas
  function renderBackground(svgEl, pos) {
    const ns = "http://www.w3.org/2000/svg";
    const bg = document.createElementNS(ns, "rect");
    bg.setAttribute("width", pos.canvasWidth);
    bg.setAttribute("height", pos.canvasHeight);
    bg.setAttribute("fill", "#f8fafc"); // Light gray for subtle background
    svgEl.appendChild(bg);
  }

  // Add SVG definitions (filters for text shadows, patterns if needed)
  function addDefs(svgEl) {
    const ns = "http://www.w3.org/2000/svg";
    const defs = document.createElementNS(ns, "defs");

    // Text halo filter for better readability
    const textFilter = document.createElementNS(ns, "filter");
    textFilter.setAttribute("id", "text-halo");
    textFilter.setAttribute("x", "-0.1");
    textFilter.setAttribute("y", "-0.1");
    textFilter.setAttribute("width", "1.2");
    textFilter.setAttribute("height", "1.2");
    textFilter.innerHTML = `
      <feFlood flood-color="white" result="bg"/>
      <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="thick"/>
      <feComposite in="bg" in2="thick" operator="in" result="halo"/>
      <feMerge>
        <feMergeNode in="halo"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    `;
    defs.appendChild(textFilter);

    // Drop shadow filter for elements (replaces CSS drop-shadow)
    const shadowFilter = document.createElementNS(ns, "filter");
    shadowFilter.setAttribute("id", "drop-shadow");
    shadowFilter.setAttribute("x", "-50%");
    shadowFilter.setAttribute("y", "-50%");
    shadowFilter.setAttribute("width", "200%");
    shadowFilter.setAttribute("height", "200%");
    shadowFilter.innerHTML = `
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
      <feOffset in="blur" dx="0" dy="3" result="offsetBlur"/>
      <feFlood flood-color="rgba(0,0,0,0.1)" result="flood"/>
      <feComposite in="flood" in2="offsetBlur" operator="in" result="composite"/>
      <feMerge>
        <feMergeNode in="composite"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    `;
    defs.appendChild(shadowFilter);

    // Optional: Add a subtle grid pattern for roadmap feel (applied if needed)
    const pattern = document.createElementNS(ns, "pattern");
    pattern.setAttribute("id", "grid");
    pattern.setAttribute("width", "20");
    pattern.setAttribute("height", "20");
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", "M 20 0 L 0 0 0 20");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#e2e8f0");
    path.setAttribute("stroke-width", "0.5");
    pattern.appendChild(path);
    defs.appendChild(pattern);

    svgEl.appendChild(defs);
  }

  // Render lines connecting phases and steps - The "road" in roadmap
  function renderConnectors(svgEl, pos) {
    const ns = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(ns, "g");

    pos.connectors.forEach((conn) => {
      const path = document.createElementNS(ns, "path");
      let d = "";

      if (conn.type === "spine") {
        // Main vertical timeline spine - Thicker for emphasis
        d = `M ${conn.from.x} ${conn.from.y} L ${conn.to.x} ${conn.to.y}`;
        path.setAttribute("stroke", "#94a3b8");
        path.setAttribute("stroke-width", "6"); // Increased for visibility
        path.setAttribute("stroke-linecap", "round");
      } else {
        // Branches to steps - Dashed for distinction, aligned to card center
        d = `M ${conn.from.x} ${conn.from.y} L ${conn.from.x} ${conn.to.y} L ${conn.to.x} ${conn.to.y}`;
        path.setAttribute("stroke", PHASE_COLORS[conn.colorIndex].stroke);
        path.setAttribute("stroke-width", "3");
        path.setAttribute("stroke-dasharray", "5 3");
        path.setAttribute("stroke-linecap", "round");
      }

      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      g.appendChild(path);
    });
    svgEl.appendChild(g);
  }

  // Render the root/title node - Top of the roadmap
  function renderRootNode(svgEl, pos) {
    if (!pos.root) return;
    const ns = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(ns, "g");

    // Rounded rectangle for title
    const rect = document.createElementNS(ns, "rect");
    rect.setAttribute("x", pos.root.x);
    rect.setAttribute("y", pos.root.y);
    rect.setAttribute("width", pos.root.width);
    rect.setAttribute("height", pos.root.height);
    rect.setAttribute("rx", 12); // Softer corners
    rect.setAttribute("fill", "#1e293b");
    rect.setAttribute("stroke", "#0f172a");
    rect.setAttribute("stroke-width", "2");
    g.appendChild(rect);

    // Title text - Centered vertically
    const text = document.createElementNS(ns, "text");
    text.setAttribute("x", pos.root.cx);
    text.setAttribute("y", pos.root.cy);
    text.setAttribute("dy", "0.35em");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#ffffff");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("font-size", "18"); // Larger for prominence
    text.setAttribute("font-family", DEFAULT_OPTIONS.fontFamily);
    text.textContent = pos.title || "Career Roadmap";
    g.appendChild(text);

    svgEl.appendChild(g);
  }

  // Render phase nodes - Circular milestones along the timeline
  function renderPhaseNodes(svgEl, pos) {
    const ns = "http://www.w3.org/2000/svg";

    pos.groups.forEach((grp) => {
      const g = document.createElementNS(ns, "g");
      const color = PHASE_COLORS[grp.colorIndex % PHASE_COLORS.length];

      // Circle with SVG shadow for depth
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", grp.cx);
      circle.setAttribute("cy", grp.cy);
      circle.setAttribute("r", grp.r);
      circle.setAttribute("fill", color.fill);
      circle.setAttribute("stroke", color.stroke);
      circle.setAttribute("stroke-width", "4");
      circle.setAttribute("filter", "url(#drop-shadow)");
      g.appendChild(circle);

      // Phase title with wrapping - Adjusted for better centering within circle
      const text = document.createElementNS(ns, "text");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", color.text);
      text.setAttribute("font-size", "14"); // Slightly smaller to fit better
      text.setAttribute("font-weight", "bold");
      text.setAttribute("font-family", DEFAULT_OPTIONS.fontFamily);

      const phaseMaxChars = 20; // Increased
      const words = (grp.title || "").split(" ");
      let lines = [];
      let currentLine = [];
      words.forEach((w) => {
        const test = [...currentLine, w].join(" ");
        if (test.length > phaseMaxChars) {
          lines.push(currentLine.join(" "));
          currentLine = [w];
        } else {
          currentLine.push(w);
        }
      });
      if (currentLine.length) lines.push(currentLine.join(" "));

      // Center lines vertically within circle radius
      const lineHeight = 1.2;
      const totalHeight = lines.length * lineHeight;
      const startDy = -(totalHeight / 2) + (lineHeight / 2);

      lines.forEach((line, i) => {
        const tspan = document.createElementNS(ns, "tspan");
        tspan.setAttribute("x", grp.cx);
        tspan.setAttribute("dy", i === 0 ? `${startDy}em` : `${lineHeight}em`);
        tspan.textContent = line;
        text.appendChild(tspan);
      });

      // Duration as subtitle - Below lines
      if (grp.duration) {
        const tspan = document.createElementNS(ns, "tspan");
        tspan.setAttribute("x", grp.cx);
        tspan.setAttribute("dy", `${lineHeight + 0.5}em`);
        tspan.setAttribute("font-size", "11");
        tspan.setAttribute("font-weight", "500");
        tspan.setAttribute("fill", "#f1f5f9"); // Softer color
        tspan.textContent = grp.duration;
        text.appendChild(tspan);
      }

      g.appendChild(text);
      svgEl.appendChild(g);
    });
  }

  // Render step nodes - Branching details, aligned cards for better readability
  function renderStepNodes(svgEl, pos) {
    const ns = "http://www.w3.org/2000/svg";

    pos.nodes.forEach((node) => {
      const g = document.createElementNS(ns, "g");
      const color = PHASE_COLORS[node.colorIndex % PHASE_COLORS.length];

      // Card background for steps - Aligned to node.y as top of card
      const cardWidth = options.stepWidth || 300;
      const titleHeight = 30;
      const bulletSpacing = 18;
      const totalLines = estimateBulletLines(node.bullets);
      const numBullets = (node.bullets || []).length;
      const extraGaps = (numBullets - 1) * (bulletSpacing * 0.5); // Approx 0.5 line for gaps
      const cardHeight = titleHeight + totalLines * bulletSpacing + extraGaps + 40; // Adjusted padding

      const cardX = node.x; // Slight left indent for alignment
      const cardY = node.y; // Removed -10

      const rect = document.createElementNS(ns, "rect");
      rect.setAttribute("x", cardX);
      rect.setAttribute("y", cardY);
      rect.setAttribute("width", cardWidth);
      rect.setAttribute("height", cardHeight);
      rect.setAttribute("rx", 8);
      rect.setAttribute("fill", "#ffffff");
      rect.setAttribute("stroke", color.stroke);
      rect.setAttribute("stroke-width", "2");
      rect.setAttribute("filter", "url(#drop-shadow)");
      g.appendChild(rect);

      // Step title - Positioned inside card
      const title = document.createElementNS(ns, "text");
      title.setAttribute("x", node.x + 10); // Padding
      title.setAttribute("y", node.y + 20);
      title.setAttribute("text-anchor", "start");
      title.setAttribute("font-weight", "bold");
      title.setAttribute("font-size", "15");
      title.setAttribute("fill", "#1e293b");
      title.setAttribute("font-family", DEFAULT_OPTIONS.fontFamily);
      title.setAttribute("filter", "url(#text-halo)");
      title.textContent = node.title;
      g.appendChild(title);

      // Bullets as list items - Positioned inside card
      if (node.bullets && node.bullets.length > 0) {
        const bulletsGroup = document.createElementNS(ns, "text");
        bulletsGroup.setAttribute("x", node.x + 10); // Padding
        bulletsGroup.setAttribute("y", node.y + titleHeight + 10);
        bulletsGroup.setAttribute("text-anchor", "start");
        bulletsGroup.setAttribute("font-size", "12");
        bulletsGroup.setAttribute("fill", "#475569");
        bulletsGroup.setAttribute("font-family", DEFAULT_OPTIONS.fontFamily);
        bulletsGroup.setAttribute("filter", "url(#text-halo)");

        node.bullets.forEach((bullet, i) => {
          if (i > 0) {
            // Add gap between bullets
            const gapTspan = document.createElementNS(ns, "tspan");
            gapTspan.setAttribute("x", node.x + 10);
            gapTspan.setAttribute("dy", "0.5em");
            gapTspan.textContent = "";
            bulletsGroup.appendChild(gapTspan);
          }

          const words = bullet.split(" ");
          let line = "";
          let lineCount = 0;

          words.forEach((word) => {
            const testLine = line + word + " ";
            if (testLine.length > 45) {
              const tspan = document.createElementNS(ns, "tspan");
              tspan.setAttribute("x", node.x + 10);
              tspan.setAttribute("dy", lineCount === 0 ? "1.2em" : "1.4em"); // Adjusted initial dy
              tspan.textContent = line;
              bulletsGroup.appendChild(tspan);
              line = word + " ";
              lineCount++;
            } else {
              line = testLine;
            }
          });

          if (line) {
            const tspan = document.createElementNS(ns, "tspan");
            tspan.setAttribute("x", node.x + 10);
            tspan.setAttribute("dy", lineCount === 0 ? "1.2em" : "1.4em");
            tspan.textContent = line;
            bulletsGroup.appendChild(tspan);
          }
        });

        g.appendChild(bulletsGroup);
      }

      svgEl.appendChild(g);
    });
  }

  // Export functions - Unchanged, but added error handling
  async function exportSvg() {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = (json.title || "roadmap") + ".svg";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("SVG Export Error:", err);
    }
  }

  async function exportPng() {
    if (!containerRef.current || !layout) return;
    try {
      const dataUrl = await domtoimage.toPng(containerRef.current, {
        cacheBust: true,
        width: layout.canvasWidth,
        height: layout.canvasHeight,
      });
      const link = document.createElement("a");
      link.download = (json.title || "roadmap") + ".png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG Export Error:", err);
    }
  }

  async function exportPdf() {
    const svgEl = svgRef.current;
    if (!svgEl || !layout) return;
    try {
      const pdf = new jsPDF({
        orientation: layout.canvasWidth > layout.canvasHeight ? "landscape" : "portrait",
        unit: "pt",
        format: [layout.canvasWidth + 20, layout.canvasHeight + 20], // Convert to points
      });
      await pdf.svg(svgEl, { x: 10, y: 10, width: layout.canvasWidth, height: layout.canvasHeight });
      pdf.save((json.title || "roadmap") + ".pdf");
    } catch (err) {
      console.error("PDF Export Error:", err);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "0 16px",
      }}
    >
      {/* Centered container */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, justifyContent: "center" }}>
        <button
          onClick={exportSvg}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Download SVG
        </button>
        <button
          onClick={exportPng}
          style={{
            padding: "10px 20px",
            backgroundColor: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Download PNG
        </button>
        <button
          onClick={exportPdf}
          style={{
            padding: "10px 20px",
            backgroundColor: "#8b5cf6",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Download PDF
        </button>
      </div>
      <div
        ref={containerRef}
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          overflowX: "auto",
          overflowY: "visible", // Changed to visible
          maxHeight: "none", // Removed maxHeight
          width: "100%",
        }}
      >
        <svg ref={svgRef} style={{ display: "block", margin: "0 auto" }} />
      </div>
    </div>
  );
}