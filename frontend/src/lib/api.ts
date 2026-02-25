import { getToken } from './auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(response.status, errorData.error || `API Error: ${response.status}`)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export const api = {
  get: <T>(endpoint: string) => fetchAPI<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) =>
    fetchAPI<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: <T>(endpoint: string, data: unknown) =>
    fetchAPI<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string) =>
    fetchAPI<T>(endpoint, {
      method: 'DELETE',
    }),
}

// API Types
export interface User {
  id: number
  email: string
  name: string
  height?: number
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Exercise {
  id: number
  name: string
  muscle_group: string
  is_custom: boolean
  user_id?: number
}

export interface WorkoutSet {
  id: number
  workout_id: number
  exercise_id: number
  set_number: number
  weight: number
  reps: number
  exercise?: Exercise
}

export interface Workout {
  id: number
  user_id: number
  date: string
  memo?: string
  sets: WorkoutSet[]
  created_at: string
  updated_at: string
}

export interface WorkoutListResponse {
  workouts: Workout[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// API Functions
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post<AuthResponse>('/api/v1/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/api/v1/auth/login', data),
  me: () => api.get<User>('/api/v1/auth/me'),
  deleteAccount: () => api.delete('/api/v1/auth/account'),
}

export const exerciseApi = {
  getAll: () => api.get<Exercise[]>('/api/v1/exercises'),
  getByMuscleGroup: (muscleGroup: string) =>
    api.get<Exercise[]>(`/api/v1/exercises?muscle_group=${muscleGroup}`),
  getCustom: () => api.get<Exercise[]>('/api/v1/exercises/custom'),
  createCustom: (data: { name: string; muscle_group: string }) =>
    api.post<Exercise>('/api/v1/exercises/custom', data),
  updateCustom: (id: number, data: { name: string; muscle_group: string }) =>
    api.put<Exercise>(`/api/v1/exercises/custom/${id}`, data),
  deleteCustom: (id: number) => api.delete(`/api/v1/exercises/custom/${id}`),
  getProgress: (id: number) => api.get<ExerciseProgress[]>(`/api/v1/exercises/${id}/progress`),
}

export const workoutApi = {
  create: (data: {
    date: string
    memo?: string
    sets: { exercise_id: number; set_number: number; weight: number; reps: number }[]
  }) => api.post<Workout>('/api/v1/workouts', data),
  getList: (page = 1, perPage = 20) =>
    api.get<WorkoutListResponse>(`/api/v1/workouts?page=${page}&per_page=${perPage}`),
  getByDate: (date: string) => api.get<Workout>(`/api/v1/workouts/date?date=${date}`),
  getById: (id: number) => api.get<Workout>(`/api/v1/workouts/${id}`),
  update: (
    id: number,
    data: {
      memo?: string
      sets: { exercise_id: number; set_number: number; weight: number; reps: number }[]
    }
  ) => api.put<Workout>(`/api/v1/workouts/${id}`, data),
  delete: (id: number) => api.delete(`/api/v1/workouts/${id}`),
  getByMonth: (year: number, month: number) =>
    api.get<Workout[]>(`/api/v1/workouts/calendar?year=${year}&month=${month}`),
}

// 統計API Types
export interface MuscleGroupStat {
  muscle_group: string
  workout_count: number
  set_count: number
}

export interface PersonalBest {
  exercise_id: number
  exercise_name: string
  muscle_group: string
  max_weight: number
}

export interface ExerciseProgress {
  date: string
  max_weight: number
  total_volume: number
}

export const statsApi = {
  getMuscleGroupStats: () => api.get<MuscleGroupStat[]>('/api/v1/stats/muscle-groups'),
  getPersonalBests: () => api.get<PersonalBest[]>('/api/v1/stats/personal-bests'),
}

// メニュー関連
export interface MenuItem {
  id: number
  menu_id: number
  exercise_id: number
  order_number: number
  target_sets: number
  target_reps: number
  target_weight?: number
  note?: string
  exercise?: Exercise
}

export interface Menu {
  id: number
  user_id: number
  name: string
  description?: string
  items: MenuItem[]
  created_at: string
  updated_at: string
}

export interface CreateMenuInput {
  name: string
  description?: string
  items: {
    exercise_id: number
    order_number: number
    target_sets: number
    target_reps: number
    target_weight?: number
    note?: string
  }[]
}

export interface AIGenerateMenuInput {
  goal: string
  fitness_level: string
  days_per_week: number
  duration_minutes: number
  target_muscle_groups?: string[]
  notes?: string
}

export interface AIGeneratedMenuItem {
  exercise_id: number
  order_number: number
  target_sets: number
  target_reps: number
  target_weight?: number
  note?: string
  exercise?: Exercise
}

export interface AIGeneratedMenu {
  name: string
  description: string
  items: AIGeneratedMenuItem[]
}

export const menuApi = {
  getAll: () => api.get<Menu[]>('/api/v1/menus'),
  getById: (id: number) => api.get<Menu>(`/api/v1/menus/${id}`),
  create: (data: CreateMenuInput) => api.post<Menu>('/api/v1/menus', data),
  update: (id: number, data: CreateMenuInput) => api.put<Menu>(`/api/v1/menus/${id}`, data),
  delete: (id: number) => api.delete(`/api/v1/menus/${id}`),
  generateWithAI: (data: AIGenerateMenuInput) =>
    api.post<AIGeneratedMenu>('/api/v1/menus/ai-generate', data),
}

// 体重記録関連
export interface BodyWeight {
  id: number
  user_id: number
  date: string
  weight: number
  body_fat_percentage?: number
  created_at: string
}

export interface CreateBodyWeightInput {
  date: string
  weight: number
  body_fat_percentage?: number
}

export const bodyWeightApi = {
  createOrUpdate: (data: CreateBodyWeightInput) =>
    api.post<BodyWeight>('/api/v1/body-weights', data),
  getRecords: (limit = 90) => api.get<BodyWeight[]>(`/api/v1/body-weights?limit=${limit}`),
  getByDateRange: (start: string, end: string) =>
    api.get<BodyWeight[]>(`/api/v1/body-weights/range?start=${start}&end=${end}`),
  getLatest: () => api.get<BodyWeight>('/api/v1/body-weights/latest'),
  delete: (id: number) => api.delete(`/api/v1/body-weights/${id}`),
}
