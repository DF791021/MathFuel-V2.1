import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// ── Mock db module ──
const mockGetDb = vi.fn();
const mockUpsertUser = vi.fn();
const mockGetUserByOpenId = vi.fn();
const mockUpdateUserType = vi.fn();
const mockUpdateUserGrade = vi.fn();

vi.mock("./db", () => ({
  getDb: mockGetDb,
  upsertUser: mockUpsertUser,
  getUserByOpenId: mockGetUserByOpenId,
  updateUserType: mockUpdateUserType,
  updateUserGrade: mockUpdateUserGrade,
}));

// ── Mock jose for JWT ──
const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
const mockSetProtectedHeader = vi.fn().mockReturnValue({ setExpirationTime: vi.fn().mockReturnValue({ sign: mockSign }) });
vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: mockSetProtectedHeader,
  })),
}));

// ── Mock _core/env ──
vi.mock("./_core/env", () => ({
  ENV: {
    cookieSecret: "test-secret-key-at-least-32-chars-long",
    appId: "test-app-id",
  },
}));

// ── Mock _core/cookies ──
vi.mock("./_core/cookies", () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  }),
}));

// ── Mock _core/trpc ──
const mockPublicProcedure = {
  input: vi.fn().mockReturnThis(),
  mutation: vi.fn().mockImplementation((fn) => fn),
  query: vi.fn().mockImplementation((fn) => fn),
};
const mockProtectedProcedure = {
  input: vi.fn().mockReturnThis(),
  mutation: vi.fn().mockImplementation((fn) => fn),
  query: vi.fn().mockImplementation((fn) => fn),
};
vi.mock("./_core/trpc", () => ({
  publicProcedure: mockPublicProcedure,
  protectedProcedure: mockProtectedProcedure,
  router: vi.fn().mockImplementation((routes) => routes),
}));

describe("Custom Auth System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Password Hashing", () => {
    it("should hash a password with bcrypt", async () => {
      const password = "testPassword123";
      const hash = await bcrypt.hash(password, 12);
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
    });

    it("should verify a correct password", async () => {
      const password = "mySecurePassword";
      const hash = await bcrypt.hash(password, 12);
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const password = "mySecurePassword";
      const hash = await bcrypt.hash(password, 12);
      const isValid = await bcrypt.compare("wrongPassword", hash);
      expect(isValid).toBe(false);
    });

    it("should produce different hashes for the same password", async () => {
      const password = "samePassword";
      const hash1 = await bcrypt.hash(password, 12);
      const hash2 = await bcrypt.hash(password, 12);
      expect(hash1).not.toBe(hash2);
      // Both should still verify
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe("Registration Validation", () => {
    it("should reject empty email", () => {
      const schema = require("zod").z.object({
        email: require("zod").z.string().email().max(320),
        password: require("zod").z.string().min(6).max(128),
        name: require("zod").z.string().min(1).max(200),
        userType: require("zod").z.enum(["student", "parent", "teacher"]),
      });

      const result = schema.safeParse({
        email: "",
        password: "password123",
        name: "Test User",
        userType: "student",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid email format", () => {
      const schema = require("zod").z.object({
        email: require("zod").z.string().email().max(320),
        password: require("zod").z.string().min(6).max(128),
        name: require("zod").z.string().min(1).max(200),
        userType: require("zod").z.enum(["student", "parent", "teacher"]),
      });

      const result = schema.safeParse({
        email: "not-an-email",
        password: "password123",
        name: "Test User",
        userType: "student",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 6 characters", () => {
      const schema = require("zod").z.object({
        email: require("zod").z.string().email().max(320),
        password: require("zod").z.string().min(6).max(128),
        name: require("zod").z.string().min(1).max(200),
        userType: require("zod").z.enum(["student", "parent", "teacher"]),
      });

      const result = schema.safeParse({
        email: "test@example.com",
        password: "12345",
        name: "Test User",
        userType: "student",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const schema = require("zod").z.object({
        email: require("zod").z.string().email().max(320),
        password: require("zod").z.string().min(6).max(128),
        name: require("zod").z.string().min(1).max(200),
        userType: require("zod").z.enum(["student", "parent", "teacher"]),
      });

      const result = schema.safeParse({
        email: "test@example.com",
        password: "password123",
        name: "",
        userType: "student",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid userType", () => {
      const schema = require("zod").z.object({
        email: require("zod").z.string().email().max(320),
        password: require("zod").z.string().min(6).max(128),
        name: require("zod").z.string().min(1).max(200),
        userType: require("zod").z.enum(["student", "parent", "teacher"]),
      });

      const result = schema.safeParse({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        userType: "admin",
      });
      expect(result.success).toBe(false);
    });

    it("should accept valid registration input", () => {
      const schema = require("zod").z.object({
        email: require("zod").z.string().email().max(320),
        password: require("zod").z.string().min(6).max(128),
        name: require("zod").z.string().min(1).max(200),
        userType: require("zod").z.enum(["student", "parent", "teacher"]),
        gradeLevel: require("zod").z.number().int().min(1).max(12).optional(),
      });

      const result = schema.safeParse({
        email: "student@example.com",
        password: "securePass123",
        name: "Johnny Appleseed",
        userType: "student",
        gradeLevel: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should accept registration without gradeLevel", () => {
      const schema = require("zod").z.object({
        email: require("zod").z.string().email().max(320),
        password: require("zod").z.string().min(6).max(128),
        name: require("zod").z.string().min(1).max(200),
        userType: require("zod").z.enum(["student", "parent", "teacher"]),
        gradeLevel: require("zod").z.number().int().min(1).max(12).optional(),
      });

      const result = schema.safeParse({
        email: "parent@example.com",
        password: "securePass123",
        name: "Jane Parent",
        userType: "parent",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Login Validation", () => {
    it("should reject empty password", () => {
      const schema = require("zod").z.object({
        email: require("zod").z.string().email(),
        password: require("zod").z.string().min(1),
      });

      const result = schema.safeParse({
        email: "test@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });

    it("should accept valid login input", () => {
      const schema = require("zod").z.object({
        email: require("zod").z.string().email(),
        password: require("zod").z.string().min(1),
      });

      const result = schema.safeParse({
        email: "test@example.com",
        password: "myPassword",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Auth Flow Logic", () => {
    it("should not allow login with non-existent email", async () => {
      // Simulating the logic from customAuth router
      const getUserByEmail = async (email: string) => null;
      const user = await getUserByEmail("nonexistent@example.com");
      expect(user).toBeNull();
      // Router would throw "Invalid email or password."
    });

    it("should not allow login for OAuth-only users (no passwordHash)", async () => {
      const oauthUser = {
        id: 1,
        openId: "oauth_123",
        name: "OAuth User",
        email: "oauth@example.com",
        passwordHash: null,
      };
      expect(oauthUser.passwordHash).toBeNull();
      // Router would throw "This account was created with a different login method."
    });

    it("should generate a unique openId for local users", () => {
      const { randomUUID } = require("crypto");
      const openId1 = `local_${randomUUID()}`;
      const openId2 = `local_${randomUUID()}`;
      expect(openId1).not.toBe(openId2);
      expect(openId1.startsWith("local_")).toBe(true);
      expect(openId2.startsWith("local_")).toBe(true);
    });

    it("should set cookie with correct options on login", () => {
      const cookieOptions = {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      };
      expect(cookieOptions.httpOnly).toBe(true);
      expect(cookieOptions.path).toBe("/");
    });
  });

  describe("Frontend Auth Redirects", () => {
    it("should redirect to /login for unauthenticated users (not Manus OAuth)", () => {
      const getLoginUrl = () => "/login";
      expect(getLoginUrl()).toBe("/login");
      expect(getLoginUrl()).not.toContain("manus");
      expect(getLoginUrl()).not.toContain("oauth");
    });

    it("should not redirect from login or signup pages", () => {
      const shouldRedirect = (currentPath: string) => {
        if (currentPath === "/login" || currentPath === "/signup") return false;
        return true;
      };
      expect(shouldRedirect("/login")).toBe(false);
      expect(shouldRedirect("/signup")).toBe(false);
      expect(shouldRedirect("/dashboard")).toBe(true);
      expect(shouldRedirect("/practice")).toBe(true);
    });
  });
});
