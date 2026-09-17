export type FoodItem = {
  name: string;
  name_ar: string;
  confidence: number;
  portion_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type AnalyzeResult = {
  items: FoodItem[];
  alternatives: string[];
  analyzer: string;
  cached: boolean;
  photo_url: string | null;
};

export type Entry = FoodItem & {
  id: number;
  meal: string;
  photo_url: string | null;
  logged_on: string;
  created_at: string;
};

export type MacroTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type DaySummary = {
  day: string;
  totals: MacroTotals;
  goal: MacroTotals;
  entry_count: number;
};

export type Profile = {
  calorie_goal: number;
  protein_goal_g: number;
  carbs_goal_g: number;
  fat_goal_g: number;
  locale: string;
};

export type HistoryPoint = { day: string; calories: number; goal: number };

export const DEFAULT_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

const request = async <T,>(baseUrl: string, path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
};

export const api = {
  health: (baseUrl: string) => request<{ status: string; analyzer: string }>(baseUrl, '/health'),

  analyze: async (baseUrl: string, photoUri: string): Promise<AnalyzeResult> => {
    const form = new FormData();
    form.append('photo', {
      uri: photoUri,
      name: 'meal.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/analyze`, {
      method: 'POST',
      body: form,
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${await response.text()}`);
    }
    return (await response.json()) as AnalyzeResult;
  },

  summary: (baseUrl: string) => request<DaySummary>(baseUrl, '/summary'),

  entries: (baseUrl: string) => request<Entry[]>(baseUrl, '/entries'),

  addEntry: (baseUrl: string, payload: Record<string, unknown>) =>
    request<Entry>(baseUrl, '/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  deleteEntry: (baseUrl: string, id: number) =>
    request<void>(baseUrl, `/entries/${id}`, { method: 'DELETE' }),

  history: (baseUrl: string, days = 7) =>
    request<HistoryPoint[]>(baseUrl, `/history?days=${days}`),

  profile: (baseUrl: string) => request<Profile>(baseUrl, '/profile'),

  saveProfile: (baseUrl: string, profile: Profile) =>
    request<Profile>(baseUrl, '/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    }),
};

export const mediaUrl = (baseUrl: string, path: string | null): string | undefined =>
  path ? `${baseUrl.replace(/\/$/, '')}${path}` : undefined;
