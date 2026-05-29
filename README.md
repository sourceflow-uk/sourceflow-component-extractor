# 🔌 SourceFlow Component Extractor

A Figma plugin that extracts the names of direct child frames/components from parent frames in your design, and:

- Writes the component names into a text node placed next to each parent frame
- Generates a downloadable CSV with metadata, including direct links to each component

---

## 📦 Features

✅ Two-step flow — review before you export  
✅ Extracts only **direct children** (not nested)  
✅ Skips irrelevant frames using smart filtering  
✅ Flags components with auto-generated names (`Frame *`) so designers can rename before exporting  
✅ Clickable links on flagged components — jump straight to the frame in Figma to fix  
✅ Places a text node with child component names next to each parent frame  
✅ Generates a CSV named after the Figma file  
✅ Supports both `/file/` and `/design/` URLs  
✅ No sensitive data stored  

---

## 🪄 How It Works

1. Run the plugin in your Figma file
2. **Screen 1 — Paste URL:** right-click the Figma tab > Copy Link, paste the URL, click **Analyse**
3. **Screen 2 — Review:**
   - See how many unique components were found and how many frames were scanned
   - If any components have auto-generated names starting with `Frame`, they'll be flagged as needing renaming — click any flagged name to jump directly to that frame in Figma, fix it, then re-run the plugin
4. Click **Download CSV** — the plugin writes text nodes next to each parent frame and downloads the CSV

---

## 📄 CSV Output

The downloaded file is named after the Figma file:

```
project-components-{file name}.csv
```

Where `{file name}` is taken from the right of the Figma file name, starting after the last `YYYY-MM` date prefix (e.g. a file named `2024-01 My Project` produces `project-components-My Project.csv`).

The CSV contains the following columns:

| Component name | Link | Figma Page | Page Design |
|----------------|------|------------|-------------|

---

## 🚫 Frames Skipped Automatically

Parent frames are excluded from extraction and flagging if:

- The name is exactly `🖼️ Cover`
- The name contains `skip component extract` (case-insensitive)
- The name contains `cookies` (case-insensitive)
- The name contains `mobile` (case-insensitive)

These rules are shown in the plugin UI on screen 1 for quick reference.
