import {API_BASE, supabase} from '../config';

export const formatDuration = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const getPageView = ():
  | 'home'
  | 'loop'
  | 'messenger'
  | 'night'
  | 'cities'
  | 'account'
  | 'wall'
  | 'leaderboard'
  | 'rider' => {
  if (typeof window === 'undefined') return 'home';
  if (window.location.pathname.startsWith('/loop')) return 'loop';
  if (window.location.pathname.startsWith('/messenger')) return 'messenger';
  if (window.location.pathname.startsWith('/night')) return 'night';
  if (window.location.pathname.startsWith('/cities')) return 'cities';
  if (window.location.pathname.startsWith('/account')) return 'account';
  if (window.location.pathname.startsWith('/wall')) return 'wall';
  if (window.location.pathname.startsWith('/leaderboard')) return 'leaderboard';
  if (window.location.pathname.startsWith('/rider/')) return 'rider';
  return 'home';
};

export const getRiderIdFromPath = () => {
  if (typeof window === 'undefined') return '';
  const match = window.location.pathname.match(/^\/rider\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : '';
};

const buildAuthHeaders = async () => {
  const headers: Record<string, string> = {};
  if (!supabase) return headers;
  try {
    const {
      data: {session},
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.warn('Failed to read Supabase session for request headers.', error);
  }
  return headers;
};

const resolveApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

export async function postJSON<T>(path: string, body: any): Promise<T> {
  const authHeaders = await buildAuthHeaders();
  const response = await fetch(resolveApiUrl(path), {
    method: 'POST',
    headers: {'Content-Type': 'application/json', ...authHeaders},
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}

export async function getJSON<T>(path: string): Promise<T> {
  const authHeaders = await buildAuthHeaders();
  const response = await fetch(resolveApiUrl(path), {
    method: 'GET',
    headers: {...authHeaders},
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}
