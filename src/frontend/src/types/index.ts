// Frontend types for Develvyn
// Manually defined until bindgen provides real types

export type UserRole =
  | "super_admin"
  | "flat_admin"
  | "family_member"
  | "watchman"
  | "watchman_family"
  | "founder"
  | "co_founder"
  | "employee"
  | "view_only"
  | "guest";

export type AppMode = "apartment" | "family" | "watchman" | "founder";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  apartmentId?: string;
  flatId?: string;
  createdAt: number;
}

export interface Apartment {
  id: string;
  name: string;
  address: string;
  totalFlats: number;
  superAdminId: string;
  upiId?: string;
  createdAt: number;
}

export interface Flat {
  id: string;
  apartmentId: string;
  number: string;
  floor: number;
  ownerId?: string;
  tenantId?: string;
  status: "occupied" | "vacant";
}

export interface MaintenanceRecord {
  id: string;
  flatId: string;
  flatNumber: string;
  amount: number;
  month: string;
  year: number;
  paidAt?: number;
  utrNumber?: string;
  screenshotUrl?: string;
  status: "pending" | "paid" | "verified";
  verifiedBy?: string;
}

export interface WalletEntry {
  id: string;
  apartmentId: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  flatId?: string;
  utrNumber?: string;
  approvedBy: string[];
  createdAt: number;
}

export interface Visitor {
  id: string;
  apartmentId: string;
  flatId: string;
  flatNumber: string;
  name: string;
  type: "guest" | "delivery" | "service" | "unknown";
  source?: string;
  loggedBy: string;
  loggedAt: number;
  status: "in" | "out";
}

export interface Notice {
  id: string;
  apartmentId: string;
  title: string;
  body: string;
  priority: "normal" | "urgent";
  postedBy: string;
  postedAt: number;
  readBy: string[];
}

export interface Issue {
  id: string;
  apartmentId: string;
  flatId?: string;
  title: string;
  description: string;
  category: string;
  status: "open" | "in_progress" | "resolved";
  raisedBy: string;
  raisedAt: number;
  resolvedAt?: number;
}

export interface WatchmanShift {
  id: string;
  apartmentId: string;
  watchmanId: string;
  watchmanName: string;
  startTime: number;
  endTime?: number;
  handoverNotes?: string;
  checklistCompleted: boolean;
  isNightMode: boolean;
}

export interface ApartmentStatus {
  gateOpen: boolean;
  waterMotorOn: boolean;
  liftOk: boolean;
  cleaningDone: boolean;
  lastUpdatedBy: string;
  lastUpdatedAt: number;
}

export interface FamilyExpense {
  id: string;
  flatId: string;
  title: string;
  amount: number;
  category: string;
  paidAt: number;
  addedBy: string;
}

export interface Task {
  id: string;
  flatId: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dueDate?: number;
  addedBy: string;
  createdAt: number;
}

export interface GroceryItem {
  id: string;
  flatId: string;
  name: string;
  quantity?: string;
  checked: boolean;
  addedBy: string;
  createdAt: number;
}
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  reminder: boolean;
  createdAt: number;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1-31
  category:
    | "electricity"
    | "water"
    | "gas"
    | "internet"
    | "ott"
    | "insurance"
    | "rent"
    | "other";
  isPaid: boolean;
  isActive: boolean;
  createdAt: number;
}

export interface HealthRecord {
  id: string;
  memberName: string;
  recordType: "prescription" | "report" | "vaccination" | "general";
  title: string;
  note?: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export interface FamilyDocument {
  id: string;
  title: string;
  docType: "aadhaar" | "pan" | "passport" | "voter_id" | "lease" | "other";
  note?: string;
  uploadedAt: number;
}

export interface Reminder {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  repeatType: "none" | "daily" | "weekly" | "monthly";
  isActive: boolean;
  createdAt: number;
}

export interface FamilyContact {
  id: string;
  name: string;
  phone: string;
  relation:
    | "spouse"
    | "parent"
    | "sibling"
    | "child"
    | "friend"
    | "doctor"
    | "other";
  note?: string;
  createdAt: number;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  apartmentId?: string;
  userId: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: number;
  updatedAt: number;
}

export interface SOSAlert {
  id: string;
  apartmentId: string;
  flatId: string;
  flatNumber: string;
  type: "medical" | "fire" | "safety" | "other";
  triggeredBy: string;
  triggeredAt: number;
  respondedBy?: string;
  respondedAt?: number;
  resolvedAt?: number;
  status: "active" | "responding" | "resolved" | "false_alarm";
}

export interface ModeAccess {
  apartment: boolean;
  family: boolean;
  watchman: boolean;
  founder: boolean;
}

export interface ConsentRecord {
  phone: string;
  generalConsent: boolean;
  generalConsentAt: number;
  watchmanPhotoIdConsent?: boolean;
  watchmanGpsConsent?: boolean;
  watchmanAttendanceConsent?: boolean;
  deviceInfo: string;
}

export interface DisputeNote {
  author: string;
  note: string;
  addedAt: number;
}

export interface DisputeRecord {
  id: string;
  flatId: string;
  category: string;
  description: string;
  status: string;
  tier: number;
  createdAt: number;
  notes: DisputeNote[];
  resolvedAt?: number;
  resolution?: string;
}

export interface MoveOutChecklistItem {
  item: string;
  completed: boolean;
}

export interface MoveOutChecklist {
  flatId: string;
  items: MoveOutChecklistItem[];
  initiatedAt: number;
  completedAt?: number;
}

export interface GuestRecord {
  id: string;
  flatId: string;
  name: string;
  phone: string;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
}

export interface WatchmanFamilyMember {
  id: string;
  watchmanId: string;
  name: string;
  phone: string;
  isActive: boolean;
}

export interface FeedbackRecord {
  id: string;
  userId: string;
  feedbackType: "suggestion" | "bug" | "compliment";
  message: string;
  submittedAt: number;
}

// ROLE_MODE_ACCESS — Intended access per role:
// superAdmin:  apartment=true,  family=false, watchman=false, founder=false
// flatAdmin:   apartment=true,  family=true,  watchman=false, founder=false
// resident:    apartment=true,  family=true,  watchman=false, founder=false
// guest:       apartment=true,  family=false, watchman=false, founder=false
// watchman:    apartment=false, family=false, watchman=true,  founder=false
// watchmanFam: apartment=false, family=true,  watchman=false, founder=false
// founder:     apartment=true,  family=true,  watchman=false, founder=true
// NOTE: Founder must NEVER access Watchman mode — context switcher for Apartment/Family only
export const ROLE_MODE_ACCESS: Record<UserRole, ModeAccess> = {
  super_admin: {
    apartment: true,
    family: true,
    watchman: false,
    founder: false,
  },
  flat_admin: {
    apartment: true,
    family: true,
    watchman: false,
    founder: false,
  },
  family_member: {
    apartment: false,
    family: true,
    watchman: false,
    founder: false,
  },
  watchman: { apartment: false, family: false, watchman: true, founder: false },
  watchman_family: {
    apartment: false,
    family: false,
    watchman: true,
    founder: false,
  },
  founder: { apartment: true, family: true, watchman: false, founder: true },
  co_founder: {
    apartment: true,
    family: false,
    watchman: false,
    founder: true,
  },
  employee: { apartment: false, family: false, watchman: false, founder: true },
  view_only: {
    apartment: true,
    family: false,
    watchman: false,
    founder: false,
  },
  guest: { apartment: false, family: false, watchman: false, founder: false },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  flat_admin: "Flat Admin",
  family_member: "Family Member",
  watchman: "Watchman",
  watchman_family: "Watchman Family",
  founder: "Founder",
  co_founder: "Co-Founder",
  employee: "Employee",
  view_only: "View Only",
  guest: "Guest",
};
