import { describe, it, expect, vi } from 'vitest';
import { InternalAIClient, AIServiceOutageError } from '../src/modules/ai/aiClient.js';

describe('InternalAIClient', () => {
  it('differentiates AI service outages from candidate misconduct', async () => {
    // Client pointing to an unreachable port
    const client = new InternalAIClient({ baseUrl: 'http://localhost:59999', maxRetries: 0 });

    try {
      await client.inferFrame('fake-b64-image', 'session-123');
      expect.fail('Should have thrown AIServiceOutageError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AIServiceOutageError);
      expect(err.isServiceOutage).toBe(true);
      // Key invariant: Outages must never result in cheating alerts
      expect(err.name).toBe('AIServiceOutageError');
    }
  });

  it('fails fast on healthcheck when service is unreachable', async () => {
    const client = new InternalAIClient({ baseUrl: 'http://localhost:59999' });
    await expect(client.checkHealth()).rejects.toThrow(AIServiceOutageError);
  });
});

