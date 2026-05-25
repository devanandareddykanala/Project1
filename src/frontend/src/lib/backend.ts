// Backend API helper — real actor calls via useActor/createActor
import type { AuthUser } from "@/store/auth";
import type { UserRole } from "@/types";
import { createActor } from "@/backend";
import type {
  MaintenancePayment,
  Notice,
  WalletEntry,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";

/** Map backend role string → frontend UserRole */
function mapRole(role: string): UserRole {
  const map: Record<string, UserRole> = {
    Founder: "founder",
    CoFounder: "co_founder",
    SuperAdmin: "super_admin",
    FlatAdmin: "flat_admin",
    FamilyMember: "family_member",
    Watchman: "watchman",
    WatchmanFamily: "watchman_family",
    Employee: "employee",
    Contractor: "employee",
    Freelancer: "employee",
    RotatingIncharge: "super_admin",
    Guest: "view_only",
  };
  return map[role] ?? "view_only";
}

/**
 * loginWithPin — call actor.loginWithPin(phone, pin)
 * Returns AuthUser on success, throws on error.
 */
/**
 * loginWithII — call actor.loginWithII(), returns AuthUser or null
 */
export async function loginWithII(
  actor: ReturnType<typeof createActor>,
): Promise<AuthUser | null> {
  try {
    const result = await actor.loginWithII();
    if (!result || result.__kind__ !== "ok") return null;
    const profile = result.ok;
    return {
      id: String(profile.userId),
      name: profile.name,
      role: mapRole(String(profile.role)),
      apartmentId: profile.apartmentId ? String(profile.apartmentId) : undefined,
      flatId: profile.flatId ? String(profile.flatId) : undefined,
      principal: undefined,
    };
  } catch {
    return null;
  }
}

/**
 * registerApartment — call actor.registerApartment(apartmentName, phone, pin)
 */
/**
 * registerApartment — call actor.registerApartment(name, phone) — no PIN
 */
export async function registerApartment(
  actor: ReturnType<typeof createActor>,
  apartmentName: string,
  phone: string,
): Promise<void> {
  const result = await actor.registerApartment(apartmentName, phone);
  if (result.__kind__ === "err") {
    throw new Error(result.err);
  }
}

/**
 * registerWithInvite — call actor.registerWithInvite(code, phone, pin, name)
 */
/**
 * registerWithInvite — call actor.registerWithInvite(code, name, phone) — no PIN
 */
export async function registerWithInvite(
  actor: ReturnType<typeof createActor>,
  code: string,
  name: string,
  phone: string,
): Promise<void> {
  const result = await actor.registerWithInvite(code, name, phone);
  if (result.__kind__ === "err") {
    throw new Error(result.err);
  }
}

/**
 * validateInviteCode — call actor.validateInviteCode(code)
 */
export async function validateInviteCode(
  actor: ReturnType<typeof createActor>,
  code: string,
): Promise<{ isValid: boolean; role: string }> {
  const result = await actor.validateInviteCode(code);
  if (result.__kind__ === "err") {
    throw new Error(result.err);
  }
  return result.ok;
}

/**
 * createWatchmanInvite — call actor.createWatchmanInvite(name, phone)
 */
export async function createWatchmanInvite(
  actor: ReturnType<typeof createActor>,
  name: string,
  phone: string,
): Promise<void> {
  const result = await actor.createWatchmanInvite(name, phone);
  if (result.__kind__ === "err") {
    throw new Error(result.err);
  }
}

/**
 * submitWatchmanIdDoc — call actor.submitWatchmanIdDoc(docUrl, docType)
 */
export async function submitWatchmanIdDoc(
  actor: ReturnType<typeof createActor>,
  docUrl: string,
  docType: string,
): Promise<void> {
  const { WatchmanIdType } = await import("@/backend");
  const resolvedDocType = (WatchmanIdType as Record<string, string>)[docType] ?? WatchmanIdType.Aadhaar;
  const result = await actor.submitWatchmanIdDoc(docUrl, resolvedDocType as import("@/backend").WatchmanIdType);
  if (result.__kind__ === "err") {
    throw new Error(result.err);
  }
}

/**
 * getPendingWatchmanApprovals — call actor.getPendingWatchmanApprovals()
 */
export async function getPendingWatchmanApprovals(
  actor: ReturnType<typeof createActor>,
) {
  return actor.getPendingWatchmanApprovals();
}

/**
 * approveWatchmanId — call actor.approveWatchmanId(principal)
 */
export async function approveWatchmanId(
  actor: ReturnType<typeof createActor>,
  watchmanPrincipal: import("@icp-sdk/core/principal").Principal,
): Promise<void> {
  const result = await actor.approveWatchmanId(watchmanPrincipal);
  if (result.__kind__ === "err") {
    throw new Error(result.err);
  }
}

/**
 * rejectWatchmanId — call actor.rejectWatchmanId(principal, reason)
 */
export async function rejectWatchmanId(
  actor: ReturnType<typeof createActor>,
  watchmanPrincipal: import("@icp-sdk/core/principal").Principal,
  reason: string,
): Promise<void> {
  const result = await actor.rejectWatchmanId(watchmanPrincipal, reason);
  if (result.__kind__ === "err") {
    throw new Error(result.err);
  }
}

/**
 * getMyMaintenancePayments — call actor.getMyMaintenancePayments()
 */
export async function getMyMaintenancePayments(
  actor: ReturnType<typeof createActor>,
): Promise<MaintenancePayment[]> {
  return actor.getMyMaintenancePayments();
}

/**
 * getNoticesForFamily — call actor.getNoticesForFamily()
 */
export async function getNoticesForFamily(
  actor: ReturnType<typeof createActor>,
): Promise<Notice[]> {
  return actor.getNoticesForFamily();
}

/**
 * getWalletSummaryForRole — call actor.getWalletSummaryForRole(apartmentId)
 */
export async function getWalletSummaryForRole(
  actor: ReturnType<typeof createActor>,
  apartmentId: bigint,
): Promise<{ balance: bigint; totalCollected: bigint; totalSpent: bigint; entries?: WalletEntry[] }> {
  return actor.getWalletSummaryForRole(apartmentId);
}

/**
 * getActiveUpiId — call actor.getActiveUpiId(apartmentId)
 */
export async function getActiveUpiId(
  actor: ReturnType<typeof createActor>,
  apartmentId: bigint,
) {
  return actor.getActiveUpiId(apartmentId);
}

/**
 * setUpiId — call actor.setUpiId(upiId, qrUrl)
 */
export async function setUpiId(
  actor: ReturnType<typeof createActor>,
  upiId: string,
  qrUrl: string | null,
): Promise<void> {
  const result = await actor.setUpiId(upiId, qrUrl);
  if (result.__kind__ === "err") {
    throw new Error(result.err);
  }
}

// Re-export createActor so consumers can reference it
export { createActor };
export { useActor };

