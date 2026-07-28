type Payload = Record<string, unknown>;

export const analytics = {
  track(event: string, payload: Payload = {}) {
    // Stubbed for now; wire PostHog later.
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, payload);
  },
};
