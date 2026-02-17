// FlowChartBase.jsx
"use client";
import React, { useEffect, useMemo } from "react";
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { getLayoutedElements,INITIAL_NODES, initialEdges } from "@/utils/careerStream"; 
// adapt imports if your utils export different names

function FlowChartBase({
  // core data
  nodesSource = INITIAL_NODES,
  edgesSource = initialEdges,
  selectedStreams = [1,2,3,4,5],

  // behaviour
  interactive = false, // fullscreen => true, embedded => false
  showMiniMap = false,
  onNodeClick = undefined,
  className = "",
}) {
  // compute layout once for these sources & streams
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(nodesSource, edgesSource, selectedStreams),
    // IMPORTANT: nodesSource and edgesSource must be stable references (exported constants or memoized upstream)
    [nodesSource, edgesSource, JSON.stringify(selectedStreams)]
  );

  // controlled state for ReactFlow (we initialize from layout)
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // if interactive === false we disable dragging and interactions by props on ReactFlow below.
  useEffect(() => {
    // If sources (or selectedStreams) change, update nodes/edges (keeps view coherent).
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutedNodes, layoutedEdges]);

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        style={{ background: "transparent" }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesDraggable={interactive}
        nodesConnectable={false}
        elementsSelectable={interactive}
        onNodeClick={onNodeClick}
        fitView
        fitViewOnInit
        fitViewOptions={{ padding: interactive ? 0.05 : 0.12 }}
        panOnDrag={interactive}
        zoomOnScroll={interactive}
        zoomOnDoubleClick={interactive}
      >
        {interactive && <Controls />}
        {showMiniMap && interactive && <MiniMap />}
        {!interactive && <Background variant="dots" gap={16} size={0.8} color="#c7d2fe" />}
      </ReactFlow>
    </div>
  );
}

export default React.memo(FlowChartBase);
