let fileKey = null;

figma.showUI(__html__, { width: 400, height: 200 });

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === "file-url") {
    try {
      const match = msg.url.match(/figma\.com\/(?:file|design)\/([\w\d]+)/);
      if (!match) throw new Error("Invalid URL");

      fileKey = match[1];
      await runPlugin();
    } catch (err) {
      figma.closePlugin("❌ Invalid Figma file URL.");
    }
  }

  if (msg.type === "close") {
    figma.closePlugin("✅ CSV downloaded and text layers added.");
  }
};

async function runPlugin() {
  const allFrames = figma.currentPage.children.filter((node) =>
    node.type === "FRAME"
  );

  const filteredFrames = allFrames.filter((parent) => {
    const name = parent.name.toLowerCase();
    return (
      parent.name !== "🖼️ Cover" &&
      !name.includes("skip component extract") &&
      !name.includes("cookies") &&
      !name.includes("mobile")
    );
  });

  const allRows = [];

  for (const parent of filteredFrames) {
    const childFrames = parent.children.filter((node) =>
      ["FRAME", "COMPONENT", "COMPONENT_SET", "INSTANCE"].includes(node.type)
    );

    const componentNames = childFrames.map((child) => child.name).join("\n");

    // Create and position text node
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      const textNode = figma.createText();
      textNode.characters = componentNames;
      textNode.x = parent.x + parent.width + 50;
      textNode.y = parent.y;
      figma.currentPage.appendChild(textNode);
    } catch (err) {
      console.error("Font load error:", err.message);
    }

    // Build CSV rows
    for (const child of childFrames) {
      const link = `https://www.figma.com/file/${fileKey}?node-id=${encodeURIComponent(child.id)}`;
      allRows.push([
        child.name,
        link,
        figma.currentPage.name,
        parent.name
      ]);
    }
  }

  // CSV header and rows
  const csvLines = [
    ["Component name", "Link", "Figma Page", "Page Design"],
    ...allRows
  ];
  const csvContent = csvLines.map((row) =>
    row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  figma.ui.postMessage({
    type: "download-csv",
    fileName: "project-components.csv",
    data: csvContent
  });
}
