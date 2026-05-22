import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import { storageService } from "../../services/storageService";
import { User } from "../../types";

jest.mock("../../services/authService");
jest.mock("../../services/storageService");

const mockUser: User = {
  _id: "user-1",
  username: "testuser",
  email: "test@example.com",
  fullName: "Test User",
  avatar: { url: "https://example.com/avatar.jpg", localPath: "" },
  role: "USER",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const resetStore = () => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isInitialized: false,
    isLoading: false,
    error: null,
  });
};

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

describe("authStore – initialize", () => {
  it("marks as initialized with no auth when no valid token", async () => {
    (authService.hasValidToken as jest.Mock).mockResolvedValue(false);

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.isInitialized).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it("restores session from storage when valid token exists", async () => {
    (authService.hasValidToken as jest.Mock).mockResolvedValue(true);
    (storageService.getUser as jest.Mock).mockResolvedValue(mockUser);
    (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (storageService.saveUser as jest.Mock).mockResolvedValue(undefined);

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isInitialized).toBe(true);
    expect(state.user).toEqual(mockUser);
  });

  it("falls back gracefully when token check throws", async () => {
    (authService.hasValidToken as jest.Mock).mockRejectedValue(new Error("SecureStore unavailable"));

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.isInitialized).toBe(true);
    expect(state.isAuthenticated).toBe(false);
  });
});

describe("authStore – login", () => {
  it("sets user and isAuthenticated on success", async () => {
    (authService.login as jest.Mock).mockResolvedValue({ user: mockUser });
    (storageService.saveUser as jest.Mock).mockResolvedValue(undefined);
    (storageService.updateLastActive as jest.Mock).mockResolvedValue(undefined);

    await useAuthStore.getState().login({ username: "testuser", password: "pass123" });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("sets error and clears loading on failure", async () => {
    (authService.login as jest.Mock).mockRejectedValue(new Error("Invalid credentials"));

    await expect(
      useAuthStore.getState().login({ username: "bad", password: "bad" })
    ).rejects.toThrow("Invalid credentials");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe("Invalid credentials");
    expect(state.isLoading).toBe(false);
  });
});

describe("authStore – logout", () => {
  it("clears user and auth state", async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });
    (authService.logout as jest.Mock).mockResolvedValue(undefined);
    (storageService.clearAll as jest.Mock).mockResolvedValue(undefined);

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBeNull();
  });

  it("clears state even if logout API call throws", async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });
    (authService.logout as jest.Mock).mockRejectedValue(new Error("Network error"));
    (storageService.clearAll as jest.Mock).mockResolvedValue(undefined);

    // The finally block clears state but the error is still re-thrown
    try {
      await useAuthStore.getState().logout();
    } catch {
      // expected – network failure
    }

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe("authStore – clearError", () => {
  it("resets the error field", () => {
    useAuthStore.setState({ error: "Something went wrong" });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});
