import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

export async function parseMarkdownToAST(markdown) {
    const processor = unified().use(remarkParse).use(remarkGfm);
    const tree = processor.parse(markdown);
    return tree;
}

export function astToRoadmapJSON(ast) {
    const json = {
        title: "",
        groups: [],
        nodes: []
    };

    let currentGroup = null;
    let currentStep = null;
    let groupCounter = 1;
    let nodeCounter = 1;

    for (const node of ast.children) {
        // H1: main title
        if (node.type === "heading" && node.depth === 1) {
            json.title = node.children[0].value;
        }

        // H2: new group / phase
        if (node.type === "heading" && node.depth === 2) {
            const text = node.children[0].value;
            const [groupName, duration] = text.includes("(")
                ? [text.split("(")[0].trim(), text.split("(")[1].replace(")", "")]
                : [text, null];

            const groupId = `g${groupCounter++}`;

            currentGroup = {
                id: groupId,
                title: groupName,
                duration: duration,
                order: json.groups.length + 1
            };

            json.groups.push(currentGroup);
        }

        // H3: new step
        if (node.type === "heading" && node.depth === 3) {
            const stepTitle = node.children[0].value;

            currentStep = {
                id: `n${nodeCounter++}`,
                title: stepTitle,
                group: currentGroup ? currentGroup.id : null,
                bullets: [],
                order: 1
            };

            json.nodes.push(currentStep);
        }

        // Bullet list under a step (list)
        if (node.type === "list" && currentStep) {
            currentStep.bullets = node.children.map(item => {
                // Handle potential nested structures or different node types in list items
                if (item.children && item.children.length > 0 && item.children[0].children && item.children[0].children.length > 0) {
                    return item.children[0].children[0].value;
                }
                return "";
            }).filter(Boolean);
        }
    }

    return json;
}

export function normalizeRoadmapJSON(json) {
    json.groups.forEach(g => {
        json.nodes
            .filter(n => n.group === g.id)
            .forEach((node, index) => {
                node.order = index + 1;
            });
    });

    return json;
}
