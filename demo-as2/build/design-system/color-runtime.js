// Resolve registered palette data for color inputs, Canvas and persisted custom colors.
// Keep original hex spelling: SVG wallpaper replacement and saved preset comparisons depend on it.
function asColor(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
