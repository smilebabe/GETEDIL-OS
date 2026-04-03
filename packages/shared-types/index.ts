// packages/shared-types/index.ts
// Barrel file with sub-exports for optimal tree shaking

// =====================================================
// MAIN BARREL EXPORTS (Backward compatible)
// =====================================================

// Core types that are small and widely used
export type {
  UUID,
  Timestamp,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
  ApiError,
  SortDirection,
  FilterOperator,
  DateRange,
  Address,
  ContactInfo,
  SocialLinks,
  Metadata,
  ValidationResult,
  WebhookPayload,
  WebhookEvent
} from './core/types';

export {
  UserRole,
  AccountStatus,
  VerificationStatus,
  TrustTier,
  NotificationChannel,
  NotificationPriority,
  WebhookEventType,
  Environment
} from './core/enums';

// =====================================================
// SUB-EXPORTS BY PILLAR (Tree shaking friendly)
// =====================================================

// P0 - Onboarding & Core Identity
export * as P0 from './p0_onboarding';

// P1 - Consultancy Services
export * as P1 from './p1_consultancy';

// P2 - Home Services
export * as P2 from './p2_home';

// P3 - Verification & KYC
export * as P3 from './p3_verification';

// P4 - Job Marketplace (Tree shakable - no video deps)
export * as P4 from './p4_jobs';

// P5 - Education & Skills
export * as P5 from './p5_education';

// P6 - Payments & Wallet (Pure - no heavy deps)
export * as P6 from './p6_payments';

// P7 - Social Networking
export * as P7 from './p7_social';

// P8 - Creator Economy (Video heavy - isolated)
export * as P8 from './p8_creator';

// P9 - Trading & Marketplace
export * as P9 from './p9_trading';

// P10 - Diaspora Services
export * as P10 from './p10_diaspora';

// P11 - Tenders & Procurement
export * as P11 from './p11_tenders';

// P12 - Legal Services
export * as P12 from './p12_legal';

// P13 - Delivery & Logistics
export * as P13 from './p13_delivery';

// P14 - Premium Jobs
export * as P14 from './p14_jobs_premium';

// P15 - Shopping
export * as P15 from './p15_shopping';

// P16 - Selling Platform
export * as P16 from './p16_selling';

// P17 - Premium Payments
export * as P17 from './p17_payments_premium';

// P18 - Premium Social
export * as P18 from './p18_social_premium';

// P19 - Profile Management
export * as P19 from './p19_profile';

// P20 - Admin Panel
export * as P20 from './p20_admin';

// P21 - Developer API
export * as P21 from './p21_api';

// P22 - Localization
export * as P22 from './p22_localization';

// P23 - Subscription Plans
export * as P23 from './p23_plans';

// P24 - Referral System
export * as P24 from './p24_referral';

// P25 - Notifications
export * as P25 from './p25_notifications';

// P26 - Analytics & Reporting
export * as P26 from './p26_analytics';

// P27 - Automation
export * as P27 from './p27_automation';

// =====================================================
// CROSS-CUTTING CONCERN EXPORTS
// =====================================================

// GETE AI types (moderate size)
export * as GETE from './gete';

// Event bus types (tiny)
export * as Events from './events';

// Shared utilities types (tiny)
export * as Utils from './utils';

// =====================================================
// TYPE GUARDS & HELPER FUNCTIONS
// =====================================================

// Re-export type guards from each module
export { isJob, isJobStatus, isJobCategory } from './p4_jobs';
export { isTransaction, isPaymentStatus, isPaymentMethod } from './p6_payments';
export { isVideo, isVideoStatus, isContentType } from './p8_creator';
export { isProfile, isVerificationLevel, isTrustTier } from './p19_profile';

// =====================================================
// DEPRECATION WARNINGS (for migration)
// =====================================================

// These exports will be removed in v2.0
/** @deprecated Use P4.Job instead. Will be removed in v2.0 */
export type Job = import('./p4_jobs').Job;

/** @deprecated Use P6.Transaction instead. Will be removed in v2.0 */
export type Transaction = import('./p6_payments').Transaction;

/** @deprecated Use P8.Video instead. Will be removed in v2.0 */
export type Video = import('./p8_creator').Video;

// =====================================================
// PACKAGE METADATA
// =====================================================

export const PACKAGE_VERSION = '1.0.0';
export const PACKAGE_NAME = '@getedil/shared-types';

// Export manifest for runtime reflection
export const MANIFEST = {
  name: PACKAGE_NAME,
  version: PACKAGE_VERSION,
  pillars: {
    total: 28, // Including P0
    exported: ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'P17', 'P18', 'P19', 'P20', 'P21', 'P22', 'P23', 'P24', 'P25', 'P26', 'P27'],
    treeShakable: true
  },
  exports: {
    direct: ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'P17', 'P18', 'P19', 'P20', 'P21', 'P22', 'P23', 'P24', 'P25', 'P26', 'P27', 'GETE', 'Events', 'Utils'],
    typeGuards: 7,
    deprecated: 3
  }
} as const;
