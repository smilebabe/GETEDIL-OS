// packages/shared-types/src/core/types.ts
// Core types used across multiple pillars (minimal, tree-shakeable)

export type UUID = string;
export type Timestamp = string; // ISO 8601
export type Email = string;
export type PhoneNumber = string;
export type Currency = 'ETB' | 'USD' | 'EUR' | 'GBP';

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: Record<string, any>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Timestamp;
}

export type SortDirection = 'asc' | 'desc';
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between';

export interface DateRange {
  start: Timestamp;
  end: Timestamp;
}

export interface Address {
  street?: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ContactInfo {
  email?: Email;
  phone?: PhoneNumber;
  website?: string;
  social?: SocialLinks;
}

export interface SocialLinks {
  telegram?: string;
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
}

export interface Metadata {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: UUID;
  updatedBy?: UUID;
  version: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface WebhookPayload {
  id: UUID;
  event: WebhookEventType;
  timestamp: Timestamp;
  data: Record<string, any>;
  signature: string;
}

export type WebhookEventType = 
  | 'transaction.completed'
  | 'job.created'
  | 'job.filled'
  | 'user.verified'
  | 'payment.received'
  | 'dispute.resolved';
