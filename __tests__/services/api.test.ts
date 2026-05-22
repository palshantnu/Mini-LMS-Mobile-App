import MockAdapter from "axios-mock-adapter";
import { api } from "../../services/api";
import { API_BASE_URL, REQUEST_TIMEOUT } from "../../constants";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue("mock-access-token"),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Retry back-off: 1s + 2s + 4s = 7 s total → allow 20 s per suite
jest.setTimeout(20000);

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(api, { delayResponse: 0 });
});

afterEach(() => {
  mock.restore();
});

describe("api instance – configuration", () => {
  it("has the correct base URL", () => {
    expect(api.defaults.baseURL).toBe(API_BASE_URL);
  });

  it("has the correct timeout", () => {
    expect(api.defaults.timeout).toBe(REQUEST_TIMEOUT);
  });
});

describe("api instance – requests", () => {
  it("attaches Authorization header from SecureStore token", async () => {
    mock.onGet("/test").reply((config) =>
      config.headers?.Authorization === "Bearer mock-access-token"
        ? [200, { ok: true }]
        : [403, {}]
    );

    const res = await api.get("/test");
    expect(res.status).toBe(200);
  });

  it("returns data on a successful GET", async () => {
    mock.onGet("/api/v1/public/randomproducts").reply(200, {
      statusCode: 200,
      data: { data: [] },
      success: true,
    });

    const res = await api.get("/api/v1/public/randomproducts");
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });
});

describe("api instance – error handling", () => {
  it("transforms 403 response into ApiError with correct message", async () => {
    // 403 skips the token-refresh interceptor (only 401 triggers it)
    mock.onPost("/api/v1/users/login").reply(403, {
      message: "Forbidden",
      statusCode: 403,
    });

    await expect(api.post("/api/v1/users/login", {})).rejects.toMatchObject({
      message: "Forbidden",
      statusCode: 403,
    });
  });

  it("retries 5xx requests exactly 3 times before giving up", async () => {
    let callCount = 0;
    mock.onGet("/api/v1/flaky").reply(() => {
      callCount++;
      return [500, { message: "Internal server error" }];
    });

    await expect(api.get("/api/v1/flaky")).rejects.toBeDefined();
    // axios-retry: 1 original request + RETRY_COUNT (3) retries = 4 total calls
    expect(callCount).toBe(4);
  }, 18000);
});
