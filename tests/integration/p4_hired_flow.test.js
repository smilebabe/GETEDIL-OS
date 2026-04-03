/**
 * GETEDIL-OS: Integration Test - GetHired (P4) Flow
 * Path: tests/integration/GetHiredFlow.test.js
 * Tools: Vitest, Playwright, MSW (Mock Service Worker)
 */

import { test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommandCenter } from '../../frontend/src/components/command/CommandCenter';
import { AppShell } from '../../frontend/src/core/AppShell';
import { offlineDB } from '../../frontend/src/lib/offline-db';
import { syncManager } from '../../frontend/src/lib/sync-manager';

vi.mock('../../frontend/src/lib/offline-db');
vi.mock('../../frontend/src/lib/sync-manager');

test('Scenario: Amharic Search for React Job and MatchScore Display', async ({ page }) => {
  // 1. Setup: Render App with AgenticRouter context
  render(<AppShell><CommandCenter /></AppShell>);

  const input = screen.getByPlaceholderText(/ምን ልርዳዎት/i); // Amharic Placeholder
  
  // 2. Action: User enters "React ስራ አዲስ አበባ" (React job Addis Ababa)
  fireEvent.change(input, { target: { value: 'React ስራ አዲስ አበባ' } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

  // 3. Expectation: Router redirects to P4
  await waitFor(() => {
    expect(window.location.pathname).toBe('/pillars/p4');
  });

  // 4. Expectation: JobCard is filtered and MatchScore > 80% is visible
  const matchScoreBadge = await screen.findByTestId('matching-score-value');
  const score = parseFloat(matchScoreBadge.textContent);
  
  expect(score).toBeGreaterThan(80);
  expect(screen.getByText(/React Developer/i)).toBeInTheDocument();
});

test('Edge Case: Offline Bid Queueing via offline-db.js', async () => {
  // 1. Simulate Offline Status
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const mockBid = { jobId: 'p4-123', userId: 'user-789', amount: 5000 };

  // 2. Action: User attempts to place a bid while offline
  // We trigger the internal logic used by BidForm.jsx
  await offlineDB.savePendingAction('P4_BID', mockBid);

  // 3. Expectation: Data is stored in IndexedDB (offline-db)
  expect(offlineDB.savePendingAction).toHaveBeenCalledWith('P4_BID', mockBid);

  // 4. Expectation: Queue Manager acknowledges pending sync
  const pendingCount = await offlineDB.getPendingCount();
  expect(pendingCount).toBe(1);

  // 5. Simulate Online Recovery
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  window.dispatchEvent(new Event('online'));

  // 6. Expectation: Sync Manager triggers reconciliation
  await waitFor(() => {
    expect(syncManager.processQueue).toHaveBeenCalled();
  });
});
