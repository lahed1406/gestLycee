
export interface SchoolData {
  name: string;
  code: string;
  director: string;
  address: string;
  email: string;
  phoneNumber: string; 
  academicYear: string;
  region: string;
  city: string;
  municipality: string;
  logo?: string; 
  hourLabels?: string[];
  incomingStartNumber?: number;
  outgoingStartNumber?: number;
}

export enum StaffRole {
  TEACHER = 'أستاذ(ة)',
  ADMIN = 'إداري',
  GENERAL_SUPERVISOR = 'حارس عام',
  DIRECTOR = 'مدير',
  MESSENGER = 'عون مصلحة'
}

export interface StaffMember {
  id: string;
  fullName: string;
  fullNameFr: string;
  cin: string;
  ppr: string;
  cadre: string;
  grade: string;
  role: string;
  specialization: string;
  familyStatus: string;
  gender: string; 
  phoneNumber: string;
  email: string;
  address: string;
  surplusStatus?: string; 
  originalSchool?: string; 
  mobility?: string; 
  
  // حقول المغادر
  destinationSchool?: string;
  destinationAcademy?: string;
  destinationDirectorate?: string;
  destinationService?: string;
  destinationReference?: string; // المرجع للمغادر
  
  // حقول الوافد
  startingSchool?: string;
  startingAcademy?: string;
  startingDirectorate?: string;
  startingService?: string; // المصلحة للوافد
  startingReference?: string; // المرجع للوافد
  
  // تتبع الملفات الإدارية
  adminFileStatus?: 'pending' | 'received' | 'sent';
  adminFileDate?: string;
  adminFileNotes?: string;
  birthDate?: string;
  birthPlace?: string;
  assignmentDate?: string;
  currentAssignmentDate?: string;
  scale?: string;
  lastInspectionDate?: string;
  lastInspectionGrade?: string;
  lastAdminGrade?: string;
  lastAdminGradeDate?: string;
  childrenCount?: number;
  spouseIsOfficial?: boolean;
  spouseRegistryNumber?: string;
  recruitmentDate?: string;
  titularizationDate?: string;
  adminSeniority?: string;
  gradeSeniority?: string;
  rank?: string;
  rankDate?: string;
  rankSeniority?: string;
  academicCertificate?: string;
  academicCertificateDate?: string;
  professionalCertificate?: string;
  professionalCertificateDate?: string;
  gradeDate?: string;
  familySituationDate?: string;
  cadreDate?: string;
  certificates?: {
    degree: string;
    specialization: string;
    institution: string;
    year: string;
  }[];
  serviceHistory?: {
    mission: string;
    institution: string;
    from: string;
    to: string;
  }[];
}

export interface CorrespondenceItem {
  subject: string;
  attachmentsCount: number;
  notes: string;
}

export interface Correspondence {
  id: string;
  type: 'incoming' | 'outgoing';
  number: string;
  date: string;
  subject: string; // Keep for backward compatibility/single subject display
  sourceOrDestination: string;
  department?: string;
  service?: string;
  office?: string;
  attachmentsCount: number; // Keep for backward compatibility
  notes: string; // Keep for backward compatibility
  items?: CorrespondenceItem[]; // Optional for now to avoid breaking existing data
  hierarchyType?: 'regional' | 'academy';
}

export interface TimetableActivity {
  id: string;
  day: string;
  hour: string;
  studentSet: string;
  subject: string;
  teacher: string;
  tag: string;
  room: string;
  comments?: string;
}

export interface StaffAbsence {
  id: string;
  staffId: string;
  staffName: string;
  type: 'absence' | 'early_departure' | 'delay';
  reason: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  totalDays?: number;
  totalHours?: number;
  scheduledEndTime?: string; // For early departure
  actualDepartureTime?: string; // For early departure
  differenceMinutes?: number; // For early departure or delay
  doctorName?: string;
  submitterName?: string;
  submitterCin?: string;
  receiptDate?: string;
  addressDuringAbsence?: string;
  createdAt: string;
}

export interface AdministrativeInquiry {
  id: string;
  staffId: string;
  staffName: string;
  reference: string;
  city: string;
  date: string;
  intro: string;
  outro: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface EducationalSupport {
  id: string;
  staffId: string;
  staffName: string;
  subject: string;
  studentGroup: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  notes?: string;
  createdAt: string;
}

export interface StructureMember {
  id: string;
  fullName: string;
  roleInStructure: string;
  isExternal: boolean;
  isStudent?: boolean;
  staffId?: string; // If internal staff
  ppr?: string;
  cin?: string;
  task?: string; // المهمة
  studentClass?: string;
  massarNumber?: string;
  gender?: string;
  assignedClasses?: string;
}

export interface SchoolStructure {
  id: string;
  name: string;
  members: StructureMember[];
}

export interface InternalMemo {
  id: string;
  number: string;
  date: string;
  recipientStructureId: string;
  reference: string;
  subject: string;
  bodyText: string;
  agenda: string;
  meetingNumber: string;
  meetingDate: string;
  meetingTime: string;
  meetingReferences: string;
  showAgendaInPrint: boolean;
  createdAt: string;
}

export interface LegislativeReference {
  id: string;
  title: string;
  category: string;
  date: string;
  description: string;
  fileName: string;
  fileType: string;
  fileData: string; // Base64 encoded file data
  createdAt: string;
}

export interface Student {
  id: string;
  massarCode: string;
  lastName: string;
  firstName: string;
  gender: string;
  birthDate: string;
  birthPlace: string;
  level: string;
  section: string;
  academicYear: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianAddress?: string;
  guardianCin?: string;
  fatherName?: string;
  fatherCin?: string;
  fatherPhone?: string;
  fatherAddress?: string;
  motherName?: string;
  motherCin?: string;
  motherPhone?: string;
  motherAddress?: string;
}

export interface DataArchive {
  academicYear: string;
  staffList: StaffMember[];
  students: Student[];
  correspondenceList: Correspondence[];
  timetableActivities: TimetableActivity[];
  attendanceList: StaffAbsence[];
  administrativeInquiries: AdministrativeInquiry[];
  educationalSupportList: EducationalSupport[];
  schoolStructures: SchoolStructure[];
  internalMemos: InternalMemo[];
  legislativeReferences: LegislativeReference[];
  schoolData: SchoolData;
  archivedAt: string;
}

export type ViewState = 'dashboard' | 'schoolSettings' | 'staffManagement' | 'correspondence' | 'timetable' | 'attendance' | 'administrativeInquiry' | 'educationalSupport' | 'schoolStructures' | 'internalMemos' | 'legislativeArchive' | 'whatsAppMessaging' | 'studentManagement' | 'requestsAndPrints' | 'archives';
