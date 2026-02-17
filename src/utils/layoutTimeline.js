// src/utils/layoutTimeline.js

/**
 * Computes Horizontal Timeline Layout
 * Root (Left) -> Phases (Horizontal Spine) -> Steps (Vertical Alternating Up/Down)
 */
export function computeTimelineLayout(json, opts = {}) {
    const cfg = {
        canvasPadding: opts.canvasPadding || 50,
        rootX: opts.rootX || 50,
        phaseStartX: opts.phaseStartX || 350,
        phaseGap: opts.phaseGap || 400, // Increased gap for wider steps

        rootWidth: opts.rootWidth || 200,
        rootHeight: opts.rootHeight || 80,

        phaseRadius: opts.phaseRadius || 60,

        stepWidth: opts.stepWidth || 350, // Wider for Title + Bracket + Desc
        stepHeight: opts.stepHeight || 80, // Taller for multi-line text
        stepGap: opts.stepGap || 20, // Vertical gap between steps
        branchPadding: opts.branchPadding || 60, // Gap between phase circle and first step

        ...opts
    };

    const groups = json.groups || [];
    const nodes = json.nodes || [];

    // Sort groups by order
    groups.sort((a, b) => (a.order || 0) - (b.order || 0));

    const positioned = {
        title: json.title,
        root: null,
        groups: [],
        nodes: [],
        connectors: []
    };

    // 1. Calculate vertical extent
    // Even phases go UP, Odd phases go DOWN
    let maxTopHeight = 0;
    let maxBottomHeight = 0;

    const groupMetrics = groups.map((g, index) => {
        const groupSteps = nodes.filter(n => n.group === g.id);
        const isUp = index % 2 === 0; // 0, 2, 4... go UP

        const totalHeight = groupSteps.length * (cfg.stepHeight + cfg.stepGap);

        if (isUp) {
            maxTopHeight = Math.max(maxTopHeight, totalHeight);
        } else {
            maxBottomHeight = Math.max(maxBottomHeight, totalHeight);
        }

        return { group: g, groupSteps, isUp };
    });

    // Spine Y Position (Center of canvas vertically)
    const spineY = Math.max(maxTopHeight + cfg.canvasPadding + 100, 400);

    // 2. Position Root
    const estimatedRootWidth = Math.max(cfg.rootWidth, (json.title || "").length * 12 + 40);
    positioned.root = {
        x: cfg.rootX,
        y: spineY - (cfg.rootHeight / 2),
        width: estimatedRootWidth,
        height: cfg.rootHeight,
        cx: cfg.rootX + estimatedRootWidth,
        cy: spineY
    };

    // 3. Position Phases and Steps
    // Track the right edge of the last element to determine the next center
    let currentRightEdge = Math.max(cfg.phaseStartX, positioned.root.cx + 100);

    groupMetrics.forEach((metric, index) => {
        const { group, groupSteps, isUp } = metric;

        // Calculate Dynamic Radius based on text length
        // Heuristic: Base 60 + extra for long text
        const textLen = group.title.length + (group.duration ? group.duration.length : 0);
        const dynamicR = Math.max(cfg.phaseRadius, 30 + (textLen * 1.5));

        const cx = currentRightEdge + dynamicR;

        // Position Phase Circle
        const phaseNode = {
            id: group.id,
            title: group.title,
            duration: group.duration,
            cx: cx,
            cy: spineY,
            r: dynamicR,
            colorIndex: index % 4
        };
        positioned.groups.push(phaseNode);

        // Connector: Root -> Phase 1 OR Phase N -> Phase N+1
        if (index === 0) {
            positioned.connectors.push({
                id: `conn-root-${group.id}`,
                type: 'spine',
                from: { x: positioned.root.cx, y: positioned.root.cy },
                to: { x: phaseNode.cx - phaseNode.r, y: phaseNode.cy }
            });
        } else {
            const prevPhase = positioned.groups[index - 1];
            positioned.connectors.push({
                id: `conn-${prevPhase.id}-${group.id}`,
                type: 'spine',
                from: { x: prevPhase.cx + prevPhase.r, y: prevPhase.cy },
                to: { x: phaseNode.cx - phaseNode.r, y: phaseNode.cy }
            });
        }

        // Position Steps
        // Tree Layout: Vertical Trunk from Phase, Horizontal Branches to Steps
        // Steps offset to the right to avoid collision with trunk
        const stepOffset = dynamicR + 20; // Start steps outside the circle

        let currentY = isUp
            ? spineY - dynamicR - cfg.branchPadding
            : spineY + dynamicR + cfg.branchPadding;

        groupSteps.forEach(s => {
            const stepNode = {
                id: s.id,
                title: s.title,
                bullets: s.bullets || [],
                x: cx + stepOffset, // Offset from phase center
                y: currentY,
                width: cfg.stepWidth,
                height: cfg.stepHeight,
                type: isUp ? 'step-top' : 'step-bottom',
                colorIndex: index % 4
            };
            positioned.nodes.push(stepNode);

            // Connector: L-shaped
            // From Phase Center (Vertical) -> Step Y -> Step X
            positioned.connectors.push({
                id: `conn-${group.id}-${s.id}`,
                type: isUp ? 'branch-top' : 'branch-bottom',
                from: { x: phaseNode.cx, y: isUp ? phaseNode.cy - phaseNode.r : phaseNode.cy + phaseNode.r },
                to: { x: stepNode.x, y: stepNode.y + 20 },
                colorIndex: index % 4
            });

            if (isUp) {
                currentY -= (cfg.stepHeight + cfg.stepGap);
            } else {
                currentY += (cfg.stepHeight + cfg.stepGap);
            }
        });

        // Update right edge for next phase
        currentRightEdge = cx + dynamicR + cfg.phaseGap;
    });

    positioned.canvasWidth = currentRightEdge + 100;
    positioned.canvasHeight = spineY + maxBottomHeight + cfg.canvasPadding + 100;

    return positioned;
}
