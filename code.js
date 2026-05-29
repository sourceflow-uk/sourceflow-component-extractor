let fileKey = null;
let scannedData = null;

figma.showUI(__html__, { width: 400, height: 440 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'file-url') {
    try {
      const match = msg.url.match(/figma\.com\/(?:file|design)\/([\w\d]+)/);
      if (!match) throw new Error('Invalid URL');
      fileKey = match[1];
      scannedData = scanComponents();
      figma.ui.resize(400, scannedData.flaggedNames.length > 0 ? 460 : 320);
      figma.ui.postMessage({
        type: 'scan-result',
        uniqueCount: scannedData.uniqueCount,
        flaggedNames: scannedData.flaggedNames,
        frameCount: scannedData.frameCount
      });
    } catch (err) {
      figma.ui.postMessage({ type: 'error', message: 'Invalid Figma file URL.' });
    }
  }

  if (msg.type === 'confirm-download') {
    if (!scannedData) return;
    try {
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      for (const { node, componentText } of scannedData.frames) {
        const textNode = figma.createText();
        textNode.characters = componentText;
        textNode.x = node.x + node.width + 50;
        textNode.y = node.y;
        figma.currentPage.appendChild(textNode);
      }
    } catch (err) {
      console.error('Font load error:', err.message);
    }

    const csvLines = [
      ['Component name', 'Link', 'Figma Page', 'Page Design'],
      ...scannedData.csvRows
    ];
    const csvContent = csvLines
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    figma.ui.postMessage({
      type: 'download-csv',
      fileName: buildFileName(figma.root.name),
      data: csvContent
    });
  }

  if (msg.type === 'open-url') {
    figma.openExternal(msg.url);
  }

  if (msg.type === 'close') {
    figma.closePlugin('✅ CSV downloaded and text layers added.');
  }
};

function shouldSkip(name) {
  const lower = name.toLowerCase();
  return (
    name === '🖼️ Cover' ||
    lower.includes('skip component extract') ||
    lower.includes('cookies') ||
    lower.includes('mobile')
  );
}

function scanComponents() {
  const allFrames = figma.currentPage.children.filter(n => n.type === 'FRAME');
  const filteredFrames = allFrames.filter(parent => !shouldSkip(parent.name));

  const csvRows = [];
  const frames = [];
  const seenNames = new Set();
  const flaggedMap = new Map();

  for (const parent of filteredFrames) {
    const childFrames = parent.children.filter(n =>
      ['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE'].includes(n.type)
    );
    if (!childFrames.length) continue;

    frames.push({ node: parent, componentText: childFrames.map(c => c.name).join('\n') });

    for (const child of childFrames) {
      seenNames.add(child.name);
      const link = `https://www.figma.com/file/${fileKey}?node-id=${encodeURIComponent(child.id)}`;
      if (child.name.startsWith('Frame') && !shouldSkip(child.name) && !flaggedMap.has(child.name)) flaggedMap.set(child.name, link);
      csvRows.push([child.name, link, figma.currentPage.name, parent.name]);
    }
  }

  return {
    frames,
    csvRows,
    uniqueCount: seenNames.size,
    flaggedNames: [...flaggedMap.entries()]
      .map(([name, link]) => ({ name, link }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    frameCount: filteredFrames.length
  };
}

function buildFileName(rootName) {
  // Greedy .* ensures we match the LAST YYYY-MM in the name and take everything after it
  const match = rootName.match(/^.*\d{4}-\d{2} (.+)$/);
  const suffix = match ? match[1] : rootName;
  return `project-components-${suffix}.csv`;
}
