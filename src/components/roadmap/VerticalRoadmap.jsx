// src/components/VerticalRoadmap.jsx
import { useEffect, useRef, useState } from "react";
import { computeTimelineLayout } from "../../utils/layoutTimeline";
import domtoimage from "dom-to-image-more";
import { jsPDF } from "jspdf";
import "svg2pdf.js";

// Color palettes for phases
const PHASE_COLORS = [
  { fill: "#3b82f6", stroke: "#2563eb", text: "#ffffff" }, // Blue
  { fill: "#f97316", stroke: "#ea580c", text: "#ffffff" }, // Orange
  { fill: "#10b981", stroke: "#059669", text: "#ffffff" }, // Emerald
  { fill: "#8b5cf6", stroke: "#7c3aed", text: "#ffffff" }, // Violet
];

export default function VerticalRoadmap({ json, options }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    if (!json) return;
    const pos = computeTimelineLayout(json, options);
    setLayout(pos);
  }, [json, options]);

  useEffect(() => {
    if (!layout) return;
    renderSVG(layout);
    // eslint-disable-next-line
  }, [layout]);

  function clearSvg(svgElement) {
    while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
    }
  }

  function renderSVG(pos) {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    clearSvg(svgEl);

    svgEl.setAttribute("width", pos.canvasWidth);
    svgEl.setAttribute("height", pos.canvasHeight);
    svgEl.setAttribute("viewBox", `0 0 ${pos.canvasWidth} ${pos.canvasHeight}`);

    renderBackground(svgEl, pos);

    // Add filter for text background
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const filter = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "filter"
    );
    filter.setAttribute("id", "text-bg");
    filter.setAttribute("x", "-0.1");
    filter.setAttribute("y", "-0.1");
    filter.setAttribute("width", "1.2");
    filter.setAttribute("height", "1.2");

    // Filter structure: Flood white -> Composite with SourceGraphic (to mask) -> Dilate SourceAlpha -> Composite with Flood -> Merge
    filter.innerHTML = `
            <feFlood flood-color="white" result="bg"/>
            <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="thick"/>
            <feComposite in="bg" in2="thick" operator="in" result="halo"/>
            <feMerge>
                <feMergeNode in="halo"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        `;
    defs.appendChild(filter);
    svgEl.appendChild(defs);

    renderConnectors(svgEl, pos);
    renderRootNode(svgEl, pos);
    renderPhaseNodes(svgEl, pos);
    renderStepNodes(svgEl, pos);
  }

  function renderBackground(svgEl, pos) {
    const ns = "http://www.w3.org/2000/svg";
    const bg = document.createElementNS(ns, "rect");
    bg.setAttribute("width", pos.canvasWidth);
    bg.setAttribute("height", pos.canvasHeight);
    bg.setAttribute("fill", "#ffffff");
    svgEl.appendChild(bg);
  }

  function renderConnectors(svgEl, pos) {
    const ns = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(ns, "g");

    pos.connectors.forEach((conn) => {
      const path = document.createElementNS(ns, "path");
      let d = "";

      if (conn.type === "spine") {
        d = `M ${conn.from.x} ${conn.from.y} L ${conn.to.x} ${conn.to.y}`;
        path.setAttribute("stroke", "#94a3b8");
        path.setAttribute("stroke-width", "4");
      } else {
        // Branch: Orthogonal Tree Style
        // From Phase Center (Vertical) -> Step Y -> Step X
        // conn.from = {x: cx, y: cy +/- r}
        // conn.to = {x: stepX, y: stepY + offset}

        // Draw Vertical then Horizontal
        d = `M ${conn.from.x} ${conn.from.y} L ${conn.from.x} ${conn.to.y} L ${conn.to.x} ${conn.to.y}`;

        path.setAttribute("stroke", PHASE_COLORS[conn.colorIndex].stroke);
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-dasharray", "4 2");
        path.setAttribute("fill", "none");
      }

      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      g.appendChild(path);
    });
    svgEl.appendChild(g);
  }

  function renderRootNode(svgEl, pos) {
    if (!pos.root) return;
    const ns = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(ns, "g");

    const rect = document.createElementNS(ns, "rect");
    rect.setAttribute("x", pos.root.x);
    rect.setAttribute("y", pos.root.y);
    rect.setAttribute("width", pos.root.width);
    rect.setAttribute("height", pos.root.height);
    rect.setAttribute("rx", 8);
    rect.setAttribute("fill", "#1e293b");
    g.appendChild(rect);

    const text = document.createElementNS(ns, "text");
    text.setAttribute("x", pos.root.cx - pos.root.width / 2);
    text.setAttribute("y", pos.root.cy);
    text.setAttribute("dy", "0.35em");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#ffffff");
    text.setAttribute("font-weight", "bold");
    text.textContent = pos.title;
    g.appendChild(text);

    svgEl.appendChild(g);
  }

  function renderPhaseNodes(svgEl, pos) {
    const ns = "http://www.w3.org/2000/svg";

    pos.groups.forEach((grp) => {
      const g = document.createElementNS(ns, "g");
      const color = PHASE_COLORS[grp.colorIndex];

      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", grp.cx);
      circle.setAttribute("cy", grp.cy);
      circle.setAttribute("r", grp.r);
      circle.setAttribute("fill", color.fill);
      circle.setAttribute("stroke", color.stroke);
      circle.setAttribute("stroke-width", "3");
      g.appendChild(circle);

      const text = document.createElementNS(ns, "text");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", color.text);
      text.setAttribute("font-size", "14");
      text.setAttribute("font-weight", "bold");

      // Wrap text
      const words = grp.title.split(" ");
      let lines = [];
      let currentLine = [];
      words.forEach((w) => {
        if ([...currentLine, w].join(" ").length > 12) {
          lines.push(currentLine.join(" "));
          currentLine = [w];
        } else {
          currentLine.push(w);
        }
      });
      if (currentLine.length) lines.push(currentLine.join(" "));

      // Calculate total height to center everything
      const totalLines = lines.length + (grp.duration ? 1 : 0);

      lines.forEach((line, i) => {
        const tspan = document.createElementNS(ns, "tspan");
        tspan.setAttribute("x", grp.cx);
        tspan.setAttribute(
          "dy",
          i === 0 ? `-${(totalLines - 1) * 0.5}em` : "1.2em"
        );
        tspan.textContent = line;
        text.appendChild(tspan);
      });

      // Duration
      if (grp.duration) {
        const tspan = document.createElementNS(ns, "tspan");
        tspan.setAttribute("x", grp.cx);
        tspan.setAttribute("dy", "1.4em");
        tspan.setAttribute("font-size", "11");
        tspan.setAttribute("font-weight", "400");
        tspan.setAttribute("fill", "#e2e8f0"); // Lighter text
        tspan.textContent = grp.duration;
        text.appendChild(tspan);
      }

      g.appendChild(text);
      svgEl.appendChild(g);
    });
  }

  function renderStepNodes(svgEl, pos) {
    const ns = "http://www.w3.org/2000/svg";

    pos.nodes.forEach((node) => {
      const g = document.createElementNS(ns, "g");
      const color = PHASE_COLORS[node.colorIndex];

      // Title - Left Aligned
      const title = document.createElementNS(ns, "text");
      title.setAttribute("x", node.x);
      title.setAttribute("y", node.y);
      title.setAttribute("text-anchor", "start"); // Left align
      title.setAttribute("font-weight", "bold");
      title.setAttribute("font-size", "14");
      title.setAttribute("fill", "#1e293b");
      title.setAttribute("filter", "url(#text-bg)");
      title.textContent = node.title;
      g.appendChild(title);

      // Bracket (Visual decoration) - Adjusted for left alignment
      // Curve under the title? Or just a line?
      // Let's make a small curve under the start of the title
      const bracketPath = `M ${node.x} ${node.y + 8} Q ${node.x + 20} ${
        node.y + 18
      } ${node.x + 40} ${node.y + 8}`;
      const bracket = document.createElementNS(ns, "path");
      bracket.setAttribute("d", bracketPath);
      bracket.setAttribute("fill", "none");
      bracket.setAttribute("stroke", color.stroke);
      bracket.setAttribute("stroke-width", "2");
      g.appendChild(bracket);

      // Bullets - Left Aligned
      if (node.bullets && node.bullets.length > 0) {
        const bulletsGroup = document.createElementNS(ns, "text");
        bulletsGroup.setAttribute("x", node.x);
        bulletsGroup.setAttribute("y", node.y + 35);
        bulletsGroup.setAttribute("text-anchor", "start"); // Left align
        bulletsGroup.setAttribute("font-size", "11");
        bulletsGroup.setAttribute("fill", "#475569");
        bulletsGroup.setAttribute("filter", "url(#text-bg)");

        node.bullets.forEach((bullet, i) => {
          const tspan = document.createElementNS(ns, "tspan");
          tspan.setAttribute("x", node.x);
          tspan.setAttribute("dy", i === 0 ? 0 : "1.2em");
          // Truncate if too long
          tspan.textContent =
            bullet.length > 60 ? bullet.substring(0, 60) + "..." : bullet;
          bulletsGroup.appendChild(tspan);
        });
        g.appendChild(bulletsGroup);
      }

      svgEl.appendChild(g);
    });
  }

  async function exportSvg() {
    const svg = svgRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = (json.title || "roadmap") + ".svg";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function exportPng() {
    if (!containerRef.current) return;
    try {
      const dataUrl = await domtoimage.toPng(containerRef.current, {
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = (json.title || "roadmap") + ".png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    }
  }

  async function exportPdf() {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });
      await pdf.svg(svgEl, { x: 10, y: 10, width: 800, height: 550 });
      pdf.save((json.title || "roadmap") + ".pdf");
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={exportSvg}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Download SVG
        </button>
        <button
          onClick={exportPng}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Download PNG
        </button>
        <button
          onClick={exportPdf}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Download PDF
        </button>
      </div>
      <div
        ref={containerRef}
        style={{ background: "#fff", padding: 20, overflow: "auto" }}
      >
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
