import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Result_2 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface ParkingSlot {
    id: bigint;
    assignedAt?: Timestamp;
    assignedTo?: FlatId;
    apartmentId: ApartmentId;
    slotType: ParkingType;
    slotNumber: string;
}
export interface DisputeNote {
    note: string;
    author: string;
    addedAt: bigint;
}
export interface ApartmentExpense {
    id: bigint;
    status: ExpenseStatus;
    apartmentId: ApartmentId;
    approvedBy: Array<UserId>;
    createdAt: Timestamp;
    description: string;
    category: ExpenseCategory;
    payee: string;
    amount: bigint;
}
export type Result_5 = {
    __kind__: "ok";
    ok: Array<SupportTicket>;
} | {
    __kind__: "err";
    err: string;
};
export type FlatId = bigint;
export type Result_4 = {
    __kind__: "ok";
    ok: Array<TicketMessage>;
} | {
    __kind__: "err";
    err: string;
};
export interface SlaMetadata {
    resolutionSla: Timestamp;
    firstResponseSla: Timestamp;
    breached: boolean;
    firstResponseAt?: Timestamp;
    resolvedAt?: Timestamp;
}
export interface WatchmanShift {
    id: bigint;
    startedAt: Timestamp;
    handoverChecklist: ShiftHandoverChecklist;
    apartmentId: ApartmentId;
    endedAt?: Timestamp;
    isNightMode: boolean;
    relievedById?: UserId;
    handoverNote: string;
    watchmanId: UserId;
}
export interface WalletEntry {
    id: bigint;
    status: DebitApprovalStatus;
    entryType: WalletEntryType;
    apartmentId: ApartmentId;
    flatId?: FlatId;
    approvedBy: Array<UserId>;
    createdAt: Timestamp;
    correctionNote?: string;
    correctionOf?: bigint;
    utrNumber?: string;
    amount: bigint;
    purpose: string;
    isPermanent: boolean;
}
export interface PendingWatchman {
    status: WatchmanStatus;
    principal: Principal;
    docUrl: string;
    apartmentId: string;
    userId: string;
    name: string;
    rejectionReason?: string;
    submittedAt: bigint;
    phone: string;
    docType: WatchmanIdType;
    uploadedAt: bigint;
}
export interface AppFeedback {
    id: bigint;
    moduleName: string;
    userId: UserId;
    createdAt: Timestamp;
    comment: string;
    rating: bigint;
}
export type Result_7 = {
    __kind__: "ok";
    ok: {
        code: string;
        link: string;
    };
} | {
    __kind__: "err";
    err: string;
};
export interface VisitorEntry {
    id: bigint;
    apartmentId: ApartmentId;
    flatId?: FlatId;
    note: string;
    visitorName: string;
    visitorType: VisitorType;
    enteredAt: Timestamp;
    enteredBy: UserId;
}
export interface SubscriptionRow {
    status: SubscriptionStatus;
    apartmentId: ApartmentId;
    city: string;
    dueDate: Timestamp;
    adminUserId: UserId;
    utrSubmitted: boolean;
    flatsCount: bigint;
    apartmentName: string;
}
export type Result_6 = {
    __kind__: "ok";
    ok: {
        expiresAt: bigint;
        code: string;
        link: string;
    };
} | {
    __kind__: "err";
    err: string;
};
export interface SOSAlert {
    id: bigint;
    resolutionNote: string;
    alertType: AlertType;
    apartmentId: ApartmentId;
    flatId: FlatId;
    isFalseAlarm: boolean;
    falseAlarmReason: string;
    triggeredAt: Timestamp;
    triggeredBy: UserId;
    respondedAt?: Timestamp;
    respondedBy?: UserId;
    resolvedAt?: Timestamp;
    resolvedBy?: UserId;
}
export interface FamilyTask {
    id: bigint;
    status: TaskStatus;
    title: string;
    assignedTo: string;
    createdAt: Timestamp;
    dueDate?: Timestamp;
    description: string;
    priority: TaskPriority;
    principalId: Principal;
}
export interface FamilyContact {
    id: bigint;
    relation: string;
    name: string;
    note: string;
    phone: string;
    principalId: Principal;
}
export interface WatchmanFamilyMember {
    id: string;
    name: string;
    isActive: boolean;
    phone: string;
    watchmanId: string;
}
export interface MaintenancePayment {
    id: bigint;
    status: PaymentStatus;
    month: bigint;
    apartmentId: ApartmentId;
    flatId: FlatId;
    screenshotUrl: string;
    createdAt: Timestamp;
    year: bigint;
    correctionNote?: string;
    correctionOf?: bigint;
    utrNumber: string;
    amount: bigint;
    verifiedBy?: UserId;
}
export type UserId = bigint;
export type Result = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export interface MoveOutChecklist {
    completedAt?: bigint;
    flatId: string;
    items: Array<ChecklistEntry>;
    initiatedAt: bigint;
}
export interface Apartment {
    id: ApartmentId;
    inchargeId?: UserId;
    name: string;
    createdAt: Timestamp;
    subscriptionStatus: SubscriptionStatus;
    address: string;
    upiId: string;
    upiQrData: string;
    superAdminId: UserId;
}
export interface FamilyExpense {
    id: bigint;
    date: Timestamp;
    createdAt: Timestamp;
    description: string;
    category: FamilyExpenseCategory;
    amount: bigint;
    principalId: Principal;
}
export interface TicketMessage {
    id: bigint;
    attachmentUrl?: string;
    authorId: UserId;
    createdAt: Timestamp;
    ticketId: bigint;
    message: string;
    isInternal: boolean;
}
export type Timestamp = bigint;
export interface PlatformHealth {
    activeUsers: bigint;
    cycleBalance: bigint;
    failedLogins: bigint;
    uptimePercent: bigint;
    sosCount: bigint;
}
export interface InchargeRecord {
    id: bigint;
    handoverChecklist: HandoverChecklist;
    endDate?: Timestamp;
    apartmentId: ApartmentId;
    userId: UserId;
    isActive: boolean;
    handoverNotes: string;
    startDate: Timestamp;
}
export interface FamilyCalendarEvent {
    id: bigint;
    title: string;
    reminder?: Timestamp;
    date: Timestamp;
    time: string;
    description: string;
    principalId: Principal;
}
export type Result_1 = {
    __kind__: "ok";
    ok: {
        role: string;
        isValid: boolean;
    };
} | {
    __kind__: "err";
    err: string;
};
export interface ChecklistEntry {
    item: string;
    completed: boolean;
}
export interface ShiftHandoverChecklist {
    liftChecked: boolean;
    gateChecked: boolean;
    motorChecked: boolean;
}
export interface ConsentRecord {
    principal: Principal;
    watchmanGpsConsent?: boolean;
    watchmanPhotoIdConsent?: boolean;
    watchmanAttendanceConsent?: boolean;
    generalConsent: boolean;
    generalConsentAt: bigint;
    deviceInfo: string;
    phone: string;
}
export interface Notice {
    id: bigint;
    title: string;
    postedAt: Timestamp;
    postedBy: UserId;
    content: string;
    acknowledgedBy: Array<UserId>;
    apartmentId: ApartmentId;
    priority: Priority;
}
export interface SupportTicket {
    id: bigint;
    sla: SlaMetadata;
    status: TicketStatus;
    assignedTo?: UserId;
    subject: string;
    apartmentId?: ApartmentId;
    userId: UserId;
    createdAt: Timestamp;
    description: string;
    updatedAt: Timestamp;
    ticketType: TicketType;
    category: TicketCategory;
    priority: TicketPriority;
}
export interface BillSubscription {
    id: bigint;
    name: string;
    isActive: boolean;
    dueDay: bigint;
    category: BillCategory;
    amount: bigint;
    principalId: Principal;
}
export interface Flat {
    id: FlatId;
    status: FlatStatus;
    ownerId?: UserId;
    apartmentId: ApartmentId;
    tenantId?: UserId;
    flatNumber: string;
}
export interface HandoverChecklist {
    gateKeyTransferred: boolean;
    upiUpdated: boolean;
    pendingIssuesNoted: boolean;
    ledgerReviewed: boolean;
}
export interface User {
    id: UserId;
    principal: Principal;
    apartmentId?: ApartmentId;
    flatId?: FlatId;
    name: string;
    createdAt: Timestamp;
    role: Role;
    isActive: boolean;
    phone: string;
}
export interface Issue {
    id: bigint;
    status: IssueStatus;
    title: string;
    assignedTo?: UserId;
    apartmentId: ApartmentId;
    flatId: FlatId;
    createdAt: Timestamp;
    description: string;
    updatedAt: Timestamp;
    category: IssueCategory;
    raisedBy: UserId;
    resolvedAt?: Timestamp;
}
export interface HealthRecord {
    id: bigint;
    title: string;
    date: Timestamp;
    note: string;
    recordType: HealthRecordType;
    memberName: string;
    principalId: Principal;
    fileUrl: string;
}
export interface GuestRecord {
    id: string;
    expiresAt: bigint;
    flatId: string;
    name: string;
    createdAt: bigint;
    isActive: boolean;
    phone: string;
}
export interface FamilyReminder {
    id: bigint;
    title: string;
    repeatType: RepeatType;
    date: Timestamp;
    time: string;
    isActive: boolean;
    principalId: Principal;
}
export interface ProfileInfo {
    apartmentId: string;
    flatId?: string;
    userId: string;
    name: string;
    role: string;
    isActive: boolean;
}
export interface DisputeRecord {
    id: string;
    status: string;
    flatId: string;
    createdAt: bigint;
    tier: bigint;
    description: string;
    resolution?: string;
    notes: Array<DisputeNote>;
    category: string;
    resolvedAt?: bigint;
}
export interface FacilityStatus {
    cleaningStatus: CleaningStatus;
    apartmentId: ApartmentId;
    waterMotorStatus: WaterMotorStatus;
    liftStatus: LiftStatus;
    lastUpdatedAt: Timestamp;
    lastUpdatedBy: UserId;
    gateStatus: GateStatus;
}
export type Result_3 = {
    __kind__: "ok";
    ok: ProfileInfo;
} | {
    __kind__: "err";
    err: string;
};
export type ApartmentId = bigint;
export interface GroceryItem {
    id: bigint;
    name: string;
    unit: string;
    isPurchased: boolean;
    addedAt: Timestamp;
    quantity: string;
    principalId: Principal;
}
export interface FeedbackRecord {
    id: string;
    userId: string;
    feedbackType: string;
    submittedAt: bigint;
    message: string;
    screenshot?: Uint8Array;
}
export interface DocumentVaultEntry {
    id: bigint;
    title: string;
    note: string;
    docType: DocumentType;
    principalId: Principal;
    uploadedAt: Timestamp;
    fileUrl: string;
}
export enum AlertType {
    Fire = "Fire",
    Safety = "Safety",
    Medical = "Medical",
    Other = "Other"
}
export enum BillCategory {
    DTH = "DTH",
    Gas = "Gas",
    Internet = "Internet",
    Electricity = "Electricity",
    Water = "Water",
    Other = "Other"
}
export enum DebitApprovalStatus {
    Approved = "Approved",
    Rejected = "Rejected",
    Executed = "Executed",
    Pending = "Pending"
}
export enum DocumentType {
    PAN = "PAN",
    Insurance = "Insurance",
    Aadhaar = "Aadhaar",
    Vehicle = "Vehicle",
    Property = "Property",
    Other = "Other"
}
export enum ExpenseCategory {
    Repair = "Repair",
    Salary = "Salary",
    Maintenance = "Maintenance",
    Other = "Other",
    Utilities = "Utilities"
}
export enum ExpenseStatus {
    Deducted = "Deducted",
    Approved = "Approved",
    Pending = "Pending"
}
export enum FamilyExpenseCategory {
    Food = "Food",
    Bills = "Bills",
    Grocery = "Grocery",
    Entertainment = "Entertainment",
    Medical = "Medical",
    Other = "Other",
    Transport = "Transport"
}
export enum FlatStatus {
    Vacant = "Vacant",
    Occupied = "Occupied"
}
export enum GateStatus {
    Open = "Open",
    Closed = "Closed",
    Locked = "Locked"
}
export enum HealthRecordType {
    Vaccination = "Vaccination",
    Report = "Report",
    Other = "Other",
    Prescription = "Prescription"
}
export enum IssueCategory {
    Security = "Security",
    Plumbing = "Plumbing",
    Maintenance = "Maintenance",
    Electrical = "Electrical",
    Other = "Other",
    Common = "Common"
}
export enum IssueStatus {
    Open = "Open",
    InProgress = "InProgress",
    Resolved = "Resolved"
}
export enum LiftStatus {
    OK = "OK",
    Issue = "Issue",
    Offline = "Offline"
}
export enum ParkingType {
    Car = "Car",
    Bike = "Bike",
    Both = "Both"
}
export enum PaymentStatus {
    Rejected = "Rejected",
    Verified = "Verified",
    Pending = "Pending"
}
export enum Priority {
    Important = "Important",
    Normal = "Normal",
    Urgent = "Urgent"
}
export enum RepeatType {
    Weekly = "Weekly",
    None = "None",
    Daily = "Daily",
    Monthly = "Monthly"
}
export enum Role {
    RotatingIncharge = "RotatingIncharge",
    Guest = "Guest",
    FamilyMember = "FamilyMember",
    Employee = "Employee",
    Founder = "Founder",
    CoFounder = "CoFounder",
    SuperAdmin = "SuperAdmin",
    FlatAdmin = "FlatAdmin",
    Freelancer = "Freelancer",
    WatchmanFamily = "WatchmanFamily",
    Watchman = "Watchman",
    Contractor = "Contractor"
}
export enum SubscriptionStatus {
    GracePeriod = "GracePeriod",
    Inactive = "Inactive",
    Active = "Active",
    Overdue = "Overdue",
    Trial = "Trial"
}
export enum TaskPriority {
    Low = "Low",
    High = "High",
    Medium = "Medium"
}
export enum TaskStatus {
    Done = "Done",
    Pending = "Pending"
}
export enum TicketCategory {
    Bug = "Bug",
    Technical = "Technical",
    Billing = "Billing",
    Account = "Account",
    Dispute = "Dispute",
    Payment = "Payment",
    Other = "Other",
    Feature = "Feature"
}
export enum TicketPriority {
    Normal = "Normal",
    Urgent = "Urgent"
}
export enum TicketStatus {
    WaitingForUser = "WaitingForUser",
    Open = "Open",
    InProgress = "InProgress",
    Resolved = "Resolved"
}
export enum TicketType {
    Support = "Support",
    DisputeEscalation = "DisputeEscalation"
}
export enum VisitorType {
    Guest = "Guest",
    Delivery = "Delivery",
    Unknown = "Unknown",
    Service = "Service"
}
export enum WalletEntryType {
    Debit = "Debit",
    Correction = "Correction",
    Credit = "Credit"
}
export enum WatchmanIdType {
    Passport = "Passport",
    Aadhaar = "Aadhaar",
    DrivingLicence = "DrivingLicence",
    VoterID = "VoterID",
    Other = "Other"
}
export enum WatchmanStatus {
    Approved = "Approved",
    Rejected = "Rejected",
    Pending = "Pending"
}
export enum WaterMotorStatus {
    On = "On",
    Off = "Off"
}
export interface backendInterface {
    acceptHandover(apartmentId: ApartmentId, newInchargeId: UserId): Promise<Result>;
    acknowledgeNotice(noticeId: bigint): Promise<Result>;
    addBillSubscription(name: string, amount: bigint, dueDay: bigint, category: BillCategory): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addCalendarEvent(title: string, description: string, date: Timestamp, time: string, reminder: Timestamp | null): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addCorrectionEntry(originalId: bigint, reason: string, correctedAmount: bigint | null, note: string): Promise<Result>;
    addDisputeNote(disputeId: string, note: string, evidence: Uint8Array | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addDocument(title: string, docType: DocumentType, note: string, fileUrl: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addFamilyContact(name: string, phone: string, relation: string, note: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addFamilyExpense(amount: bigint, category: FamilyExpenseCategory, description: string, date: Timestamp): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addFamilyTask(title: string, description: string, assignedTo: string, dueDate: Timestamp | null, priority: TaskPriority): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addGroceryItem(name: string, quantity: string, unit: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addHealthRecord(memberName: string, recordType: HealthRecordType, title: string, note: string, date: Timestamp, fileUrl: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addInternalNote(ticketId: bigint, note: string): Promise<Result>;
    addMessage(ticketId: bigint, message: string): Promise<Result>;
    addReminder(title: string, date: Timestamp, time: string, repeatType: RepeatType): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addWatchmanFamilyMember(watchmanId: string, name: string, phone: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    approveDebit(entryId: bigint): Promise<Result>;
    approveExpense(expenseId: bigint): Promise<Result>;
    approveWatchmanId(watchmanPrincipal: Principal): Promise<Result>;
    assignIncharge(apartmentId: ApartmentId, userId: UserId, startDate: Timestamp): Promise<Result>;
    assignParking(slotId: bigint, flatId: FlatId): Promise<Result>;
    assignRole(target: Principal, role: Role): Promise<Result>;
    completeChecklistItem(checklistId: string, item: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    completeMovOut(flatId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createApartment(name: string, address: string): Promise<Result>;
    createDispute(flatId: string, category: string, description: string, photo: Uint8Array | null): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createExpense(apartmentId: ApartmentId, amount: bigint, category: ExpenseCategory, description: string, payee: string): Promise<Result>;
    createFlat(apartmentId: ApartmentId, flatNumber: string): Promise<Result>;
    createGuest(flatId: string, guestName: string, guestPhone: string, durationDays: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createTicket(subject: string, description: string, category: TicketCategory, priority: TicketPriority, ticketType: TicketType): Promise<Result>;
    createWatchmanInvite(watchmanName: string, phone: string): Promise<Result>;
    deactivateUser(target: Principal): Promise<Result>;
    deductExpense(expenseId: bigint): Promise<Result>;
    deleteBillSubscription(id: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteCalendarEvent(id: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteDocument(id: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteFamilyContact(id: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteFamilyExpense(id: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteFamilyTask(id: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteGroceryItem(id: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteHealthRecord(id: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteReminder(id: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    endShift(shiftId: bigint, note: string, checklist: ShiftHandoverChecklist): Promise<Result>;
    escalateDispute(disputeId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    generateFounderInvite(role: string): Promise<Result_7>;
    generateInviteCode(role: string, flatId: string | null): Promise<Result_6>;
    getActiveShift(apartmentId: ApartmentId): Promise<WatchmanShift | null>;
    getActiveUpiId(apartmentId: ApartmentId): Promise<{
        qrImageUrl?: string;
        upiId: string;
        effectiveFrom: bigint;
    } | null>;
    getApartment(apartmentId: ApartmentId): Promise<Apartment | null>;
    getApartmentCount(): Promise<bigint>;
    getApartmentOverview(): Promise<Array<{
        apartmentId: ApartmentId;
        city: string;
        name: string;
        subscriptionStatus: SubscriptionStatus;
        superAdminId: UserId;
    }>>;
    getApartmentUsers(apartmentId: ApartmentId): Promise<Array<User>>;
    getConsentRecord(phone: string): Promise<ConsentRecord | null>;
    getDisputeEscalations(): Promise<Result_5>;
    getDisputes(filter: string | null): Promise<Array<DisputeRecord>>;
    getExpenses(apartmentId: ApartmentId): Promise<Array<ApartmentExpense>>;
    getFacilityStatus(apartmentId: ApartmentId): Promise<FacilityStatus | null>;
    getFeedback(): Promise<Array<AppFeedback>>;
    getFlats(apartmentId: ApartmentId): Promise<Array<Flat>>;
    getFounderTeam(): Promise<Array<ProfileInfo>>;
    getGuests(apartmentId: string): Promise<Array<GuestRecord>>;
    getInAppFeedback(filter: string | null): Promise<Array<FeedbackRecord>>;
    getInchargeHistory(apartmentId: ApartmentId): Promise<Array<InchargeRecord>>;
    getIssues(apartmentId: ApartmentId): Promise<Array<Issue>>;
    getIssuesByFlat(flatId: FlatId): Promise<Array<Issue>>;
    getMaintenanceForFlat(flatId: FlatId): Promise<Array<MaintenancePayment>>;
    getMoveOutChecklist(flatId: string): Promise<MoveOutChecklist | null>;
    getMyMaintenancePayments(): Promise<Array<MaintenancePayment>>;
    getMyProfile(): Promise<User | null>;
    getMyRole(): Promise<string | null>;
    getNotices(apartmentId: ApartmentId): Promise<Array<Notice>>;
    getNoticesForApartment(apartmentId: ApartmentId): Promise<Array<Notice>>;
    getNoticesForFamily(): Promise<Array<Notice>>;
    getOpenTicketCount(): Promise<bigint>;
    getParkingSlots(apartmentId: ApartmentId): Promise<Array<ParkingSlot>>;
    getPaymentsByFlat(flatId: FlatId): Promise<Array<MaintenancePayment>>;
    getPendingPaymentConfirmations(): Promise<bigint>;
    getPendingPayments(apartmentId: ApartmentId): Promise<Array<MaintenancePayment>>;
    getPendingWatchmanApprovals(): Promise<Array<PendingWatchman>>;
    getPlatformHealth(): Promise<PlatformHealth>;
    getSOSLog(apartmentId: ApartmentId): Promise<Array<SOSAlert>>;
    getShiftHistory(apartmentId: ApartmentId): Promise<Array<WatchmanShift>>;
    getSubscriptionTable(): Promise<Array<SubscriptionRow>>;
    getSubscriptionsDueThisWeek(): Promise<bigint>;
    getTicketThread(ticketId: bigint): Promise<Result_4>;
    getTickets(): Promise<Array<SupportTicket>>;
    getUnreadNoticeCount(apartmentId: ApartmentId): Promise<bigint>;
    getVisitorLog(apartmentId: ApartmentId): Promise<Array<VisitorEntry>>;
    getVisitorLogForFlat(flatId: FlatId): Promise<Array<VisitorEntry>>;
    getWalletBalance(apartmentId: ApartmentId): Promise<bigint>;
    getWalletLedger(apartmentId: ApartmentId): Promise<Array<WalletEntry>>;
    getWalletSummaryForRole(apartmentId: ApartmentId): Promise<{
        balance: bigint;
        totalCollected: bigint;
        entries?: Array<WalletEntry>;
        totalSpent: bigint;
    }>;
    getWatchmanFamily(watchmanId: string): Promise<Array<WatchmanFamilyMember>>;
    initiateDebit(apartmentId: ApartmentId, amount: bigint, purpose: string): Promise<Result>;
    initiateHandover(apartmentId: ApartmentId, notes: string, checklist: HandoverChecklist): Promise<Result>;
    initiateMovIn(flatId: string, newTenantPhone: string, newTenantName: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    initiateMovOut(flatId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    isFounderRegistered(): Promise<boolean>;
    listBillSubscriptions(): Promise<Array<BillSubscription>>;
    listCalendarEvents(): Promise<Array<FamilyCalendarEvent>>;
    listDocuments(): Promise<Array<DocumentVaultEntry>>;
    listFamilyContacts(): Promise<Array<FamilyContact>>;
    listFamilyExpenses(): Promise<Array<FamilyExpense>>;
    listFamilyTasks(): Promise<Array<FamilyTask>>;
    listGroceryItems(): Promise<Array<GroceryItem>>;
    listHealthRecords(): Promise<Array<HealthRecord>>;
    listReminders(): Promise<Array<FamilyReminder>>;
    logVisitor(flatId: FlatId | null, apartmentId: ApartmentId, name: string, visitorType: VisitorType, note: string): Promise<Result>;
    loginWithII(): Promise<Result_3>;
    markResolved(ticketId: bigint, resolutionNote: string): Promise<Result_2>;
    postNotice(apartmentId: ApartmentId, title: string, content: string, priority: Priority): Promise<Result>;
    raiseIssue(flatId: FlatId, apartmentId: ApartmentId, title: string, description: string, category: IssueCategory): Promise<Result>;
    recordConsent(phone: string, consentType: string, timestamp: bigint, deviceInfo: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    registerApartment(name: string, phone: string): Promise<Result>;
    registerWithInvite(code: string, name: string, phone: string): Promise<Result>;
    rejectDebit(debitId: bigint, reason: string): Promise<Result_2>;
    rejectWatchmanId(watchmanPrincipal: Principal, reason: string): Promise<Result>;
    reopenTicket(ticketId: bigint, reason: string): Promise<Result_2>;
    resolveDispute(disputeId: string, resolution: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    resolveSOS(sosId: bigint, note: string, isFalseAlarm: boolean, falseAlarmReason: string): Promise<Result>;
    respondToSOS(sosId: bigint): Promise<Result>;
    revokeGuest(guestId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setNightMode(shiftId: bigint, enabled: boolean): Promise<Result>;
    setUpiId(upiId: string, qrImageUrl: string | null): Promise<Result>;
    startShift(apartmentId: ApartmentId, watchmanId: UserId): Promise<Result>;
    submitFeedback(rating: bigint, comment: string, moduleName: string): Promise<Result>;
    submitInAppFeedback(feedbackType: string, message: string, screenshot: Uint8Array | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitPayment(flatId: FlatId, apartmentId: ApartmentId, amount: bigint, month: bigint, year: bigint, utrNumber: string, screenshotUrl: string): Promise<Result>;
    submitWatchmanIdDoc(docUrl: string, docType: WatchmanIdType): Promise<Result>;
    triggerSOS(flatId: FlatId, apartmentId: ApartmentId, alertType: AlertType): Promise<Result>;
    unassignParking(slotId: bigint): Promise<Result>;
    updateApartmentUpi(apartmentId: ApartmentId, upiId: string, upiQrData: string): Promise<Result>;
    updateBillSubscription(id: bigint, name: string, amount: bigint, dueDay: bigint, category: BillCategory, isActive: boolean): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateFacilityStatus(apartmentId: ApartmentId, gate: GateStatus, waterMotor: WaterMotorStatus, lift: LiftStatus, cleaning: CleaningStatus): Promise<Result>;
    updateFamilyContact(id: bigint, name: string, phone: string, relation: string, note: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateFamilyExpense(id: bigint, amount: bigint, category: FamilyExpenseCategory, description: string, date: Timestamp): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateFamilyTask(id: bigint, title: string, description: string, assignedTo: string, dueDate: Timestamp | null, status: TaskStatus, priority: TaskPriority): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateGroceryItem(id: bigint, name: string, quantity: string, unit: string, isPurchased: boolean): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateIssueStatus(issueId: bigint, status: IssueStatus): Promise<Result>;
    updateTicketStatus(ticketId: bigint, status: TicketStatus): Promise<Result>;
    validateInviteCode(code: string): Promise<Result_1>;
    verifyPayment(paymentId: bigint, approve: boolean): Promise<Result>;
}
