/**
 * GETEDIL-OS: useCommand Hook
 * Bridges Zero-UI Command Center to Agentic Router and Web Speech API.
 * Path: apps/web/src/hooks/useCommand.ts
 */

import { useState, useCallback, useRef } from 'react';
import { useAgenticRouter } from '../agentic-router/AgenticRouter';
import { parseVoiceIntent } from '../lib/voice-intent-parser';

interface CommandState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
}

export const useCommand = () => {
  const [state, setState] = useState<CommandState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    error: null,
  });

  const { handleIntent } = useAgenticRouter();
  const recognitionRef = useRef<any>(null);

  /**
   * Core execution logic for both Text and Voice inputs
   */
  const executeCommand = useCallback(async (input: string) => {
    if (!input.trim()) return;

    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Simulate slight AI "thinking" delay for UX shimmer/shimmering feedback
      await new Promise((resolve) => setTimeout(resolve, 600));

      // 1. Call logic parser (Supports English/Amharic patterns)
      const result = await parseVoiceIntent(input);

      // 2. Hand off to Agentic Router for navigation or Bento Overlay
      handleIntent(input);

      setState((prev) => ({ ...prev, isProcessing: false, transcript: '' }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: 'Failed to process command. እባክዎ እንደገና ይሞክሩ።',
      }));
    }
  }, [handleIntent]);

  /**
   * Web Speech API Integration
   */
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setState((prev) => ({ ...prev, error: 'Speech Recognition not supported.' }));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'am-ET, en-US'; // Multi-language support
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setState((prev) => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setState((prev) => ({ ...prev, transcript: text }));
      executeCommand(text);
    };

    recognition.onerror = (event: any) => {
      setState((prev) => ({ ...prev, isListening: false, error: event.error }));
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false }));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [state.isListening, executeCommand]);

  return {
    ...state,
    executeCommand,
    toggleListening,
  };
};
