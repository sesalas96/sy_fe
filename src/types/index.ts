export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  SAFETY_STAFF = 'safety_staff',
  CLIENT_SUPERVISOR = 'client_supervisor',
  CLIENT_APPROVER = 'client_approver',
  CLIENT_STAFF = 'client_staff',
  VALIDADORES_OPS = 'validadores_ops',
  CONTRATISTA_ADMIN = 'contratista_admin',
  CONTRATISTA_SUBALTERNOS = 'contratista_subalternos',
  CONTRATISTA_HUERFANO = 'contratista_huerfano'
}

export enum RegistrationSource {
  NORMAL = 'normal',
  INVITATION_CODE = 'invitation_code',
  EMAIL_BATCH = 'email_batch'
}

export interface User {
  id?: string;
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  phone?: string; // Added direct phone property
  cedula?: string;
  role: UserRole;
  departments?: {
    _id: string;
    name: string;
    code?: string;
    description?: string;
    company?: {
      _id: string;
      name: string;
    };
  }[];
  company?: {
    _id: string;
    name: string;
    ruc?: string;
    address?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
    settings?: {
      notificationDays: number[];
      requiredCourses: string[];
    };
  } | null;
  companyId?: string;
  companies?: {
    companyId: string;
    companyName: string;
    companyRuc?: string;
    role: UserRole;
    isPrimary: boolean;
    isActive: boolean;
    startDate: string;
    permissions: string[];
  }[];
  supervisedCompanies?: {
    _id: string;
    name: string;
  }[];
  isActive: boolean;
  active?: boolean; // Para compatibilidad
  status: 'active' | 'inactive';
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  verificationSummary?: {
    totalCompanies: number;
    compliantCompanies: number;
    partialCompanies: number;
    nonCompliantCompanies: number;
    details: {
      companyId: string;
      companyName: string;
      complianceStatus: 'compliant' | 'partial' | 'non_compliant';
      verificationsTotal: number;
      verificationsCompleted: number;
      verificationsPending: number;
      verificationsExpired: number;
    }[];
    globalCompliance: 'compliant' | 'partial' | 'non_compliant';
  };
  reviewSummary?: {
    receivedReviews: {
      total: number;
      averageRating: number;
      wouldHireAgainPercentage: number;
      recentReviews: any[];
    };
    givenReviews: {
      total: number;
      recentCount: number;
    };
    performance: {
      punctuality: number;
      quality: number;
      safety: number;
      communication: number;
      professionalBehavior: number;
    };
  };
  termsAcceptedAt: string;
  privacyPolicyAcceptedAt: string;
  profile?: {
    phone?: string;
    certifications?: string[];
    lastLogin?: string;
  };
  verificationData?: {
    selfie: { simulated: boolean };
    idFront: { simulated: boolean };
    idBack: { simulated: boolean };
    verified: boolean;
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  __v?: number;
}

export interface CompanyCertification {
  name: string;
  issuedBy: string;
  issueDate: Date;
  expiryDate?: Date;
  status: 'valid' | 'expired' | 'pending';
}

export interface CompanyContactPerson {
  name: string;
  position: string;
  email: string;
  phone: string;
}

export interface CompanyLegalRepresentative {
  name: string;
  cedula: string;
  position: string;
}

export interface CompanyInsuranceInfo {
  provider: string;
  policyNumber: string;
  expiryDate: Date;
  coverage: string;
}

export interface CompanySettings {
  notificationDays: number[];
  requiredCourses: {
    name: string;
    isInitial: boolean;
  }[];
}

export interface Company {
  id?: string;
  _id: string;
  name: string;
  taxId: string;
  ruc?: string; // Para compatibilidad con API que devuelve ruc
  address: string;
  phone: string;
  email: string;
  website?: string;
  industry?: string;
  employeeCount?: number;
  contactPerson?: CompanyContactPerson;
  legalRepresentative?: CompanyLegalRepresentative;
  insuranceInfo?: CompanyInsuranceInfo;
  certifications?: CompanyCertification[];
  status: 'active' | 'inactive' | 'suspended';
  isActive: boolean;
  settings?: CompanySettings;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  __v?: number;
}

export interface CompanyFormData {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  industry: string;
  employeeCount?: number;
  contactPerson: CompanyContactPerson;
  legalRepresentative: CompanyLegalRepresentative;
  insuranceInfo?: CompanyInsuranceInfo;
  certifications?: CompanyCertification[];
  status: 'active' | 'inactive' | 'suspended';
  settings?: CompanySettings;
}

export interface Contractor {
  id: string;
  userId: string;
  fullName: string;
  cedula: string;
  ordenPatronal?: string;
  polizaINS?: string;
  status: 'active' | 'inactive';
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  contractorId: string;
  name: string;
  type: 'initial' | 'additional';
  completionDate: Date;
  expirationDate?: Date;
  certificateUrl?: string;
  status: 'valid' | 'expiring' | 'expired';
}

// TalentLMS specific types
export interface TalentLMSCourse {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number; // in minutes
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  currency: string;
  status: 'active' | 'inactive';
  created_on: string;
  last_update_on: string;
  thumbnail_url?: string;
  certification_enabled: boolean;
  required_for_companies?: string[]; // Company IDs that require this course
}

export interface TalentLMSUser {
  id: string;
  login: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: 'Learner' | 'Instructor' | 'Administrator';
  created_on: string;
  last_login?: string;
  avatar?: string;
  bio?: string;
  login_key?: string;
  deactivation_date?: string;
}

export interface TalentLMSEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_date: string;
  completion_status: 'not_started' | 'in_progress' | 'completed';
  completion_percentage: number;
  completion_date?: string;
  certificate_url?: string;
  time_spent: number; // in minutes
  last_accessed?: string;
  grade?: number;
}

export interface ContractorProgress {
  contractorId: string;
  talentLmsUserId?: string;
  enrollments: TalentLMSEnrollment[];
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  overallProgress: number;
  lastSyncDate: Date;
}

export interface CourseRequirement {
  id: string;
  companyId: string;
  courseId: string;
  courseName: string;
  isRequired: boolean;
  validityPeriod?: number; // in months
  jobRoles?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TalentLMSWebhookEvent {
  event_type: 'user_signup' | 'user_login' | 'course_enrollment' | 'course_completion' | 'certificate_issued';
  user_id: string;
  course_id?: string;
  completion_percentage?: number;
  completion_date?: string;
  certificate_url?: string;
  timestamp: string;
}

export interface SyncOperation {
  id: string;
  type: 'contractor_sync' | 'bulk_sync' | 'course_sync' | 'progress_sync';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  targetIds: string[]; // Contractor IDs or Course IDs
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  errors?: string[];
  initiatedBy: string; // User ID
}

export interface WorkPermit {
  _id: string;
  permitNumber: string;
  category?: string;
  contractor: {
    _id: string;
    cedula: string;
  };
  company: {
    _id: string;
    name: string;
  };
  workDescription: string;
  location: string;
  startDate: string;
  endDate: string;
  workHours: {
    start: string;
    end: string;
  };
  identifiedRisks: string[];
  toolsToUse: string[];
  requiredPPE: string[];
  safetyControls: {
    item: string;
    checked: boolean;
    notes?: string;
    _id: string;
  }[];
  additionalControls?: string;
  contractorSignature?: {
    signed: boolean;
    signedAt: string;
  };
  status: 'borrador' | 'pendiente' | 'aprobado' | 'rechazado' | 'expirado' | 'cancelado';
  approvals: PermitApproval[];
  associatedForms?: AssociatedForm[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface PermitApproval {
  department: 'supervisor' | 'hse' | 'seguridad';
  requiredRole: string;
  approver?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: 'pendiente' | 'aprobado' | 'rechazado';
  approvedAt?: string;
  comments?: string;
  _id: string;
}

export interface AssociatedForm {
  formId: string;
  formName: string;
  formCategory: string;
  addedAt: string;
  addedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  responses?: FormResponse[];
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  completedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

export interface FormResponse {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  value: any;
  answeredAt: string;
  answeredBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  companyId?: string;
  type: 'course_expiring' | 'document_expiring' | 'permit_expiring' | 'system_alert' | 'work_reminder' | 'general';
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
  emailSent?: boolean;
  emailSentAt?: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface NotificationFilters {
  type?: string[];
  priority?: string[];
  read?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  companyId?: string;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BulkDeleteRequest {
  notificationIds: string[];
}

export interface CreateNotificationRequest {
  userId?: string;
  companyId?: string;
  type: Notification['type'];
  title: string;
  message: string;
  actionUrl?: string;
  priority?: Notification['priority'];
  metadata?: Record<string, any>;
  sendEmail?: boolean;
}

// Configuration and Settings Types

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  courseExpiring: boolean;
  documentExpiring: boolean;
  permitExpiring: boolean;
  workReminders: boolean;
  systemAlerts: boolean;
  dailyDigest: boolean;
}

export interface DashboardSettings {
  defaultView: 'overview' | 'detailed';
  refreshInterval: number; // in minutes
  showWelcomeMessage: boolean;
  compactMode: boolean;
  widgetOrder: string[];
  hideCompletedTasks: boolean;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
  updatedAt: Date;
}

export interface BrandingSettings {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  favicon?: string;
  loginBackground?: string;
  customCSS?: string;
}

export interface PolicySettings {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  sessionTimeout: number; // in minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  requireTwoFactor: boolean;
  allowRememberMe: boolean;
}

export interface FeatureSettings {
  enableContractors: boolean;
  enableWorkPermits: boolean;
  enableCourses: boolean;
  enableReports: boolean;
  enableNotifications: boolean;
  enableAuditLog: boolean;
  enableDataExport: boolean;
  maxFileUploadSize: number; // in MB
  allowedFileTypes: string[];
}

export interface CompanySettings {
  id: string;
  companyId: string;
  branding: BrandingSettings;
  policies: PolicySettings;
  features: FeatureSettings;
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    website?: string;
  };
  businessHours: {
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
  updatedAt: Date;
}

export interface IntegrationSettings {
  emailProvider: {
    enabled: boolean;
    provider: 'smtp' | 'sendgrid' | 'ses';
    config: Record<string, any>;
  };
  smsProvider: {
    enabled: boolean;
    provider: 'twilio' | 'nexmo';
    config: Record<string, any>;
  };
  storageProvider: {
    provider: 'local' | 's3' | 'azure';
    config: Record<string, any>;
  };
  backupSchedule: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number; // in days
  };
}

export interface SystemSettings {
  id: string;
  security: {
    enableAuditLog: boolean;
    logRetention: number; // in days
    enableRateLimiting: boolean;
    allowConcurrentSessions: boolean;
    requireHttps: boolean;
  };
  integrations: IntegrationSettings;
  maintenance: {
    enableMaintenanceMode: boolean;
    maintenanceMessage: string;
    scheduledMaintenance?: {
      start: Date;
      end: Date;
      message: string;
    };
  };
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Review Types
export interface Review {
  _id: string;
  contractor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewer: {
    _id: string;
    firstName: string;
    lastName: string;
    company: {
      _id: string;
      name: string;
    };
  };
  company: {
    _id: string;
    name: string;
  };
  rating: number;
  punctuality: number;
  quality: number;
  safety: number;
  communication: number;
  professionalBehavior: number;
  comment: string;
  wouldHireAgain: boolean;
  projectName?: string;
  workType?: string;
  tags?: string[];
  flagged?: {
    isFlagged: boolean;
    reason?: string;
    description?: string;
    flaggedBy?: string;
    flaggedAt?: string;
  };
  response?: {
    text: string;
    date: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewInput {
  contractorId: string;
  rating: number;
  punctuality: number;
  quality: number;
  safety: number;
  communication: number;
  professionalBehavior: number;
  comment: string;
  wouldHireAgain: boolean;
  projectName?: string;
  workType?: string;
  tags?: string[];
}

export interface UpdateReviewInput {
  rating?: number;
  punctuality?: number;
  quality?: number;
  safety?: number;
  communication?: number;
  professionalBehavior?: number;
  comment?: string;
  wouldHireAgain?: boolean;
  projectName?: string;
  workType?: string;
  tags?: string[];
}

export interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  wouldHireAgainPercentage: number;
  metrics: {
    punctuality: number;
    quality: number;
    safety: number;
    communication: number;
    professionalBehavior: number;
  };
  ratingDistribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

export interface ReviewFilters {
  rating?: number;
  wouldHireAgain?: boolean;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface FlagReviewInput {
  reason: string;
  description?: string;
}