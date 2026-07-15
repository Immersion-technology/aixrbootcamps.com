export interface ParsedUA {
  device: string;
  os: string;
  browser: string;
}

export function parseUA(ua: string): ParsedUA {
  const device = /ipad|tablet/i.test(ua)
    ? "Tablet"
    : /mobi|iphone|android.*mobile/i.test(ua)
      ? "Mobile"
      : "Desktop";

  const os = /windows/i.test(ua)
    ? "Windows"
    : /iphone|ipad|ipod/i.test(ua)
      ? "iOS"
      : /android/i.test(ua)
        ? "Android"
        : /mac os x/i.test(ua)
          ? "macOS"
          : /linux/i.test(ua)
            ? "Linux"
            : "Other";

  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /chrome|crios/i.test(ua)
      ? "Chrome"
      : /firefox|fxios/i.test(ua)
        ? "Firefox"
        : /safari/i.test(ua)
          ? "Safari"
          : "Other";

  return { device, os, browser };
}
