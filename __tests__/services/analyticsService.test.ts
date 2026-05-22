import { analyticsService } from "../../services/analyticsService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Wait for all pending writes to complete
async function drainQueue() {
  await analyticsService.flush();
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe("analyticsService – track", () => {
  it("stores a tracked event in AsyncStorage", async () => {
    analyticsService.track("login", { method: "password" });
    await drainQueue();
    const events = await analyticsService.getEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].event).toBe("login");
    expect(events[0].properties?.method).toBe("password");
  });

  it("stores multiple events serially", async () => {
    analyticsService.track("app_open");
    analyticsService.track("course_view", { courseId: "42" });
    await drainQueue();
    const events = await analyticsService.getEvents();
    expect(events.length).toBe(2);
  });

  it("attaches a timestamp to every event", async () => {
    analyticsService.track("search");
    await drainQueue();
    const events = await analyticsService.getEvents();
    expect(events[0].timestamp).toBeTruthy();
    expect(new Date(events[0].timestamp).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("attaches a sessionId to every event", async () => {
    analyticsService.startNewSession();
    analyticsService.track("app_open");
    await drainQueue();
    const events = await analyticsService.getEvents();
    expect(events[0].sessionId).toBeTruthy();
  });
});

describe("analyticsService – clearEvents", () => {
  it("removes all stored events", async () => {
    analyticsService.track("login");
    await drainQueue();
    await analyticsService.clearEvents();
    const events = await analyticsService.getEvents();
    expect(events).toHaveLength(0);
  });
});

describe("analyticsService – getSessionSummary", () => {
  it("returns correct total and unique event types", async () => {
    analyticsService.track("app_open");
    analyticsService.track("login");
    analyticsService.track("login");
    await drainQueue();
    const summary = await analyticsService.getSessionSummary();
    expect(summary.totalEvents).toBe(3);
    expect(summary.uniqueEvents).toContain("app_open");
    expect(summary.uniqueEvents).toContain("login");
    expect(summary.uniqueEvents.filter((e) => e === "login")).toHaveLength(1);
  });
});

describe("analyticsService – startNewSession", () => {
  it("generates a different session id each time", async () => {
    const summary1 = await analyticsService.getSessionSummary();
    const id1 = summary1.sessionId;

    analyticsService.startNewSession();

    const summary2 = await analyticsService.getSessionSummary();
    const id2 = summary2.sessionId;

    expect(id1).not.toBe(id2);
  });
});
