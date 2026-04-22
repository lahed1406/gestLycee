
import React, { useState, useMemo, useEffect } from 'react';
import { StaffMember, EducationalSupport, TimetableActivity, SchoolData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  MapPin, 
  FileText,
  History,
  X,
  ChevronDown,
  Printer
} from 'lucide-react';

interface EducationalSupportManagementProps {
  staff: StaffMember[];
  supportList: EducationalSupport[];
  setSupportList: (list: EducationalSupport[]) => void;
  timetable: TimetableActivity[];
  schoolData: SchoolData;
}

export const EducationalSupportManagement: React.FC<EducationalSupportManagementProps> = ({ 
  staff, 
  supportList, 
  setSupportList,
  timetable,
  schoolData
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<'الأول' | 'الثاني'>('الأول');
  const [printingTeacherName, setPrintingTeacherName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Reset generating state when modal closes
  useEffect(() => {
    if (!showReportModal) {
      setIsGenerating(false);
    }
  }, [showReportModal]);
  const [shouldPrint, setShouldPrint] = useState(false);

  // Handle printing after generation
  useEffect(() => {
    if (shouldPrint && isGenerating) {
      const timer = setTimeout(() => {
        window.print();
        setShouldPrint(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldPrint, isGenerating]);

  const filteredReportData = useMemo(() => {
    const grouped = supportList
      .filter(item => {
        if (!item.date) return false;
        const month = new Date(item.date).getMonth() + 1;
        const isFirstSemester = month >= 9 || month <= 1;
        return selectedSemester === 'الأول' ? isFirstSemester : !isFirstSemester;
      })
      .reduce((acc, item) => {
        if (!acc[item.staffName]) acc[item.staffName] = [];
        acc[item.staffName].push(item);
        return acc;
      }, {} as Record<string, EducationalSupport[]>);

    return Object.entries(grouped)
      .filter(([staffName]) => !printingTeacherName || staffName === printingTeacherName)
      .sort((a, b) => a[0].localeCompare(b[0], 'ar'));
  }, [supportList, selectedSemester, printingTeacherName]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EducationalSupport>>({
    staffId: '',
    staffName: '',
    subject: '',
    studentGroup: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    room: '',
    notes: ''
  });

  // Robust Arabic normalization for better matching
  const normalizeText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  // Day mapping for FET compatibility
  const getDayVariants = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayIndex = date.getDay(); // 0 is Sunday
    
    const variants: Record<number, string[]> = {
      0: ['الأحد', 'dimanche', 'sunday', 'dim', '0', '7'],
      1: ['الاثنين', 'الإثنين', 'lundi', 'monday', 'lun', '1'],
      2: ['الثلاثاء', 'mardi', 'tuesday', 'mar', '2'],
      3: ['الأربعاء', 'mercredi', 'wednesday', 'mer', '3'],
      4: ['الخميس', 'jeudi', 'thursday', 'jeu', '4'],
      5: ['الجمعة', 'vendredi', 'friday', 'ven', '5'],
      6: ['السبت', 'samedi', 'saturday', 'sam', '6']
    };
    
    return variants[dayIndex].map(normalizeText);
  };

  // Helper to get day name in Arabic (Local time safe)
  const getDayName = (dateStr: string) => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return days[date.getDay()];
  };

  // Group staff by specialization
  const groupedStaff = useMemo(() => {
    const groups: Record<string, StaffMember[]> = {};
    staff.forEach(s => {
      const spec = s.specialization || 'أخرى';
      if (!groups[spec]) groups[spec] = [];
      groups[spec].push(s);
    });
    return groups;
  }, [staff]);

  // Get teacher's subjects and groups from timetable
  const teacherData = useMemo(() => {
    if (!formData.staffId) return { subjects: [], groups: [] };
    const selectedStaff = staff.find(s => s.id === formData.staffId);
    if (!selectedStaff) return { subjects: [], groups: [] };

    const normalizedFullName = normalizeText(selectedStaff.fullName);
    const teacherActivities = timetable.filter(a => 
      normalizeText(a.teacher) === normalizedFullName
    );
    const subjects = Array.from(new Set(teacherActivities.map(a => a.subject).filter(Boolean)));
    const groups = Array.from(new Set(teacherActivities.map(a => a.studentSet).filter(Boolean)));
    
    return { subjects, groups };
  }, [formData.staffId, staff, timetable]);

  // Auto-fill subject and sync name when staff changes
  useEffect(() => {
    if (formData.staffId) {
      const selectedStaff = staff.find(s => s.id === formData.staffId);
      if (selectedStaff) {
        setFormData(prev => ({ 
          ...prev, 
          staffName: selectedStaff.fullName,
          subject: editingId ? prev.subject : (teacherData.subjects[0] || selectedStaff.specialization || ''),
          studentGroup: editingId ? prev.studentGroup : ''
        }));
      }
    }
  }, [formData.staffId, teacherData.subjects, staff, editingId]);

  // Helper to check if two time ranges overlap
  const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + (m || 0);
    };
    
    const s1 = toMinutes(start1.includes(':') ? start1 : `${start1.padStart(2, '0')}:00`);
    const e1 = toMinutes(end1.includes(':') ? end1 : `${end1.padStart(2, '0')}:00`);
    const s2 = toMinutes(start2.includes(':') ? start2 : `${start2.padStart(2, '0')}:00`);
    const e2 = toMinutes(end2.includes(':') ? end2 : `${end2.padStart(2, '0')}:00`);
    
    return s1 < e2 && s2 < e1;
  };

  // Check if selected group is available
  const isGroupAvailable = useMemo(() => {
    if (!formData.studentGroup || !formData.date || !formData.startTime || !formData.endTime) return true;
    if (formData.studentGroup === 'فوج آخر') return true;

    const dayVariants = getDayVariants(formData.date);
    const normalizedSelectedGroup = normalizeText(formData.studentGroup);
    
    let occupied = false;
    timetable.forEach(activity => {
      const normalizedActDay = normalizeText(activity.day);
      const isDayMatch = dayVariants.some(v => normalizedActDay.includes(v) || v.includes(normalizedActDay));
      
      if (isDayMatch) {
        const normalizedActGroup = normalizeText(activity.studentSet);
        if (normalizedActGroup.includes(normalizedSelectedGroup) || normalizedSelectedGroup.includes(normalizedActGroup)) {
          let actStart = '';
          let actEnd = '';

          const rangeMatch = activity.hour.match(/(\d+)(?:h|:)?(\d+)?\s*-\s*(\d+)(?:h|:)?(\d+)?/i);
          if (rangeMatch) {
            const h1 = parseInt(rangeMatch[1]);
            const m1 = parseInt(rangeMatch[2] || '0');
            const h2 = parseInt(rangeMatch[3]);
            const m2 = parseInt(rangeMatch[4] || '0');
            const startTotal = h1 * 60 + m1;
            const endTotal = h2 * 60 + m2;
            const minTotal = Math.min(startTotal, endTotal);
            const maxTotal = Math.max(startTotal, endTotal);
            actStart = `${Math.floor(minTotal / 60).toString().padStart(2, '0')}:${(minTotal % 60).toString().padStart(2, '0')}`;
            actEnd = `${Math.floor(maxTotal / 60).toString().padStart(2, '0')}:${(maxTotal % 60).toString().padStart(2, '0')}`;
          } else if (activity.hour.match(/^H[1-8]$/i)) {
            const hNum = parseInt(activity.hour.substring(1));
            const isAfternoonSuffix = normalizedActDay.endsWith('_s') || normalizedActDay.includes('soir') || normalizedActDay.includes('afternoon');
            let startH = hNum > 4 ? 9 + hNum : (isAfternoonSuffix ? 13 + hNum : 7 + hNum);
            actStart = `${startH.toString().padStart(2, '0')}:00`;
            actEnd = `${(startH + 1).toString().padStart(2, '0')}:00`;
          } else {
            const labels = schoolData.hourLabels || ['09h - 08h', '10h - 09h', '11h - 10h', '12h - 11h', '15h - 14h', '16h - 15h', '17h - 16h', '18h - 17h'];
            const labelIndex = parseInt(activity.hour) - 1;
            if (!isNaN(labelIndex) && labels[labelIndex]) {
              const labelMatch = labels[labelIndex].match(/(\d+)(?:h|:)?(\d+)?\s*-\s*(\d+)(?:h|:)?(\d+)?/i);
              if (labelMatch) {
                const h1 = parseInt(labelMatch[1]);
                const m1 = parseInt(labelMatch[2] || '0');
                const h2 = parseInt(labelMatch[3]);
                const m2 = parseInt(labelMatch[4] || '0');
                const startTotal = h1 * 60 + m1;
                const endTotal = h2 * 60 + m2;
                const minTotal = Math.min(startTotal, endTotal);
                const maxTotal = Math.max(startTotal, endTotal);
                actStart = `${Math.floor(minTotal / 60).toString().padStart(2, '0')}:${(minTotal % 60).toString().padStart(2, '0')}`;
                actEnd = `${Math.floor(maxTotal / 60).toString().padStart(2, '0')}:${(maxTotal % 60).toString().padStart(2, '0')}`;
              }
            }
          }

          if (actStart && actEnd && isOverlapping(formData.startTime!, formData.endTime!, actStart, actEnd)) {
            occupied = true;
          }
        }
      }
    });

    return !occupied;
  }, [formData.studentGroup, formData.date, formData.startTime, formData.endTime, timetable, schoolData.hourLabels]);

  // Check if selected teacher is available
  const isTeacherAvailable = useMemo(() => {
    if (!formData.staffId || !formData.date || !formData.startTime || !formData.endTime) return true;
    
    const selectedStaff = staff.find(s => s.id === formData.staffId);
    if (!selectedStaff) return true;

    const dayVariants = getDayVariants(formData.date);
    const normalizedTeacherName = normalizeText(selectedStaff.fullName);
    
    let occupied = false;
    timetable.forEach(activity => {
      const normalizedActDay = normalizeText(activity.day);
      const isDayMatch = dayVariants.some(v => normalizedActDay.includes(v) || v.includes(normalizedActDay));
      
      if (isDayMatch) {
        const normalizedActTeacher = normalizeText(activity.teacher);
        if (normalizedActTeacher === normalizedTeacherName) {
          let actStart = '';
          let actEnd = '';

          const rangeMatch = activity.hour.match(/(\d+)(?:h|:)?(\d+)?\s*-\s*(\d+)(?:h|:)?(\d+)?/i);
          if (rangeMatch) {
            const h1 = parseInt(rangeMatch[1]);
            const m1 = parseInt(rangeMatch[2] || '0');
            const h2 = parseInt(rangeMatch[3]);
            const m2 = parseInt(rangeMatch[4] || '0');
            const startTotal = h1 * 60 + m1;
            const endTotal = h2 * 60 + m2;
            const minTotal = Math.min(startTotal, endTotal);
            const maxTotal = Math.max(startTotal, endTotal);
            actStart = `${Math.floor(minTotal / 60).toString().padStart(2, '0')}:${(minTotal % 60).toString().padStart(2, '0')}`;
            actEnd = `${Math.floor(maxTotal / 60).toString().padStart(2, '0')}:${(maxTotal % 60).toString().padStart(2, '0')}`;
          } else if (activity.hour.match(/^H[1-8]$/i)) {
            const hNum = parseInt(activity.hour.substring(1));
            const isAfternoonSuffix = normalizedActDay.endsWith('_s') || normalizedActDay.includes('soir') || normalizedActDay.includes('afternoon');
            let startH = hNum > 4 ? 9 + hNum : (isAfternoonSuffix ? 13 + hNum : 7 + hNum);
            actStart = `${startH.toString().padStart(2, '0')}:00`;
            actEnd = `${(startH + 1).toString().padStart(2, '0')}:00`;
          } else {
            const labels = schoolData.hourLabels || ['09h - 08h', '10h - 09h', '11h - 10h', '12h - 11h', '15h - 14h', '16h - 15h', '17h - 16h', '18h - 17h'];
            const labelIndex = parseInt(activity.hour) - 1;
            if (!isNaN(labelIndex) && labels[labelIndex]) {
              const labelMatch = labels[labelIndex].match(/(\d+)(?:h|:)?(\d+)?\s*-\s*(\d+)(?:h|:)?(\d+)?/i);
              if (labelMatch) {
                const h1 = parseInt(labelMatch[1]);
                const m1 = parseInt(labelMatch[2] || '0');
                const h2 = parseInt(labelMatch[3]);
                const m2 = parseInt(labelMatch[4] || '0');
                const startTotal = h1 * 60 + m1;
                const endTotal = h2 * 60 + m2;
                const minTotal = Math.min(startTotal, endTotal);
                const maxTotal = Math.max(startTotal, endTotal);
                actStart = `${Math.floor(minTotal / 60).toString().padStart(2, '0')}:${(minTotal % 60).toString().padStart(2, '0')}`;
                actEnd = `${Math.floor(maxTotal / 60).toString().padStart(2, '0')}:${(maxTotal % 60).toString().padStart(2, '0')}`;
              }
            }
          }

          if (actStart && actEnd && isOverlapping(formData.startTime!, formData.endTime!, actStart, actEnd)) {
            occupied = true;
          }
        }
      }
    });

    return !occupied;
  }, [formData.staffId, formData.date, formData.startTime, formData.endTime, timetable, staff, schoolData.hourLabels]);

  // Check if selected room is available
  const isRoomAvailable = useMemo(() => {
    if (!formData.room || !formData.date || !formData.startTime || !formData.endTime) return true;
    if (formData.room === 'قاعة أخرى') return true;

    const dayVariants = getDayVariants(formData.date);
    const normalizedSelectedRoom = normalizeText(formData.room);
    
    let occupied = false;
    timetable.forEach(activity => {
      const normalizedActDay = normalizeText(activity.day);
      const isDayMatch = dayVariants.some(v => normalizedActDay.includes(v) || v.includes(normalizedActDay));
      
      if (isDayMatch) {
        const roomParts = activity.room.split(/[+,/]/).map(r => normalizeText(r.trim())).filter(Boolean);
        if (roomParts.some(p => p === normalizedSelectedRoom)) {
          let actStart = '';
          let actEnd = '';

          const rangeMatch = activity.hour.match(/(\d+)(?:h|:)?(\d+)?\s*-\s*(\d+)(?:h|:)?(\d+)?/i);
          if (rangeMatch) {
            const h1 = parseInt(rangeMatch[1]);
            const m1 = parseInt(rangeMatch[2] || '0');
            const h2 = parseInt(rangeMatch[3]);
            const m2 = parseInt(rangeMatch[4] || '0');
            const startTotal = h1 * 60 + m1;
            const endTotal = h2 * 60 + m2;
            const minTotal = Math.min(startTotal, endTotal);
            const maxTotal = Math.max(startTotal, endTotal);
            actStart = `${Math.floor(minTotal / 60).toString().padStart(2, '0')}:${(minTotal % 60).toString().padStart(2, '0')}`;
            actEnd = `${Math.floor(maxTotal / 60).toString().padStart(2, '0')}:${(maxTotal % 60).toString().padStart(2, '0')}`;
          } else if (activity.hour.match(/^H[1-8]$/i)) {
            const hNum = parseInt(activity.hour.substring(1));
            const isAfternoonSuffix = normalizedActDay.endsWith('_s') || normalizedActDay.includes('soir') || normalizedActDay.includes('afternoon');
            let startH = hNum > 4 ? 9 + hNum : (isAfternoonSuffix ? 13 + hNum : 7 + hNum);
            actStart = `${startH.toString().padStart(2, '0')}:00`;
            actEnd = `${(startH + 1).toString().padStart(2, '0')}:00`;
          } else {
            const labels = schoolData.hourLabels || ['09h - 08h', '10h - 09h', '11h - 10h', '12h - 11h', '15h - 14h', '16h - 15h', '17h - 16h', '18h - 17h'];
            const labelIndex = parseInt(activity.hour) - 1;
            if (!isNaN(labelIndex) && labels[labelIndex]) {
              const labelMatch = labels[labelIndex].match(/(\d+)(?:h|:)?(\d+)?\s*-\s*(\d+)(?:h|:)?(\d+)?/i);
              if (labelMatch) {
                const h1 = parseInt(labelMatch[1]);
                const m1 = parseInt(labelMatch[2] || '0');
                const h2 = parseInt(labelMatch[3]);
                const m2 = parseInt(labelMatch[4] || '0');
                const startTotal = h1 * 60 + m1;
                const endTotal = h2 * 60 + m2;
                const minTotal = Math.min(startTotal, endTotal);
                const maxTotal = Math.max(startTotal, endTotal);
                actStart = `${Math.floor(minTotal / 60).toString().padStart(2, '0')}:${(minTotal % 60).toString().padStart(2, '0')}`;
                actEnd = `${Math.floor(maxTotal / 60).toString().padStart(2, '0')}:${(maxTotal % 60).toString().padStart(2, '0')}`;
              }
            }
          }

          if (actStart && actEnd && isOverlapping(formData.startTime!, formData.endTime!, actStart, actEnd)) {
            occupied = true;
          }
        }
      }
    });

    return !occupied;
  }, [formData.room, formData.date, formData.startTime, formData.endTime, timetable, schoolData.hourLabels]);

  const [showAllRooms, setShowAllRooms] = useState(false);

  // Get vacant rooms
  const vacantRooms = useMemo(() => {
    if (!formData.date || !formData.startTime || !formData.endTime) return [];
    if (showAllRooms) return Array.from(new Set(timetable.map(a => a.room).filter(Boolean))).sort() as string[];

    const dayVariants = getDayVariants(formData.date);
    const allRooms = Array.from(new Set(timetable.map(a => a.room).filter(Boolean))) as string[];
    
    // Find rooms occupied during the selected time
    const occupiedRooms = new Set<string>();
    timetable.forEach(activity => {
      const normalizedActDay = normalizeText(activity.day);
      const isDayMatch = dayVariants.some(v => normalizedActDay.includes(v) || v.includes(normalizedActDay));
      
      if (isDayMatch) {
        let actStart = '';
        let actEnd = '';

        // Try to parse range (e.g., "08h30 - 10h30")
        const rangeMatch = activity.hour.match(/(\d+)(?:h|:)?(\d+)?\s*-\s*(\d+)(?:h|:)?(\d+)?/i);
        if (rangeMatch) {
          const h1 = parseInt(rangeMatch[1]);
          const m1 = parseInt(rangeMatch[2] || '0');
          const h2 = parseInt(rangeMatch[3]);
          const m2 = parseInt(rangeMatch[4] || '0');
          
          const startTotal = h1 * 60 + m1;
          const endTotal = h2 * 60 + m2;
          const minTotal = Math.min(startTotal, endTotal);
          const maxTotal = Math.max(startTotal, endTotal);
          
          actStart = `${Math.floor(minTotal / 60).toString().padStart(2, '0')}:${(minTotal % 60).toString().padStart(2, '0')}`;
          actEnd = `${Math.floor(maxTotal / 60).toString().padStart(2, '0')}:${(maxTotal % 60).toString().padStart(2, '0')}`;
        } 
        // Handle FET specific format: H1-H8 with _m (morning) or _s (afternoon)
        else if (activity.hour.match(/^H[1-8]$/i)) {
          const hNum = parseInt(activity.hour.substring(1));
          // Suffix _m/_s or Matin/Soir determines morning/afternoon
          // Also H5-H8 are typically afternoon
          const isAfternoonSuffix = normalizedActDay.endsWith('_s') || normalizedActDay.includes('soir') || normalizedActDay.includes('afternoon');
          const isMorningSuffix = normalizedActDay.endsWith('_m') || normalizedActDay.includes('matin') || normalizedActDay.includes('morning');
          
          let startH = 0;
          if (hNum > 4) {
            // H5-H8 -> 14h-18h
            startH = 9 + hNum; // H5 -> 14, H6 -> 15...
          } else if (isAfternoonSuffix) {
            // H1-H4 Afternoon -> 14h-18h
            startH = 13 + hNum; // H1 -> 14
          } else {
            // H1-H4 Morning -> 8h-12h
            startH = 7 + hNum; // H1 -> 8
          }
          
          actStart = `${startH.toString().padStart(2, '0')}:00`;
          actEnd = `${(startH + 1).toString().padStart(2, '0')}:00`;
        }
        else {
          // Try to match single hour label from schoolData
          const labels = schoolData.hourLabels || ['09h - 08h', '10h - 09h', '11h - 10h', '12h - 11h', '15h - 14h', '16h - 15h', '17h - 16h', '18h - 17h'];
          const labelIndex = parseInt(activity.hour) - 1;
          if (!isNaN(labelIndex) && labels[labelIndex]) {
            const labelMatch = labels[labelIndex].match(/(\d+)(?:h|:)?(\d+)?\s*-\s*(\d+)(?:h|:)?(\d+)?/i);
            if (labelMatch) {
              const h1 = parseInt(labelMatch[1]);
              const m1 = parseInt(labelMatch[2] || '0');
              const h2 = parseInt(labelMatch[3]);
              const m2 = parseInt(labelMatch[4] || '0');
              
              const startTotal = h1 * 60 + m1;
              const endTotal = h2 * 60 + m2;
              const minTotal = Math.min(startTotal, endTotal);
              const maxTotal = Math.max(startTotal, endTotal);
              
              actStart = `${Math.floor(minTotal / 60).toString().padStart(2, '0')}:${(minTotal % 60).toString().padStart(2, '0')}`;
              actEnd = `${Math.floor(maxTotal / 60).toString().padStart(2, '0')}:${(maxTotal % 60).toString().padStart(2, '0')}`;
            }
          }
        }
        
        if (actStart && actEnd && isOverlapping(formData.startTime!, formData.endTime!, actStart, actEnd)) {
          // Split room by common delimiters (+, ,, /, and spaces if they look like multiple rooms)
          const roomParts = activity.room.split(/[+,/]/).map(r => normalizeText(r.trim())).filter(Boolean);
          roomParts.forEach(r => occupiedRooms.add(r));
        }
      }
    });

    // Filter allRooms: a room is vacant only if NONE of its parts are in occupiedRooms
    return allRooms.filter(room => {
      const roomParts = room.split(/[+,/]/).map(r => normalizeText(r.trim())).filter(Boolean);
      return !roomParts.some(p => occupiedRooms.has(p));
    }).sort();
  }, [formData.date, formData.startTime, formData.endTime, timetable, showAllRooms, schoolData.hourLabels]);

  const filteredList = supportList.filter(item => 
    item.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.studentGroup.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAdd = () => {
    if (!formData.staffId || !formData.date || !formData.startTime || !formData.endTime) {
      alert('يرجى ملء جميع الحقول الأساسية');
      return;
    }

    const selectedStaff = staff.find(s => s.id === formData.staffId);
    const newEntry: EducationalSupport = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      staffId: formData.staffId!,
      staffName: selectedStaff?.fullName || '',
      subject: formData.subject || '',
      studentGroup: formData.studentGroup || '',
      date: formData.date!,
      startTime: formData.startTime!,
      endTime: formData.endTime!,
      room: formData.room || '',
      notes: formData.notes || '',
      createdAt: new Date().toISOString()
    };

    if (editingId) {
      setSupportList(supportList.map(item => item.id === editingId ? newEntry : item));
    } else {
      setSupportList([...supportList, newEntry]);
    }

    resetForm();
  };

  const handleEdit = (item: EducationalSupport) => {
    setFormData(item);
    setEditingId(item.id);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
      setSupportList(supportList.filter(item => item.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      staffId: '',
      staffName: '',
      subject: '',
      studentGroup: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      room: '',
      notes: ''
    });
    setEditingId(null);
    setShowAddModal(false);
    setShowAllRooms(false);
  };

  return (
    <>
      <div className="no-print space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            نظام تدبير الدعم التربوي
          </h2>
          <p className="text-sm text-gray-500 font-bold mt-1">تتبع حصص الدعم التربوي المنجزة من طرف الموظفين</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center justify-center gap-2 bg-white text-indigo-600 border-2 border-indigo-100 px-6 py-3 rounded-2xl font-black hover:bg-indigo-50 transition-all"
          >
            <Printer className="w-5 h-5" />
            <span>توليد تقرير</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة حصة دعم</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="البحث عن موظف، مادة، أو فوج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-black text-gray-600">الموظف</th>
                <th className="px-6 py-4 text-sm font-black text-gray-600">المادة / الفوج</th>
                <th className="px-6 py-4 text-sm font-black text-gray-600">التاريخ والتوقيت</th>
                <th className="px-6 py-4 text-sm font-black text-gray-600">القاعة</th>
                <th className="px-6 py-4 text-sm font-black text-gray-600 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                        {item.staffName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-black text-gray-900">{item.staffName}</div>
                        <div className="text-[10px] text-gray-400 font-bold">PPR: {staff.find(s => s.id === item.staffId)?.ppr || '---'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <BookOpen className="w-3 h-3 text-indigo-500" />
                        {item.subject}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <Users className="w-3 h-3 text-indigo-400" />
                        {item.studentGroup}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <Calendar className="w-3 h-3 text-indigo-500" />
                        {item.date.split('-').reverse().join('/')}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        {item.startTime} - {item.endTime}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <MapPin className="w-3 h-3 text-indigo-500" />
                      {item.room || '---'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <History className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-bold">لا توجد حصص دعم مسجلة</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-2xl">
                    <GraduationCap className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{editingId ? 'تعديل حصة دعم' : 'إضافة حصة دعم جديدة'}</h3>
                    <p className="text-xs text-gray-500 font-bold">أدخل تفاصيل حصة الدعم التربوي</p>
                  </div>
                </div>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar text-right" dir="rtl">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    الموظف المعني (مصنف حسب التخصص)
                  </label>
                  <select
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    className={`w-full p-4 rounded-2xl border transition-all text-sm font-bold ${
                      !formData.staffId 
                        ? 'border-gray-200' 
                        : isTeacherAvailable 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/10' 
                          : 'border-rose-200 bg-rose-50 text-rose-700 ring-2 ring-rose-500/10'
                    } focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                  >
                    <option value="">اختر الموظف...</option>
                    {Object.entries(groupedStaff).map(([spec, members]) => (
                      <optgroup key={spec} label={spec}>
                        {(members as StaffMember[]).map(s => (
                          <option key={s.id} value={s.id}>{s.fullName}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {!isTeacherAvailable && formData.staffId && (
                    <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                      <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
                      هذا الموظف لديه حصة أخرى في هذا التوقيت حسب جدول الحصص
                    </p>
                  )}
                </div>

                {/* Timetable Summary */}
                {formData.staffId && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-5 bg-indigo-50/80 rounded-[2rem] border border-indigo-100 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-700 font-black text-sm">
                        <History className="w-5 h-5" />
                        ملخص جدول حصص الموظف:
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-black">
                          {teacherData.groups.length} حصص مسجلة
                        </div>
                        {teacherData.groups.length > 0 && (
                          <div className="text-[10px] bg-amber-100 text-amber-600 px-3 py-1 rounded-full font-black">
                            تأكد من مطابقة أسماء الأيام
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 min-h-[100px]">
                      {[
                        { ar: 'الاثنين', variants: ['الاثنين', 'الإثنين', 'lundi', 'monday', 'lun', '1'] },
                        { ar: 'الثلاثاء', variants: ['الثلاثاء', 'mardi', 'tuesday', 'mar', '2'] },
                        { ar: 'الأربعاء', variants: ['الأربعاء', 'mercredi', 'wednesday', 'mer', '3'] },
                        { ar: 'الخميس', variants: ['الخميس', 'jeudi', 'thursday', 'jeu', '4'] },
                        { ar: 'الجمعة', variants: ['الجمعة', 'vendredi', 'friday', 'ven', '5'] },
                        { ar: 'السبت', variants: ['السبت', 'samedi', 'saturday', 'sam', '6'] }
                      ].map(dayObj => {
                        const selectedStaff = staff.find(s => s.id === formData.staffId);
                        const normalizedTeacher = selectedStaff ? normalizeText(selectedStaff.fullName) : '';
                        const normalizedVariants = dayObj.variants.map(normalizeText);
                        
                        const dayActivities = timetable.filter(a => {
                          if (!selectedStaff) return false;
                          const normalizedActTeacher = normalizeText(a.teacher);
                          const normalizedActDay = normalizeText(a.day);
                          
                          return normalizedActTeacher === normalizedTeacher && 
                                 normalizedVariants.some(v => normalizedActDay.includes(v) || v.includes(normalizedActDay));
                        }).sort((a, b) => {
                          const h1 = parseInt(a.hour.match(/\d+/)?.[0] || '0');
                          const h2 = parseInt(b.hour.match(/\d+/)?.[0] || '0');
                          return h1 - h2;
                        });

                        if (dayActivities.length === 0) return null;

                        return (
                          <div key={dayObj.ar} className="bg-white p-3 rounded-2xl shadow-sm border border-indigo-100/50 flex flex-col h-full">
                            <div className="text-[11px] font-black text-indigo-600 mb-2 border-b border-indigo-50 pb-1 text-center">
                              {dayObj.ar}
                            </div>
                            <div className="space-y-2 flex-grow">
                              {dayActivities.map((act, idx) => (
                                <div key={idx} className="text-[10px] font-bold text-gray-600 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <div className="flex items-center gap-1">
                                      <span className="text-indigo-500 font-black">{act.hour}</span>
                                      {normalizeText(act.day).includes('_m') && <span className="text-[8px] bg-blue-100 text-blue-600 px-1 rounded">صباح</span>}
                                      {normalizeText(act.day).includes('_s') && <span className="text-[8px] bg-orange-100 text-orange-600 px-1 rounded">مساء</span>}
                                    </div>
                                    <span className="text-[9px] text-gray-400">{act.room}</span>
                                  </div>
                                  <div className="text-indigo-400 truncate" title={act.studentSet}>
                                    {act.studentSet}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {teacherData.groups.length === 0 && (
                      <div className="py-4 text-center">
                        <p className="text-xs text-gray-400 font-bold">لا توجد حصص مسجلة لهذا الموظف في جدول الحصص المستورد</p>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      المادة
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="المادة المدرسة"
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      الفوج / القسم
                    </label>
                    <select
                      value={formData.studentGroup}
                      onChange={(e) => setFormData({ ...formData, studentGroup: e.target.value })}
                      className={`w-full p-4 rounded-2xl border transition-all text-sm font-bold ${
                        !formData.studentGroup 
                          ? 'border-gray-200' 
                          : isGroupAvailable 
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/10' 
                            : 'border-rose-200 bg-rose-50 text-rose-700 ring-2 ring-rose-500/10'
                      } focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                      disabled={!formData.staffId}
                    >
                      <option value="">اختر الفوج...</option>
                      {teacherData.groups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                      <option value="فوج آخر">فوج آخر (إدخال يدوي)</option>
                    </select>
                    {!isGroupAvailable && formData.studentGroup && formData.studentGroup !== 'فوج آخر' && (
                      <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                        <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
                        هذا القسم لديه حصة أخرى في هذا التوقيت حسب جدول الحصص
                      </p>
                    )}
                    {isGroupAvailable && formData.studentGroup && formData.studentGroup !== 'فوج آخر' && (
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                        القسم متاح في هذا التوقيت
                      </p>
                    )}
                    {formData.studentGroup === 'فوج آخر' && (
                      <input
                        type="text"
                        placeholder="أدخل اسم الفوج يدوياً"
                        className={`w-full mt-2 p-4 rounded-2xl border transition-all text-sm font-bold ${
                          !formData.studentGroup || formData.studentGroup === 'فوج آخر'
                            ? 'border-gray-200' 
                            : isGroupAvailable 
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/10' 
                              : 'border-rose-200 bg-rose-50 text-rose-700 ring-2 ring-rose-500/10'
                        } focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                        onChange={(e) => setFormData({ ...formData, studentGroup: e.target.value })}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      التاريخ
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      من الساعة
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      إلى الساعة
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        القاعة الشاغرة
                      </label>
                      <button 
                        type="button"
                        onClick={() => setShowAllRooms(!showAllRooms)}
                        className={`text-[10px] font-black px-2 py-1 rounded-lg transition-colors ${showAllRooms ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        {showAllRooms ? 'إظهار الشاغرة فقط' : 'إظهار جميع القاعات'}
                      </button>
                    </div>
                    <select
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      className={`w-full p-4 rounded-2xl border transition-all text-sm font-bold ${
                        !formData.room 
                          ? 'border-gray-200' 
                          : isRoomAvailable 
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/10' 
                            : 'border-rose-200 bg-rose-50 text-rose-700 ring-2 ring-rose-500/10'
                      } focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                      disabled={!formData.date || !formData.startTime || !formData.endTime}
                    >
                      <option value="">{showAllRooms ? 'اختر من جميع القاعات...' : 'اختر القاعة الشاغرة...'}</option>
                      {vacantRooms.map(room => (
                        <option key={room} value={room}>{room}</option>
                      ))}
                      <option value="قاعة أخرى">قاعة أخرى</option>
                    </select>
                    {!isRoomAvailable && formData.room && formData.room !== 'قاعة أخرى' && (
                      <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                        <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
                        هذه القاعة مشغولة في هذا التوقيت حسب جدول الحصص
                      </p>
                    )}
                    {isRoomAvailable && formData.room && formData.room !== 'قاعة أخرى' && (
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                        القاعة شاغرة ومتاحة
                      </p>
                    )}
                    {formData.room === 'قاعة أخرى' && (
                      <input
                        type="text"
                        placeholder="أدخل اسم القاعة يدوياً"
                        className={`w-full mt-2 p-4 rounded-2xl border transition-all text-sm font-bold ${
                          !formData.room || formData.room === 'قاعة أخرى'
                            ? 'border-gray-200' 
                            : isRoomAvailable 
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/10' 
                              : 'border-rose-200 bg-rose-50 text-rose-700 ring-2 ring-rose-500/10'
                        } focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      />
                    )}
                    {!showAllRooms && vacantRooms.length === 0 && formData.date && formData.startTime && formData.endTime && (
                      <p className="text-[10px] text-amber-500 font-bold">لم يتم العثور على قاعات شاغرة، يمكنك إظهار الكل أو إدخال يدوي</p>
                    )}
                    {(!formData.date || !formData.startTime || !formData.endTime) && (
                      <p className="text-[10px] text-indigo-500 font-bold">يرجى تحديد التاريخ والتوقيت أولاً لعرض القاعات الشاغرة</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      ملاحظات
                    </label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="أي ملاحظات إضافية..."
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-4">
                <button
                  onClick={resetForm}
                  className="px-6 py-3 rounded-2xl font-black text-gray-500 hover:bg-gray-100 transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAdd}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                >
                  {editingId ? 'حفظ التعديلات' : 'إضافة الحصة'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm overflow-y-auto print-modal-container">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col print-modal-content"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 no-print">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-2xl">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">إعداد تقارير الدعم التربوي</h3>
                    <p className="text-xs text-gray-500 font-bold">حدد خيارات التقرير المطلوب استخراجه</p>
                  </div>
                </div>
                <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-10 space-y-8 no-print" dir="rtl">
                {!isGenerating ? (
                  <>
                    <div className="grid grid-cols-1 gap-8">
                      <div className="space-y-4">
                        <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          اختيار الأسدوس
                        </label>
                        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                          <button
                            onClick={() => setSelectedSemester('الأول')}
                            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${selectedSemester === 'الأول' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            الأسدوس الأول
                          </button>
                          <button
                            onClick={() => setSelectedSemester('الثاني')}
                            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${selectedSemester === 'الثاني' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            الأسدوس الثاني
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                          <Users className="w-4 h-4 text-indigo-500" />
                          نوع التقرير
                        </label>
                        <select 
                          value={printingTeacherName || ''} 
                          onChange={(e) => setPrintingTeacherName(e.target.value || null)}
                          className="w-full bg-gray-50 border-2 border-gray-100 text-sm font-bold rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                        >
                          <option value="">تقرير جماعي (جميع الموظفين)</option>
                          {Array.from(new Set(supportList.map(item => item.staffName))).sort().map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-6 border-t border-gray-100">
                      <button 
                        onClick={() => {
                          if (filteredReportData.length === 0) {
                            alert('لا توجد بيانات للأسدوس المختار');
                            return;
                          }
                          setIsGenerating(true);
                        }}
                        className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                      >
                        <FileText className="w-5 h-5" />
                        معاينة التقرير
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs font-bold text-center">
                      تأكد من مراجعة البيانات أدناه قبل الطباعة. سيتم فتح نافذة الطباعة تلقائياً.
                    </div>
                    
                    <div className="max-h-[40vh] overflow-y-auto border border-gray-100 rounded-2xl p-4 bg-gray-50/50 custom-scrollbar">
                      <p className="text-xs text-gray-400 mb-4 text-center">--- معاينة سريعة للبيانات ({filteredReportData.length} موظف) ---</p>
                      {filteredReportData.map(([name, sessions]) => (
                        <div key={name} className="mb-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                          <div className="font-black text-sm text-indigo-600 mb-1">{name}</div>
                          <div className="text-[10px] text-gray-500">{sessions.length} حصص دعم مسجلة</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 no-print">
                      <button 
                        onClick={() => setIsGenerating(false)}
                        className="flex-1 bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-black hover:bg-gray-200 transition-all"
                      >
                        رجوع
                      </button>
                      <button 
                        onClick={() => setShouldPrint(true)}
                        className="flex-[2] flex items-center justify-center gap-3 bg-indigo-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                      >
                        <Printer className="w-5 h-5" />
                        تأكيد الطباعة
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

    {/* Hidden Print Content Section */}
    {isGenerating && (
      <div className="print-only-container" dir="rtl">
          <style dangerouslySetInnerHTML={{ __html: `
            @media screen {
              .print-only-container { display: none !important; }
            }
            @media print {
              @page { 
                margin: 0; 
                size: portrait;
              }
              
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                background: white !important;
                overflow: visible !important;
              }

              .no-print {
                display: none !important;
              }

              .print-only-container {
                display: block !important;
                position: relative !important;
                width: 100% !important;
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              .report-page {
                display: block !important;
                width: 100% !important;
                padding: 0.5cm 1.5cm 1.5cm 1.5cm !important;
                page-break-inside: avoid !important;
                background: white !important;
                clear: both !important;
                min-height: 100vh !important;
              }

              .report-page:not(:last-child) {
                page-break-after: always !important;
                break-after: page !important;
              }

              table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 1.5rem !important; table-layout: auto !important; }
              th, td { border: 1px solid black !important; padding: 8px !important; text-align: right !important; word-break: break-word !important; color: black !important; }
              th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; font-weight: bold !important; }
              .report-header { border-bottom: 2px solid black !important; margin-bottom: 2rem !important; padding-bottom: 1rem !important; margin-top: 0 !important; }
              .teacher-info-box { border: 1px solid black !important; padding: 1rem !important; margin-bottom: 2rem !important; display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 1rem !important; }
              
              h1, h2, h3, p, span, div { color: black !important; }
            }
          `}} />
          
          {filteredReportData.map(([staffName, sessions], index, array) => {
            const teacherSessions = sessions as EducationalSupport[];
            const teacherInfo = staff.find(s => s.fullName === staffName);
            return (
              <div key={staffName} className="report-page">
                {/* Header */}
                <div className="report-header">
                  {schoolData.logo && (
                    <img 
                      src={schoolData.logo} 
                      alt="Logo" 
                      className="w-full h-auto max-h-32 object-contain mx-auto mb-4"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="text-center">
                    <h1 className="text-xl font-bold mb-1">جدول حصص الدعم التربوي للأسدوس {selectedSemester}</h1>
                    <p className="text-sm">الموسم الدراسي: {schoolData.academicYear}</p>
                  </div>
                </div>

                  {/* Teacher Info */}
                  <div className="teacher-info-box">
                    <div>
                      <p className="text-xs font-bold">الاسم الكامل: <span className="font-normal">{staffName}</span></p>
                      <p className="text-xs font-bold">المادة: <span className="font-normal">{teacherInfo?.specialization || '---'}</span></p>
                    </div>
                    <div>
                      <p className="text-xs font-bold">رقم التأجير: <span className="font-normal">{teacherInfo?.ppr || '---'}</span></p>
                      <p className="text-xs font-bold">الإطار: <span className="font-normal">{teacherInfo?.cadre || '---'}</span></p>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="text-sm">
                    <thead>
                      <tr>
                        <th className="w-24">اليوم</th>
                        <th className="w-32">التوقيت</th>
                        <th>الفوج / القسم</th>
                        <th>القاعة</th>
                        <th>ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((session) => (
                        <tr key={session.id}>
                          <td className="font-bold">{getDayName(session.date)}</td>
                          <td>{session.startTime} - {session.endTime}</td>
                          <td>{session.studentGroup}</td>
                          <td>{session.room}</td>
                          <td className="text-xs italic">{session.notes || '---'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Footer */}
                  <div className={`flex justify-between mt-12 text-xs font-bold ${(!printingTeacherName && array.length > 1) ? 'mb-16' : ''}`}>
                    <p>توقيع الأستاذ(ة)</p>
                    <p>توقيع ناظر الدروس</p>
                    <p>توقيع مدير المؤسسة</p>
                  </div>
                </div>
              );
            })}
          </div>
      )}
    </>
  );
};
