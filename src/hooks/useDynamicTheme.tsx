import { useEffect } from "react";
import { useStoreSettings } from "./useStoreSettings";

export function useDynamicTheme() {
  const { settings, loading } = useStoreSettings();

  useEffect(() => {
    if (loading) return;

    const root = document.documentElement;

    // Colors
    const colorMap: Record<string, string> = {
      color_primary: "--accent",
      color_buttons: "--ring",
      color_background: "--background",
      color_text: "--foreground",
      color_promotions: "--destructive",
    };

    Object.entries(colorMap).forEach(([key, cssVar]) => {
      const val = settings[key];
      if (val && val.length > 3) {
        root.style.setProperty(cssVar, val);
      }
    });

    // Also apply accent = primary for consistency
    if (settings.color_primary && settings.color_primary.length > 3) {
      root.style.setProperty("--accent", settings.color_primary);
      root.style.setProperty("--sidebar-primary", settings.color_primary);
      root.style.setProperty("--sidebar-ring", settings.color_primary);
      root.style.setProperty("--ring", settings.color_primary);
    }

    // Typography
    if (settings.font_headings) {
      root.style.setProperty("--font-display", `'${settings.font_headings}', sans-serif`);
    }
    if (settings.font_body) {
      root.style.setProperty("--font-body", `'${settings.font_body}', sans-serif`);
    }

    // Favicon
    if (settings.favicon_url) {
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (link) link.href = settings.favicon_url;
    }

    return () => {
      // Clean up custom properties on unmount (optional)
    };
  }, [settings, loading]);
}
