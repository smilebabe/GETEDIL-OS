// packages/shared-types/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    // Main entry
    index: 'src/index.ts',
    
    // Individual pillar exports
    p0_onboarding: 'src/p0_onboarding.ts',
    p1_consultancy: 'src/p1_consultancy.ts',
    p2_home: 'src/p2_home.ts',
    p3_verification: 'src/p3_verification.ts',
    p4_jobs: 'src/p4_jobs.ts',
    p5_education: 'src/p5_education.ts',
    p6_payments: 'src/p6_payments.ts',
    p7_social: 'src/p7_social.ts',
    p8_creator: 'src/p8_creator.ts',
    p9_trading: 'src/p9_trading.ts',
    p10_diaspora: 'src/p10_diaspora.ts',
    p11_tenders: 'src/p11_tenders.ts',
    p12_legal: 'src/p12_legal.ts',
    p13_delivery: 'src/p13_delivery.ts',
    p14_jobs_premium: 'src/p14_jobs_premium.ts',
    p15_shopping: 'src/p15_shopping.ts',
    p16_selling: 'src/p16_selling.ts',
    p17_payments_premium: 'src/p17_payments_premium.ts',
    p18_social_premium: 'src/p18_social_premium.ts',
    p19_profile: 'src/p19_profile.ts',
    p20_admin: 'src/p20_admin.ts',
    p21_api: 'src/p21_api.ts',
    p22_localization: 'src/p22_localization.ts',
    p23_plans: 'src/p23_plans.ts',
    p24_referral: 'src/p24_referral.ts',
    p25_notifications: 'src/p25_notifications.ts',
    p26_analytics: 'src/p26_analytics.ts',
    p27_automation: 'src/p27_automation.ts',
    
    // Cross-cutting concerns
    gete: 'src/gete.ts',
    events: 'src/events.ts',
    utils: 'src/utils.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false, // Don't minify types
  target: 'es2020',
  platform: 'neutral',
  esbuildOptions(options) {
    options.treeShaking = true;
    options.ignoreAnnotations = false;
  }
});
