const STORAGE_KEY = "dms_dashboard_city_mun";

export function loadCityMunFilter(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
}

export function saveCityMunFilter(value: string): void {
  if (typeof window === "undefined") return;
  const trimmed = value.trim();
  if (trimmed) {
    window.localStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
