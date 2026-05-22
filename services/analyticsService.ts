import AsyncStorage from "@react-native-async-storage/async-storage";

export type AnalyticsEvent =
  | "app_open"
  | "login"
  | "logout"
  | "register"
  | "course_view"
  | "course_enroll"
  | "bookmark_add"
  | "bookmark_remove"
  | "search"
  | "webview_open"
  | "notification_received"
  | "error";

interface EventPayload {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
  sessionId: string;
}

const SESSION_KEY = "analytics_session";
const EVENTS_KEY = "analytics_events";
const MAX_STORED_EVENTS = 200;

let _sessionId: string = generateSessionId();
let _writeQueue: Promise<void> = Promise.resolve();

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function persist(event: EventPayload): void {
  _writeQueue = _writeQueue.then(async () => {
    try {
      const raw = await AsyncStorage.getItem(EVENTS_KEY);
      const events: EventPayload[] = raw ? (JSON.parse(raw) as EventPayload[]) : [];
      events.push(event);
      if (events.length > MAX_STORED_EVENTS) {
        events.splice(0, events.length - MAX_STORED_EVENTS);
      }
      await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    } catch {
      // non-blocking — analytics must never crash the app
    }
  });
}

export const analyticsService = {
  flush(): Promise<void> {
    return _writeQueue;
  },

  startNewSession(): void {
    _sessionId = generateSessionId();
    AsyncStorage.setItem(SESSION_KEY, _sessionId).catch(() => {});
  },

  track(
    event: AnalyticsEvent,
    properties?: Record<string, string | number | boolean>
  ): void {
    const payload: EventPayload = {
      event,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: _sessionId,
    };
    persist(payload);
  },

  async getEvents(): Promise<EventPayload[]> {
    try {
      const raw = await AsyncStorage.getItem(EVENTS_KEY);
      return raw ? (JSON.parse(raw) as EventPayload[]) : [];
    } catch {
      return [];
    }
  },

  async clearEvents(): Promise<void> {
    await AsyncStorage.removeItem(EVENTS_KEY);
  },

  async getSessionSummary(): Promise<{
    totalEvents: number;
    uniqueEvents: string[];
    sessionId: string;
  }> {
    const events = await analyticsService.getEvents();
    const unique = [...new Set(events.map((e) => e.event))];
    return {
      totalEvents: events.length,
      uniqueEvents: unique,
      sessionId: _sessionId,
    };
  },
};
