import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SettingsMap {
  [key: string]: string;
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("store_settings").select("key, value");
      const map: SettingsMap = {};
      data?.forEach((s: any) => { map[s.key] = s.value; });
      setSettings(map);
      setLoading(false);
    };
    fetch();
  }, []);

  const getSetting = (key: string, fallback = "") => settings[key] ?? fallback;
  const isEnabled = (key: string) => settings[key] === "true";

  return { settings, loading, getSetting, isEnabled };
}
