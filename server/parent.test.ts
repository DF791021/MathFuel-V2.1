import { describe, it, expect } from "vitest";
import crypto from "crypto";

/**
 * Unit tests for MathFuel parent router logic.
 * Tests invite code generation format, redemption validation,
 * role-based access checks, and child progress aggregation logic.
 */

// ─────────────────────────────────────────────────────────────
// Invite code generation (extracted from parent.ts)
// ─────────────────────────────────────────────────────────────

const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CONFUSING_CHARS = ["I", "O", "0", "1"];

function generateInviteCode(): string {
  const chars = INVITE_CODE_CHARS;
  // Use rejection sampling to avoid modulo bias (chars.length=32, accept bytes < 224)
  const limit = Math.floor(256 / chars.length) * chars.length;
  let code = "";
  while (code.length < 6) {
    const byte = crypto.randomBytes(1)[0];
    if (byte < limit) {
      code += chars[byte % chars.length];
    }
  }
  return code;
}

describe("Parent router – invite code generation", () => {
  it("should produce a 6-character code", () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(6);
  });

  it("should only contain allowed characters (no I, O, 0, 1)", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateInviteCode();
      for (const ch of CONFUSING_CHARS) {
        expect(code).not.toContain(ch);
      }
    }
  });

  it("should contain only uppercase alphanumeric characters from the allowed set", () => {
    const allowed = new Set(INVITE_CODE_CHARS);
    for (let i = 0; i < 20; i++) {
      const code = generateInviteCode();
      for (const ch of code) {
        expect(allowed.has(ch)).toBe(true);
      }
    }
  });

  it("should generate unique codes on repeated calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateInviteCode());
    }
    // With 32^6 ≈ 1 billion combinations, 50 codes should all be unique
    expect(codes.size).toBe(50);
  });
});

// ─────────────────────────────────────────────────────────────
// redeemInviteCode validation logic (extracted rules)
// ─────────────────────────────────────────────────────────────

type InviteCodeRecord = {
  id: number;
  studentId: number;
  code: string;
  usedBy: number | null;
  expiresAt: Date;
};

function validateInviteCodeRedemption(
  inviteCode: InviteCodeRecord | null,
  parentId: number,
  existingLinks: Array<{ studentId: number }>
): { valid: true; studentId: number } | { valid: false; error: string; code: string } {
  if (!inviteCode) {
    return { valid: false, error: "Invalid invite code. Please check and try again.", code: "NOT_FOUND" };
  }
  if (inviteCode.usedBy !== null) {
    return { valid: false, error: "This invite code has already been used.", code: "BAD_REQUEST" };
  }
  if (inviteCode.expiresAt < new Date()) {
    return {
      valid: false,
      error: "This invite code has expired. Ask your child to generate a new one.",
      code: "BAD_REQUEST",
    };
  }
  const alreadyLinked = existingLinks.some((l) => l.studentId === inviteCode.studentId);
  if (alreadyLinked) {
    return { valid: false, error: "You are already linked to this student.", code: "BAD_REQUEST" };
  }
  return { valid: true, studentId: inviteCode.studentId };
}

describe("Parent router – redeemInviteCode validation", () => {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

  const validCode: InviteCodeRecord = {
    id: 1,
    studentId: 42,
    code: "ABCD23",
    usedBy: null,
    expiresAt: futureDate,
  };

  it("should return NOT_FOUND error when invite code does not exist", () => {
    const result = validateInviteCodeRedemption(null, 99, []);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("NOT_FOUND");
    }
  });

  it("should return BAD_REQUEST when code has already been used", () => {
    const usedCode = { ...validCode, usedBy: 55 };
    const result = validateInviteCodeRedemption(usedCode, 99, []);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("BAD_REQUEST");
      expect(result.error).toContain("already been used");
    }
  });

  it("should return BAD_REQUEST when code is expired", () => {
    const expiredCode = { ...validCode, expiresAt: pastDate };
    const result = validateInviteCodeRedemption(expiredCode, 99, []);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("BAD_REQUEST");
      expect(result.error).toContain("expired");
    }
  });

  it("should return BAD_REQUEST when parent is already linked to this student", () => {
    const result = validateInviteCodeRedemption(validCode, 99, [{ studentId: 42 }]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("BAD_REQUEST");
      expect(result.error).toContain("already linked");
    }
  });

  it("should succeed for a valid, unused, unexpired, unlinked code", () => {
    const result = validateInviteCodeRedemption(validCode, 99, []);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.studentId).toBe(42);
    }
  });

  it("should allow a parent already linked to a different student", () => {
    const result = validateInviteCodeRedemption(validCode, 99, [{ studentId: 100 }]);
    expect(result.valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// getMyInviteCodes – active code filtering logic
// ─────────────────────────────────────────────────────────────

type RawInviteCode = {
  id: number;
  code: string;
  expiresAt: Date;
  usedBy: number | null;
  usedAt: Date | null;
};

function mapInviteCodes(codes: RawInviteCode[]) {
  const now = new Date();
  return codes.map((c) => ({
    id: c.id,
    code: c.code,
    expiresAt: c.expiresAt,
    isActive: !c.usedBy && c.expiresAt > now,
    usedBy: c.usedBy,
    usedAt: c.usedAt,
  }));
}

describe("Parent router – getMyInviteCodes mapping", () => {
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const past = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

  it("should mark a valid unused unexpired code as active", () => {
    const codes: RawInviteCode[] = [
      { id: 1, code: "ABCD23", expiresAt: future, usedBy: null, usedAt: null },
    ];
    expect(mapInviteCodes(codes)[0].isActive).toBe(true);
  });

  it("should mark an expired code as inactive", () => {
    const codes: RawInviteCode[] = [
      { id: 2, code: "XYZ789", expiresAt: past, usedBy: null, usedAt: null },
    ];
    expect(mapInviteCodes(codes)[0].isActive).toBe(false);
  });

  it("should mark a used code as inactive", () => {
    const codes: RawInviteCode[] = [
      { id: 3, code: "MNPQ45", expiresAt: future, usedBy: 55, usedAt: new Date() },
    ];
    expect(mapInviteCodes(codes)[0].isActive).toBe(false);
  });

  it("should preserve all code fields in the result", () => {
    const usedAt = new Date();
    const codes: RawInviteCode[] = [
      { id: 4, code: "TEST22", expiresAt: future, usedBy: 77, usedAt },
    ];
    const result = mapInviteCodes(codes)[0];
    expect(result.id).toBe(4);
    expect(result.code).toBe("TEST22");
    expect(result.usedBy).toBe(77);
    expect(result.usedAt).toBe(usedAt);
  });

  it("should handle empty codes array", () => {
    expect(mapInviteCodes([])).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
// getChildren – child progress aggregation logic
// ─────────────────────────────────────────────────────────────

type ChildMasteryRecord = { masteryLevel: string; masteryScore: number };

function computeChildSummary(mastery: ChildMasteryRecord[]) {
  const totalMastered = mastery.filter((m) => m.masteryLevel === "mastered").length;
  const overallAccuracy =
    mastery.length > 0
      ? Math.round(mastery.reduce((sum, m) => sum + m.masteryScore, 0) / mastery.length)
      : 0;
  return { skillsMastered: totalMastered, totalSkills: mastery.length, overallAccuracy };
}

describe("Parent router – getChildren child progress summary", () => {
  it("should count mastered skills", () => {
    const mastery: ChildMasteryRecord[] = [
      { masteryLevel: "mastered", masteryScore: 92 },
      { masteryLevel: "close", masteryScore: 75 },
      { masteryLevel: "practicing", masteryScore: 50 },
    ];
    const result = computeChildSummary(mastery);
    expect(result.skillsMastered).toBe(1);
    expect(result.totalSkills).toBe(3);
  });

  it("should return 0 accuracy and 0 skills for empty mastery", () => {
    const result = computeChildSummary([]);
    expect(result.overallAccuracy).toBe(0);
    expect(result.totalSkills).toBe(0);
  });

  it("should compute rounded average mastery score", () => {
    const mastery: ChildMasteryRecord[] = [
      { masteryLevel: "mastered", masteryScore: 92 },
      { masteryLevel: "practicing", masteryScore: 50 },
    ];
    const result = computeChildSummary(mastery);
    expect(result.overallAccuracy).toBe(71);
  });

  it("should handle all mastered skills", () => {
    const mastery: ChildMasteryRecord[] = [
      { masteryLevel: "mastered", masteryScore: 95 },
      { masteryLevel: "mastered", masteryScore: 91 },
    ];
    const result = computeChildSummary(mastery);
    expect(result.skillsMastered).toBe(2);
    expect(result.totalSkills).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────
// Role-based access control
// ─────────────────────────────────────────────────────────────

describe("Parent router – role-based access control", () => {
  function canGenerateInviteCode(userType: string): boolean {
    return userType === "student";
  }

  function canRedeemInviteCode(userType: string): boolean {
    return userType === "parent";
  }

  it("should allow only students to generate invite codes", () => {
    expect(canGenerateInviteCode("student")).toBe(true);
    expect(canGenerateInviteCode("parent")).toBe(false);
    expect(canGenerateInviteCode("teacher")).toBe(false);
    expect(canGenerateInviteCode("admin")).toBe(false);
  });

  it("should allow only parents to redeem invite codes", () => {
    expect(canRedeemInviteCode("parent")).toBe(true);
    expect(canRedeemInviteCode("student")).toBe(false);
    expect(canRedeemInviteCode("teacher")).toBe(false);
    expect(canRedeemInviteCode("admin")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// generateInviteCode – active code reuse logic
// ─────────────────────────────────────────────────────────────

describe("Parent router – generateInviteCode reuse logic", () => {
  type StoredCode = { code: string; usedBy: number | null; expiresAt: Date };

  function shouldReuseCode(codes: StoredCode[]): StoredCode | null {
    const now = new Date();
    return codes.find((c) => !c.usedBy && c.expiresAt > now) ?? null;
  }

  it("should return existing active code if one exists", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const codes: StoredCode[] = [{ code: "ACTIVE", usedBy: null, expiresAt: future }];
    expect(shouldReuseCode(codes)?.code).toBe("ACTIVE");
  });

  it("should not reuse an expired code", () => {
    const past = new Date(Date.now() - 1000);
    const codes: StoredCode[] = [{ code: "EXPIRED", usedBy: null, expiresAt: past }];
    expect(shouldReuseCode(codes)).toBeNull();
  });

  it("should not reuse a used code", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const codes: StoredCode[] = [{ code: "USED", usedBy: 5, expiresAt: future }];
    expect(shouldReuseCode(codes)).toBeNull();
  });

  it("should return null when no codes exist", () => {
    expect(shouldReuseCode([])).toBeNull();
  });

  it("should return first active code among multiple", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const past = new Date(Date.now() - 1000);
    const codes: StoredCode[] = [
      { code: "EXPIRED", usedBy: null, expiresAt: past },
      { code: "FIRST_ACTIVE", usedBy: null, expiresAt: future },
      { code: "SECOND_ACTIVE", usedBy: null, expiresAt: future },
    ];
    expect(shouldReuseCode(codes)?.code).toBe("FIRST_ACTIVE");
  });
});
