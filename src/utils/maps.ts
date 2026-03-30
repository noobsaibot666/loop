const MOBILE_DEVICE_REGEX = /Android|iPhone|iPad|iPod/i;

type LatLng = { lat: number; lng: number };

const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;
  return MOBILE_DEVICE_REGEX.test(navigator.userAgent || "");
};

const parsePoint = (value: string | null | undefined): LatLng | null => {
  const cleaned = String(value || "").replace(/^via:/, "").trim();
  const [lat, lng] = cleaned.split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const buildPathDirectionsUrl = (points: LatLng[]) => {
  const usable = points.filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng));
  if (usable.length < 3) return "";
  const path = usable.map((point) => `${point.lat},${point.lng}`).join("/");
  return `https://www.google.com/maps/dir/${path}/data=!4m2!4m1!3e1`;
};

export const normalizeMapsUrl = (url: string) => {
  const raw = String(url || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    if (!/google\.com$/i.test(parsed.hostname) && !/google\.com$/i.test(parsed.hostname.split(".").slice(-2).join("."))) {
      return raw;
    }

    const origin = parsePoint(parsed.searchParams.get("origin"));
    const destination = parsePoint(parsed.searchParams.get("destination"));
    const waypoints = String(parsed.searchParams.get("waypoints") || "")
      .split("|")
      .map(parsePoint)
      .filter((point): point is LatLng => Boolean(point));

    if (parsed.pathname.includes("/maps/dir/")) {
      const points = parsed.pathname
        .split("/maps/dir/")[1]
        ?.split("/")
        .map((segment) => decodeURIComponent(segment).trim())
        .filter(Boolean)
        .map(parsePoint)
        .filter((point): point is LatLng => Boolean(point)) || [];
      const normalized = buildPathDirectionsUrl(points);
      return normalized || raw;
    }

    if (origin && destination) {
      const normalized = buildPathDirectionsUrl([origin, ...waypoints, destination]);
      return normalized || raw;
    }
  } catch {
    return raw;
  }

  return raw;
};

export const openMapsUrl = (url: string) => {
  if (!url || typeof window === "undefined") return;
  const normalizedUrl = normalizeMapsUrl(url);
  if (!normalizedUrl) return;
  if (isMobileDevice()) {
    window.location.assign(normalizedUrl);
    return;
  }
  window.open(normalizedUrl, "_blank", "noopener,noreferrer");
};
