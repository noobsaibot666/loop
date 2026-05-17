const MOBILE_DEVICE_REGEX = /Android|iPhone|iPad|iPod/i;
const IOS_DEVICE_REGEX = /iPhone|iPad|iPod/i;
const MOBILE_MAX_WAYPOINTS = 3;

type LatLng = {lat: number; lng: number};

const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return MOBILE_DEVICE_REGEX.test(navigator.userAgent || '');
};

const isIOSDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return IOS_DEVICE_REGEX.test(navigator.userAgent || '');
};

const parsePoint = (value: string | null | undefined): LatLng | null => {
  const cleaned = String(value || '')
    .replace(/^via:/, '')
    .trim();
  const [lat, lng] = cleaned.split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {lat, lng};
};

const buildPathDirectionsUrl = (points: LatLng[]) => {
  const usable = points.filter(
    point => Number.isFinite(point?.lat) && Number.isFinite(point?.lng),
  );
  if (usable.length < 3) return '';
  const path = usable.map(point => `${point.lat},${point.lng}`).join('/');
  return `https://www.google.com/maps/dir/${path}/data=!4m2!4m1!3e1`;
};

const buildMobileDirectionsUrl = (points: LatLng[]) => {
  const usable = points.filter(
    point => Number.isFinite(point?.lat) && Number.isFinite(point?.lng),
  );
  if (usable.length < 3) return '';
  const origin = usable[0];
  const destination = usable[usable.length - 1];
  const internal = usable.slice(1, -1);
  const selectedWaypoints =
    internal.length <= MOBILE_MAX_WAYPOINTS
      ? internal
      : Array.from({length: MOBILE_MAX_WAYPOINTS}, (_, index) => {
          const ratio = (index + 1) / (MOBILE_MAX_WAYPOINTS + 1);
          return internal[
            Math.min(internal.length - 1, Math.floor(internal.length * ratio))
          ];
        });
  const params = new URLSearchParams({
    api: '1',
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    travelmode: 'bicycling',
    dir_action: 'navigate',
  });
  if (selectedWaypoints.length) {
    params.set(
      'waypoints',
      selectedWaypoints.map(point => `${point.lat},${point.lng}`).join('|'),
    );
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

const extractPathPoints = (url: string) => {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.includes('/maps/dir/')) return [];
    return (
      parsed.pathname
        .split('/maps/dir/')[1]
        ?.split('/')
        .map(segment => decodeURIComponent(segment).trim())
        .filter(Boolean)
        .map(parsePoint)
        .filter((point): point is LatLng => Boolean(point)) || []
    );
  } catch {
    return [];
  }
};

const buildIOSGoogleMapsAppUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    if (!/google\./i.test(parsed.hostname)) return '';
    return `comgooglemapsurl://${url.replace(/^https?:\/\//i, '')}`;
  } catch {
    return '';
  }
};

export const normalizeMapsUrl = (url: string) => {
  const raw = String(url || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    if (
      !/google\.com$/i.test(parsed.hostname) &&
      !/google\.com$/i.test(parsed.hostname.split('.').slice(-2).join('.'))
    ) {
      return raw;
    }

    const origin = parsePoint(parsed.searchParams.get('origin'));
    const destination = parsePoint(parsed.searchParams.get('destination'));
    const waypoints = String(parsed.searchParams.get('waypoints') || '')
      .split('|')
      .map(parsePoint)
      .filter((point): point is LatLng => Boolean(point));

    if (parsed.pathname.includes('/maps/dir/')) {
      const points =
        parsed.pathname
          .split('/maps/dir/')[1]
          ?.split('/')
          .map(segment => decodeURIComponent(segment).trim())
          .filter(Boolean)
          .map(parsePoint)
          .filter((point): point is LatLng => Boolean(point)) || [];
      const normalized = buildPathDirectionsUrl(points);
      return normalized || raw;
    }

    if (origin && destination) {
      const normalized = buildPathDirectionsUrl([
        origin,
        ...waypoints,
        destination,
      ]);
      return normalized || raw;
    }
  } catch {
    return raw;
  }

  return raw;
};

export const openMapsUrl = (url: string) => {
  if (!url || typeof window === 'undefined') return;
  const normalizedUrl = normalizeMapsUrl(url);
  if (!normalizedUrl) return;
  if (isMobileDevice()) {
    const points = extractPathPoints(normalizedUrl);
    const mobileUrl = buildMobileDirectionsUrl(points) || normalizedUrl;

    if (isIOSDevice()) {
      const appUrl = buildIOSGoogleMapsAppUrl(normalizedUrl);
      if (appUrl) {
        let didHide = false;
        const markHidden = () => {
          didHide = true;
        };
        const cleanup = () => {
          window.removeEventListener('pagehide', markHidden);
          document.removeEventListener('visibilitychange', onVisibilityChange);
        };
        const onVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            markHidden();
          }
        };
        window.addEventListener('pagehide', markHidden, {once: true});
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.location.assign(appUrl);
        window.setTimeout(() => {
          cleanup();
          if (!didHide) {
            window.location.assign(mobileUrl);
          }
        }, 700);
        return;
      }
    }

    window.location.assign(mobileUrl);
    return;
  }
  window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
};
