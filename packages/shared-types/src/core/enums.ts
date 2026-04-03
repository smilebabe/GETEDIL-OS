// packages/shared-types/src/core/enums.ts
// Core enums (small, tree-shakeable)

export enum UserRole {
  USER = 'user',
  VERIFIED_USER = 'verified_user',
  BUSINESS = 'business',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  MODERATOR = 'moderator'
}

export enum AccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
  PENDING_VERIFICATION = 'pending_verification'
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum TrustTier {
  TIER_0 = 'tier_0',
  TIER_1 = 'tier_1',
  TIER_2 = 'tier_2',
  TIER_3 = 'tier_3',
  TIER_4 = 'tier_4'
}

export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app',
  TELEGRAM = 'telegram'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum WebhookEventType {
  // Transaction events
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_COMPLETED = 'transaction.completed',
  TRANSACTION_FAILED = 'transaction.failed',
  
  // Job events
  JOB_CREATED = 'job.created',
  JOB_UPDATED = 'job.updated',
  JOB_FILLED = 'job.filled',
  JOB_EXPIRED = 'job.expired',
  
  // User events
  USER_REGISTERED = 'user.registered',
  USER_VERIFIED = 'user.verified',
  USER_SUSPENDED = 'user.suspended',
  
  // Payment events
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_SENT = 'payment.sent',
  ESCROW_RELEASED = 'escrow.released',
  
  // Dispute events
  DISPUTE_OPENED = 'dispute.opened',
  DISPUTE_RESOLVED = 'dispute.resolved'
}

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}
