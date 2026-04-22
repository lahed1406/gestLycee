import React, { useState, useMemo } from 'react';
import { StaffMember, TimetableActivity, StaffAbsence, SchoolData } from '../types';
import { KINGDOM_LOGO_URL } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { 
  Clock, 
  Calendar, 
  User, 
  Plus, 
  History, 
  Trash2, 
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  Printer,
  ChevronDown,
  Filter,
  BarChart3,
  Edit2,
  FileText
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StaffAttendanceManagementProps {
  absences: StaffAbsence[];
  onUpdate: (absences: StaffAbsence[]) => void;
  staff: StaffMember[];
  timetable: TimetableActivity[];
  schoolData: SchoolData;
}

type AttendanceType = 'absence' | 'early_departure' | 'delay';

interface StaffReportGroup {
  staff: Record<string, {
    name: string;
    absences: StaffAbsence[];
    totalHours: number;
  }>;
}

interface StaffStats {
  subject: string;
  totalAbsences: number;
  totalDelays: number;
  totalEarlyDepartures: number;
  totalHours: number;
  scheduledHours: number;
  staffCount: Set<string>;
  wastePercentage: number;
}

const toTifinagh = (text: string): string => {
  if (!text) return '';
  const dictionary: { [key: string]: string } = {
    'الرباط': 'ⵕⴱⴰⵟ',
    'سلا': 'ⵙⵍⴰ',
    'القنيطرة': 'ⵇⵏⵉⵟⵔⴰ',
    'الدار البيضاء': 'ⵜⴰⴷⴷⴰⵔⵜ ⵜⵓⵎⵍⵉⵍⵜ',
    'سطات': 'ⵙⵟⵟⴰⵜ',
    'مراكش': 'ⵎⵕⵕⴰⴽⵛ',
    'آسفي': 'ⴰⵙⴼⵉ',
    'فاس': 'ⴼⴰⵙ',
    'مكناس': 'ⵎⴽⵏⴰⵙ',
    'طنجة': 'ⵟⴰⵏⵊⴰ',
    'تطوان': 'ⵜⵉⵟⵟⴰⵡⵉⵏ',
    'الحسيمة': 'ⵍⵃⵓⵙⵉⵎⴰ',
    'وجدة': 'ⵡⵓⵊⴷⴰ',
    'بني ملال': 'ⴰⵢⵜ ⵎⵍⵍⴰⵍ',
    'خنيفرة': 'ⵅⵏⵉⴼⵔⴰ',
    'درعة': 'ⴷⵔⵄⴰ',
    'تافيلالت': 'ⵜⴰⴼⵉⵍⴰⵍⵜ',
    'سوس': 'ⵙⵓⵙ',
    'ماسة': 'ⵎⴰⵙⵙⴰ',
    'كلميم': 'ⴳⵍⵎⵉⵎ',
    'واد نون': 'ⵡⴰⴷ ⵏⵓⵏ',
    'العيون': 'ⵍⵄⵢⵓⵏ',
    'الساقية الحمراء': 'ⵜⴰⵔⴳⴰ ⵜⴰⵣⴳⴳⵯⴰⵖⵜ',
    'الداخلة': 'ⴷⴷⴰⵅⵍⴰ',
    'وادي الذهب': 'ⵡⴰⴷ ⴷⴷⴰⵀⴰⴱ',
    'أكادير': 'ⴰⴳⴰⴷⵉⵔ',
    'إداوتنان': 'ⵉⴷⴰⵡⵜⴰⵏⴰⵏ',
    'إنزكان': 'ⵉⵏⵣⴳⴳⴰⵏ',
    'أيت ملول': 'ⴰⵢⵜ ⵎⵍⵍⵓⵍ',
    'تارودانت': 'ⵜⴰⵔⵓⴷⴰⵏⵜ',
    'تيزنيت': 'ⵜⵉⵣⵏⵉⵜ',
    'اشتوكة': 'ⵛⵜⵓⴽⴰ',
    'أيت باها': 'ⴰⵢⵜ ⴱⴰⵀⴰ',
    'طاطا': 'ⵟⴰⵟⴰ',
    'سيدي إفني': 'ⵙⵉⴷⵉ ⵉⴼⵏⵉ',
    'الرباط سلا القنيطرة': 'ⵕⴱⴰⵟ ⵙⵍⴰ ⵇⵏⵉⵟⵔⴰ',
    'الدار البيضاء سطات': 'ⵜⴰⴷⴷⴰⵔⵜ ⵜⵓⵎⵍⵉⵍⵜ ⵙⵟⵟⴰⵜ',
    'مراكش آسفي': 'ⵎⵕⵕⴰⴽⵛ ⴰⵙⴼⵉ',
    'فاس مكناس': 'ⴼⴰⵙ ⵎⴽⵏⴰⵙ',
    'طنجة تطوان الحسيمة': 'ⵟⴰⵏⵊⴰ ⵜⵉⵟⵟⴰⵡⵉⵏ ⵍⵃⵓⵙⵉⵎⴰ',
    'الشرق': 'ⵍⵇⴱⵍⵜ',
    'بني ملال خنيفرة': 'ⴰⵢⵜ ⵎⵍⵍⴰⵍ ⵅⵏⵉⴼⵔⴰ',
    'درعة تافيلالت': 'ⴷⵔⵄⴰ ⵜⴰⴼⵉⵍⴰⵍⵜ',
    'سوس ماسة': 'ⵙⵓⵙ ⵎⴰⵙⵙⴰ',
    'كلميم واد نون': 'ⴳⵍⵎⵉⵎ ⵡⴰⴷ ⵏⵓⵏ',
    'العيون الساقية الحمراء': 'ⵍⵄⵢⵓⵏ ⵜⴰⵔⴳⴰ ⵜⴰⵣⴳⴳⵯⴰⵖⵜ',
    'الداخلة وادي الذهب': 'ⴷⴷⴰⵅⵍⴰ ⵡⴰⴷ ⴷⴷⴰⵀⴰⴱ'
  };
  const trimmedText = text.trim();
  return dictionary[trimmedText] || trimmedText;
};

export const StaffAttendanceManagement: React.FC<StaffAttendanceManagementProps> = ({
  absences,
  onUpdate,
  staff,
  timetable,
  schoolData
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'log' | 'report'>('form');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('absence');
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportType, setReportType] = useState<'detailed' | 'stats' | 'individual_card'>('detailed');
  const [selectedStaffForCard, setSelectedStaffForCard] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAbsenceId, setEditingAbsenceId] = useState<string | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [currentResumeAbsence, setCurrentResumeAbsence] = useState<StaffAbsence | null>(null);
  const [resumeDate, setResumeDate] = useState(new Date().toISOString().split('T')[0]);
  const [resumeReason, setResumeReason] = useState('رخصة مرضية قصيرة الأمد');
  
  const [formData, setFormData] = useState({
    reason: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '10:00',
    actualDepartureTime: '10:00',
    doctorName: '',
    submitterName: '',
    submitterCin: '',
    receiptDate: new Date().toISOString().split('T')[0],
    addressDuringAbsence: '',
  });

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<StaffAbsence | null>(null);

  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [currentInquiryAbsence, setCurrentInquiryAbsence] = useState<StaffAbsence | null>(null);
  const [inquiryReference, setInquiryReference] = useState('المرسوم رقم 2.99.1216 الصادر في 6 صفر 1421 (10/05/2000).');
  const [inquiryCity, setInquiryCity] = useState(schoolData.municipality || schoolData.city || '');
  const [inquiryIntro, setInquiryIntro] = useState('');
  const [inquiryOutro, setInquiryOutro] = useState('');

  const inquiryDate = useMemo(() => {
    if (!currentInquiryAbsence) return new Date().toISOString().split('T')[0];
    const endStr = currentInquiryAbsence.endDate || currentInquiryAbsence.startDate;
    const [y, m, d] = endStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    const nextD = String(date.getDate()).padStart(2, '0');
    return `${nextY}-${nextM}-${nextD}`;
  }, [currentInquiryAbsence]);

  const selectedStaff = useMemo(() => 
    staff.find(s => s.id === selectedStaffId), 
    [staff, selectedStaffId]
  );

  // Update default values when staff is selected
  React.useEffect(() => {
    if (selectedStaff) {
      setFormData(prev => ({
        ...prev,
        submitterName: selectedStaff.fullName,
        submitterCin: selectedStaff.cin || '',
        addressDuringAbsence: selectedStaff.address || '',
      }));
    }
  }, [selectedStaff]);

  const [manualMapping, setManualMapping] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('gestlycee_timetable_mappings');
    return saved ? JSON.parse(saved) : {};
  });

  const normalizeName = (name: string) => {
    if (!name) return '';
    // Remove accents, common prefixes, and special chars
    return name.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/^(m\.|mme\.|mr\.|m\s+|mme\s+|mr\s+)/i, '')
      .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const smartMatch = (staffName: string, timetableName: string) => {
    const n1 = normalizeName(staffName);
    const n2 = normalizeName(timetableName);
    if (!n1 || !n2) return false;
    if (n1 === n2) return true;

    const tokens1 = n1.split(' ').filter(t => t.length > 1);
    const tokens2 = n2.split(' ').filter(t => t.length > 1);
    
    if (tokens1.length === 0 || tokens2.length === 0) return false;

    // Check if all tokens of the shorter name are contained in the longer name
    const [shorter, longer] = tokens1.length <= tokens2.length ? [tokens1, tokens2] : [tokens2, tokens1];
    return shorter.every(s => longer.some(l => l.includes(s) || s.includes(l)));
  };

  const staffTimetable = useMemo(() => {
    if (!selectedStaff) return [];
    
    // Check manual mapping first
    const mappedName = manualMapping[selectedStaff.id];
    if (mappedName) {
      return timetable.filter(t => t.teacher === mappedName);
    }

    const sName = selectedStaff.fullName;
    const sNameFr = selectedStaff.fullNameFr;
    
    return timetable.filter(t => {
      const tName = t.teacher;
      return smartMatch(sName, tName) || smartMatch(sNameFr, tName);
    });
  }, [timetable, selectedStaff, manualMapping]);

  const filteredAbsences = useMemo(() => {
    if (!searchQuery.trim()) return absences;
    const query = searchQuery.toLowerCase();
    return absences.filter(a => 
      a.staffName.toLowerCase().includes(query) || 
      (a.reason && a.reason.toLowerCase().includes(query)) ||
      (a.doctorName && a.doctorName.toLowerCase().includes(query))
    );
  }, [absences, searchQuery]);

  const unlinkedTimetableTeachers = useMemo(() => {
    const allTimetableTeachers = Array.from(new Set(timetable.map(t => t.teacher)));
    const linkedNames = new Set(Object.values(manualMapping) as string[]);
    
    // Also consider names that are already "smart matched" as linked
    const smartLinked = new Set<string>();
    staff.forEach((s: StaffMember) => {
      allTimetableTeachers.forEach((tName: string) => {
        if (smartMatch(s.fullName, tName) || smartMatch(s.fullNameFr, tName)) {
          smartLinked.add(tName);
        }
      });
    });

    return allTimetableTeachers.filter((t: string) => !linkedNames.has(t) && !smartLinked.has(t)).sort();
  }, [timetable, staff, manualMapping]);

  const handleManualLink = (timetableName: string) => {
    if (!selectedStaffId) return;
    const newMapping = { ...manualMapping, [selectedStaffId]: timetableName };
    setManualMapping(newMapping);
    localStorage.setItem('gestlycee_timetable_mappings', JSON.stringify(newMapping));
  };

  const DAYS_MAP_AR: Record<string, string> = {
    'lundi': 'الإثنين',
    'Mardi': 'الثلاثاء',
    'Mercredi': 'الأربعاء',
    'Jeudi': 'الخميس',
    'Vendredi': 'الجمعة',
    'Samedi': 'السبت',
  };

  const reverseDaysMapping: { [key: number]: string } = {
    1: 'lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi',
    0: 'الأحد' // Sunday usually not in timetable
  };

  const calculateAbsenceMetrics = () => {
    if (!selectedStaff || !formData.startDate || !formData.endDate) return { days: 0, hours: 0 };
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    let days = 0;
    let hours = 0;

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      const dayKeyBase = reverseDaysMapping[dayOfWeek];
      
      // Count working days
      // In TimetableActivity, day is stored as 'lundi_m', 'lundi_s', etc.
      const dayActivities = staffTimetable.filter(t => 
        t.day.toLowerCase().startsWith(dayKeyBase.toLowerCase())
      );
      
      if (dayActivities.length > 0) {
        days++;
        hours += dayActivities.length;
      }
      
      current.setDate(current.getDate() + 1);
    }

    return { days, hours };
  };

  const calculateEarlyDepartureMetrics = () => {
    if (!selectedStaff || !formData.startDate || !formData.actualDepartureTime) return { scheduledEnd: '', diff: 0 };
    
    const date = new Date(formData.startDate);
    const dayKeyBase = reverseDaysMapping[date.getDay()];
    const dayActivities = staffTimetable.filter(t => 
      t.day.toLowerCase().startsWith(dayKeyBase.toLowerCase())
    );
    
    if (dayActivities.length === 0) return { scheduledEnd: 'لا توجد حصص', diff: 0 };

    // Find the latest activity for that day
    // hour format is H1, H2, H3, H4
    // We need to map H1-H4 to actual hours using schoolData.hourLabels
    const sortedActivities = [...dayActivities].sort((a, b) => {
      const isAM_A = a.day.toLowerCase().endsWith('_m');
      const isAM_B = b.day.toLowerCase().endsWith('_m');
      
      if (isAM_A && !isAM_B) return -1;
      if (!isAM_A && isAM_B) return 1;
      
      const hA = parseInt(a.hour.replace('H', ''));
      const hB = parseInt(b.hour.replace('H', ''));
      return hA - hB;
    });

    const latestActivity = sortedActivities[sortedActivities.length - 1];
    const hourIndex = (latestActivity.day.toLowerCase().endsWith('_m') ? 0 : 4) + (parseInt(latestActivity.hour.replace('H', '')) - 1);
    const hourLabel = schoolData.hourLabels?.[hourIndex] || '';
    
    // hourLabel format: '10h - 09h' (End - Start)
    const scheduledEndHour = parseInt(hourLabel.split('h')[0]);
    const scheduledEndTimeStr = `${scheduledEndHour.toString().padStart(2, '0')}:00`;
    
    const [actualH, actualM] = formData.actualDepartureTime.split(':').map(Number);
    const actualMinutes = actualH * 60 + actualM;
    const scheduledMinutes = scheduledEndHour * 60;
    
    const diff = scheduledMinutes - actualMinutes;

    return { scheduledEnd: scheduledEndTimeStr, diff: Math.max(0, diff) };
  };

  const calculateDelayMetrics = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    return Math.max(0, endMinutes - startMinutes);
  };

  const handlePrint = () => {
    window.print();
  };

  const reportData = useMemo(() => {
    const filtered = absences.filter(a => a.startDate.startsWith(reportMonth));
    
    // Group by specialization for detailed report
    const grouped: Record<string, StaffReportGroup> = {};
    
    // Stats by specialization
    const stats: Record<string, StaffStats & { scheduledHours: number }> = {};
    
    // Calculate scheduled hours for each specialization for THIS specific month
    const scheduledHoursPerSpec: Record<string, number> = {};
    
    // Initialize stats and scheduledHoursPerSpec for all specializations found in staff list
    const allStaffSpecializations = Array.from(new Set(staff.map(s => s.specialization || 'غير محدد'))) as string[];
    
    allStaffSpecializations.forEach(spec => {
      scheduledHoursPerSpec[spec] = 0;
      stats[spec] = {
        subject: spec,
        totalAbsences: 0,
        totalDelays: 0,
        totalEarlyDepartures: 0,
        totalHours: 0,
        scheduledHours: 0,
        staffCount: new Set(),
        wastePercentage: 0
      };
    });

    // Calculate exact number of each day of the week in the selected month
    const [year, month] = reportMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayCounts: Record<string, number> = {
      'lundi': 0, 'mardi': 0, 'mercredi': 0, 'jeudi': 0, 'vendredi': 0, 'samedi': 0
    };
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dayName = reverseDaysMapping[date.getDay()];
      if (dayName && dayCounts[dayName.toLowerCase()] !== undefined) {
        dayCounts[dayName.toLowerCase()]++;
      }
    }

    // Map timetable hours to staff specializations
    // We iterate over the timetable and for each entry, we find the specialization of the teacher(s)
    const teacherSpecsCache: Record<string, string> = {};

    timetable.forEach(activity => {
      if (!activity.teacher) return;
      const teacherNames = activity.teacher.split(/[+&,]/).map(n => n.trim());
      
      const dayBase = activity.day.split('_')[0].toLowerCase();
      const multiplier = dayCounts[dayBase] || 0;

      teacherNames.forEach(tName => {
        if (!teacherSpecsCache[tName]) {
          const matchingStaff = staff.find(s => smartMatch(s.fullName, tName) || smartMatch(s.fullNameFr, tName));
          teacherSpecsCache[tName] = matchingStaff?.specialization || 'غير محدد';
        }
        
        const spec = teacherSpecsCache[tName];
        if (scheduledHoursPerSpec[spec] !== undefined) {
          scheduledHoursPerSpec[spec] += multiplier;
        }
      });
    });

    filtered.forEach(abs => {
      const s = staff.find(st => st.id === abs.staffId);
      const spec = s?.specialization || 'غير محدد';
      
      // Calculate hours for this entry
      let entryHours = 0;
      if (abs.type === 'absence') {
        entryHours = abs.totalHours || 0;
      } else {
        entryHours = (abs.differenceMinutes || 0) / 60;
      }

      // Detailed grouping
      if (!grouped[spec]) grouped[spec] = { staff: {} };
      if (!grouped[spec].staff[abs.staffId]) {
        grouped[spec].staff[abs.staffId] = {
          name: abs.staffName,
          absences: [],
          totalHours: 0
        };
      }
      grouped[spec].staff[abs.staffId].absences.push(abs);
      grouped[spec].staff[abs.staffId].totalHours += entryHours;

      // Stats grouping
      if (!stats[spec]) {
        stats[spec] = {
          subject: spec,
          totalAbsences: 0,
          totalDelays: 0,
          totalEarlyDepartures: 0,
          totalHours: 0,
          scheduledHours: 0,
          staffCount: new Set(),
          wastePercentage: 0
        };
      }

      stats[spec].staffCount.add(abs.staffId);
      if (abs.type === 'absence') stats[spec].totalAbsences += 1;
      else if (abs.type === 'delay') stats[spec].totalDelays += 1;
      else if (abs.type === 'early_departure') stats[spec].totalEarlyDepartures += 1;
      
      stats[spec].totalHours += entryHours;
    });
    
    // Round total hours and calculate percentages
    Object.values(grouped).forEach(specGroup => {
      Object.values(specGroup.staff).forEach(staffData => {
        staffData.totalHours = Math.round(staffData.totalHours * 100) / 100;
      });
    });
    
    Object.values(stats).forEach(s => {
      s.totalHours = Math.round(s.totalHours * 100) / 100;
      s.scheduledHours = scheduledHoursPerSpec[s.subject] || 0;
      
      if (s.scheduledHours > 0) {
        s.wastePercentage = Math.round((s.totalHours / s.scheduledHours) * 100 * 100) / 100;
      } else if (s.totalHours > 0) {
        s.wastePercentage = 100;
      }
    });
    
    return { grouped, stats, scheduledHoursPerSpec };
  }, [absences, reportMonth, staff, timetable]);

  const groupedStaff = useMemo<Record<string, StaffMember[]>>(() => {
    const groups: Record<string, StaffMember[]> = {};
    staff.forEach(s => {
      const spec = s.specialization || 'غير محدد';
      if (!groups[spec]) groups[spec] = [];
      groups[spec].push(s);
    });
    // Sort specializations alphabetically
    const sortedGroups: Record<string, StaffMember[]> = {};
    Object.keys(groups).sort().forEach(key => {
      sortedGroups[key] = groups[key].sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar'));
    });
    return sortedGroups;
  }, [staff]);

  const renderStaffOptions = () => {
    return Object.entries(groupedStaff).map(([spec, members]) => (
      <optgroup key={spec} label={spec}>
        {(members as StaffMember[]).map(s => (
          <option key={s.id} value={s.id}>{s.fullName}</option>
        ))}
      </optgroup>
    ));
  };

  const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const getDatesBetween = (start: string, end: string) => {
    const dates = [];
    let curr = new Date(start);
    const last = new Date(end);
    while (curr <= last) {
      dates.push(curr.toLocaleDateString('fr-FR'));
      curr.setDate(curr.getDate() + 1);
    }
    return dates.join('; ');
  };

  const handleSave = () => {
    if (!selectedStaffId) {
      alert('المرجو اختيار الموظف أولاً');
      return;
    }

    let targetAbsence: StaffAbsence;
    
    if (editingAbsenceId) {
      const existing = absences.find(a => a.id === editingAbsenceId);
      if (!existing) return;
      targetAbsence = {
        ...existing,
        staffId: selectedStaffId,
        staffName: selectedStaff?.fullName || '',
        type: attendanceType,
        reason: formData.reason,
        startDate: formData.startDate,
      };
    } else {
      targetAbsence = {
        id: Math.random().toString(36).substr(2, 9),
        staffId: selectedStaffId,
        staffName: selectedStaff?.fullName || '',
        type: attendanceType,
        reason: formData.reason,
        startDate: formData.startDate,
        createdAt: new Date().toISOString(),
      };
    }

    if (attendanceType === 'absence') {
      const metrics = calculateAbsenceMetrics();
      targetAbsence = {
        ...targetAbsence,
        endDate: formData.endDate,
        totalDays: metrics.days,
        totalHours: metrics.hours,
        doctorName: formData.doctorName,
        submitterName: formData.submitterName,
        submitterCin: formData.submitterCin,
        receiptDate: formData.receiptDate,
        addressDuringAbsence: formData.addressDuringAbsence,
      };
    } else if (attendanceType === 'early_departure') {
      const metrics = calculateEarlyDepartureMetrics();
      targetAbsence = {
        ...targetAbsence,
        actualDepartureTime: formData.actualDepartureTime,
        scheduledEndTime: metrics.scheduledEnd,
        differenceMinutes: metrics.diff
      };
    } else if (attendanceType === 'delay') {
      const diff = calculateDelayMetrics();
      targetAbsence = {
        ...targetAbsence,
        startTime: formData.startTime,
        endTime: formData.endTime,
        differenceMinutes: diff
      };
    }

    if (editingAbsenceId) {
      onUpdate(absences.map(a => a.id === editingAbsenceId ? targetAbsence : a));
    } else {
      onUpdate([targetAbsence, ...absences]);
    }
    
    // If it's a medical absence, offer to print receipt
    if (attendanceType === 'absence' && (formData.reason.includes('طبية') || formData.doctorName)) {
      setCurrentReceipt(targetAbsence);
      setShowReceiptModal(true);
    }

    setEditingAbsenceId(null);
    setSelectedStaffId('');
    setFormData({
      reason: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '10:00',
      actualDepartureTime: '10:00',
      doctorName: '',
      submitterName: '',
      submitterCin: '',
      receiptDate: new Date().toISOString().split('T')[0],
      addressDuringAbsence: '',
    });
    if (!(attendanceType === 'absence' && (formData.reason.includes('طبية') || formData.doctorName))) {
      setActiveTab('log');
    }
  };

  const handleEdit = (absence: StaffAbsence) => {
    setEditingAbsenceId(absence.id);
    setSelectedStaffId(absence.staffId);
    setAttendanceType(absence.type);
    setFormData({
      reason: absence.reason || '',
      startDate: absence.startDate,
      endDate: absence.endDate || absence.startDate,
      startTime: absence.startTime || '08:00',
      endTime: absence.endTime || '10:00',
      actualDepartureTime: absence.actualDepartureTime || '10:00',
      doctorName: absence.doctorName || '',
      submitterName: absence.submitterName || '',
      submitterCin: absence.submitterCin || '',
      receiptDate: absence.receiptDate || absence.startDate,
      addressDuringAbsence: absence.addressDuringAbsence || '',
    });
    setActiveTab('form');
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      onUpdate(absences.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className={cn((showResumeModal || showReceiptModal || showInquiryModal) && "print:hidden")}>
        <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {editingAbsenceId ? 'تعديل سجل التغيب' : 'تدبير تغيبات الموظفين'}
          </h2>
          <p className="text-gray-500 text-sm font-medium">
            {editingAbsenceId ? `تعديل بيانات ${absences.find(a => a.id === editingAbsenceId)?.staffName}` : 'تتبع الغياب، التأخر، والمغادرة المبكرة'}
          </p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm print:hidden">
          <button
            onClick={() => {
              setActiveTab('form');
              setEditingAbsenceId(null);
              setSelectedStaffId('');
              setFormData({
                reason: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                startTime: '08:00',
                endTime: '10:00',
                actualDepartureTime: '10:00',
                doctorName: '',
                submitterName: '',
                submitterCin: '',
                receiptDate: new Date().toISOString().split('T')[0],
                addressDuringAbsence: '',
              });
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'form' ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <Plus className="w-4 h-4" />
            <span>{editingAbsenceId ? 'التعديل الحالي' : 'تسجيل جديد'}</span>
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'log' ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <History className="w-4 h-4" />
            <span>سجل التغيبات</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'report' ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <Printer className="w-4 h-4" />
            <span>التقارير الشهرية</span>
          </button>
        </div>
      </div>

      {activeTab === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900">بيانات التغيب</h3>
                    <p className="text-xs text-gray-500 font-bold">اختر الموظف ونوع الغياب</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">الموظف</label>
                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm bg-white"
                    >
                      <option value="">اختر الموظف...</option>
                      {renderStaffOptions()}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">نوع الغياب</label>
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                      <button
                        onClick={() => setAttendanceType('absence')}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                          attendanceType === 'absence' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        غياب
                      </button>
                      <button
                        onClick={() => setAttendanceType('early_departure')}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                          attendanceType === 'early_departure' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        مغادرة
                      </button>
                      <button
                        onClick={() => setAttendanceType('delay')}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                          attendanceType === 'delay' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        تأخر
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">السبب</label>
                    <input
                      type="text"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                      placeholder="سبب الغياب..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">
                      {attendanceType === 'absence' ? 'تاريخ البداية' : 'التاريخ'}
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {attendanceType === 'absence' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <div>
                        <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">تاريخ النهاية</label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 w-full flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold text-indigo-900">المدة المحتسبة:</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-indigo-600">{calculateAbsenceMetrics().days}</span>
                            <span className="text-[10px] font-bold text-indigo-400 mr-1">أيام</span>
                            <span className="mx-2 text-indigo-200">|</span>
                            <span className="text-lg font-black text-indigo-600">{calculateAbsenceMetrics().hours}</span>
                            <span className="text-[10px] font-bold text-indigo-400 mr-1">ساعات</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {attendanceType === 'early_departure' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <div>
                        <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">توقيت المغادرة</label>
                        <input
                          type="time"
                          value={formData.actualDepartureTime}
                          onChange={(e) => setFormData({ ...formData, actualDepartureTime: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 w-full flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-bold text-amber-900">الفارق الزمني:</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-amber-600">{calculateEarlyDepartureMetrics().diff}</span>
                            <span className="text-[10px] font-bold text-amber-400 mr-1">دقيقة</span>
                            <div className="text-[9px] text-amber-500 font-bold">
                              (نهاية الحصة: {calculateEarlyDepartureMetrics().scheduledEnd})
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {attendanceType === 'delay' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">من</label>
                          <input
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">إلى</label>
                          <input
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-end">
                        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 w-full flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span className="text-xs font-bold text-rose-900">مدة التأخر:</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-rose-600">{calculateDelayMetrics()}</span>
                            <span className="text-[10px] font-bold text-rose-400 mr-1">دقيقة</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {attendanceType === 'absence' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 pt-4 border-t border-gray-100"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                        <h4 className="text-sm font-black text-gray-900">تفاصيل الشهادة الطبية (اختياري)</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">اسم الطبيب</label>
                          <input
                            type="text"
                            value={formData.doctorName}
                            onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                            placeholder="د. فلان..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">تاريخ الاستلام</label>
                          <input
                            type="date"
                            value={formData.receiptDate}
                            onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">العنوان أثناء الغياب</label>
                          <input
                            type="text"
                            value={formData.addressDuringAbsence}
                            onChange={(e) => setFormData({ ...formData, addressDuringAbsence: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                            placeholder="العنوان..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">اسم المودع (إذا كان غير الموظف)</label>
                          <input
                            type="text"
                            value={formData.submitterName}
                            onChange={(e) => setFormData({ ...formData, submitterName: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                            placeholder="الاسم الكامل..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">رقم ب.ت.و للمودع</label>
                          <input
                            type="text"
                            value={formData.submitterCin}
                            onChange={(e) => setFormData({ ...formData, submitterCin: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                            placeholder="رقم البطاقة..."
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4 flex gap-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{editingAbsenceId ? 'حفظ التعديلات' : 'تأكيد التسجيل'}</span>
                  </button>
                  {editingAbsenceId && (
                    <button
                      onClick={() => {
                        setEditingAbsenceId(null);
                        setSelectedStaffId('');
                        setFormData({
                          reason: '',
                          startDate: new Date().toISOString().split('T')[0],
                          endDate: new Date().toISOString().split('T')[0],
                          startTime: '08:00',
                          endTime: '10:00',
                          actualDepartureTime: '10:00',
                          doctorName: '',
                          submitterName: '',
                          submitterCin: '',
                          receiptDate: new Date().toISOString().split('T')[0],
                          addressDuringAbsence: '',
                        });
                        setActiveTab('log');
                      }}
                      className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-xl font-black hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>إلغاء</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>ملخص جدول الحصص</span>
              </h3>
              
              {selectedStaffId ? (
                <div className="space-y-3">
                  {Object.entries(DAYS_MAP_AR).map(([dayKey, dayName]) => {
                    const dayActs = staffTimetable.filter(t => t.day.toLowerCase().startsWith(dayKey.toLowerCase()));
                    if (dayActs.length === 0) return null;
                    
                    // Sort day activities by time
                    const sortedDayActs = [...dayActs].sort((a, b) => {
                      const isAM_A = a.day.toLowerCase().endsWith('_m');
                      const isAM_B = b.day.toLowerCase().endsWith('_m');
                      if (isAM_A && !isAM_B) return -1;
                      if (!isAM_A && isAM_B) return 1;
                      return parseInt(a.hour.replace('H', '')) - parseInt(b.hour.replace('H', ''));
                    });

                    return (
                      <div key={dayKey} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-black text-indigo-600">{dayName}</span>
                          <span className="text-[10px] font-bold text-gray-400">{dayActs.length} حصص</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {sortedDayActs.map((act, idx) => {
                            const hIdx = (act.day.toLowerCase().endsWith('_m') ? 0 : 4) + (parseInt(act.hour.replace('H', '')) - 1);
                            const label = schoolData.hourLabels?.[hIdx] || act.hour;
                            return (
                              <span key={idx} className="text-[9px] bg-white px-2 py-1 rounded border border-gray-200 font-bold text-gray-600">
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {staffTimetable.length === 0 && (
                    <div className="text-center py-8 space-y-4">
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <Info className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                        <p className="text-xs text-amber-700 font-bold">لم يتم العثور على جدول حصص تلقائياً</p>
                        <p className="text-[10px] text-amber-500 mt-1">قد يكون الاسم في الجدول مختلفاً عن الاسم في النظام</p>
                      </div>
                      
                      {unlinkedTimetableTeachers.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase">ربط يدوي مع أسماء من الجدول:</p>
                          <div className="max-h-40 overflow-y-auto space-y-1 p-1">
                            {unlinkedTimetableTeachers.map(tName => (
                              <button
                                key={tName}
                                onClick={() => handleManualLink(tName)}
                                className="w-full text-right px-3 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-all"
                              >
                                {tName}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-bold">اختر موظفاً لعرض جدول حصصه</p>
                </div>
              )}
            </div>

            <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-900/20">
              <h3 className="font-black mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-300" />
                <span>إحصائيات سريعة</span>
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-indigo-300 font-bold">إجمالي التغيبات (هذا الشهر)</span>
                  <span className="text-xl font-black">
                    {absences.filter(a => a.type === 'absence' && a.startDate.startsWith(new Date().toISOString().slice(0, 7))).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-indigo-300 font-bold">إجمالي التأخرات</span>
                  <span className="text-xl font-black">
                    {absences.filter(a => a.type === 'delay').length}
                  </span>
                </div>
                <div className="h-px bg-white/10 my-2"></div>
                <p className="text-[10px] text-indigo-400 font-medium leading-relaxed">
                  يتم احتساب عدد الساعات بناءً على جدول الحصص المسجل في النظام. تأكد من تحديث الجداول دورياً.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'log' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="relative flex-1">
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="بحث باسم الموظف، السبب، أو الطبيب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                مسح البحث
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">الموظف</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">النوع</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">التاريخ</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">المدة / التفاصيل</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">السبب</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAbsences.map((absence) => (
                    <tr key={absence.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{absence.staffName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                          absence.type === 'absence' ? "bg-indigo-100 text-indigo-700" :
                          absence.type === 'early_departure' ? "bg-amber-100 text-amber-700" :
                          "bg-rose-100 text-rose-700"
                        )}>
                          {absence.type === 'absence' ? 'غياب' : 
                           absence.type === 'early_departure' ? 'مغادرة' : 'تأخر'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-600">
                          {absence.startDate}
                          {absence.endDate && absence.endDate !== absence.startDate && ` - ${absence.endDate}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-gray-900">
                          {absence.type === 'absence' && (
                            <span>{absence.totalDays} يوم ({absence.totalHours} ساعة)</span>
                          )}
                          {absence.type === 'early_departure' && (
                            <span>{absence.differenceMinutes} دقيقة (مغادرة: {absence.actualDepartureTime})</span>
                          )}
                          {absence.type === 'delay' && (
                            <span>{absence.differenceMinutes} دقيقة ({absence.startTime} - {absence.endTime})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500 font-medium">{absence.reason || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(absence)}
                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(absence.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {absence.type === 'absence' && (absence.doctorName || absence.reason.includes('طبية')) && (
                            <button
                              onClick={() => {
                                setCurrentReceipt(absence);
                                setShowReceiptModal(true);
                              }}
                              className="p-2 text-indigo-400 hover:text-indigo-600 transition-colors"
                              title="طباعة إيصال الاستلام"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                          {absence.type === 'absence' && (
                            <button
                              onClick={() => {
                                setCurrentResumeAbsence(absence);
                                // Default resume date is day after end date
                                if (absence.endDate) {
                                  const nextDay = new Date(absence.endDate);
                                  nextDay.setDate(nextDay.getDate() + 1);
                                  setResumeDate(nextDay.toISOString().split('T')[0]);
                                } else {
                                  const nextDay = new Date(absence.startDate);
                                  nextDay.setDate(nextDay.getDate() + 1);
                                  setResumeDate(nextDay.toISOString().split('T')[0]);
                                }
                                
                                if (absence.reason.includes('مرض')) {
                                  setResumeReason('رخصة مرضية قصيرة الأمد');
                                } else if (absence.reason.includes('ولادة')) {
                                  setResumeReason('رخصة ولادة');
                                } else {
                                  setResumeReason('تغيب أو انقطاع عن العمل');
                                }
                                
                                setShowResumeModal(true);
                              }}
                              className="p-2 text-emerald-400 hover:text-emerald-600 transition-colors"
                              title="محضر استئناف العمل"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setCurrentInquiryAbsence(absence);
                              const intro = absence.type === 'absence' ? 'تغيبت (م) عن عملك (م)' :
                                            absence.type === 'delay' ? 'تأخرت (م) عن الالتحاق بعملك (م)' :
                                            'غادرت (م) مقر عملك (م) قبل الوقت';
                              setInquiryIntro(`وبعد، فقد لوحظ أنك (م) ${intro} يوم / أيام :`);
                              setInquiryOutro('بدون اشعار أو اذن سابق، الشيء الذي يتنافى و القوانين الجاري بها العمل.\nلذا أطلب منك (م) موافاتي بالبيانات المفصلة في الموضوع مصحوبة بالوثائق المبررة وذلك في أجل لا يتعدى 03 أيام ابتداء من تاريخ توصلك (م) بهذا الكتاب .');
                              setShowInquiryModal(true);
                            }}
                            className="p-2 text-amber-500 hover:text-amber-600 transition-colors"
                            title="توليد استفسار"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAbsences.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <History className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 font-bold">
                          {searchQuery ? 'لا توجد نتائج تطابق بحثك' : 'لا توجد سجلات تغيب حالياً'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'report' ? (
        <div className="space-y-8">
          {/* Report Controls */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="month"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  className="pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setReportType('detailed')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    reportType === 'detailed' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  تقرير مفصل
                </button>
                <button
                  onClick={() => setReportType('stats')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    reportType === 'stats' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  إحصائيات حسب المواد
                </button>
                <button
                  onClick={() => setReportType('individual_card')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    reportType === 'individual_card' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  بطاقة تتبع فردية
                </button>
              </div>

              {reportType === 'individual_card' && (
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={selectedStaffForCard}
                    onChange={(e) => setSelectedStaffForCard(e.target.value)}
                    className="pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none min-w-[200px]"
                  >
                    <option value="">اختر الموظف...</option>
                    {renderStaffOptions()}
                  </select>
                </div>
              )}

              {reportType !== 'individual_card' && (
                <div className="text-xs font-bold text-gray-500">
                  إجمالي التغيبات في هذا الشهر: <span className="text-indigo-600">{(Object.values(reportData.grouped) as StaffReportGroup[]).reduce((acc, spec) => acc + Object.keys(spec.staff).length, 0)} موظف</span>
                </div>
              )}
            </div>
            <button
              onClick={handlePrint}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>طبع التقرير</span>
            </button>
          </div>

          {/* Printable Report Content */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0">
            {/* Report Header (Visible only in print) */}
            <div className="hidden print:block mb-4">
                <div className="flex justify-between items-center border-b-2 border-black pb-2">
                  <div className="text-center space-y-0.5 w-[38%] font-serif" style={{ fontFamily: "'Noto Sans Tifinagh', sans-serif" }}>
                    <p className="font-black text-[10px] uppercase tracking-wide">ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ</p>
                    <p className="font-black text-[10px]">ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ</p>
                    <div className="flex flex-col items-center text-[9px] font-bold space-y-0">
                      <p>ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ {toTifinagh(schoolData.region)}</p>
                      <p>ⵜⴰⵎⵀⵍⴰ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ {toTifinagh(schoolData.city)}</p>
                    </div>
                  </div>
                  <div className="w-[24%] flex justify-center">
                    <img 
                      src={KINGDOM_LOGO_URL} 
                      alt="Coat of Arms" 
                      className="w-[25mm] h-[25mm] object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-center space-y-0.5 w-[38%]">
                    <p className="font-black text-[10px] uppercase tracking-wide">المملكة المغربية</p>
                    <p className="font-black text-[10px]">وزارة التربية الوطنية والتعليم الأولي والرياضة</p>
                    <div className="flex flex-col items-center text-[9px] font-bold text-gray-800 space-y-0">
                      <p>الأكاديمية الجهوية للتربية والتكوين: {schoolData.region}</p>
                      <p>المديرية الإقليمية: {schoolData.city}</p>
                      <p className="text-[11px] font-black pt-0.5">المؤسسة: {schoolData.name}</p>
                    </div>
                  </div>
                </div>
                
                <div className="w-full flex justify-center mt-2">
                  <div className="text-center">
                    <div className="border-2 border-black px-6 py-1 bg-gray-50">
                      <h1 className="text-sm font-black text-black">
                        {reportType === 'detailed' ? 'تقرير تغيبات الموظفين (مفصل)' : 
                         reportType === 'stats' ? 'إحصائيات التغيبات حسب المواد' : 
                         'بطاقة تتبع تغيبات الموظف'}
                      </h1>
                      {reportType !== 'individual_card' && (
                        <p className="text-[10px] font-bold text-black">شهر: {monthNames[parseInt(reportMonth.split('-')[1]) - 1]} {reportMonth.split('-')[0]}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            {reportType === 'individual_card' ? (
              selectedStaffForCard ? (
                <div className="space-y-4 print:space-y-2 text-black">
                  {/* Staff Info Card */}
                  {(() => {
                    const s = staff.find(st => st.id === selectedStaffForCard);
                    const staffAbsences = absences.filter(a => a.staffId === selectedStaffForCard);
                    const totalDays = staffAbsences.reduce((acc, a) => acc + (a.totalDays || 0), 0);
                    
                    const absenceHours = staffAbsences.filter(a => a.type === 'absence').reduce((acc, a) => acc + (a.totalHours || 0), 0);
                    const delayHours = staffAbsences.filter(a => a.type === 'delay').reduce((acc, a) => acc + ((a.differenceMinutes || 0) / 60), 0);
                    const earlyHours = staffAbsences.filter(a => a.type === 'early_departure').reduce((acc, a) => acc + ((a.differenceMinutes || 0) / 60), 0);
                    const totalCombinedHours = absenceHours + delayHours + earlyHours;

                    const totalDelays = staffAbsences.filter(a => a.type === 'delay').length;
                    const totalEarly = staffAbsences.filter(a => a.type === 'early_departure').length;

                    // Group by reason
                    const reasons: Record<string, number> = {};
                    staffAbsences.forEach(a => {
                      const r = a.reason || 'غير محدد';
                      reasons[r] = (reasons[r] || 0) + 1;
                    });

                    // Group by month for the grid
                    const monthsGrid: Record<string, { 
                      days: number, 
                      absHours: number, 
                      delayHours: number, 
                      earlyHours: number,
                      totalHours: number,
                      count: number 
                    }> = {};
                    
                    staffAbsences.forEach(a => {
                      const month = a.startDate.slice(0, 7);
                      if (!monthsGrid[month]) monthsGrid[month] = { days: 0, absHours: 0, delayHours: 0, earlyHours: 0, totalHours: 0, count: 0 };
                      
                      if (a.type === 'absence') {
                        monthsGrid[month].days += (a.totalDays || 0);
                        monthsGrid[month].absHours += (a.totalHours || 0);
                      } else if (a.type === 'delay') {
                        monthsGrid[month].delayHours += ((a.differenceMinutes || 0) / 60);
                      } else if (a.type === 'early_departure') {
                        monthsGrid[month].earlyHours += ((a.differenceMinutes || 0) / 60);
                      }
                      
                      monthsGrid[month].totalHours = monthsGrid[month].absHours + monthsGrid[month].delayHours + monthsGrid[month].earlyHours;
                      monthsGrid[month].count += 1;
                    });

                    return (
                      <div className="space-y-3 print:space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">
                          <div className="border border-gray-200 print:border-black p-3 print:p-2 rounded-xl print:rounded-none space-y-1">
                            <h3 className="font-black text-indigo-600 print:text-black border-b border-gray-100 print:border-black pb-0.5 mb-1 text-sm print:text-[10px]">معلومات الموظف</h3>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs print:text-[9px]">
                              <p className="font-bold text-gray-500 print:text-black">الاسم الكامل:</p>
                              <p className="font-black text-black">{s?.fullName}</p>
                              <p className="font-bold text-gray-500 print:text-black">رقم التأجير / CIN:</p>
                              <p className="font-black text-black">{s?.cin || '---'}</p>
                              <p className="font-bold text-gray-500 print:text-black">الإطار:</p>
                              <p className="font-black text-black">{s?.cadre || '---'}</p>
                              <p className="font-bold text-gray-500 print:text-black">التخصص:</p>
                              <p className="font-black text-black">{s?.specialization || '---'}</p>
                              <p className="font-bold text-gray-500 print:text-black">رقم الهاتف:</p>
                              <p className="font-black text-black">{s?.phoneNumber || '---'}</p>
                              <p className="font-bold text-gray-500 print:text-black">العنوان:</p>
                              <p className="font-black text-black truncate">{s?.address || '---'}</p>
                            </div>
                          </div>
                          
                          <div className="border border-gray-200 print:border-black p-3 print:p-2 rounded-xl print:rounded-none space-y-1">
                            <h3 className="font-black text-indigo-600 print:text-black border-b border-gray-100 print:border-black pb-0.5 mb-1 text-sm print:text-[10px]">خلاصة سنوية</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs print:text-[9px]">
                              <p className="font-bold text-gray-500 print:text-black">إجمالي أيام الغياب:</p>
                              <p className="font-black text-black">{totalDays} يوم</p>
                              <p className="font-bold text-gray-500 print:text-black">ساعات الغياب:</p>
                              <p className="font-black text-black">{absenceHours.toFixed(1)} س</p>
                              <p className="font-bold text-gray-500 print:text-black">ساعات التأخر:</p>
                              <p className="font-black text-black">{delayHours.toFixed(1)} س</p>
                              <p className="font-bold text-gray-500 print:text-black">ساعات المغادرة:</p>
                              <p className="font-black text-black">{earlyHours.toFixed(1)} س</p>
                              <div className="col-span-2 border-t border-gray-100 print:border-black mt-1 pt-0.5 flex justify-between">
                                <span className="font-black text-indigo-600 print:text-black">إجمالي الساعات:</span>
                                <span className="font-black text-indigo-600 print:text-black">{totalCombinedHours.toFixed(1)} ساعة</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Timetable Summary */}
                        <div className="border border-gray-200 print:border-black p-3 print:p-2 rounded-xl print:rounded-none">
                          <h3 className="font-black text-indigo-600 print:text-black border-b border-gray-100 print:border-black pb-0.5 mb-2 text-sm print:text-[10px] flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            <span>جدول الحصص الأسبوعي</span>
                          </h3>
                          <div className="grid grid-cols-6 gap-1 print:gap-0.5">
                            {Object.entries(DAYS_MAP_AR).map(([dayKey, dayName]) => {
                              const dayActs = timetable.filter(t => {
                                if (!t.teacher) return false;
                                const teachers = t.teacher.split(/[+&,]/).map(name => name.trim());
                                return teachers.some(name => smartMatch(s?.fullName || '', name) || smartMatch(s?.fullNameFr || '', name));
                              }).filter(t => t.day.toLowerCase().startsWith(dayKey.toLowerCase()));

                              const morningActs = dayActs.filter(t => t.day.toLowerCase().endsWith('_m')).sort((a, b) => a.hour.localeCompare(b.hour));
                              const afternoonActs = dayActs.filter(t => t.day.toLowerCase().endsWith('_s')).sort((a, b) => a.hour.localeCompare(b.hour));

                              return (
                                <div key={dayKey} className="border border-gray-100 print:border-black p-1 text-center flex flex-col">
                                  <p className="text-[10px] print:text-[8px] font-black bg-gray-50 print:bg-gray-100 py-0.5 mb-1">{dayName}</p>
                                  <div className="flex-1 space-y-1">
                                    {morningActs.length > 0 && (
                                      <div className="space-y-0.5">
                                        <p className="text-[7px] print:text-[6px] font-black text-indigo-400 border-b border-indigo-50 mb-0.5">صباحا</p>
                                        {morningActs.map((act, idx) => (
                                          <div key={idx} className="text-[8px] print:text-[7px] font-bold text-gray-600 pb-0.5">
                                            {act.hour} ({act.studentSet || act.subject})
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {afternoonActs.length > 0 && (
                                      <div className="space-y-0.5">
                                        <p className="text-[7px] print:text-[6px] font-black text-amber-500 border-b border-amber-50 mb-0.5">مساء</p>
                                        {afternoonActs.map((act, idx) => (
                                          <div key={idx} className="text-[8px] print:text-[7px] font-bold text-gray-600 pb-0.5">
                                            {act.hour} ({act.studentSet || act.subject})
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {dayActs.length === 0 && <p className="text-[8px] text-gray-300 my-auto">---</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Monthly Detailed Grid */}
                        <div className="border border-gray-200 print:border-black rounded-xl print:rounded-none overflow-hidden">
                          <div className="bg-gray-50 print:bg-gray-100 px-3 py-2 border-b border-gray-200 print:border-black">
                            <h3 className="text-[11px] print:text-[9px] font-black">تتبع التغيبات اليومي حسب الأشهر</h3>
                          </div>
                          <div className="p-2 overflow-x-auto">
                            <table className="w-full text-[9px] print:text-[6px] border-collapse">
                              <thead>
                                <tr>
                                  <th className="border border-gray-200 print:border-black p-0.5 bg-gray-50 print:bg-gray-100 w-16 text-black">الشهر</th>
                                  {Array.from({ length: 31 }).map((_, i) => (
                                    <th key={i} className="border border-gray-200 print:border-black p-0.5 bg-gray-50 print:bg-gray-100 w-5 text-center text-black">{i + 1}</th>
                                  ))}
                                  <th className="border border-gray-200 print:border-black p-0.5 bg-indigo-50 print:bg-gray-100 w-8 text-center text-black">غ (س)</th>
                                  <th className="border border-gray-200 print:border-black p-0.5 bg-amber-50 print:bg-gray-100 w-8 text-center text-black">ت (س)</th>
                                  <th className="border border-gray-200 print:border-black p-0.5 bg-rose-50 print:bg-gray-100 w-8 text-center text-black">م (س)</th>
                                  <th className="border border-gray-200 print:border-black p-0.5 bg-gray-100 print:bg-gray-200 w-10 text-center text-black">المجموع</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const currentYear = new Date().getFullYear();
                                  const months = [];
                                  for (let i = 8; i < 12; i++) months.push(`${currentYear - 1}-${(i + 1).toString().padStart(2, '0')}`);
                                  for (let i = 0; i < 7; i++) months.push(`${currentYear}-${(i + 1).toString().padStart(2, '0')}`);
                                  
                                  return months.map(m => {
                                    const [year, month] = m.split('-');
                                    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
                                    const monthData = monthsGrid[m] || { absHours: 0, delayHours: 0, earlyHours: 0, totalHours: 0 };
                                    
                                    return (
                                      <tr key={m}>
                                        <td className="border border-gray-200 print:border-black p-0.5 font-bold bg-gray-50 print:bg-gray-100 text-black">
                                          {monthNames[parseInt(month) - 1]}
                                        </td>
                                        {Array.from({ length: 31 }).map((_, i) => {
                                          const day = i + 1;
                                          if (day > daysInMonth) return <td key={i} className="border border-gray-200 print:border-black bg-gray-100 print:bg-gray-200"></td>;
                                          
                                          const dateStr = `${year}-${month}-${day.toString().padStart(2, '0')}`;
                                          const dayAbsences = staffAbsences.filter(a => {
                                            const start = a.startDate;
                                            const end = a.endDate || a.startDate;
                                            return dateStr >= start && dateStr <= end;
                                          });

                                          const hasAbsence = dayAbsences.some(a => a.type === 'absence');
                                          const hasDelay = dayAbsences.some(a => a.type === 'delay');
                                          const hasEarly = dayAbsences.some(a => a.type === 'early_departure');

                                          return (
                                            <td 
                                              key={i} 
                                              className={cn(
                                                "border border-gray-200 print:border-black p-0.5 text-center h-4",
                                                hasAbsence ? "bg-rose-500 text-white print:bg-gray-800" : 
                                                hasDelay ? "bg-amber-400 text-white print:bg-gray-400" :
                                                hasEarly ? "bg-indigo-400 text-white print:bg-gray-600" : ""
                                              )}
                                            >
                                              {hasAbsence ? 'غ' : hasDelay ? 'ت' : hasEarly ? 'م' : ''}
                                            </td>
                                          );
                                        })}
                                        <td className="border border-gray-200 print:border-black p-0.5 text-center font-bold bg-indigo-50/30 text-black">{monthData.absHours > 0 ? monthData.absHours.toFixed(1) : '-'}</td>
                                        <td className="border border-gray-200 print:border-black p-0.5 text-center font-bold bg-amber-50/30 text-black">{monthData.delayHours > 0 ? monthData.delayHours.toFixed(1) : '-'}</td>
                                        <td className="border border-gray-200 print:border-black p-0.5 text-center font-bold bg-rose-50/30 text-black">{monthData.earlyHours > 0 ? monthData.earlyHours.toFixed(1) : '-'}</td>
                                        <td className="border border-gray-200 print:border-black p-0.5 text-center font-black bg-gray-50 text-black">{monthData.totalHours > 0 ? monthData.totalHours.toFixed(1) : '-'}</td>
                                      </tr>
                                    );
                                  });
                                })()}
                              </tbody>
                            </table>
                            <div className="mt-1 flex gap-4 text-[8px] print:text-[6px] font-bold text-black">
                              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 print:bg-gray-800"></div> غياب (غ)</div>
                              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-400 print:bg-gray-400"></div> تأخر (ت)</div>
                              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-400 print:bg-gray-600"></div> مغادرة (م)</div>
                            </div>
                          </div>
                        </div>

                        {/* Classification by Reason - Professional Side-by-Side Tables */}
                        <div className="border border-gray-200 print:border-black p-3 print:p-2 rounded-xl print:rounded-none">
                          <h3 className="font-black text-indigo-600 print:text-black border-b border-gray-100 print:border-black pb-0.5 mb-1 text-sm print:text-[10px]">تفاصيل التغيبات (الرخص الإدارية والطبية)</h3>
                          
                          {(() => {
                            // Filter to only show reasons starting with "رخصة"
                            const licenseAbsences = staffAbsences.filter(a => (a.reason || '').startsWith('رخصة'));
                            
                            if (licenseAbsences.length === 0) {
                              return <p className="text-xs text-gray-400 text-center py-2 text-black">لا توجد تغيبات مسجلة كـ "رخصة"</p>;
                            }

                            // Split into two lists for side-by-side tables
                            const mid = Math.ceil(licenseAbsences.length / 2);
                            const leftList = licenseAbsences.slice(0, mid);
                            const rightList = licenseAbsences.slice(mid);

                            const renderTable = (list: StaffAbsence[]) => (
                              <table className="w-full text-right border-collapse text-[9px] print:text-[6.5px]">
                                <thead>
                                  <tr className="bg-gray-50 print:bg-gray-100 border-b border-gray-200 print:border-black">
                                    <th className="p-0.5 font-black border-l border-gray-200 print:border-black text-black">نوع الرخصة</th>
                                    <th className="p-0.5 font-black border-l border-gray-200 print:border-black text-center text-black">من</th>
                                    <th className="p-0.5 font-black text-center text-black">إلى</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 print:divide-black">
                                  {list.map((a, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="p-0.5 border-l border-gray-200 print:border-black">
                                        <div className="font-bold text-indigo-900 print:text-black leading-tight">{a.reason}</div>
                                        <div className="text-[7px] print:text-[6px] opacity-60 text-black">({a.totalDays} يوم)</div>
                                      </td>
                                      <td className="p-0.5 border-l border-gray-200 print:border-black text-center font-medium text-black">{a.startDate}</td>
                                      <td className="p-0.5 text-center font-medium text-black">{a.endDate || a.startDate}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            );

                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">
                                <div className="border border-gray-100 print:border-black rounded-lg print:rounded-none overflow-hidden h-fit">
                                  {renderTable(leftList)}
                                </div>
                                <div className="border border-gray-100 print:border-black rounded-lg print:rounded-none overflow-hidden h-fit">
                                  {rightList.length > 0 ? renderTable(rightList) : (
                                    <div className="h-full min-h-[30px] bg-gray-50/30 flex items-center justify-center text-[8px] text-gray-300">---</div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Footer Signatures */}
                        <div className="hidden print:grid grid-cols-2 gap-12 mt-12">
                          <div className="text-center space-y-8">
                            <p className="text-[10px] font-black border-b border-black pb-1">توقيع الموظف المعني</p>
                            <div className="h-16"></div>
                          </div>
                          <div className="text-center space-y-8">
                            <p className="text-[10px] font-black border-b border-black pb-1">توقيع ومصادقة السيد المدير</p>
                            <div className="h-16"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <User className="w-16 h-16 text-gray-100 mx-auto" />
                  <p className="text-gray-400 font-bold">المرجو اختيار موظف لعرض بطاقة التتبع الخاصة به</p>
                </div>
              )
            ) : Object.keys(reportData.grouped).length > 0 || Object.keys(reportData.stats).length > 0 ? (
              <div className="space-y-6 print:space-y-4">
                {reportType === 'detailed' ? (
                  (Object.entries(reportData.grouped) as [string, StaffReportGroup][]).map(([spec, data]) => (
                    <div key={spec} className="space-y-2 print:space-y-1">
                      <h3 className="bg-gray-100 print:bg-white print:border-b print:border-gray-800 px-3 py-1.5 print:py-0.5 rounded-lg font-black text-indigo-900 print:text-black flex items-center gap-2 text-sm print:text-xs">
                        <Filter className="w-3.5 h-3.5 print:hidden" />
                        <span>المادة / التخصص: {spec}</span>
                      </h3>
                      <div className="overflow-hidden border border-gray-200 rounded-xl print:rounded-none print:border-black">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="bg-gray-50 print:bg-gray-100 border-b border-gray-200 print:border-black">
                              <th className="px-3 py-2 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black border-l border-gray-200 print:border-black">الموظف</th>
                              <th className="px-3 py-2 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black border-l border-gray-200 print:border-black">نوع الغياب</th>
                              <th className="px-3 py-2 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black border-l border-gray-200 print:border-black">الفترة</th>
                              <th className="px-3 py-2 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black border-l border-gray-200 print:border-black">السبب</th>
                              <th className="px-3 py-2 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black border-l border-gray-200 print:border-black">المدة</th>
                              <th className="px-3 py-2 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black">المجموع (س)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 print:divide-black">
                            {Object.values(data.staff).map((sData, idx) => (
                              <React.Fragment key={idx}>
                                {sData.absences.map((abs, aIdx) => (
                                  <tr key={aIdx} className="text-[11px] print:text-[8px] print:border-b print:border-black last:print:border-b-0">
                                    {aIdx === 0 && (
                                      <td rowSpan={sData.absences.length} className="px-3 py-2 print:py-1 font-bold border-l border-gray-200 print:border-black align-top">
                                        {sData.name}
                                      </td>
                                    )}
                                    <td className="px-3 py-2 print:py-1 border-l border-gray-200 print:border-black">
                                      {abs.type === 'absence' ? 'غياب' : abs.type === 'delay' ? 'تأخر' : 'مغادرة مبكرة'}
                                    </td>
                                    <td className="px-3 py-2 print:py-1 border-l border-gray-200 print:border-black">
                                      {abs.startDate} {abs.endDate && abs.endDate !== abs.startDate && ` إلى ${abs.endDate}`}
                                    </td>
                                    <td className="px-3 py-2 print:py-1 border-l border-gray-200 print:border-black italic text-gray-500">
                                      {abs.reason || '---'}
                                    </td>
                                    <td className="px-3 py-2 print:py-1 border-l border-gray-200 print:border-black">
                                      {abs.type === 'absence' ? `${abs.totalHours} س` : `${abs.differenceMinutes} د`}
                                    </td>
                                    {aIdx === 0 && (
                                      <td rowSpan={sData.absences.length} className="px-3 py-2 print:py-1 font-black text-indigo-600 print:text-black text-center align-middle bg-indigo-50/30 print:bg-gray-100">
                                        {sData.totalHours}
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-8 print:space-y-4">
                    <div className="overflow-hidden border border-gray-200 rounded-xl print:rounded-none print:border-black">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-gray-50 print:bg-gray-100 border-b border-gray-200 print:border-black">
                            <th className="px-4 py-2.5 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black border-l border-gray-200 print:border-black">المادة / التخصص</th>
                            <th className="px-4 py-2.5 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black border-l border-gray-200 print:border-black text-center">عدد الموظفين</th>
                            <th className="px-4 py-2.5 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black border-l border-gray-200 print:border-black text-center">عدد التغيبات</th>
                            <th className="px-4 py-2.5 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black border-l border-gray-200 print:border-black text-center">عدد التأخرات</th>
                            <th className="px-4 py-2.5 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black border-l border-gray-200 print:border-black text-center">المغادرات المبكرة</th>
                            <th className="px-4 py-2.5 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black border-l border-gray-200 print:border-black text-center bg-indigo-50 print:bg-gray-100">ساعات الغياب</th>
                            <th className="px-4 py-2.5 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black border-l border-gray-200 print:border-black text-center bg-indigo-50 print:bg-gray-100">الساعات المقررة</th>
                            <th className="px-4 py-2.5 print:py-1 text-[11px] print:text-[9px] font-black text-gray-700 print:text-black text-center bg-red-50 print:bg-gray-100">نسبة هدر الزمن</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 print:divide-black">
                          {(Object.values(reportData.stats) as any[]).map((stat, idx) => (
                            <tr key={idx} className="text-[11px] print:text-[9px] hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-2 print:py-1 border-l border-gray-200 print:border-black font-bold">{stat.subject}</td>
                              <td className="px-4 py-2 print:py-1 text-center border-l border-gray-200 print:border-black">{stat.staffCount.size}</td>
                              <td className="px-4 py-2 print:py-1 text-center border-l border-gray-200 print:border-black">{stat.totalAbsences}</td>
                              <td className="px-4 py-2 print:py-1 text-center border-l border-gray-200 print:border-black">{stat.totalDelays}</td>
                              <td className="px-4 py-2 print:py-1 text-center border-l border-gray-200 print:border-black">{stat.totalEarlyDepartures}</td>
                              <td className="px-4 py-2 print:py-1 text-center border-l border-gray-200 print:border-black font-black text-indigo-600 print:text-black bg-indigo-50/30 print:bg-gray-50">{stat.totalHours} س</td>
                              <td className="px-4 py-2 print:py-1 text-center border-l border-gray-200 print:border-black font-black text-indigo-600 print:text-black bg-indigo-50/30 print:bg-gray-50">{stat.scheduledHours} س</td>
                              <td className="px-4 py-2 print:py-1 text-center font-black text-red-600 print:text-black bg-red-50/30 print:bg-gray-50">{stat.wastePercentage}%</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 print:bg-gray-200 font-black text-xs print:text-[9px]">
                            <td className="px-4 py-3 print:py-1 border-l border-gray-200 print:border-black">المجموع العام</td>
                            <td className="px-4 py-3 print:py-1 text-center border-l border-gray-200 print:border-black">
                              {new Set((Object.values(reportData.stats) as any[]).flatMap(s => Array.from(s.staffCount))).size}
                            </td>
                            <td className="px-4 py-3 print:py-1 text-center border-l border-gray-200 print:border-black">
                              {(Object.values(reportData.stats) as any[]).reduce((acc, s) => acc + s.totalAbsences, 0)}
                            </td>
                            <td className="px-4 py-3 print:py-1 text-center border-l border-gray-200 print:border-black">
                              {(Object.values(reportData.stats) as any[]).reduce((acc, s) => acc + s.totalDelays, 0)}
                            </td>
                            <td className="px-4 py-3 print:py-1 text-center border-l border-gray-200 print:border-black">
                              {(Object.values(reportData.stats) as any[]).reduce((acc, s) => acc + s.totalEarlyDepartures, 0)}
                            </td>
                            <td className="px-4 py-3 print:py-1 text-center border-l border-gray-200 print:border-black text-indigo-700 print:text-black">
                              {Math.round((Object.values(reportData.stats) as any[]).reduce((acc, s) => acc + s.totalHours, 0) * 100) / 100} س
                            </td>
                            <td className="px-4 py-3 print:py-1 text-center border-l border-gray-200 print:border-black text-indigo-700 print:text-black">
                              {Math.round((Object.values(reportData.stats) as any[]).reduce((acc, s) => acc + s.scheduledHours, 0) * 100) / 100} س
                            </td>
                            <td className="px-4 py-3 print:py-1 text-center text-red-700 print:text-black">
                              {(() => {
                                const totalScheduled = (Object.values(reportData.stats) as any[]).reduce((acc, s) => acc + s.scheduledHours, 0);
                                const totalAbsence = (Object.values(reportData.stats) as any[]).reduce((acc, s) => acc + s.totalHours, 0);
                                return totalScheduled > 0 ? Math.round((totalAbsence / totalScheduled) * 100 * 100) / 100 : 0;
                              })()}%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-gray-50 p-6 print:p-2 rounded-2xl border border-gray-200 print:border-black print:bg-white">
                      <div className="flex items-center gap-2 mb-6 print:mb-2">
                        <BarChart3 className="w-5 h-5 text-indigo-600 print:hidden" />
                        <h4 className="font-black text-gray-900 print:text-[10px]">مبيان إجمالي ساعات الغياب حسب المواد</h4>
                      </div>
                      <div className="h-[400px] print:h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={(Object.values(reportData.stats) as StaffStats[]).filter(s => s.totalHours > 0)}
                            margin={{ top: 10, right: 10, left: 0, bottom: 50 }}
                            layout="horizontal"
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="subject" 
                              angle={-90} 
                              textAnchor="end" 
                              interval={0}
                              height={100}
                              tick={{ fontSize: 9, fontWeight: 'bold', fill: '#000' }}
                            />
                            <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#000' }} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              cursor={{ fill: '#f3f4f6' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />
                            <Bar 
                              dataKey="totalHours" 
                              name="ساعات الغياب" 
                              radius={[4, 4, 0, 0]}
                              barSize={35}
                            >
                              <LabelList 
                                dataKey="wastePercentage" 
                                position="top" 
                                formatter={(val: number) => `${val}%`}
                                style={{ fontSize: '10px', fontWeight: 'bold', fill: '#000' }}
                              />
                              {(Object.values(reportData.stats) as StaffStats[]).filter(s => s.totalHours > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'][index % 6]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <Printer className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                <p className="text-gray-400 font-bold">لا توجد تغيبات مسجلة لهذا الشهر</p>
              </div>
            )}

            {/* Print Footer */}
            <div className="hidden print:flex justify-between mt-8 px-10">
              <div className="text-center">
                <p className="font-black underline mb-8 text-[10px]">توقيع ناظر الدروس</p>
                <div className="w-24 h-px bg-black mx-auto"></div>
              </div>
              <div className="text-center">
                <p className="font-black underline mb-8 text-[10px]">توقيع رئيس المؤسسة</p>
                <div className="w-24 h-px bg-black mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      </div>

       {/* Resume Work Modal */}
      <AnimatePresence>
        {showResumeModal && currentResumeAbsence && (
          <div key="resume-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:static print:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none print:max-h-none print:max-w-none print:h-auto print:w-full print:m-0 print:overflow-visible print:static print:block print:transform-none print:opacity-100"
            >
              <div className="p-8 print:p-0 print:overflow-visible">
                <div className="flex justify-between items-center mb-8 print:hidden">
                  <h3 className="text-xl font-black text-gray-900">محضر استئناف العمل</h3>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                       <label className="text-xs font-black text-gray-500">تاريخ الاستئناف:</label>
                       <input 
                         type="date" 
                         value={resumeDate}
                         onChange={(e) => setResumeDate(e.target.value)}
                         className="bg-transparent border-none text-sm font-bold focus:ring-0"
                       />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                       <label className="text-xs font-black text-gray-500">السبب:</label>
                       <select 
                         value={resumeReason}
                         onChange={(e) => setResumeReason(e.target.value)}
                         className="bg-transparent border-none text-sm font-bold focus:ring-0"
                       >
                         <option value="رخصة مرضية قصيرة الأمد">رخصة مرضية قصيرة الأمد</option>
                         <option value="رخصة مرضية متوسطة الأمد">رخصة مرضية متوسطة الأمد</option>
                         <option value="رخصة مرضية طويلة الأمد">رخصة مرضية طويلة الأمد</option>
                         <option value="رخصة ولادة">رخصة ولادة</option>
                         <option value="رخصة استثنائية">رخصة استثنائية</option>
                         <option value="تغيب أو انقطاع عن العمل">تغيب أو انقطاع عن العمل</option>
                         <option value="بعد الاستيداع">بعد الاستيداع</option>
                         <option value="بعد الإلحاق">بعد الإلحاق</option>
                         <option value="بعد تدريب دراسي">بعد تدريب دراسي</option>
                         <option value="بعد إنهاء تكليف بمهمة">بعد إنهاء تكليف بمهمة</option>
                       </select>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة</span>
                    </button>
                    <button
                      onClick={() => setShowResumeModal(false)}
                      className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>

                {/* Print Content */}
                <div className="print-content grid grid-cols-1 print:grid-cols-2 gap-8 print:gap-4 w-full">
                  <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                      @page {
                        size: A4 landscape;
                        margin: 2mm;
                      }
                      body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                      }
                      .print-content {
                        width: 100%;
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 10mm !important;
                      }
                      .print-copy {
                        width: 100% !important;
                        min-height: auto !important;
                        border: none !important;
                        padding: 2mm !important;
                        margin: 0 !important;
                        position: relative;
                        background: white !important;
                        display: block !important;
                        box-sizing: border-box !important;
                        page-break-inside: avoid !important;
                        overflow: visible !important;
                        break-inside: avoid !important;
                      }
                      /* Hide browser headers/footers */
                      header, footer { display: none !important; }
                    }
                  `}} />
                  {[1, 2].map((copy) => (
                    <div key={copy} className="print-copy text-right dir-rtl p-4 print:p-0 border-2 border-gray-100 rounded-3xl mb-8 print:mb-0">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="mb-4 print:mb-1 w-full text-center">
                          {schoolData.logo ? (
                            <img src={schoolData.logo} alt="School Header" className="w-full h-auto max-h-[100px] print:max-h-[80px] object-contain mx-auto" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex justify-between items-center border-b-2 border-black pb-1 mb-2">
                              <div className="text-center space-y-0.5 w-[38%] font-serif" style={{ fontFamily: "'Noto Sans Tifinagh', sans-serif" }}>
                                <p className="font-black text-[9px] uppercase tracking-wide">ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ</p>
                                <p className="font-black text-[8px]">ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ</p>
                                <div className="flex flex-col items-center text-[7px] font-bold space-y-0">
                                  <p>ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ {toTifinagh(schoolData.region)}</p>
                                  <p>ⵜⴰⵎⵀⵍⴰ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ {toTifinagh(schoolData.city)}</p>
                                </div>
                              </div>
                              <div className="w-[24%] flex justify-center">
                                <img 
                                  src={KINGDOM_LOGO_URL} 
                                  alt="Coat of Arms" 
                                  className="w-[18mm] h-[18mm] object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="text-center space-y-0.5 w-[38%]">
                                <p className="font-black text-[9px] uppercase tracking-wide">المملكة المغربية</p>
                                <p className="font-black text-[8px]">وزارة التربية الوطنية والتعليم الأولي والرياضة</p>
                                <div className="flex flex-col items-center text-[7px] font-bold text-gray-800 space-y-0">
                                  <p>الأكاديمية الجهوية للتربية والتكوين: {schoolData.region}</p>
                                  <p>المديرية الإقليمية: {schoolData.city}</p>
                                  <p className="text-[9px] font-black pt-0.5">المؤسسة: {schoolData.name}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-center mb-4 print:mb-0.5">
                          <h1 className="text-2xl print:text-xl font-black border-b-4 border-double border-gray-900 inline-block pb-0.5 px-8">
                            محضر استئناف العمل
                          </h1>
                          <p className="hidden print:block text-[11px] font-bold text-gray-500 mt-0.5">
                            {copy === 1 ? '(نسخة الموظف)' : '(نسخة الإدارة)'}
                          </p>
                        </div>

                        <div className="space-y-3 print:space-y-2 text-base print:text-[13px] leading-tight">
                          <p className="font-bold">
                            أنا الموقع أسفله رئيس المؤسسة : <span className="border-b-2 border-dotted border-gray-900 px-4">{schoolData.director}</span>
                          </p>
                          <p className="font-bold text-center text-lg print:text-base">أشهد أن السيد (ة) :</p>

                          <div className="border-2 border-gray-900 p-4 print:p-4 rounded-none space-y-4 print:space-y-2">
                            <div className="grid grid-cols-2 gap-4 print:gap-4">
                              <div className="flex items-baseline gap-2">
                                <span className="font-black">الإسم الكامل :</span>
                                <span className="flex-1 border-b-2 border-dotted border-gray-900 font-bold text-center">
                                  {currentResumeAbsence.staffName}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="font-black">NomPrenom :</span>
                                <span className="flex-1 border-b-2 border-dotted border-gray-900 font-bold text-center uppercase">
                                  {staff.find(s => s.id === currentResumeAbsence.staffId)?.fullNameFr || '................'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 print:gap-4">
                              <div className="flex items-baseline gap-2">
                                <span className="font-black">الإطار :</span>
                                <span className="flex-1 border-b-2 border-dotted border-gray-900 font-bold text-center">
                                  {staff.find(s => s.id === currentResumeAbsence.staffId)?.cadre || '................'}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="font-black">الدرجة :</span>
                                <span className="flex-1 border-b-2 border-dotted border-gray-900 font-bold text-center">
                                  {staff.find(s => s.id === currentResumeAbsence.staffId)?.grade || '................'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 print:gap-4">
                              <div className="flex items-baseline gap-2">
                                <span className="font-black">رقم التأجير :</span>
                                <span className="flex-1 border-b-2 border-dotted border-gray-900 font-bold text-center">
                                  {staff.find(s => s.id === currentResumeAbsence.staffId)?.ppr || '................'}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="font-black">بطاقة التعريف الوطنية :</span>
                                <span className="flex-1 border-b-2 border-dotted border-gray-900 font-bold text-center">
                                  {staff.find(s => s.id === currentResumeAbsence.staffId)?.cin || '................'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-baseline gap-2">
                              <span className="font-black">قد استأنف (ت) عمله (ها) بتاريخ :</span>
                              <span className="w-40 border-b-2 border-dotted border-gray-900 font-bold text-center">
                                {new Date(resumeDate).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="font-black">بعد :</span>
                              <span className="flex-1 border-b-2 border-dotted border-gray-900 font-bold text-center">
                                {resumeReason}
                              </span>
                            </div>

                            <div className="flex items-baseline gap-2">
                              <span className="font-black">مدة الغياب بالأيام :</span>
                              <span className="w-20 border-b-2 border-dotted border-gray-900 font-bold text-center">
                                {currentResumeAbsence.totalDays}
                              </span>
                              <span className="font-black">أيام :</span>
                              <span className="flex-1 border-b-2 border-dotted border-gray-900 font-bold text-center text-[11px]">
                                {currentResumeAbsence.totalDays > 1 
                                  ? `من ${new Date(currentResumeAbsence.startDate).toLocaleDateString('fr-FR')} إلى ${new Date(currentResumeAbsence.endDate || currentResumeAbsence.startDate).toLocaleDateString('fr-FR')}`
                                  : new Date(currentResumeAbsence.startDate).toLocaleDateString('fr-FR')
                                }
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 print:gap-2">
                              <div className="flex items-baseline gap-2">
                                <span className="font-black">المهام الإدارية أو التربوية :</span>
                                <span className="flex-1 border-b-2 border-dotted border-gray-900 font-bold text-center">
                                  تدريس {staff.find(s => s.id === currentResumeAbsence.staffId)?.specialization || '................'}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="font-black">العنوان الشخصي :</span>
                                <span className="flex-1 border-b-2 border-dotted border-gray-900 font-bold text-center">
                                  {staff.find(s => s.id === currentResumeAbsence.staffId)?.address || '................'}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="font-black">الهاتف :</span>
                                <span className="flex-1 border-b-2 border-dotted border-gray-900 font-bold text-center">
                                  {staff.find(s => s.id === currentResumeAbsence.staffId)?.phoneNumber || '................'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 print:gap-4 mt-4 print:mt-4">
                            <div className="text-center space-y-1">
                              <p className="font-black">حرر بـ : <span className="font-bold">{schoolData.municipality}</span></p>
                              <p className="font-black">توقيع المعني (ة) بالأمر :</p>
                              <div className="h-20 border-2 border-dashed border-gray-400 rounded-xl"></div>
                            </div>
                            <div className="text-center space-y-1">
                              <p className="font-black">في : <span className="font-bold">{new Date().toLocaleDateString('fr-FR')}</span></p>
                              <p className="font-black">توقيع الرئيس المباشر :</p>
                              <div className="h-20 border-2 border-dashed border-gray-400 rounded-xl"></div>
                            </div>
                          </div>

                          <div className="mt-4 print:mt-4 pt-2 border-t-2 border-gray-900">
                            <p className="font-black mb-1">مختلف الحالات :</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] font-bold">
                              {[
                                { label: 'استئناف العمل بعد الاستيداع', val: 'بعد الاستيداع' },
                                { label: 'استئناف العمل بعد رخصة مرض قصيرة الأمد', val: 'رخصة مرضية قصيرة الأمد' },
                                { label: 'استئناف العمل بعد الإلحاق', val: 'بعد الإلحاق' },
                                { label: 'استئناف العمل بعد رخصة مرض متوسطة الأمد', val: 'رخصة مرضية متوسطة الأمد' },
                                { label: 'استئناف العمل بعد تدريب دراسي', val: 'بعد تدريب دراسي' },
                                { label: 'استئناف العمل بعد رخصة مرض طويلة الأمد', val: 'رخصة مرضية طويلة الأمد' },
                                { label: 'استئناف العمل بعد رخصة ولادة', val: 'رخصة ولادة' },
                                { label: 'استئناف العمل بعد إنهاء تكليف بمهمة', val: 'بعد إنهاء تكليف بمهمة' },
                                { label: 'استئناف العمل بعد رخصة استثنائية', val: 'رخصة استثنائية' },
                                { label: 'استئناف العمل بعد تغيب أو انقطاع عن العمل', val: 'تغيب أو انقطاع عن العمل' }
                              ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className={`w-3 h-3 border-2 border-gray-900 ${resumeReason === item.val ? 'bg-gray-900' : ''}`}></div>
                                  <span>{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && currentReceipt && (
          <div key="receipt-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:static print:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none print:max-h-none print:h-auto print:w-full print:m-0 print:overflow-visible print:static"
            >
              <div className="p-8 print:p-0">
                <div className="flex justify-between items-center mb-8 print:hidden">
                  <h3 className="text-xl font-black text-gray-900">إيصال استلام الشهادة الطبية</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowReceiptModal(false);
                        setActiveTab('log');
                      }}
                      className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>

                {/* Print Content */}
                <div className="print-content flex flex-col gap-6 print:gap-0">
                  {/* First Copy */}
                  <div className="text-right dir-rtl p-8 border-2 border-gray-100 rounded-2xl print:border-none print:p-0 print:min-h-[49vh] print:flex print:flex-col print:justify-between print:break-inside-avoid">
                    <div className="print:flex-1">
                      {/* Header - Full width logo as requested */}
                      <div className="mb-4 w-full">
                        {schoolData.logo ? (
                          <img src={schoolData.logo} alt="School Header" className="w-full h-auto max-h-[100px] object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400 font-bold">
                            يرجى رفع شعار المؤسسة (ترويسة كاملة) في الإعدادات
                          </div>
                        )}
                      </div>

                      <div className="text-center mb-4">
                        <h2 className="text-xl print:text-lg font-black border-b-2 border-double border-gray-900 inline-block pb-1 px-6">
                          إيصال باستلام الشهادة (ات) الطبية
                        </h2>
                        <p className="text-xs font-bold mt-1 text-gray-600">يسلم إلى الشخص الذي أودع الشهادة (ات) الطبية (نسخة الموظف)</p>
                      </div>

                      <div className="space-y-3 print:space-y-1.5 text-base print:text-[11px] leading-tight">
                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">أنا الموقع (ة) أسفله :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {schoolData.director} - مدير المؤسسة
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">مدير(ة) مؤسسة :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {schoolData.name}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">أشهد أني تسلمت بتاريخ (1) :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {currentReceipt.receiptDate || new Date().toISOString().split('T')[0]}
                          </span>
                          <span className="font-black whitespace-nowrap">من طرف السيد(ة) :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {currentReceipt.submitterName || currentReceipt.staffName}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">شهادة طبية مسلمة من الطبيب السيد (ة) :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {currentReceipt.doctorName || '................................'}
                          </span>
                          <span className="font-black whitespace-nowrap">مدتها :</span>
                          <span className="w-16 border-b border-dotted border-gray-400 pb-0.5 font-bold text-center">
                            {currentReceipt.totalDays}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">ابتداء من :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold text-center">
                            {currentReceipt.startDate}
                          </span>
                          <span className="font-black whitespace-nowrap">إلى :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold text-center">
                            {currentReceipt.endDate}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">تتعلق بالسيد (ة) :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {currentReceipt.staffName}
                          </span>
                          <span className="font-black whitespace-nowrap">الرقم المالي :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {staff.find(s => s.id === currentReceipt.staffId)?.ppr || '................'}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">الإطار :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {staff.find(s => s.id === currentReceipt.staffId)?.cadre || '................'}
                          </span>
                          <span className="font-black whitespace-nowrap">مادة التدريس :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {staff.find(s => s.id === currentReceipt.staffId)?.specialization || '................'}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">العنوان الشخصي أثناء فترة المرض :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {currentReceipt.addressDuringAbsence || '................................'}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">رقم هاتف المعني بالأمر :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {staff.find(s => s.id === currentReceipt.staffId)?.phoneNumber || '................'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 print:mt-2 grid grid-cols-2 gap-8 print:gap-4">
                      <div className="text-center space-y-1">
                        <p className="font-black text-sm print:text-[10px]">توقيع وملاحظة الرئيس المباشر :</p>
                        <div className="h-16 print:h-12 border border-gray-200 rounded-lg"></div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="flex justify-center gap-1 mb-1">
                          <span className="font-black text-sm print:text-[10px]">حرر بـ :</span>
                          <span className="font-bold text-sm print:text-[10px]">{schoolData.city || '................'}</span>
                          <span className="font-black mr-2 text-sm print:text-[10px]">في :</span>
                          <span className="font-bold text-sm print:text-[10px]">{new Date().toLocaleDateString('fr-FR')}</span>
                        </div>
                        <p className="font-black text-sm print:text-[10px]">توقيع المدلي (ة) بالشهادة :</p>
                        <div className="p-2 border border-gray-200 rounded-lg text-right space-y-0.5">
                          <p className="text-xs print:text-[9px] font-bold">المودع: {currentReceipt.submitterName || currentReceipt.staffName}</p>
                          <p className="text-xs print:text-[9px] font-bold">ر.ب.ت.و: {currentReceipt.submitterCin || staff.find(s => s.id === currentReceipt.staffId)?.cin || '................'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider for print */}
                  <div className="hidden print:block border-t border-dashed border-gray-300 my-1"></div>

                  {/* Second Copy (Duplicated) */}
                  <div className="text-right dir-rtl p-8 border-2 border-gray-100 rounded-2xl print:border-none print:p-0 print:min-h-[49vh] print:flex print:flex-col print:justify-between print:break-inside-avoid">
                    <div className="print:flex-1">
                      {/* Header - Full width logo as requested */}
                      <div className="mb-4 w-full">
                        {schoolData.logo ? (
                          <img src={schoolData.logo} alt="School Header" className="w-full h-auto max-h-[100px] object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400 font-bold">
                            يرجى رفع شعار المؤسسة (ترويسة كاملة) في الإعدادات
                          </div>
                        )}
                      </div>

                      <div className="text-center mb-4">
                        <h2 className="text-xl print:text-lg font-black border-b-2 border-double border-gray-900 inline-block pb-1 px-6">
                          إيصال باستلام الشهادة (ات) الطبية
                        </h2>
                        <p className="text-xs font-bold mt-1 text-gray-600">يسلم إلى الشخص الذي أودع الشهادة (ات) الطبية (نسخة الإدارة)</p>
                      </div>

                      <div className="space-y-3 print:space-y-1.5 text-base print:text-[11px] leading-tight">
                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">أنا الموقع (ة) أسفله :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {schoolData.director} - مدير المؤسسة
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">مدير(ة) مؤسسة :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {schoolData.name}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">أشهد أني تسلمت بتاريخ (1) :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {currentReceipt.receiptDate || new Date().toISOString().split('T')[0]}
                          </span>
                          <span className="font-black whitespace-nowrap">من طرف السيد(ة) :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {currentReceipt.submitterName || currentReceipt.staffName}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">شهادة طبية مسلمة من الطبيب السيد (ة) :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {currentReceipt.doctorName || '................................'}
                          </span>
                          <span className="font-black whitespace-nowrap">مدتها :</span>
                          <span className="w-16 border-b border-dotted border-gray-400 pb-0.5 font-bold text-center">
                            {currentReceipt.totalDays}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">ابتداء من :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold text-center">
                            {currentReceipt.startDate}
                          </span>
                          <span className="font-black whitespace-nowrap">إلى :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold text-center">
                            {currentReceipt.endDate}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">تتعلق بالسيد (ة) :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {currentReceipt.staffName}
                          </span>
                          <span className="font-black whitespace-nowrap">الرقم المالي :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {staff.find(s => s.id === currentReceipt.staffId)?.ppr || '................'}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">الإطار :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {staff.find(s => s.id === currentReceipt.staffId)?.cadre || '................'}
                          </span>
                          <span className="font-black whitespace-nowrap">مادة التدريس :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {staff.find(s => s.id === currentReceipt.staffId)?.specialization || '................'}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">العنوان الشخصي أثناء فترة المرض :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {currentReceipt.addressDuringAbsence || '................................'}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black whitespace-nowrap">رقم هاتف المعني بالأمر :</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5 font-bold">
                            {staff.find(s => s.id === currentReceipt.staffId)?.phoneNumber || '................'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 print:mt-2 grid grid-cols-2 gap-8 print:gap-4">
                      <div className="text-center space-y-1">
                        <p className="font-black text-sm print:text-[10px]">توقيع وملاحظة الرئيس المباشر :</p>
                        <div className="h-16 print:h-12 border border-gray-200 rounded-lg"></div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="flex justify-center gap-1 mb-1">
                          <span className="font-black text-sm print:text-[10px]">حرر بـ :</span>
                          <span className="font-bold text-sm print:text-[10px]">{schoolData.city || '................'}</span>
                          <span className="font-black mr-2 text-sm print:text-[10px]">في :</span>
                          <span className="font-bold text-sm print:text-[10px]">{new Date().toLocaleDateString('fr-FR')}</span>
                        </div>
                        <p className="font-black text-sm print:text-[10px]">توقيع المدلي (ة) بالشهادة :</p>
                        <div className="p-2 border border-gray-200 rounded-lg text-right space-y-0.5">
                          <p className="text-xs print:text-[9px] font-bold">المودع: {currentReceipt.submitterName || currentReceipt.staffName}</p>
                          <p className="text-xs print:text-[9px] font-bold">ر.ب.ت.و: {currentReceipt.submitterCin || staff.find(s => s.id === currentReceipt.staffId)?.cin || '................'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inquiry Modal */}
      <AnimatePresence>
        {showInquiryModal && currentInquiryAbsence && (
          <div key="inquiry-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:static print:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none print:max-h-none print:max-w-none print:h-auto print:w-full print:m-0 print:overflow-visible print:static print:block print:transform-none print:opacity-100"
            >
              <div className="p-8 print:p-0 print:overflow-visible">
                <div className="flex justify-between items-center mb-8 print:hidden">
                  <h3 className="text-xl font-black text-gray-900">استفسار عن التغيب / التأخر</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة</span>
                    </button>
                    <button
                      onClick={() => setShowInquiryModal(false)}
                      className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 print:hidden">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500">المراجع (كل مرجع في سطر):</label>
                    <textarea 
                      value={inquiryReference}
                      onChange={(e) => setInquiryReference(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold h-24"
                      placeholder="أدخل المراجع هنا، كل مرجع في سطر مستقل..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500">المدينة:</label>
                    <input 
                      type="text" 
                      value={inquiryCity}
                      onChange={(e) => setInquiryCity(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500">تاريخ التحرير:</label>
                    <input 
                      type="date" 
                      value={inquiryDate}
                      readOnly
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 print:hidden">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500">نص الاستهلال:</label>
                    <textarea 
                      value={inquiryIntro}
                      onChange={(e) => setInquiryIntro(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold h-24"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500">نص الخاتمة:</label>
                    <textarea 
                      value={inquiryOutro}
                      onChange={(e) => setInquiryOutro(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold h-24"
                    />
                  </div>
                </div>

                {/* Print Content */}
                <div className="print-content w-full text-right dir-rtl p-4 print:p-0">
                  <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                      @page {
                        size: A4 portrait;
                        margin: 0;
                      }
                      body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                      }
                      .print-content {
                        width: 100% !important;
                        display: block !important;
                        padding: 0 10mm 10mm 10mm !important;
                        box-sizing: border-box !important;
                      }
                      header, footer, .no-print { display: none !important; }
                    }
                  `}} />
                  
                  {/* Header */}
                  <div className="mb-6 w-full text-center">
                    {schoolData.logo ? (
                      <img src={schoolData.logo} alt="School Header" className="w-full h-auto max-h-[120px] object-contain mx-auto" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
                        <div className="text-center space-y-0.5 w-[38%] font-serif" style={{ fontFamily: "'Noto Sans Tifinagh', sans-serif" }}>
                          <p className="font-black text-[10px] uppercase tracking-wide">ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ</p>
                          <p className="font-black text-[10px]">ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ</p>
                          <div className="flex flex-col items-center text-[9px] font-bold space-y-0">
                            <p>ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ {toTifinagh(schoolData.region)}</p>
                            <p>ⵜⴰⵎⵀⵍⴰ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ {toTifinagh(schoolData.city)}</p>
                          </div>
                        </div>
                        <div className="w-[24%] flex justify-center">
                          <img 
                            src={KINGDOM_LOGO_URL} 
                            alt="Coat of Arms" 
                            className="w-[25mm] h-[25mm] object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="text-center space-y-0.5 w-[38%]">
                          <p className="font-black text-[10px] uppercase tracking-wide">المملكة المغربية</p>
                          <p className="font-black text-[10px]">وزارة التربية الوطنية والتعليم الأولي والرياضة</p>
                          <div className="flex flex-col items-center text-[9px] font-bold text-gray-800 space-y-0">
                            <p>الأكاديمية الجهوية للتربية والتكوين: {schoolData.region}</p>
                            <p>المديرية الإقليمية: {schoolData.city}</p>
                            <p className="text-[11px] font-black pt-0.5">المؤسسة: {schoolData.name}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center mb-6 space-y-3">
                    <div className="text-center">
                      <p className="text-sm font-black">من مدير(ة): {schoolData.name}</p>
                    </div>
                    <div className="text-center space-y-1 text-sm font-bold">
                      <p>إلى السيد (ة) : <span className="font-black">{currentInquiryAbsence.staffName}</span></p>
                      <p>رقم التأجير : <span className="font-black">{staff.find(s => s.id === currentInquiryAbsence.staffId)?.ppr || '---'}</span></p>
                      <p>الإطار : <span className="font-black">{staff.find(s => s.id === currentInquiryAbsence.staffId)?.cadre || '---'}</span></p>
                    </div>
                  </div>

                  <div className="space-y-4 print:space-y-2">
                    <div className="flex items-baseline gap-4">
                      <span className="font-black text-lg underline">الموضوع :</span>
                      <span className="text-xl font-black">استفسار</span>
                    </div>

                    <div className="text-sm font-bold leading-tight">
                      <p className="underline mb-1">المرجع :</p>
                      <p className="pr-4 whitespace-pre-wrap">{inquiryReference}</p>
                    </div>

                    <div className="text-center py-1">
                      <p className="font-bold">سلام تام بوجود مولانا الإمام المؤيد بالله</p>
                    </div>

                    <div className="text-base leading-normal space-y-3 print:space-y-1.5">
                      <p className="whitespace-pre-wrap">{inquiryIntro}</p>
                      
                      <div className="border-2 border-gray-900 p-2 font-black text-center">
                        {currentInquiryAbsence.startDate === (currentInquiryAbsence.endDate || currentInquiryAbsence.startDate) ? (
                          <div>بتاريخ : {currentInquiryAbsence.startDate.split('-').reverse().join('/')} {currentInquiryAbsence.startTime && `(${currentInquiryAbsence.startTime})`}</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-8">
                            <div>من : {currentInquiryAbsence.startDate.split('-').reverse().join('/')} {currentInquiryAbsence.startTime && `(${currentInquiryAbsence.startTime})`}</div>
                            <div>إلى : {(currentInquiryAbsence.endDate || currentInquiryAbsence.startDate).split('-').reverse().join('/')} {currentInquiryAbsence.endTime && `(${currentInquiryAbsence.endTime})`}</div>
                          </div>
                        )}
                      </div>

                      {(currentInquiryAbsence.type === 'delay' || currentInquiryAbsence.type === 'early_departure') && currentInquiryAbsence.differenceMinutes && (
                        <div className="text-center font-black text-lg">
                          مدة {currentInquiryAbsence.type === 'delay' ? 'التأخر' : 'المغادرة المبكرة'} : {currentInquiryAbsence.differenceMinutes} دقيقة
                        </div>
                      )}

                      <p className="text-justify whitespace-pre-wrap">{inquiryOutro}</p>
                    </div>

                    <div className="flex justify-between items-start pt-4">
                      <div className="text-center space-y-1">
                        <p className="font-black">والسلام</p>
                      </div>
                      <div className="text-center space-y-2 print:space-y-1">
                        <p className="font-black">حرر بـ : {inquiryCity}</p>
                        <p className="font-black">بتاريخ : {inquiryDate.split('-').reverse().join('/')}</p>
                        <div className="pt-1">
                          <p className="font-black">توقيع وطابع السيد مدير المؤسسة :</p>
                          <div className="h-12"></div>
                        </div>
                      </div>
                    </div>

                    {/* Response Area */}
                    <div className="border-t-2 border-dashed border-gray-400 pt-2 mt-2 space-y-2 print:space-y-1">
                      <p className="font-black text-lg underline">جواب المعني بالأمر :</p>
                      <div className="space-y-2 print:space-y-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="border-b border-dotted border-gray-400 h-5 w-full"></div>
                        ))}
                      </div>
                      <div className="flex justify-end pt-1">
                        <div className="text-center w-64 space-y-2 print:space-y-1">
                          <p className="font-black underline">توقيع المعني بالأمر :</p>
                          <div className="h-8"></div>
                        </div>
                      </div>
                    </div>

                    {/* Receipt Acknowledgement */}
                    <div className="border-2 border-gray-900 p-2 mt-0 space-y-2 text-xs">
                      <div className="text-center font-black underline mb-1">اشعار باستلام استفسار</div>
                      <div className="grid grid-cols-2 gap-2">
                        <p>يشهد السيد (ة) : <span className="font-black">{currentInquiryAbsence.staffName}</span></p>
                        <p>رقم التأجير : <span className="font-black">{staff.find(s => s.id === currentInquiryAbsence.staffId)?.ppr || '---'}</span></p>
                      </div>
                      <p>أنه توصل (ت) باستفسار عن {
                        currentInquiryAbsence.type === 'absence' ? 'التغيب' :
                        currentInquiryAbsence.type === 'delay' ? 'التأخر' :
                        'المغادرة قبل الوقت'
                      } 
                        {currentInquiryAbsence.startDate === (currentInquiryAbsence.endDate || currentInquiryAbsence.startDate) ? (
                          <span> بتاريخ: <span className="font-black">{currentInquiryAbsence.startDate.split('-').reverse().join('/')}</span></span>
                        ) : (
                          <span> خلال الفترة الممتدة من: <span className="font-black">{currentInquiryAbsence.startDate.split('-').reverse().join('/')}</span> إلى <span className="font-black">{(currentInquiryAbsence.endDate || currentInquiryAbsence.startDate).split('-').reverse().join('/')}</span></span>
                        )}
                      </p>
                      <div className="flex justify-between pt-2">
                        <p>بتاريخ : {inquiryDate.split('-').reverse().join('/')}</p>
                        <p>توقيع المعني بالأمر : ................................</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
