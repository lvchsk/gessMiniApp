export type BackendGame = 'runner' | 'match';

export interface BackendUser {
  telegramId: number;
  username: string;
  registrationDate: string;
  scoreRunner: number;
  scoreMatch: number;
}

export interface AuthResponse {
  token: string;
  user: BackendUser;
}

export interface ScoreResponse {
  game: BackendGame;
  updated: boolean;
  previousBest: number;
  bestScore: number;
  user: BackendUser;
}

export interface LeaderboardItem {
  rank: number;
  username: string;
  registrationDate: string;
  score: number;
}

interface LeaderboardResponse {
  game: BackendGame;
  total: number;
  items: LeaderboardItem[];
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  token?: string | null;
}

function getApiBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const baseUrl =
    configuredUrl || (import.meta.env.DEV ? 'http://localhost:4000' : window.location.origin);
  return baseUrl.replace(/\/+$/, '');
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(data?.error || `Backend request failed with status ${response.status}`);
  }

  return data as T;
}

export async function authenticateWithTelegram(initData: string): Promise<AuthResponse> {
  return requestJson<AuthResponse>('/api/auth/telegram', {
    method: 'POST',
    body: { initData },
  });
}

export async function fetchLeaderboard(game: BackendGame): Promise<LeaderboardItem[]> {
  const response = await requestJson<LeaderboardResponse>(`/api/leaderboards/${game}?limit=10`);
  return response.items;
}

export async function submitHighScore(
  token: string,
  game: BackendGame,
  score: number,
): Promise<ScoreResponse> {
  return requestJson<ScoreResponse>(`/api/scores/${game}`, {
    method: 'POST',
    token,
    body: { score },
  });
}
