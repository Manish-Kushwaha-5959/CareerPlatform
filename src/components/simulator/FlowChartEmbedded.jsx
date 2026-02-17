// src/components/flowchart/FlowChartEmbedded.jsx
"use client";
import React, { useMemo } from "react";
import FlowChartPreview from "./FlowChartPreview";
import { Maximize2 } from "lucide-react";
import { initialEdges, INITIAL_NODES} from "@/utils/careerStream";

export default function FlowChartEmbedded({
  onExpand,
  selectedStreams = [1, 2, 3, 4, 5],
}) {
  const { nodes, edges,rootNodeIds  } = useMemo(() => {
    // Filter visible nodes and edges
    const visibleNodes = INITIAL_NODES.filter((n) => {
      const stream = parseInt(n.id.charAt(0));
      return selectedStreams.includes(stream);
    });

    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = initialEdges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    );
const getStreamColor = (stream) => {
    const colors = {
      '1': "#3b82f6",
      '2': "#f59e0b",
      '3': "#10b981",
      '4': "#8b5cf6",
      '5': "#ef4444",
    };
    return colors[stream] || "#6366f1";
  };
    // Build incoming map to find roots per stream
    const incomingMap = new Map();
    visibleEdges.forEach((e) => {
      if (!incomingMap.has(e.target)) incomingMap.set(e.target, []);
      incomingMap.get(e.target).push(e.source);
    });

    // Group nodes by stream
    const nodesByStream = {};
    visibleNodes.forEach((node) => {
      const stream = node.id.charAt(0);
      if (!nodesByStream[stream]) nodesByStream[stream] = [];
      nodesByStream[stream].push(node);
    });
    let allRootIds = [];
    const finalNodes = [];
    const finalEdges = visibleEdges.map((e) => ({
      ...e,
      type: "smoothstep",
      style: { stroke: "#cbd5e1", strokeWidth: 1.8 },
    }));

    let streamY = 80;
    Object.entries(nodesByStream).forEach(([stream, streamNodes]) => {
      // Find roots (no incoming edges)
      const roots = streamNodes.filter(node => !incomingMap.has(node.id));
      allRootIds.push(...roots.map(r => r.id));
      // Sort roots by id for consistent order
      roots.sort((a, b) => a.id.localeCompare(b.id));

      // Place roots at left (main streams)
      let rootX = 80;
      roots.forEach((root) => {
        finalNodes.push({
          ...root,
          position: { x: rootX, y: streamY },
          data: { ...root.data, color: getStreamColor(stream) },
          style: { width: 152, height: 44 },
          draggable: true,
        });
        rootX += 190;
      });

      // Place children to the right of roots or below if no roots
      let childX = roots.length > 0 ? rootX + 50 : 80;
      const nonRoots = streamNodes.filter(node => incomingMap.has(node.id));
      nonRoots.sort((a, b) => a.id.localeCompare(b.id));

      nonRoots.forEach((child) => {
        finalNodes.push({
          ...child,
          position: { x: childX, y: streamY + 60 },
          data: { ...child.data, color: getStreamColor(stream) },
          style: { width: 152, height: 44 },
          draggable: true,
        });
        childX += 190;
      });

      // Next stream below
      streamY += 140;
    });

    return { nodes: finalNodes, edges: finalEdges, rootNodeIds: allRootIds };
  }, [selectedStreams]);

  

  return (
    <div className="relative bg-gradient-to-b from-purple-50 via-pink-50 to-indigo-50 rounded-2xl p-6 shadow-2xl border border-purple-100 overflow-hidden">
      {/* Header */}
      <div className="absolute top-5 left-8 z-10 flex items-center gap-4">
        <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-xl">
          C
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-800">Career Universe</h3>
          <p className="text-sm text-gray-600">All paths at a glance</p>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-96 mt-4">
        <FlowChartPreview nodes={nodes} edges={edges} rootNodeIds={rootNodeIds}/>
      </div>

      {/* Expand Button */}
      <button
        onClick={onExpand}
        className="absolute top-6 right-6 z-10 p-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 hover:shadow-pink-500/60"
      >
        <Maximize2 className="w-7 h-7" />
      </button>
    </div>
  );
}