/**
 * GETEDIL-OS: Lazy Intent Parser
 * Implements Context-Aware NLP to minimize memory and CPU overhead.
 */

// 1. Global Commands (Always Loaded)
// These handle OS-level navigation and system overrides.
const GLOBAL_INTENTS = {
  NAV_HOME: [/መነሻ/i, /home/i, /dashboard/i],
  NAV_WALLET: [/ዋሌት/i, /wallet/i, /money/i, /ብር/i],
  SYSTEM_HELP: [/እርዳታ/i, /help/i, /support/i],
  LOGOUT: [/ውጣ/i, /logout/i, /sign out/i]
};

// 2. Pillar-Specific Fragment Loader
// Instead of importing all 27, we fetch fragments on-demand.
const PILLAR_FRAGMENTS = {
  P4: () => import('./fragments/p4-hired.json'),
  P6: () => import('./fragments/p6-paid.json'),
  P15: () => import('./fragments/p15-shopping.json'),
  // ... other 27 pillars map here
};

class LazyIntentParser {
  constructor() {
    this.activePillarPatterns = null;
    this.currentPillarId = null;
  }

  /**
   * Switches the NLP context when the user navigates.
   * Called by AgenticRouter or AppShell.
   */
  async switchContext(pillarId) {
    if (this.currentPillarId === pillarId) return;
    
    if (PILLAR_FRAGMENTS[pillarId]) {
      try {
        const module = await PILLAR_FRAGMENTS[pillarId]();
        // Module contains optimized regex strings or keyword arrays
        this.activePillarPatterns = module.default;
        this.currentPillarId = pillarId;
        console.log(`[NLP] Context swapped to ${pillarId}`);
      } catch (err) {
        console.error(`[NLP] Failed to load fragment for ${pillarId}`, err);
      }
    }
  }

  /**
   * Main Parsing Logic
   * Evaluates Global first, then Local context.
   */
  parse(transcript) {
    const normalized = transcript.toLowerCase().trim();
    
    // Check Global Intents First (High Priority)
    for (const [intent, patterns] of Object.entries(GLOBAL_INTENTS)) {
      if (patterns.some(p => p.test(normalized))) {
        return { intent, scope: 'GLOBAL', confidence: 0.95 };
      }
    }

    // Check Active Pillar Context (Medium Priority)
    if (this.activePillarPatterns) {
      for (const [intent, keywords] of Object.entries(this.activePillarPatterns)) {
        if (keywords.some(kw => normalized.includes(kw))) {
          return { 
            intent: `${this.currentPillarId}_${intent}`, 
            scope: 'LOCAL', 
            confidence: 0.90 
          };
        }
      }
    }

    // Fallback to General Search
    return { intent: 'GLOBAL_SEARCH', scope: 'SYSTEM', confidence: 0.5 };
  }
}

export const intentParser = new LazyIntentParser();
