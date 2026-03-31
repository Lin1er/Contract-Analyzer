// Simple analytics tracking utility
// Can be extended to send events to any analytics provider (Google Analytics, Mixpanel, PostHog, etc.)

export type AnalyticsEvent = 
  | 'page_view'
  | 'file_upload_started'
  | 'file_upload_completed'
  | 'text_paste_submitted'
  | 'analysis_started'
  | 'analysis_completed'
  | 'analysis_failed'
  | 'export_json'
  | 'export_pdf'
  | 'history_opened'
  | 'history_entry_selected'
  | 'history_cleared'
  | 'language_changed'
  | 'theme_changed';

export interface AnalyticsEventData {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean>;
  timestamp?: number;
}

// Queue for batching events (useful for sending to backend)
const eventQueue: AnalyticsEventData[] = [];

// Track an analytics event
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>): void {
  const eventData: AnalyticsEventData = {
    event,
    properties,
    timestamp: Date.now(),
  };

  // Add to queue
  eventQueue.push(eventData);

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, properties);
  }

  // If you want to send to a backend or third-party analytics:
  // - Google Analytics: window.gtag?.('event', event, properties);
  // - PostHog: window.posthog?.capture(event, properties);
  // - Custom backend: sendToBackend(eventData);
}

// Track page views
export function trackPageView(path: string): void {
  trackEvent('page_view', { path });
}

// Get all queued events (useful for debugging or batch sending)
export function getEventQueue(): AnalyticsEventData[] {
  return [...eventQueue];
}

// Clear the event queue
export function clearEventQueue(): void {
  eventQueue.length = 0;
}

// Helper to track analysis completion with details
export function trackAnalysisComplete(
  redFlagCount: number,
  overallRisk: string,
  language: string
): void {
  trackEvent('analysis_completed', {
    red_flag_count: redFlagCount,
    overall_risk: overallRisk,
    language,
  });
}

// Helper to track errors
export function trackAnalysisError(errorCode: string, retryCount: number): void {
  trackEvent('analysis_failed', {
    error_code: errorCode,
    retry_count: retryCount,
  });
}
