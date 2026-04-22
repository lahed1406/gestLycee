
import React, { useState, useRef, useMemo } from 'react';
import { TimetableActivity, SchoolData, StaffMember, SchoolStructure, Student } from '../types';
import { KINGDOM_LOGO_URL, toTifinagh } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { StaffPersonalSheet } from './StaffPersonalSheet';
import { 
  FileUp, 
  Search, 
  Calendar, 
  User, 
  Users, 
  Home,
  Printer,
  Download,
  Trash2,
  Filter,
  Zap,
  Plus,
  Check,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimetableManagementProps {
  activities: TimetableActivity[];
  onUpdate: (activities: TimetableActivity[]) => void;
  schoolData: SchoolData;
  onUpdateSchoolData: (data: SchoolData) => void;
  staff: StaffMember[];
  structures: SchoolStructure[];
  students: Student[];
}

const DAYS_MAP: Record<string, string> = {
  'lundi': 'الإثنين',
  'Mardi': 'الثلاثاء',
  'Mercredi': 'الأربعاء',
  'Jeudi': 'الخميس',
  'Vendredi': 'الجمعة',
  'Samedi': 'السبت',
};

const DAYS_ORDER = ['lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const DEFAULT_HOUR_LABELS = [
  '09h - 08h', '10h - 09h', '11h - 10h', '12h - 11h',
  '15h - 14h', '16h - 15h', '17h - 16h', '18h - 17h'
];

const VIBRANT_COLORS = [
  '#ffeb3b', '#2196f3', '#9c27b0', '#00bcd4', '#4caf50', 
  '#f44336', '#607d8b', '#8bc34a', '#ff9800', '#3f51b5', 
  '#e91e63', '#ff5722', '#795548', '#009688', '#673ab7'
];

export const TimetableManagement: React.FC<TimetableManagementProps> = ({ 
  activities, 
  onUpdate, 
  schoolData, 
  onUpdateSchoolData, 
  staff,
  structures,
  students
}) => {
  const [filterType, setFilterType] = useState<'teacher' | 'class' | 'room' | 'availability' | 'support'>('teacher');
  const [showPersonalSheet, setShowPersonalSheet] = useState(false);
  const [showSupportScheduler, setShowSupportScheduler] = useState(false);
  const [supportTeacher, setSupportTeacher] = useState('');
  const [supportClass, setSupportClass] = useState('');
  const [supportTargetHours, setSupportTargetHours] = useState(21);
  const [filterValue, setFilterValue] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [printInColor, setPrintInColor] = useState(true);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const [isMasterPrinting, setIsMasterPrinting] = useState(false);
  const [masterType, setMasterType] = useState<'teacher' | 'class' | 'room' | 'empty'>('teacher');
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hourLabels = schoolData.hourLabels || DEFAULT_HOUR_LABELS;

  const isDarkColor = (color: string) => {
    if (!color || color === 'white' || color === 'transparent') return false;
    const hex = color.replace('#', '');
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 140; // Slightly higher threshold for better contrast
  };

  React.useEffect(() => {
    const handleAfterPrint = () => {
      setIsBulkPrinting(false);
      setIsMasterPrinting(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const uniqueTeachers = useMemo(() => Array.from(new Set(activities.map(a => a.teacher))).sort(), [activities]);

  const groupedTeachers = useMemo<Record<string, string[]>>(() => {
    const groups: Record<string, string[]> = {};
    
    uniqueTeachers.forEach(tName => {
      // Try to find the teacher in the staff list to get their specialization
      const staffMember = staff.find(s => s.fullName === tName || s.fullNameFr === tName);
      const spec = staffMember?.specialization || 'غير محدد';
      
      if (!groups[spec]) groups[spec] = [];
      groups[spec].push(tName);
    });

    const sortedGroups: Record<string, string[]> = {};
    Object.keys(groups).sort().forEach(key => {
      sortedGroups[key] = groups[key].sort((a, b) => a.localeCompare(b, 'ar'));
    });
    return sortedGroups;
  }, [uniqueTeachers, staff]);

  const renderTeacherOptions = (teacherList?: string[], showHours: boolean = false) => {
    // If a specific list is provided (like teachersUnder21), we filter the grouped structure
    const sourceGroups: Record<string, string[]> = teacherList 
      ? Object.entries(groupedTeachers).reduce((acc, [spec, names]) => {
          const filtered = (names as string[]).filter(n => teacherList.includes(n));
          if (filtered.length > 0) acc[spec] = filtered;
          return acc;
        }, {} as Record<string, string[]>)
      : groupedTeachers;

    return Object.entries(sourceGroups).map(([spec, names]) => (
      <optgroup key={spec} label={spec}>
        {(names as string[]).map(t => (
          <option key={t} value={t}>
            {t} {showHours ? `(${getTeacherHours(t)} ساعة)` : ''}
          </option>
        ))}
      </optgroup>
    ));
  };
  const uniqueClasses = useMemo(() => Array.from(new Set(activities.map(a => a.studentSet))).sort(), [activities]);
  const uniqueRooms = useMemo(() => Array.from(new Set(activities.map(a => a.room))).sort(), [activities]);

  const getCellColor = (act: TimetableActivity) => {
    if (!printInColor) return 'white';
    if (act.subject === 'المواكبة والدعم') return '#3b82f6'; // Bright blue for support
    if (act.subject.includes('إضافية')) return '#10b981'; // Emerald for extra
    if (filterType === 'teacher') {
      const index = uniqueClasses.indexOf(act.studentSet);
      return VIBRANT_COLORS[index % VIBRANT_COLORS.length];
    } else {
      const index = uniqueTeachers.indexOf(act.teacher);
      return VIBRANT_COLORS[index % VIBRANT_COLORS.length];
    }
  };

  const getTeacherHours = (teacher: string) => {
    return activities.filter(a => a.teacher === teacher && a.subject !== 'المواكبة والدعم' && !a.subject.includes('إضافية')).length;
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Try to detect encoding
        // First try UTF-8
        let text = new TextDecoder('utf-8').decode(uint8Array);
        
        // Heuristic: if there are many replacement characters, it's likely Windows-1256 (common for Arabic CSVs)
        const replacementCharCount = (text.match(/\ufffd/g) || []).length;
        if (replacementCharCount > 2) {
          try {
            const win1256Text = new TextDecoder('windows-1256').decode(uint8Array);
            // check if it looks better (less garbled)
            if ((win1256Text.match(/\ufffd/g) || []).length < replacementCharCount) {
              text = win1256Text;
            }
          } catch (e) {
            console.error("Windows-1256 decoding failed", e);
          }
        }

        if (!text || text.trim() === "") {
          alert("الملف فارغ أو غير صالح");
          return;
        }

        const lines = text.split(/\r?\n/);
        const newActivities: TimetableActivity[] = [];

        // Detect delimiter: check first line
        const sampleLine = lines[0] || "";
        const semicolonCount = (sampleLine.match(/;/g) || []).length;
        const commaCount = (sampleLine.match(/,/g) || []).length;
        const tabCount = (sampleLine.match(/\t/g) || []).length;
        
        let delimiter = ";";
        if (tabCount > semicolonCount && tabCount > commaCount) {
          delimiter = "\t";
        } else if (commaCount > semicolonCount) {
          delimiter = ",";
        }

        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(delimiter);
          // We need at least 8 parts
          if (parts.length < 8) continue;

          newActivities.push({
            id: parts[0]?.trim() || Math.random().toString(36).substr(2, 9),
            day: parts[1]?.trim() || "",
            hour: parts[2]?.trim() || "",
            studentSet: parts[3]?.trim() || "",
            subject: parts[4]?.trim() || "",
            teacher: parts[5]?.trim() || "",
            tag: parts[6]?.trim() || "",
            room: parts[7]?.trim() || "",
            comments: parts[8]?.trim() || ""
          });
        }

        if (newActivities.length > 0) {
          onUpdate(newActivities);
          
          // Calculate teachers under 21h
          const teachers = Array.from(new Set(newActivities.map(a => a.teacher)));
          const under21Count = teachers.filter(t => newActivities.filter(a => a.teacher === t).length < 21).length;
          
          alert(`تم استيراد ${newActivities.length} حصة بنجاح.\nتم العثور على ${under21Count} أستاذ يشتغلون أقل من 21 ساعة.`);
        } else {
          alert("لم يتم العثور على بيانات صالحة في الملف. يرجى التأكد من أن الملف يستخدم (;) أو (,) أو Tab كفاصل بين الأعمدة.");
        }
      } catch (error) {
        console.error("CSV Import Error:", error);
        alert("حدث خطأ أثناء استيراد الملف. يرجى التأكد من صيغة الملف.");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
      alert("حدث خطأ أثناء قراءة الملف.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    
    // Read as ArrayBuffer to handle encoding manually
    reader.readAsArrayBuffer(file);
  };

  const getFilteredActivities = (val: string) => {
    if (!val) return [];
    if (filterType === 'teacher') return activities.filter(a => a.teacher === val);
    if (filterType === 'class') {
      // Merge G1/G2 into the main class view
      return activities.filter(a => a.studentSet === val || a.studentSet.startsWith(val + ':'));
    }
    if (filterType === 'room') return activities.filter(a => a.room === val);
    return [];
  };

  const currentFilteredActivities = useMemo(() => getFilteredActivities(filterValue), [activities, filterType, filterValue]);

  const getCellContent = (acts: TimetableActivity[], day: string, hourLabel: string, index: number) => {
    const isMorning = index < 4;
    const dayKey = isMorning ? `${day}_m` : `${day}_s`;
    
    // Map index to H1-H4
    const hKey = `H${(index % 4) + 1}`;

    return acts.filter(a => a.day.toLowerCase() === dayKey.toLowerCase() && a.hour === hKey);
  };

  const getAssignedList = (acts: TimetableActivity[]) => {
    if (filterType === 'teacher') {
      const classes = Array.from(new Set(acts.map(a => a.studentSet))).sort();
      return classes.join(' + ');
    } else if (filterType === 'class') {
      const teachersBySubject: Record<string, string> = {};
      acts.forEach(a => {
        teachersBySubject[a.subject] = a.teacher;
      });
      return Object.entries(teachersBySubject).map(([sub, teacher]) => ({ sub, teacher }));
    }
    return null;
  };

  const handlePrint = () => {
    setIsBulkPrinting(false);
    setTimeout(() => window.print(), 100);
  };

  const handleBulkPrint = () => {
    setIsMasterPrinting(false);
    setIsBulkPrinting(true);
    setTimeout(() => window.print(), 100);
  };

  const handleMasterPrint = (type: 'teacher' | 'class' | 'room' | 'empty') => {
    setMasterType(type);
    setIsBulkPrinting(false);
    setIsMasterPrinting(true);
    setTimeout(() => window.print(), 100);
  };

  const renderMasterTimetable = () => {
    const items = masterType === 'teacher' ? uniqueTeachers : masterType === 'class' ? uniqueClasses : uniqueRooms;
    const firstHalf = DAYS_ORDER.slice(0, 3);
    const secondHalf = DAYS_ORDER.slice(3, 6);

    const renderTable = (days: string[], titleSuffix: string) => (
      <div className="space-y-4 print:page-break-after-always print:pt-0">
        {/* Compact Formal Header for Master Reports */}
        <div className="flex justify-between items-center border-b border-gray-400 pb-0.5 mb-1">
          <div className="text-center text-[7px] leading-tight">
            <p className="font-black">المملكة المغربية</p>
            <p>وزارة التربية الوطنية والتعليم الأولي والرياضة</p>
            <p>أكاديمية: {schoolData.region} | مديرية: {schoolData.city}</p>
            <p className="font-bold">المؤسسة: {schoolData.name}</p>
          </div>
          <div className="text-center">
            <img 
              src={KINGDOM_LOGO_URL} 
              alt="Logo" 
              className="h-8 w-8 object-contain"
              referrerPolicy="no-referrer"
            />
            <h2 className="text-[8px] font-black bg-gray-100 px-2 py-0.5 rounded border border-gray-300 mt-0.5">
              {masterType === 'teacher' ? 'مجمل جداول حصص الأساتذة' : masterType === 'class' ? 'مجمل جداول حصص الأقسام' : 'مجمل جداول حصص القاعات'}
              <span className="text-indigo-600 mr-1">({titleSuffix})</span>
            </h2>
          </div>
          <div className="text-center text-[7px] leading-tight font-['Noto_Sans_Tifinagh']">
            <p>ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ</p>
            <p>ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ</p>
            <p>ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ {toTifinagh(schoolData.region.replace('جهة ', ''))} | ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ ⵏ {toTifinagh(schoolData.city.replace('مديرية ', '').replace('المديرية الإقليمية لـ ', '').replace('المديرية الإقليمية ل', ''))}</p>
            <p className="font-bold">ⵜⴰⵙⵏⵓⵔⴰⵢⵜ: {toTifinagh(schoolData.name)}</p>
          </div>
        </div>

        <table className="w-full border-collapse text-[8px] text-center table-fixed border-2 border-gray-900">
          <thead>
            <tr className="bg-white text-black">
              <th className="border border-gray-900 p-1 w-20 font-black text-[9px]">
                {masterType === 'teacher' ? 'الأستاذ(ة)' : masterType === 'class' ? 'القسم' : 'القاعة'}
              </th>
              {days.map(day => (
                <th key={day} colSpan={8} className="border border-gray-900 p-1 font-black bg-white text-[10px]">
                  {DAYS_MAP[day]}
                </th>
              ))}
            </tr>
            <tr className="bg-white text-black">
              <th className="border border-gray-900 p-0.5"></th>
              {days.map(day => 
                hourLabels.map((h, i) => (
                  <th key={`${day}-${i}`} className="border border-gray-900 p-0.5 text-[6px] font-bold text-black">
                    {h.split(' - ')[1]}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, rowIdx) => (
              <tr key={item} className={cn(
                "h-20 print:h-10 transition-colors break-inside-avoid",
                rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
              )}>
                <td className="border border-gray-900 p-1 font-black bg-white overflow-hidden text-[8px] leading-tight">
                  {item}
                </td>
                {days.map(day => 
                  hourLabels.map((_, i) => {
                    const isMorning = i < 4;
                    const dayKey = isMorning ? `${day}_m` : `${day}_s`;
                    const hKey = `H${(i % 4) + 1}`;
                    const acts = activities.filter(a => 
                      a.day.toLowerCase() === dayKey.toLowerCase() && 
                      a.hour === hKey && 
                      (masterType === 'teacher' ? a.teacher === item : masterType === 'class' ? (a.studentSet === item || a.studentSet.startsWith(item + ':')) : a.room === item)
                    );
                    
                    return (
                      <td key={`${day}-${i}`} className="border border-gray-900 p-0 relative group">
                        <div className="vertical-text-container h-full w-full flex items-center justify-center py-1">
                          {acts.map((a, idx) => (
                            <div key={idx} className="vertical-text text-[7px] font-bold leading-none">
                              {masterType === 'teacher' ? a.studentSet : masterType === 'class' ? a.teacher : a.teacher}
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    return (
      <div className="print-content space-y-4 print:pt-0 print:scale-95 origin-top">
        {renderTable(firstHalf, "الإثنين - الأربعاء")}
        {renderTable(secondHalf, "الخميس - السبت")}
        
        {/* Print Footer for Master Timetable */}
        <div className="flex justify-between items-end pt-4 mt-4">
          <div className="text-center space-y-1">
            <p className="font-black text-[10px]">توقيع الحارس العام</p>
            <div className="w-48 h-10"></div>
          </div>
          <div className="text-center space-y-1">
            <p className="font-black text-[10px]">خاتم و توقيع السيد مدير المؤسسة</p>
            <div className="w-48 h-10 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-gray-300 text-[8px]">
              {schoolData.director}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyRoomsReport = () => (
    <div className="print-content space-y-8">
      {/* Formal Header */}
      <div className="flex justify-between items-center border-b-2 border-gray-900 pb-4 mb-6">
        <div className="text-center text-[10px] leading-tight space-y-1">
          <p className="font-black">المملكة المغربية</p>
          <p>وزارة التربية الوطنية والتعليم الأولي والرياضة</p>
          <p>أكاديمية: {schoolData.region}</p>
          <p>مديرية: {schoolData.city}</p>
          <p className="font-bold">المؤسسة: {schoolData.name}</p>
        </div>
        <div className="text-center">
          <img 
            src={KINGDOM_LOGO_URL} 
            alt="Logo" 
            className="h-16 w-16 object-contain mb-2"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-2xl font-black border-2 border-gray-900 text-black px-8 py-2 rounded-2xl shadow-lg">
            لائحة القاعات الشاغرة
          </h2>
          <p className="text-sm font-bold mt-2 text-gray-600">الموسم الدراسي: {schoolData.academicYear}</p>
        </div>
        <div className="text-center text-[10px] leading-tight space-y-1 font-['Noto_Sans_Tifinagh']">
          <p>ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ</p>
          <p>ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ</p>
          <p>ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ {toTifinagh(schoolData.region.replace('جهة ', ''))}</p>
          <p>ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ ⵏ {toTifinagh(schoolData.city.replace('مديرية ', '').replace('المديرية الإقليمية لـ ', '').replace('المديرية الإقليمية ل', ''))}</p>
          <p className="font-bold">ⵜⴰⵙⵏⵓⵔⴰⵢⵜ: {toTifinagh(schoolData.name)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border-2 border-gray-900 shadow-xl">
        <table className="w-full border-collapse text-[10px] text-center">
          <thead>
            <tr className="bg-white text-black">
              <th className="border-b-2 border-gray-900 p-4 w-40 font-black text-sm">الحصة / اليوم</th>
              {DAYS_ORDER.map(day => (
                <th key={day} className="border-b-2 border-gray-900 p-4 font-black text-sm bg-white">
                  {DAYS_MAP[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hourLabels.map((h, i) => (
              <tr key={i} className={cn(
                "min-h-[60px] transition-colors",
                i % 2 === 0 ? "bg-white" : "bg-slate-50"
              )}>
                <td className="border border-gray-200 p-4 font-black bg-gray-100/50 text-gray-700 border-r-2 border-r-gray-900">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-indigo-600">{i < 4 ? 'صباحاً' : 'مساءً'}</span>
                    <span className="text-lg">{h}</span>
                  </div>
                </td>
                {DAYS_ORDER.map(day => {
                  const isMorning = i < 4;
                  const dayKey = isMorning ? `${day}_m` : `${day}_s`;
                  const hKey = `H${(i % 4) + 1}`;
                  const occupiedRooms = activities
                    .filter(a => a.day.toLowerCase() === dayKey.toLowerCase() && a.hour === hKey)
                    .map(a => a.room);
                  const empty = uniqueRooms.filter(r => !occupiedRooms.includes(r)).sort();
                  
                  return (
                    <td key={day} className="border border-gray-200 p-3 align-top">
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {empty.length > 0 ? (
                          empty.map(r => (
                            <span key={r} className="bg-white px-2 py-1 rounded-lg border border-gray-200 text-[9px] font-bold text-emerald-700 shadow-sm hover:border-emerald-300 transition-colors">
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="text-red-400 text-[8px] italic font-bold mt-4">لا توجد قاعات شاغرة</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-400 font-bold pt-4">
        <p>عدد القاعات الإجمالي: {uniqueRooms.length}</p>
        <p>نظام GestLycee v10.0</p>
      </div>
    </div>
  );

  const renderSingleTimetable = (val: string, acts: TimetableActivity[], isBulk = false) => (
    <div key={val} className={cn(
      "bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-6 print:p-0 print:shadow-none print:border-none print:m-0 print:scale-95 origin-top print:bg-white print-content print:space-y-1",
      isBulk && "print:page-break-after-always"
    )}>
      {/* Formal Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4 print:pb-0">
        <div className="text-center space-y-1 print:space-y-0">
          <h1 className="text-sm font-black print:text-[11px]">المملكة المغربية</h1>
          <p className="text-[10px] font-bold print:text-[9px]">وزارة التربية الوطنية والتعليم الأولي والرياضة</p>
          <p className="text-[10px] print:text-[8px]">أكاديمية: {schoolData.region}</p>
          <p className="text-[10px] print:text-[8px]">مديرية: {schoolData.city}</p>
          <p className="text-[10px] print:text-[8px]">المؤسسة: {schoolData.name}</p>
        </div>
        <div className="flex flex-col items-center">
           <img 
             src={KINGDOM_LOGO_URL} 
             alt="Logo" 
             className="w-16 h-16 object-contain mb-2 print:w-10 print:h-10 print:mb-0" 
             referrerPolicy="no-referrer"
           />
        </div>
        <div className="text-center space-y-1 print:space-y-0 font-['Noto_Sans_Tifinagh']">
          <p className="text-[10px] font-black print:text-[9px]">ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ</p>
          <p className="text-[9px] font-bold print:text-[8px]">ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ</p>
          <p className="text-[9px] print:text-[8px]">ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ {toTifinagh(schoolData.region.replace('جهة ', ''))}</p>
          <p className="text-[9px] print:text-[8px]">ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ ⵏ {toTifinagh(schoolData.city.replace('مديرية ', '').replace('المديرية الإقليمية لـ ', '').replace('المديرية الإقليمية ل', ''))}</p>
          <p className="text-[9px] font-bold print:text-[8px]">ⵜⴰⵙⵏⵓⵔⴰⵢⵜ: {toTifinagh(schoolData.name)}</p>
        </div>
      </div>

      {filterType === 'teacher' ? (
        <div className="text-center space-y-4 print:space-y-0">
           <div className="space-y-1 print:space-y-0">
             <p className="font-bold text-sm print:text-[9px]">من مدير {schoolData.name}</p>
             <p className="font-bold text-sm print:text-[9px]">إلى</p>
             <p className="font-bold text-sm print:text-[9px]">السيد(ة) : {val}</p>
           </div>
           <div className="border border-gray-900 p-1.5 inline-block font-black print:p-0.5 print:text-[8px] print:mt-0.5">
             الموضوع : تسليم جدول الحصص برسم الموسم الدراسي {schoolData.academicYear}
           </div>
           {!isBulk && (
             <div className="py-2 space-y-2 print:py-0.5 print:space-y-0.5">
              <p className="font-bold text-base print:text-[10px]">سلام تام بوجود مولانا الإمام دام له النصر و التأييد.</p>
              <p className="text-xs leading-tight print:text-[9px]">
                وبعد، ففي إطار تنظيم الدخول المدرسي للموسم الدراسي أعلاه، يشرفني إخباركم أنه تم اختياركم للقيام بمهمة التدريس حسب الجدول الزمني التالي :
              </p>
            </div>
           )}
        </div>
      ) : (
        <div className="text-center space-y-2 print:space-y-1">
          <h2 className="text-2xl font-black border-b-4 border-double border-gray-900 inline-block pb-1 print:text-lg">
            {filterType === 'class' ? `جدول حصص القسم: ${val}` : `جدول حصص القاعة: ${val}`}
          </h2>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="relative overflow-x-auto print:overflow-visible">
        <div className="absolute -top-8 left-0 bg-white text-black border-2 border-gray-900 px-3 py-1 rounded-t-lg text-xs font-black print:-top-5 print:text-[8px]">
          {acts.length} h
        </div>
        <table className="w-full border-collapse border-2 border-gray-900 text-center text-[12px] print:text-[11px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-2 border-gray-900 p-2 w-24 font-black print:p-1">اليوم</th>
              {hourLabels.map(h => (
                <th key={h} className="border-2 border-gray-900 p-2 font-black print:p-1">{h}</th>
              ))}
              <th className="border-2 border-gray-900 p-2 bg-white text-black w-16 print:p-1 print:bg-white print:text-black">
                {acts.length} h
              </th>
            </tr>
          </thead>
          <tbody>
            {DAYS_ORDER.map(dayKey => (
              <tr key={dayKey} className="h-16 print:h-12">
                <td className="border-2 border-gray-900 p-2 font-black bg-gray-50 text-[11px] print:text-[10px] print:p-1">
                  {DAYS_MAP[dayKey]}
                </td>
                {hourLabels.map((hourLabel, idx) => {
                  const cellActivities = getCellContent(acts, dayKey, hourLabel, idx);
                  return (
                    <td key={idx} className="border-2 border-gray-900 p-0 relative min-w-[70px] print:min-w-0">
                      {cellActivities.map((act, actIdx) => {
                        const bgColor = getCellColor(act);
                        const useWhiteText = isDarkColor(bgColor);
                        return (
                          <div key={actIdx} 
                            style={{ backgroundColor: bgColor }}
                            className={cn(
                              "h-full w-full flex flex-col justify-center items-center p-1",
                              useWhiteText ? "text-white" : "text-black"
                            )}
                          >
                            <p className="font-black leading-tight text-[11px] print:text-[10px]">{act.subject}</p>
                            <div className="flex flex-col text-[10px] print:text-[9px] font-bold opacity-90">
                              {filterType !== 'class' && <span>{act.studentSet}</span>}
                              {filterType !== 'teacher' && <span>{act.teacher}</span>}
                              {filterType !== 'room' && <span>ق: {act.room}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
                <td className="border-2 border-gray-900 p-2 bg-white text-black print:p-1 print:bg-white print:text-black"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Additional Info Lists */}
      <div className="space-y-4 pt-2 print:space-y-0.5 print:pt-0.5">
        {filterType === 'teacher' && (
          <div className="border-2 border-gray-900 rounded-xl overflow-hidden print:rounded-lg print:border">
            <div className="bg-gray-100 p-2 border-b-2 border-gray-900 text-center font-black text-xs print:p-0.5 print:text-[8px] print:border-b">
              لائحة الأقسام المسندة للأستاذ(ة)
            </div>
            <div className="p-3 text-center font-bold text-sm tracking-widest print:p-0.5 print:text-[8px]">
              {getAssignedList(acts) as string}
            </div>
          </div>
        )}

        {filterType === 'class' && (
          <div className="border-2 border-gray-900 rounded-xl overflow-hidden print:rounded-lg">
            <div className="bg-gray-100 p-2 border-b-2 border-gray-900 text-center font-black text-xs print:p-1 print:text-[9px]">
              لائحة الأساتذة المسندين حسب المواد
            </div>
            <div className="grid grid-cols-3">
              {(getAssignedList(acts) as {sub: string, teacher: string}[]).map((item, idx) => (
                <div key={idx} className="flex border-b border-l border-gray-300 last:border-l-0">
                  <div className="w-1/3 bg-gray-50 p-2 font-black text-[10px] border-l border-gray-300 print:p-1 print:text-[8px]">{item.sub}</div>
                  <div className="w-2/3 p-2 font-bold text-[10px] print:p-1 print:text-[8px]">{item.teacher}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {filterType === 'teacher' && !isBulk && (
        <div className="pt-4 space-y-2 print:pt-0.5 print:space-y-0">
          <p className="text-sm leading-relaxed print:text-[8px]">
            لذا يتعين عليكم الالتزام بجدول الحصص المسند إليكم، راجين منكم إيلاء هذه العملية ما تستحقه من العناية و الاهتمام المعهودين فيكم.
          </p>
          <p className="text-center font-black text-lg print:text-[9px]">و تقبلو أزكى التحيات و السلام.</p>
        </div>
      )}

      {/* Print Footer */}
      <div className="flex justify-between items-end pt-6 mt-6 print:pt-2 print:mt-2">
        <div className="text-center space-y-1">
          <p className="font-black text-sm print:text-[10px]">توقيع {filterType === 'teacher' ? 'الأستاذ(ة)' : 'الحارس العام'}</p>
          <div className="w-48 h-16 print:h-10"></div>
        </div>
        <div className="text-center space-y-1">
          <p className="font-black text-sm print:text-[10px]">خاتم و توقيع السيد مدير المؤسسة</p>
          <div className="w-48 h-16 print:h-10 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-gray-300 text-[10px] print:text-[8px]">
            {schoolData.director}
          </div>
        </div>
      </div>
    </div>
  );

  const handleAutoSupport = () => {
    if (!supportTeacher || !supportClass) {
      alert('يرجى اختيار الأستاذ والقسم أولاً');
      return;
    }

    const currentHours = getTeacherHours(supportTeacher);
    const needed = supportTargetHours - currentHours;

    if (needed <= 0) {
      alert(`الأستاذ يشتغل فعلياً ${currentHours} ساعة (أكثر من أو يساوي ${supportTargetHours} ساعة)`);
      return;
    }

    const newActivities = [...activities];
    let addedCount = 0;

    // Try to find slots
    for (const day of DAYS_ORDER) {
      for (let i = 0; i < hourLabels.length; i++) {
        if (addedCount >= needed) break;

        const isMorning = i < 4;
        const dayKey = isMorning ? `${day}_m` : `${day}_s`;
        const hKey = `H${(i % 4) + 1}`;

        // Check if teacher is free
        const teacherBusy = newActivities.some(a => a.teacher === supportTeacher && a.day.toLowerCase() === dayKey.toLowerCase() && a.hour === hKey);
        if (teacherBusy) continue;

        // Check if class is free
        const classBusy = newActivities.some(a => (a.studentSet === supportClass || a.studentSet.startsWith(supportClass + ':')) && a.day.toLowerCase() === dayKey.toLowerCase() && a.hour === hKey);
        if (classBusy) continue;

        // Find a free room (prefer teacher's usual room if possible, otherwise any)
        const teacherRooms = Array.from(new Set(activities.filter(a => a.teacher === supportTeacher).map(a => a.room)));
        let selectedRoom = teacherRooms[0] || uniqueRooms[0];
        
        const roomBusy = newActivities.some(a => a.room === selectedRoom && a.day.toLowerCase() === dayKey.toLowerCase() && a.hour === hKey);
        if (roomBusy) {
          // Try other rooms
          const freeRoom = uniqueRooms.find(r => !newActivities.some(a => a.room === r && a.day.toLowerCase() === dayKey.toLowerCase() && a.hour === hKey));
          if (freeRoom) {
            selectedRoom = freeRoom;
          } else {
            continue; // No room available
          }
        }

        // Add support session
        newActivities.push({
          id: Math.random().toString(36).substr(2, 9),
          day: dayKey,
          hour: hKey,
          studentSet: supportClass,
          subject: 'المواكبة والدعم',
          teacher: supportTeacher,
          tag: 'Support',
          room: selectedRoom,
          comments: 'برمجة آلية'
        });
        addedCount++;
      }
      if (addedCount >= needed) break;
    }

    if (addedCount > 0) {
      onUpdate(newActivities);
      alert(`تمت إضافة ${addedCount} حصة دعم للأستاذ ${supportTeacher} مع القسم ${supportClass}`);
    } else {
      alert('لم يتم العثory على أي حصص متوافقة لبرمجة الدعم');
    }
  };

  const renderSupportScheduler = () => {
    const teachersUnder21 = uniqueTeachers.filter(t => getTeacherHours(t) < 21).sort((a, b) => getTeacherHours(a) - getTeacherHours(b));

    return (
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-8">
        <div className="flex justify-between items-center">
          <div className="text-right space-y-1">
            <h3 className="text-2xl font-black text-gray-900">برمجة حصص الدعم الآلية</h3>
            <p className="text-sm text-gray-500 font-bold">تكملة حصص الأساتذة الذين يشتغلون أقل من 21 ساعة</p>
          </div>
          <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
            <span className="text-xs font-black text-indigo-600">هدف الساعات: 21 ساعة</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase mr-1">الأستاذ (أقل من 21 ساعة)</label>
            <select 
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-sm appearance-none"
              value={supportTeacher}
              onChange={(e) => setSupportTeacher(e.target.value)}
            >
              <option value="">-- اختر أستاذا --</option>
              {renderTeacherOptions(teachersUnder21, true)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase mr-1">القسم المستهدف</label>
            <select 
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-sm appearance-none"
              value={supportClass}
              onChange={(e) => setSupportClass(e.target.value)}
            >
              <option value="">-- اختر قسما --</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAutoSupport}
              disabled={!supportTeacher || !supportClass}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-5 h-5" />
              بدء البرمجة الآلية
            </motion.button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h4 className="text-sm font-black text-gray-400 mb-4 uppercase">قائمة الأساتذة المعنيين</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachersUnder21.map(t => {
              const hours = getTeacherHours(t);
              const diff = 21 - hours;
              return (
                <div key={t} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{t}</p>
                    <p className="text-[10px] text-gray-500 font-bold">الحصص الحالية: {hours} ساعة</p>
                  </div>
                  <div className="text-left">
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-[10px] font-black">
                      نقص: {diff} س
                    </span>
                  </div>
                </div>
              );
            })}
            {teachersUnder21.length === 0 && (
              <div className="col-span-full py-8 text-center text-gray-400 font-bold italic">
                جميع الأساتذة يشتغلون 21 ساعة أو أكثر.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAvailabilityGrid = () => {
    if (!selectedTeacher && selectedClasses.length === 0 && !selectedRoom) {
      return (
        <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center space-y-4">
          <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-10 h-10 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-gray-900">البحث عن حصة متاحة</h3>
            <p className="text-gray-500 font-bold max-w-md mx-auto">قم باختيار الأستاذ والأقسام والقاعة للتحقق من الأوقات التي يكونون فيها جميعاً متاحين في نفس الوقت.</p>
          </div>
        </div>
      );
    }

    const handlePrintAvailability = () => {
      window.print();
    };

    const handleExportToWord = () => {
      const reportElement = document.querySelector('.availability-report');
      if (!reportElement) return;

      // Clone the element to modify it for export
      const clone = reportElement.cloneNode(true) as HTMLElement;
      
      // Remove buttons and non-print elements
      clone.querySelectorAll('.no-print').forEach(el => el.remove());

      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>تقرير البحث عن حصة متاحة</title>
          <style>
            body { font-family: 'Arial', sans-serif; direction: rtl; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid black; padding: 8px; text-align: center; font-size: 10pt; }
            .bg-indigo-900 { background-color: #1e1b4b; color: white; }
            .bg-emerald-500 { background-color: #10b981; color: white; }
            .bg-emerald-50 { background-color: #ecfdf5; }
            .text-emerald-600 { color: #059669; }
            .text-indigo-700 { color: #4338ca; }
            .font-black { font-weight: 900; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .rounded-full { border-radius: 9999px; }
            .p-1 { padding: 4px; }
            .m-1 { margin: 4px; }
            .flex { display: flex; }
            .flex-wrap { flex-wrap: wrap; }
            .gap-1 { gap: 4px; }
            .justify-center { justify-content: center; }
            .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
            .border { border: 1px solid #e5e7eb; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .text-[10px] { font-size: 8pt; }
            .text-[8px] { font-size: 7pt; }
            .text-[7px] { font-size: 6pt; }
            .text-[6px] { font-size: 5pt; }
          </style>
        </head>
        <body>
          ${clone.innerHTML}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
      });

      saveAs(blob, `تقرير_البحث_${selectedTeacher || 'عام'}.doc`);
    };

    const handleExportToExcel = () => {
      const data: any[][] = [];
      
      // Header row
      const header = ["اليوم", ...hourLabels];
      data.push(header);

      // Rows for each day
      DAYS_ORDER.forEach(dayKey => {
        const row: any[] = [DAYS_MAP[dayKey]];
        
        hourLabels.forEach((hourLabel, idx) => {
          const isMorning = idx < 4;
          const dKey = isMorning ? `${dayKey}_m` : `${dayKey}_s`;
          const hKey = `H${(idx % 4) + 1}`;

          const teacherAct = selectedTeacher ? activities.find(a => a.teacher === selectedTeacher && a.day.toLowerCase() === dKey.toLowerCase() && a.hour === hKey) : null;
          
          const classStatuses = selectedClasses.map(c => {
            const act = activities.find(a => (a.studentSet === c || a.studentSet.startsWith(c + ':')) && a.day.toLowerCase() === dKey.toLowerCase() && a.hour === hKey);
            return { name: c, isBusy: !!act, act };
          });

          const roomAct = selectedRoom ? activities.find(a => a.room === selectedRoom && a.day.toLowerCase() === dKey.toLowerCase() && hKey === a.hour) : null;

          const availableClasses = classStatuses.filter(s => !s.isBusy).map(s => s.name);
          const isTeacherFree = !teacherAct;
          const isRoomFree = !roomAct;
          const hasSelection = selectedTeacher || selectedClasses.length > 0 || selectedRoom;

          if (!hasSelection) {
            row.push("");
            return;
          }

          let cellContent = "";

          if (teacherAct) {
            cellContent += "الأستاذ مشغول\n";
          }

          if (roomAct) {
            cellContent += "القاعة المختارة مشغولة\n";
          }

          if (isTeacherFree && availableClasses.length > 0) {
            // Find free rooms
            const occupiedRoomsInSlot = activities
              .filter(a => a.day.toLowerCase() === dKey.toLowerCase() && a.hour === hKey)
              .map(a => a.room);
            const freeRooms = uniqueRooms.filter(r => !occupiedRoomsInSlot.includes(r));

            if (freeRooms.length > 0) {
              cellContent += `القاعات الشاغرة (${freeRooms.length}): ${freeRooms.join(", ")}\n`;
            }

            cellContent += `الأقسام المتاحة: ${availableClasses.join(", ")}\n`;

            if (availableClasses.length < selectedClasses.length) {
              cellContent += `متاح جزئياً (${availableClasses.length}/${selectedClasses.length})`;
            }
          } else if (isTeacherFree && availableClasses.length === 0 && selectedClasses.length > 0) {
            cellContent += "جميع الأقسام المختارة مشغولة";
          }

          row.push(cellContent.trim());
        });
        
        data.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Basic styling for column widths
      const wscols = [{ wch: 15 }, ...hourLabels.map(() => ({ wch: 40 }))];
      ws['!cols'] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "تقرير البحث");
      XLSX.writeFile(wb, `تقرير_البحث_${selectedTeacher || 'عام'}.xlsx`);
    };

    return (
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-6 print:p-0 print:shadow-none print:border-none">
        <div className="flex justify-between items-center bg-indigo-900 text-white p-6 rounded-3xl shadow-lg print:bg-white print:text-black print:border-2 print:border-gray-900 print:shadow-none">
          <div className="flex flex-wrap gap-8">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-indigo-300 print:text-gray-400" />
              <div>
                <p className="text-[10px] font-black uppercase opacity-60">الأستاذ</p>
                <p className="font-bold">{selectedTeacher || '---'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 max-w-[50%]">
              <Users className="w-5 h-5 text-indigo-300 print:text-gray-400" />
              <div>
                <p className="text-[10px] font-black uppercase opacity-60">الأقسام المختارة</p>
                <p className="font-bold text-xs break-words">{selectedClasses.length > 0 ? selectedClasses.join(' + ') : '---'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Home className="w-5 h-5 text-indigo-300 print:text-gray-400" />
              <div>
                <p className="text-[10px] font-black uppercase opacity-60">القاعة المفضلة</p>
                <p className="font-bold">{selectedRoom || '---'}</p>
              </div>
            </div>
          </div>
            <div className="flex flex-col items-end gap-2 no-print">
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExportToExcel}
                  className="bg-emerald-100 text-emerald-900 px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md hover:bg-emerald-200 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  تصدير إلى إكسيل
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExportToWord}
                  className="bg-indigo-100 text-indigo-900 px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md hover:bg-indigo-200 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  تصدير إلى وورد
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrintAvailability}
                  className="bg-white text-indigo-900 px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  طبع تقرير البحث
                </motion.button>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/20">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black">متاحة (باللون الأخضر)</span>
            </div>
          </div>
          {/* Print-only title */}
          <div className="hidden print:block text-left">
            <h2 className="text-xl font-black">تقرير البحث عن حصة متاحة</h2>
            <p className="text-[10px]">{schoolData.name} | {schoolData.academicYear}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-900 text-center text-[12px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-2 border-gray-900 p-3 w-24 font-black">اليوم</th>
                {hourLabels.map(h => (
                  <th key={h} className="border-2 border-gray-900 p-3 font-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS_ORDER.map(dayKey => (
                <tr key={dayKey} className="h-24 print:h-20">
                  <td className="border-2 border-gray-900 p-3 font-black bg-gray-50 text-[11px]">
                    {DAYS_MAP[dayKey]}
                  </td>
                  {hourLabels.map((hourLabel, idx) => {
                    const isMorning = idx < 4;
                    const dKey = isMorning ? `${dayKey}_m` : `${dayKey}_s`;
                    const hKey = `H${(idx % 4) + 1}`;

                    const teacherAct = selectedTeacher ? activities.find(a => a.teacher === selectedTeacher && a.day.toLowerCase() === dKey.toLowerCase() && a.hour === hKey) : null;
                    
                    const classStatuses = selectedClasses.map(c => {
                      const act = activities.find(a => (a.studentSet === c || a.studentSet.startsWith(c + ':')) && a.day.toLowerCase() === dKey.toLowerCase() && a.hour === hKey);
                      return { name: c, isBusy: !!act, act };
                    });

                    const roomAct = selectedRoom ? activities.find(a => a.room === selectedRoom && a.day.toLowerCase() === dKey.toLowerCase() && hKey === a.hour) : null;

                    const availableClasses = classStatuses.filter(s => !s.isBusy).map(s => s.name);
                    const isTeacherFree = !teacherAct;
                    const isRoomFree = !roomAct;
                    const hasSelection = selectedTeacher || selectedClasses.length > 0 || selectedRoom;

                    // Find all free rooms for this slot
                    const occupiedRoomsInSlot = activities
                      .filter(a => a.day.toLowerCase() === dKey.toLowerCase() && a.hour === hKey)
                      .map(a => a.room);
                    const freeRooms = uniqueRooms.filter(r => !occupiedRoomsInSlot.includes(r));

                    const isPerfectlyAvailable = hasSelection && isTeacherFree && isRoomFree && availableClasses.length === selectedClasses.length && selectedClasses.length > 0;

                    return (
                      <td key={idx} className={cn(
                        "border-2 border-gray-900 p-1 relative min-w-[130px] transition-all availability-cell",
                        isPerfectlyAvailable ? "bg-emerald-50" : "bg-white"
                      )}>
                        {!hasSelection ? null : (
                          <div className="space-y-1.5 h-full flex flex-col justify-center">
                            {/* Teacher Status */}
                            {teacherAct && (
                              <div className="bg-red-50 text-red-700 p-1 rounded border border-red-100 text-[8px] font-black leading-tight">
                                الأستاذ مشغول
                              </div>
                            )}

                            {/* Preferred Room Status */}
                            {roomAct && (
                              <div className="bg-indigo-50 text-indigo-700 p-1 rounded border border-indigo-100 text-[8px] font-black leading-tight">
                                القاعة المختارة مشغولة
                              </div>
                            )}

                            {/* All Available Rooms - Shown when teacher and at least one selected class are free */}
                            {isTeacherFree && availableClasses.length > 0 && freeRooms.length > 0 && (
                              <div className="space-y-1 mt-1 border-t border-gray-100 pt-1">
                                <p className="text-[7px] font-black text-indigo-700 uppercase">القاعات الشاغرة ({freeRooms.length}):</p>
                                <div className="flex flex-wrap gap-1 justify-center p-1 bg-white/50 rounded-lg border border-gray-100 shadow-inner rooms-list-container max-h-32 overflow-y-auto print:max-h-none print:overflow-visible">
                                  {freeRooms.map(r => (
                                    <span key={r} className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-[8px] font-bold text-indigo-800 shadow-sm hover:border-indigo-400 transition-colors">
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Available Classes Status */}
                            {isTeacherFree && availableClasses.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[7px] font-black text-emerald-600 uppercase border-b border-emerald-100 pb-0.5">الأقسام المتاحة:</p>
                                <div className="flex flex-wrap gap-0.5 justify-center">
                                  {availableClasses.map(c => (
                                    <span key={c} className="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black shadow-sm">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                                {availableClasses.length < selectedClasses.length && (
                                  <p className="text-[6px] text-amber-500 font-bold italic mt-0.5">متاح جزئياً ({availableClasses.length}/{selectedClasses.length})</p>
                                )}
                              </div>
                            )}

                            {isTeacherFree && availableClasses.length === 0 && selectedClasses.length > 0 && (
                              <p className="text-[8px] font-black text-amber-500 italic">جميع الأقسام المختارة مشغولة</p>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="hidden print:flex justify-between items-center text-[10px] text-gray-400 font-bold pt-4">
          <p>تم استخراج التقرير بتاريخ: {new Date().toLocaleDateString('ar-MA')}</p>
          <p>نظام GestLycee</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-gray-100 space-y-8 no-print"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="text-right space-y-1">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">جداول الحصص</h2>
            <p className="text-sm text-gray-500 font-bold">استيراد وعرض جداول الحصص للمؤسسة</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleCsvImport} 
              className="hidden" 
            />
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()} 
              className="flex-1 lg:flex-none bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <FileUp className="w-5 h-5" />
              استيراد CSV
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBulkPrint}
              className="flex-1 lg:flex-none bg-indigo-950 text-white px-6 py-3 rounded-2xl font-black hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20"
            >
              <Printer className="w-5 h-5" />
              طبع الكل
            </motion.button>
            <div className="flex flex-wrap gap-2">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMasterPrint('teacher')}
                className="bg-white text-indigo-950 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-50 transition-all"
              >
                مجمل الأساتذة
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMasterPrint('class')}
                className="bg-white text-indigo-950 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-50 transition-all"
              >
                مجمل الأقسام
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMasterPrint('room')}
                className="bg-white text-indigo-950 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-50 transition-all"
              >
                مجمل القاعات
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMasterPrint('empty')}
                className="bg-white text-emerald-700 border border-emerald-100 px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-50 transition-all"
              >
                القاعات الشاغرة
              </motion.button>
            </div>
            {filterValue && filterType !== 'availability' && (
              <div className="flex gap-2 flex-1 lg:flex-none">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrint}
                  className="flex-1 lg:flex-none bg-gray-800 text-white px-6 py-3 rounded-2xl font-black hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-800/20"
                >
                  <Printer className="w-5 h-5" />
                  طبع الحالي
                </motion.button>
                {filterType === 'teacher' && (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPersonalSheet(true)}
                    className="flex-1 lg:flex-none bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    <FileText className="w-5 h-5" />
                    الورقة الشخصية
                  </motion.button>
                )}
              </div>
            )}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpdate([])} 
              className="flex-1 lg:flex-none bg-white text-red-600 border-2 border-red-100 px-6 py-3 rounded-2xl font-black hover:border-red-600 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Trash2 className="w-5 h-5" />
              مسح الكل
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase mr-1">نوع العرض</label>
            <div className="flex bg-white p-1 rounded-xl border border-gray-200">
              <button 
                onClick={() => { setFilterType('teacher'); setFilterValue(''); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                  filterType === 'teacher' ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <User className="w-4 h-4" />
                أستاذ
              </button>
              <button 
                onClick={() => { setFilterType('class'); setFilterValue(''); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                  filterType === 'class' ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Users className="w-4 h-4" />
                قسم
              </button>
              <button 
                onClick={() => { setFilterType('room'); setFilterValue(''); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                  filterType === 'room' ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Home className="w-4 h-4" />
                قاعة
              </button>
              <button 
                onClick={() => { setFilterType('availability'); setFilterValue(''); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                  filterType === 'availability' ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Zap className="w-4 h-4" />
                بحث عن حصة
              </button>
              <button 
                onClick={() => { setFilterType('support'); setFilterValue(''); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                  filterType === 'support' ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Plus className="w-4 h-4" />
                برمجة الدعم
              </button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            {filterType === 'availability' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 mr-1">الأستاذ</label>
                  <select 
                    className="w-full px-4 py-2 bg-white border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold text-xs appearance-none"
                    value={selectedTeacher}
                    onChange={(e) => {
                      setSelectedTeacher(e.target.value);
                      setSelectedClasses([]); // Reset classes when teacher changes
                    }}
                  >
                    <option value="">-- اختر أستاذا --</option>
                    {renderTeacherOptions()}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 mr-1">الأقسام (اختيار متعدد)</label>
                  <div className="relative group">
                    <div className="w-full px-4 py-2 bg-white border-2 border-gray-100 rounded-xl font-bold text-[10px] min-h-[38px] flex flex-wrap gap-1 items-center cursor-pointer overflow-hidden">
                      {selectedClasses.length === 0 ? (
                        <span className="text-gray-400">اختر الأقسام...</span>
                      ) : (
                        selectedClasses.map(c => (
                          <span key={c} className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                            {c}
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClasses(prev => prev.filter(x => x !== c));
                            }} className="hover:text-red-500">×</button>
                          </span>
                        ))
                      )}
                    </div>
                    <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto hidden group-hover:block hover:block">
                      {(() => {
                        const teacherClasses = selectedTeacher 
                          ? Array.from(new Set(activities.filter(a => a.teacher === selectedTeacher).map(a => a.studentSet))).sort()
                          : uniqueClasses;
                        
                        return teacherClasses.map(c => (
                          <label key={c} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer text-xs">
                            <input 
                              type="checkbox" 
                              checked={selectedClasses.includes(c)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedClasses(prev => [...prev, c]);
                                } else {
                                  setSelectedClasses(prev => prev.filter(x => x !== c));
                                }
                              }}
                              className="w-4 h-4 accent-indigo-600"
                            />
                            {c}
                          </label>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 mr-1">القاعة المفضلة</label>
                  <select 
                    className="w-full px-4 py-2 bg-white border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold text-xs appearance-none"
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                  >
                    <option value="">-- اختر قاعة --</option>
                    {uniqueRooms.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <label className="text-xs font-black text-gray-400 uppercase mr-1">
                  {filterType === 'teacher' ? 'اختر الأستاذ' : filterType === 'class' ? 'اختر القسم' : 'اختر القاعة'}
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select 
                      className="w-full pr-12 pl-6 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold text-sm appearance-none"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                    >
                      <option value="">-- اختر من القائمة --</option>
                      {filterType === 'teacher' && renderTeacherOptions()}
                      {filterType === 'class' && uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                      {filterType === 'room' && uniqueRooms.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 rounded-xl border-2 border-gray-100">
                    <label className="text-xs font-black text-gray-500">ألوان</label>
                    <input 
                      type="checkbox" 
                      checked={printInColor} 
                      onChange={(e) => setPrintInColor(e.target.checked)}
                      className="w-5 h-5 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTimeSettings(!showTimeSettings)}
                    className={cn(
                      "px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
                      showTimeSettings ? "bg-indigo-600 text-white" : "bg-white text-indigo-600 border border-indigo-100"
                    )}
                  >
                    <Calendar className="w-4 h-4" />
                    تعديل الأوقات
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showTimeSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-indigo-900 text-sm">تعديل تسميات الحصص الزمنية</h4>
                  <p className="text-[10px] text-indigo-500 font-bold">سيتم حفظ التغييرات تلقائياً</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {hourLabels.map((label, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 mr-1">
                        {idx < 4 ? `صباحاً H${idx + 1}` : `مساءً H${idx - 3}`}
                      </label>
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => {
                          const newLabels = [...hourLabels];
                          newLabels[idx] = e.target.value;
                          onUpdateSchoolData({ ...schoolData, hourLabels: newLabels });
                        }}
                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


      </motion.div>

      {/* Master Printing Area */}
      <div className={cn(!isMasterPrinting && "hidden print:hidden")}>
        {masterType === 'empty' ? renderEmptyRoomsReport() : renderMasterTimetable()}
      </div>

      {/* Availability Grid */}
      {filterType === 'availability' && (
        <div className="availability-report">
          {renderAvailabilityGrid()}
        </div>
      )}

      {/* Support Scheduler */}
      {filterType === 'support' && (
        <div className="no-print">
          {renderSupportScheduler()}
        </div>
      )}

      {/* Bulk Printing Area */}
      <div className={cn("space-y-0 print:space-y-0", !isBulkPrinting && "hidden print:hidden")}>
        {(filterType === 'teacher' ? uniqueTeachers : filterType === 'class' ? uniqueClasses : uniqueRooms).map(val => (
          <div key={val} className="bulk-print-item">
            {renderSingleTimetable(val, getFilteredActivities(val), true)}
          </div>
        ))}
      </div>

      {/* Single Printing Area */}
      <div className={cn(isBulkPrinting && "no-print")}>
        {filterValue && filterType !== 'availability' && renderSingleTimetable(filterValue, currentFilteredActivities)}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200">
          <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-400">لا توجد بيانات جداول حصص</h3>
          <p className="text-sm text-gray-400 mt-2">يرجى استيراد ملف CSV لبدء العرض</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            text-shadow: none !important;
            box-shadow: none !important;
            filter: none !important;
          }

          @page {
            size: A4 landscape;
            margin: 0;
          }
          
          /* Reset layout for printing */
          html, body { 
            height: auto !important; 
            overflow: visible !important; 
            background: white !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Target the root layout containers */
          #root, #root > div,
          div[class*="h-screen"], 
          main, 
          div[class*="overflow-y-auto"] { 
            height: auto !important; 
            overflow: visible !important; 
            display: block !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            background: white !important;
            box-shadow: none !important;
            position: static !important;
          }

          .no-print { display: none !important; }
          header, aside, nav { display: none !important; }
          
          .print\\:p-0 { padding: 0 !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:bg-white { background-color: white !important; }
          
          .print-content {
            padding: 10mm !important;
            box-sizing: border-box !important;
            width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          table { 
            width: 100% !important; 
            border-collapse: collapse !important; 
            table-layout: auto !important; 
            background-color: white !important; 
            page-break-inside: auto;
          }

          table thead {
            display: table-header-group !important;
          }

          table tbody {
            display: table-row-group !important;
          }
          
          th, td { 
            border: 1.5px solid black !important; 
            padding: 2px !important; 
          }
          
          .print\\:scale-95 { 
            transform: scale(0.95); 
            transform-origin: top center; 
          }
          
          .print\\:page-break-after-always { 
            page-break-after: always !important; 
            break-after: page !important; 
            display: block !important;
            position: relative !important;
            width: 100% !important;
          }
          
          /* Vertical text for master reports */
          .vertical-text-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            gap: 2px;
          }
          .vertical-text {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            white-space: nowrap;
            display: inline-block;
            text-align: center;
          }
          .vertical-text span {
            display: flex;
            flex-direction: column;
            gap: 1px;
          }
          
          /* Ensure each timetable starts on a new page in bulk mode */
          .bulk-print-item {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            width: 100% !important;
          }
          
          /* Ensure text is black for printing, but preserve cell colors */
          .print-content *:not([style*="background-color"]):not(.text-white) { color: black !important; }
          .print-content p:not(.text-white), .print-content span:not(.text-white), .print-content td:not(.text-white), .print-content th:not(.text-white), .print-content h1, .print-content h2 { color: black !important; }
          
          /* Force correct text color on colored cells during print */
          .print-content .text-white,
          .print-content .text-white p,
          .print-content .text-white div,
          .print-content .text-white span {
            color: white !important;
          }
          .print-content .text-black,
          .print-content .text-black p,
          .print-content .text-black div,
          .print-content .text-black span {
            color: black !important;
          }
          
          /* Availability Report Specific Print Styles */
          .availability-report {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            height: auto !important;
            overflow: visible !important;
          }

          .availability-report table {
            table-layout: auto !important;
            width: 100% !important;
            border-spacing: 0;
            border-collapse: collapse !important;
          }

          .availability-report th, .availability-report td {
            font-size: 7pt !important;
            padding: 2px !important;
            line-height: 1 !important;
          }

          .availability-cell {
            min-width: 0 !important;
            width: auto !important;
            padding: 1px !important;
            vertical-align: top !important;
            height: auto !important;
          }

          .rooms-list-container {
            max-height: none !important;
            overflow: visible !important;
            height: auto !important;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 1px !important;
          }

          .rooms-list-container span {
            font-size: 6pt !important;
            padding: 1px 2px !important;
            margin: 1px !important;
            border: 0.5pt solid #ccc !important;
            color: #1e1b4b !important;
          }

          .availability-report .bg-emerald-500,
          .availability-report .bg-emerald-600 {
            background-color: #10b981 !important;
            color: white !important;
          }

          .availability-report .text-white {
            color: white !important;
          }

          .availability-report p, .availability-report span {
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Force page breaks for long tables */
          .availability-report tr {
            page-break-inside: avoid !important;
          }

          .overflow-x-auto {
            overflow: visible !important;
            display: block !important;
            width: 100% !important;
          }
        }
      `}} />
      {/* Personal Sheet Modal */}
      {showPersonalSheet && filterType === 'teacher' && filterValue && (
        <StaffPersonalSheet 
          staff={staff.find(s => s.fullName.trim() === filterValue.trim()) || { id: '0', fullName: filterValue, fullNameFr: '', cin: '', ppr: '', cadre: '', grade: '', role: 'أستاذ(ة)', specialization: '', familyStatus: '', gender: '', phoneNumber: '', email: '', address: '', birthDate: '', birthPlace: '', recruitmentDate: '', currentAssignmentDate: '' }}
          schoolData={schoolData}
          activities={activities.filter(a => a.teacher.trim() === filterValue.trim())}
          structures={structures}
          students={students}
          onClose={() => setShowPersonalSheet(false)}
        />
      )}
    </div>
  );
};
