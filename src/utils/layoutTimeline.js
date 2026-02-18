// src/utils/layoutTimeline.js

/**
 * Computes Vertical Timeline Layout
 * Root (Top) -> Phases (Vertical Spine)
 * Steps branch left/right under each phase
 */
export function computeTimelineLayout(json, opts = {}) {
  const cfg = {
    canvasPadding: opts.canvasPadding || 80,

    rootWidth: opts.rootWidth || 260,
    rootHeight: opts.rootHeight || 100,

    phaseRadius: opts.phaseRadius || 60,
    phaseGap: opts.phaseGap || 160,

    stepWidth: opts.stepWidth || 300,
    stepHeight: opts.stepHeight || 90,
    stepGap: opts.stepGap || 25,
    branchPadding: opts.branchPadding || 50,

    canvasWidth: opts.canvasWidth || 1400,

    ...opts
  };

  const groups = [...(json.groups || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  const nodes = json.nodes || [];

  const positioned = {
    title: json.title,
    root: null,
    groups: [],
    nodes: [],
    connectors: []
  };

  const centerX = cfg.canvasWidth / 2;

  // ─────────────────────────────
  // 1️⃣ Position Root (Top Center)
  // ─────────────────────────────
  const rootY = cfg.canvasPadding;

  positioned.root = {
    x: centerX - cfg.rootWidth / 2,
    y: rootY,
    width: cfg.rootWidth,
    height: cfg.rootHeight,
    cx: centerX,
    cy: rootY + cfg.rootHeight / 2
  };

  let currentY = positioned.root.cy + 180;

  // Helper function to wrap text
  function wrapText(text, maxChars) {
    if (!text) return [];
    const words = text.split(" ");
    let lines = [];
    let currentLine = [];
    words.forEach((w) => {
      const test = [...currentLine, w].join(" ");
      if (test.length > maxChars) {
        lines.push(currentLine.join(" "));
        currentLine = [w];
      } else {
        currentLine.push(w);
      }
    });
    if (currentLine.length) lines.push(currentLine.join(" "));
    return lines;
  }

  // Helper function to estimate bullet lines
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

  // ─────────────────────────────
  // 2️⃣ Position Phases & Steps
  // ─────────────────────────────
  groups.forEach((group, index) => {
    const groupSteps = nodes.filter(n => n.group === group.id);

    // Compute dynamic radius for phase
    const phaseMaxChars = 20; // Increased for better fitting
    const titleLines = wrapText(group.title, phaseMaxChars).length;
    const durationLines = group.duration ? wrapText(group.duration, phaseMaxChars).length : 0;
    const totalLines = titleLines + durationLines;
    const phaseLineHeight = 16;
    const textPadding = 30;
    const dynamicR = Math.max(
      cfg.phaseRadius,
      (totalLines * phaseLineHeight + (durationLines > 0 ? 8 : 0)) / 2 + textPadding / 2
    );

    const phaseNode = {
      id: group.id,
      title: group.title,
      duration: group.duration,
      cx: centerX,
      cy: currentY,
      r: dynamicR,
      colorIndex: index % 4
    };

    positioned.groups.push(phaseNode);

    // ─────────────────────────
    // Connector from previous phase or root
    // ─────────────────────────
    if (index === 0) {
      positioned.connectors.push({
        id: `conn-root-${group.id}`,
        type: "spine",
        from: { x: positioned.root.cx, y: positioned.root.cy },
        to: { x: phaseNode.cx, y: phaseNode.cy - dynamicR }
      });
    } else {
      const prev = positioned.groups[index - 1];
      positioned.connectors.push({
        id: `conn-${prev.id}-${group.id}`,
        type: "spine",
        from: { x: prev.cx, y: prev.cy + prev.r },
        to: { x: phaseNode.cx, y: phaseNode.cy - dynamicR }
      });
    }

    // ─────────────────────────
    // 3️⃣ Steps layout
    // ─────────────────────────
    // Available half width from center
    const maxSideWidth = centerX - cfg.stepWidth - cfg.canvasPadding;

    // Safe offset so it never goes outside
    const horizontalOffset = Math.min(
      dynamicR + 150, // Increased for better spacing
      maxSideWidth - dynamicR
    );

    let stepY = phaseNode.cy + dynamicR + cfg.branchPadding;

    groupSteps.forEach(step => {
      // Compute dynamic height for step
      const bullets = step.bullets || [];
      const totalBulletLines = estimateBulletLines(bullets);
      const titleHeight = 30;
      const lineHeight = 18;
      const padding = 40;
      const numBullets = bullets.length;
      const gapHeight = (numBullets > 0 ? (numBullets - 1) * 9 : 0); // Approx gap between bullets
      let calculatedHeight = titleHeight + totalBulletLines * lineHeight + gapHeight + padding;
      calculatedHeight = Math.max(cfg.stepHeight, calculatedHeight);

      const isRightSide = index % 2 === 1; // Alternate: even index left, odd right

      const stepNode = {
        id: step.id,
        title: step.title,
        bullets: step.bullets || [],
        x: isRightSide
          ? phaseNode.cx + horizontalOffset
          : phaseNode.cx - horizontalOffset - cfg.stepWidth,
        y: stepY,
        width: cfg.stepWidth,
        height: calculatedHeight,
        colorIndex: index % 4
      };

      positioned.nodes.push(stepNode);

      // Branch connector
      positioned.connectors.push({
        id: `conn-${group.id}-${step.id}`,
        type: "branch",
        from: {
          x: phaseNode.cx,
          y: phaseNode.cy + dynamicR
        },
        to: {
          x: isRightSide ? stepNode.x : stepNode.x + cfg.stepWidth,
          y: stepNode.y + calculatedHeight / 2
        },
        colorIndex: index % 4
      });

      stepY += calculatedHeight + cfg.stepGap;
    });

    // Move down for next phase
    currentY = stepY + cfg.phaseGap;
  });

  // ─────────────────────────────
  // 4️⃣ Final Canvas Size
  // ─────────────────────────────
  positioned.canvasWidth = cfg.canvasWidth;
  positioned.canvasHeight = currentY + cfg.canvasPadding;

  return positioned;
}