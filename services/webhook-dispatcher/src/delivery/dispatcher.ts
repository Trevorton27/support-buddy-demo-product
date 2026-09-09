export interface DeliveryResult {
  delivered: boolean;
  statusCode?: number;
  attempts: number;
  error?: string;
}

export interface WebhookTarget {
  url: string;
  secret: string;
  retryEnabled: boolean;
  maxRetries: number;
}

/**
 * Simulates delivering a webhook payload to a target URL.
 * In a real service this would make HTTP requests.
 */
export async function deliverWebhook(
  target: WebhookTarget,
  payload: string,
  simulateFailure: boolean = false
): Promise<DeliveryResult> {
  let attempts = 0;
  const maxAttempts = target.retryEnabled ? target.maxRetries + 1 : 1;

  while (attempts < maxAttempts) {
    attempts++;

    if (simulateFailure && attempts < maxAttempts) {
      continue; // simulate transient failure
    }

    return {
      delivered: !simulateFailure,
      statusCode: simulateFailure ? 500 : 200,
      attempts,
    };
  }

  return {
    delivered: false,
    statusCode: 500,
    attempts,
    error: "Max retries exceeded",
  };
}
