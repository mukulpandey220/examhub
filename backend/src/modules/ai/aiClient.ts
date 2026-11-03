import { config } from '../../config/env.js';

export interface AIClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export class AIServiceOutageError extends Error {
  public isServiceOutage = true;
  constructor(message: string) {
    super(message);
    this.name = 'AIServiceOutageError';
  }
}

export interface InternalAIResponse {
  is_face_present: boolean;
  face_count: number;
  faces: Array<{
    box: { x: number; y: number; width: number; height: number };
    confidence: number;
    landmarks_count: number;
  }>;
  head_pose?: {
    yaw: number;
    pitch: number;
    roll: number;
    is_deviated: boolean;
    deviation_direction?: string;
  };
  lighting: {
    mean_luminance: number;
    contrast_rms: number;
    status: string;
    is_compromised: boolean;
  };
  detected_objects: Array<{
    label: string;
    confidence: number;
    box: { x: number; y: number; width: number; height: number };
  }>;
  inference_latency_ms: number;
  model_version: string;
  timestamp: number;
}

export class InternalAIClient {
  private baseUrl: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor(options: AIClientOptions = {}) {
    this.baseUrl = options.baseUrl || config.aiServiceUrl;
    this.timeoutMs = options.timeoutMs || 8000;
    this.maxRetries = options.maxRetries || 2;
  }

  public async checkHealth(): Promise<{ status: string; modelsLoaded: boolean }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as any;
      return { status: data.status, modelsLoaded: !!data.models_loaded };
    } catch (err: any) {
      throw new AIServiceOutageError(`AI Service unreachable at ${this.baseUrl}: ${err.message}`);
    }
  }

  public async inferFrame(
    imageBase64: string,
    sessionId?: string,
    requestId?: string
  ): Promise<InternalAIResponse> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(`${this.baseUrl}/v1/infer/frame`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': requestId || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          },
          body: JSON.stringify({
            image_base64: imageBase64,
            session_id: sessionId,
            client_timestamp: Date.now() / 1000,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status >= 500) {
            throw new AIServiceOutageError(`AI Inference Engine 5xx error: ${response.statusText}`);
          }
          const errBody = await response.text();
          throw new Error(`AI Inference 4xx Client error: ${errBody}`);
        }

        const data = (await response.json()) as InternalAIResponse;
        return data;
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          lastError = new AIServiceOutageError(`AI Service timed out after ${this.timeoutMs}ms.`);
        } else if (!(err instanceof AIServiceOutageError)) {
          lastError = new AIServiceOutageError(`AI Service network failure: ${err.message || 'fetch failed'}`);
        } else {
          lastError = err;
        }

        // Retry only on network / timeout errors, not 4xx client errors
        if (attempt <= this.maxRetries && (lastError instanceof AIServiceOutageError)) {
          await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
          continue;
        }
        break;
      }
    }

    throw lastError || new AIServiceOutageError('Unknown AI client failure.');
  }
}

export const aiClient = new InternalAIClient();
