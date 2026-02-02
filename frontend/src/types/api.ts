// API Response Types

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  timestamp: string;
}

export interface ApiError {
  success: false;
  data: null;
  message: string;
  error: {
    code: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// Query params
export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface SortParams {
  sort?: string;
  order?: 'asc' | 'desc';
}
