const ICON_PATHS = Object.freeze({
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  shield: '<path d="M12 3l7 3v5c0 4.6-2.8 7.4-7 10-4.2-2.6-7-5.4-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  check: '<path d="M5 12l4 4L19 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H5V6h6"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  reset: '<path d="M4 7v5h5"/><path d="M5.5 15a7 7 0 101-8L4 12"/>',
});

export function icon(name) {
  return '<svg aria-hidden="true" viewBox="0 0 24 24">'
    + (ICON_PATHS[name] || '')
    + '</svg>';
}
