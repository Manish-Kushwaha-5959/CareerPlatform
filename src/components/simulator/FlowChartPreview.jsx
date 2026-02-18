// src/components/flowchart/FlowChartPreview.jsx
"use client";
import { useEffect } from "react";
import React from "react";
import ReactFlow, { Background, Handle, Position,useReactFlow } from "reactflow";
import "reactflow/dist/style.css";

const TinyCleanNode = ({ data }) => {
  const colors = {
    1: "#3b82f6", // Science - blue
    2: "#f59e0b", // Commerce - orange
    3: "#10b981", // Arts - green
    4: "#8b5cf6", // Diploma - purple
    5: "#ef4444", // New-age - red
  };
  const color = colors[parseInt(data.id?.charAt(0)) || 1] || "#6366f1";

  return (
    <div
      className="bg-white rounded-lg shadow-md border-2 font-medium text-xs px-3 py-2 text-center leading-tight"
      style={{
        borderColor: color,
        minWidth: 140,
        maxWidth: 180,
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
      }}
      title={data.label}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div className="text-gray-800 font-semibold">{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
};

const nodeTypes = { custom: TinyCleanNode };

export default function FlowChartPreview({ nodes, edges,rootNodeIds = [] }) {
  const { fitView } = useReactFlow();

   useEffect(() => {
    if (nodes.length > 0) {
      // If specific nodes are provided, fit around them
      if (rootNodeIds.length > 0) {
        fitView({ nodes: rootNodeIds.map(id => ({ id })), padding: 0.4 });
      } else {
        fitView({ padding: 0.4 });
      }
    }
  }, [nodes, rootNodeIds, fitView]);
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView={false}
      fitViewOptions={{ padding: 0.2, maxZoom: 1, duration: 600 }}
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag={true}
      zoomOnScroll={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e0e7ff" gap={24} size={1} />
    </ReactFlow>
  );
}