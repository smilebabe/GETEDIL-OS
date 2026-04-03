/**
 * GETE-OS: Voice Intent Parser (Amharic & English)
 * Specialized for Ethiopic NLP / Zero-UI Command Center
 */

const INTENT_MAP = {
  P4_GET_HIRED: {
    patterns: [
      /ስራ/i, /የስራ/i, /መቀጠር/i, /ቀጣሪ/i, /ክፍት/i, 
      /job/i, /hired/i, /apply/i, /vacancy/i, /career/i, /work/i
    ],
    keywords: ['sira', 'keteri', 'apply', 'job', 'work']
  },
  P6_GET_PAID: {
    patterns: [
      /ክፍያ/i, /ብር/i, /መክፈል/i, /ሂሳብ/i, /ትራንስፈር/i,
      /pay/i, /money/i, /transfer/i, /wallet/i, /etb/i, /chapa/i, /telebirr/i
    ],
    keywords: ['pay', 'birr', 'send', 'wallet']
  },
  P15_GET_SHOPPING: {
    patterns: [
      /መግዛት/i, /ገበያ/i, /ዋጋ/i, /ሱቅ/i,
      /buy/i, /shop/i, /price/i, /store/i, /purchase/i
    ],
    keywords: ['buy', 'shop', 'order']
  }
};

const LOCATION_MAP = {
  'Addis Ababa': [/አዲስ አበባ/i, /addis/i, /finfinne/i, /sheger/i],
  'Adama': [/አዳማ/i, /adama/i, /nazret/i],
  'Bahir Dar': [/ባህር ዳር/i, /bahir dar/i],
  'Hawassa': [/ሐዋሳ/i, /hawassa/i]
};

/**
 * Core Parser Utility
 * @param {string} transcript - Voice-to-text input
 * @returns {Object} - Intent, Entities, and Confidence
 */
export const parseVoiceIntent = (transcript) => {
  if (!transcript || typeof transcript !== 'string') {
    return { intent: 'UNKNOWN', entities: {}, confidence: 0 };
  }

  const normalized = transcript.toLowerCase().trim();
  let identifiedIntent = 'GLOBAL_SEARCH';
  let maxWeight = 0;

  // 1. Intent Identification
  for (const [intent, config] of Object.entries(INTENT_MAP)) {
    let weight = 0;
    
    config.patterns.forEach(pattern => {
      if (pattern.test(normalized)) weight += 0.6;
    });

    config.keywords.forEach(kw => {
      if (normalized.includes(kw)) weight += 0.3;
    });

    if (weight > maxWeight) {
      maxWeight = weight;
      identifiedIntent = intent;
    }
  }

  // 2. Entity Extraction (Location & Category)
  const entities = {
    location: 'Remote',
    category: 'General',
    raw_query: transcript
  };

  for (const [city, patterns] of Object.entries(LOCATION_MAP)) {
    if (patterns.some(p => p.test(normalized))) {
      entities.location = city;
      break;
    }
  }

  // Basic category extraction (Extensible for more pillars)
  if (/tech|ሶፍትዌር|ኮምፒውተር/i.test(normalized)) entities.category = 'tech';
  if (/delivery|መላኪያ/i.test(normalized)) entities.category = 'logistics';

  return {
    intent: identifiedIntent,
    entities,
    confidence: Math.min(parseFloat((maxWeight + 0.1).toFixed(2)), 1.0),
    timestamp: new Date().toISOString()
  };
};

/**
 * Integration Example for CommandCenter.jsx
 * * const handleVoiceInput = (text) => {
 * const result = parseVoiceIntent(text);
 * if (result.confidence > 0.7) {
 * // Trigger AgenticRouter or direct pillar navigation
 * executeIntent(result.intent, result.entities);
 * }
 * };
 */
