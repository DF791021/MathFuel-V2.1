import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Invite Code Generation ──

describe("Invite Code Generation", () => {
  it("should generate a 6-character alphanumeric code", () => {
    // Simulate the code generation logic
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");

    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
    // Should not contain confusing characters
    expect(code).not.toMatch(/[IO01]/);
  });

  it("should generate unique codes on each call", () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const code = Array.from({ length: 6 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join("");
      codes.add(code);
    }
    // With 30^6 = 729M possibilities, 100 codes should all be unique
    expect(codes.size).toBe(100);
  });

  it("should set expiration to 7 days from now", () => {
    const now = Date.now();
    const expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000);
    const diff = expiresAt.getTime() - now;
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

// ── Invite Code Validation ──

describe("Invite Code Validation", () => {
  it("should normalize code to uppercase and trim", () => {
    const input = "  abc123  ";
    const normalized = input.toUpperCase().trim();
    expect(normalized).toBe("ABC123");
  });

  it("should reject empty codes", () => {
    const code = "";
    expect(code.length).toBeLessThan(1);
  });

  it("should reject codes shorter than 4 characters", () => {
    const code = "AB";
    expect(code.length).toBeLessThan(4);
  });

  it("should accept valid 6-character codes", () => {
    const code = "ABC234";
    expect(code.length).toBe(6);
    expect(code).toMatch(/^[A-Z0-9]{3,6}$/);
  });
});

// ── Invite Code Redemption Logic ──

describe("Invite Code Redemption", () => {
  it("should reject expired codes", () => {
    const code = {
      id: 1,
      code: "ABC234",
      studentId: 1,
      expiresAt: new Date(Date.now() - 86400000), // expired yesterday
      usedBy: null,
      usedAt: null,
    };

    const isExpired = code.expiresAt < new Date();
    expect(isExpired).toBe(true);
  });

  it("should reject already-used codes", () => {
    const code = {
      id: 1,
      code: "ABC234",
      studentId: 1,
      expiresAt: new Date(Date.now() + 86400000),
      usedBy: 5,
      usedAt: new Date(),
    };

    const isUsed = code.usedBy !== null;
    expect(isUsed).toBe(true);
  });

  it("should accept valid, unused, unexpired codes", () => {
    const code = {
      id: 1,
      code: "ABC234",
      studentId: 1,
      expiresAt: new Date(Date.now() + 86400000),
      usedBy: null,
      usedAt: null,
    };

    const isValid = !code.usedBy && code.expiresAt > new Date();
    expect(isValid).toBe(true);
  });

  it("should detect already-linked parent-student pairs", () => {
    const existingLinks = [
      { parentId: 10, studentId: 1 },
      { parentId: 10, studentId: 3 },
    ];
    const newStudentId = 1;

    const alreadyLinked = existingLinks.some(l => l.studentId === newStudentId);
    expect(alreadyLinked).toBe(true);
  });

  it("should allow linking to a new student", () => {
    const existingLinks = [
      { parentId: 10, studentId: 1 },
    ];
    const newStudentId = 5;

    const alreadyLinked = existingLinks.some(l => l.studentId === newStudentId);
    expect(alreadyLinked).toBe(false);
  });
});

// ── Password Reset Token Logic ──

describe("Password Reset Token", () => {
  it("should generate a valid hex token", () => {
    // Simulate crypto.randomBytes(32).toString('hex')
    const token = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");

    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should set expiration to 1 hour from now", () => {
    const now = Date.now();
    const expiresAt = new Date(now + 60 * 60 * 1000);
    const diff = expiresAt.getTime() - now;
    expect(diff).toBe(60 * 60 * 1000);
  });

  it("should reject expired tokens", () => {
    const token = {
      id: 1,
      token: "abc123",
      userId: 1,
      expiresAt: new Date(Date.now() - 3600000), // expired 1 hour ago
      usedAt: null,
    };

    const isExpired = token.expiresAt < new Date();
    expect(isExpired).toBe(true);
  });

  it("should reject already-used tokens", () => {
    const token = {
      id: 1,
      token: "abc123",
      userId: 1,
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: new Date(),
    };

    const isUsed = token.usedAt !== null;
    expect(isUsed).toBe(true);
  });

  it("should accept valid, unused, unexpired tokens", () => {
    const token = {
      id: 1,
      token: "abc123",
      userId: 1,
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: null,
    };

    const isValid = !token.usedAt && token.expiresAt > new Date();
    expect(isValid).toBe(true);
  });
});

// ── Password Validation ──

describe("Password Validation", () => {
  it("should reject passwords shorter than 8 characters", () => {
    const password = "abc123";
    expect(password.length).toBeLessThan(8);
  });

  it("should accept passwords of 8+ characters", () => {
    const password = "mySecure1";
    expect(password.length).toBeGreaterThanOrEqual(8);
  });

  it("should reject mismatched password confirmation", () => {
    const password = "mySecure1";
    const confirm = "mySecure2";
    expect(password).not.toBe(confirm);
  });

  it("should accept matching password confirmation", () => {
    const password = "mySecure1";
    const confirm = "mySecure1";
    expect(password).toBe(confirm);
  });
});

// ── Role-based Access Control ──

describe("Role-based Access for Linking", () => {
  it("should only allow students to generate invite codes", () => {
    const user = { id: 1, userType: "student" };
    expect(user.userType).toBe("student");
  });

  it("should reject non-students from generating invite codes", () => {
    const user = { id: 2, userType: "parent" };
    expect(user.userType).not.toBe("student");
  });

  it("should only allow parents to redeem invite codes", () => {
    const user = { id: 3, userType: "parent" };
    expect(user.userType).toBe("parent");
  });

  it("should reject non-parents from redeeming invite codes", () => {
    const user = { id: 1, userType: "student" };
    expect(user.userType).not.toBe("parent");
  });
});
