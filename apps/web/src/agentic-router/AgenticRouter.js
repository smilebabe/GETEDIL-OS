/**
 * GETEDIL-OS: Agentic Router Logic
 * Orchestrates multi-pillar navigation and context-aware UI transitions.
 * Path: apps/web/src/agentic-router/AgenticRouter.js
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../lib/store'; // Zustand store
import { parseVoiceIntent } from '../lib/voice-intent-parser';

export const useAgenticRouter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Zustand State Selectors
  const setPillarFilters = useStore((state) => state.setPillarFilters);
  const setOverlayMode = useStore((state) => state.setOverlayMode);
  const activePillars = useStore((state) => state.activePillars);

  /**
   * Process incoming intent and determine navigation strategy
   * @param {string} transcript - Raw text from Voice-to-Text
   */
  const handleIntent = (transcript) => {
    const result = parseVoiceIntent(transcript);
    const { intent, entities, confidence } = result;

    if (confidence < 0.6) return; // Ignore low-confidence noise

    const currentPath = location.pathname;

    switch (intent) {
      case 'P4_GET_HIRED':
        // 1. Update Pillar 4 Global State
        setPillarFilters('P4', {
          category: entities.category,
          location: entities.location,
          query: entities.raw_query
        });

        // 2. Context-Aware Navigation Logic
        if (currentPath.includes('/pillars/p6')) {
          /**
           * Scenario: User is in "GetPaid" (P6) but asks for a Job.
           * Action: Trigger Bento Overlay to prevent task abandonment.
           */
          setOverlayMode({
            type: 'BENTO_OVERLAY',
            targetPillar: 'P4',
            layout: 'split-vertical',
            title: `Matching Jobs in ${entities.location}`
          });
        } else {
          /**
           * Standard Navigation
           */
          navigate('/pillars/p4');
        }
        break;

      case 'P6_GET_PAID':
        // Standard P6 logic
        navigate('/pillars/p6');
        break;

      case 'GLOBAL_SEARCH':
        navigate(`/search?q=${encodeURIComponent(entities.raw_query)}`);
        break;

      default:
        console.warn(`Intent ${intent} not mapped in AgenticRouter.`);
    }
  };

  return { handleIntent };
};

/**
 * Integration Snippet for CommandCenter.jsx:
 * * const { handleIntent } = useAgenticRouter();
 * <VoiceInput onTranscriptComplete={(text) => handleIntent(text)} />
 */
