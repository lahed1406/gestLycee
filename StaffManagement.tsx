import React, { useState, useRef, useMemo } from 'react';
import { StaffMember, SchoolData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  FileUp, 
  FileDown, 
  Search, 
  Trash2, 
  Edit3, 
  FileText, 
  CheckSquare, 
  Square,
  Users,
  ArrowRightLeft,
  Download,
  X,
  Plus,
  Info,
  Briefcase,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { moroccoData, KINGDOM_LOGO_URL, toTifinagh } from '../constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StaffManagementProps {
  staff: StaffMember[];
  onUpdate: (newList: StaffMember[]) => void;
  schoolData: SchoolData;
}


export const StaffManagement: React.FC<StaffManagementProps> = ({ staff, onUpdate, schoolData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const cadres = [
    "أستاذ التعليم الثانوي التأهيلي",
    "متصرف تربوي",
    "أستاذ مبرز للتربية والتكوين",
    "أستاذ التعليم الثانوي الإعدادي",
    "أستاذ التعليم الابتدائي",
    "مختص تربوي",
    "مختص اجتماعي",
    "مختص الاقتصاد والإدارة",
    "مساعد تربوي",
    "ملحق تربوي",
    "ملحق الاقتصاد والإدارة",
    "ممون",
    "مفتش",
    "متصرف",
    "أخرى"
  ];

  const specializations = [
    "اللغة العربية",
    "اللغة الفرنسية",
    "اللغة الانجليزية",
    "التاريخ والجغرافيا",
    "الرياضيات",
    "علوم الحياة والأرض",
    "الفيزياء والكيمياء",
    "التربية الاسلامية",
    "التربية البدنية",
    "المعلوميات",
    "الفلسفة",
    "اللغة الإسبانية",
    "اللغة الألمانية",
    "اللغة الإيطالية",
    "الاقتصاد والتدبير",
    "علوم المهندس",
    "الفنون التشكيلية",
    "الترجمة",
    "التوجيه التربوي",
    "التخطيط التربوي",
    "أخرى"
  ];

  const initialFormState: Partial<StaffMember> = {
    fullName: '',
    fullNameFr: '',
    cin: '',
    ppr: '',
    cadre: '',
    grade: '',
    role: '',
    specialization: '',
    familyStatus: 'عازب(ة)',
    gender: 'ذكر',
    phoneNumber: '',
    email: '',
    address: '',
    surplusStatus: '',
    originalSchool: schoolData.name,
    mobility: 'لاشيء',
    destinationSchool: '',
    destinationAcademy: '',
    destinationDirectorate: '',
    destinationService: 'مصلحة الموارد البشرية',
    destinationReference: '',
    startingSchool: '',
    startingAcademy: '',
    startingDirectorate: '',
    startingService: 'مصلحة الموارد البشرية',
    startingReference: '',
    birthDate: '',
    birthPlace: '',
    assignmentDate: '',
    currentAssignmentDate: '',
    scale: '',
    lastInspectionDate: '',
    lastInspectionGrade: '',
    lastAdminGrade: '',
    lastAdminGradeDate: '',
    childrenCount: 0,
    spouseIsOfficial: false,
    spouseRegistryNumber: '',
    recruitmentDate: '',
    titularizationDate: '',
    adminSeniority: '',
    gradeSeniority: '',
    rank: '',
    rankDate: '',
    rankSeniority: '',
    academicCertificate: '',
    academicCertificateDate: '',
    professionalCertificate: '',
    professionalCertificateDate: '',
    gradeDate: '',
    familySituationDate: '',
    cadreDate: '',
    certificates: [],
    serviceHistory: []
  };

  const [formData, setFormData] = useState<Partial<StaffMember>>(initialFormState);

  const isTeacherRole = (role: string) => {
    const r = role || '';
    return r.includes('أستاذ') || r.includes('مدرس');
  };

  const getRolePriority = (role: string): number => {
    const r = (role || '').toLowerCase();
    if (r.includes('مدير')) return 1;
    if (r.includes('ناظر')) return 2;
    if (r.includes('حارس عام')) return 5;
    if (isTeacherRole(role)) return 100;
    return 50;
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      const searchLower = searchTerm.toLowerCase();
      return (
        member.fullName.toLowerCase().includes(searchLower) ||
        member.ppr.toLowerCase().includes(searchLower) ||
        member.cin.toLowerCase().includes(searchLower)
      );
    });
  }, [staff, searchTerm]);

  const sortedStaff = useMemo(() => {
    return [...filteredStaff].sort((a, b) => {
      const priorityA = getRolePriority(a.role);
      const priorityB = getRolePriority(b.role);
      
      const roleDiff = priorityA - priorityB;
      if (roleDiff !== 0) return roleDiff;
      
      if (priorityA === 100) {
        const specA = a.specialization || '';
        const specB = b.specialization || '';
        const specDiff = specA.localeCompare(specB, 'ar');
        if (specDiff !== 0) return specDiff;
      }
      
      return a.fullName.localeCompare(b.fullName, 'ar');
    });
  }, [filteredStaff]);

  const stats = useMemo(() => {
    const roleCounts: Record<string, number> = {};
    const specCounts: Record<string, number> = {};
    let females = 0;
    let males = 0;
    let teacherCount = 0;
    let nonTeacherCount = 0;

    staff.forEach(m => {
      if (m.gender === 'أنثى') females++; else males++;
      const isTeacher = isTeacherRole(m.role);
      if (isTeacher) {
        teacherCount++;
        const spec = m.specialization || 'غير محدد';
        specCounts[spec] = (specCounts[spec] || 0) + 1;
      } else {
        nonTeacherCount++;
        roleCounts[m.role] = (roleCounts[m.role] || 0) + 1;
      }
    });

    return { 
      roleCounts, 
      specCounts, 
      females, 
      males, 
      total: staff.length,
      teacherCount,
      nonTeacherCount
    };
  }, [staff]);

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedStaff.length && sortedStaff.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedStaff.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const openEditModal = (member: StaffMember) => {
    const cleanDate = (d: string | undefined) => d ? d.split(/[T\s]/)[0] : '';
    
    setEditingStaff(member);
    setFormData({
      ...member,
      birthDate: cleanDate(member.birthDate),
      recruitmentDate: cleanDate(member.recruitmentDate),
      titularizationDate: cleanDate(member.titularizationDate),
      adminSeniority: cleanDate(member.adminSeniority),
      gradeSeniority: cleanDate(member.gradeSeniority),
      rankDate: cleanDate(member.rankDate),
      rankSeniority: cleanDate(member.rankSeniority),
      academicCertificateDate: cleanDate(member.academicCertificateDate),
      professionalCertificateDate: cleanDate(member.professionalCertificateDate),
      gradeDate: cleanDate(member.gradeDate),
      familySituationDate: cleanDate(member.familySituationDate),
      cadreDate: cleanDate(member.cadreDate),
      adminFileDate: cleanDate(member.adminFileDate),
      assignmentDate: cleanDate(member.assignmentDate),
      currentAssignmentDate: cleanDate(member.currentAssignmentDate),
      lastInspectionDate: cleanDate(member.lastInspectionDate),
      lastAdminGradeDate: cleanDate(member.lastAdminGradeDate),
      mobility: member.mobility || 'لاشيء',
      destinationService: member.destinationService || 'مصلحة الموارد البشرية',
      startingService: member.startingService || 'مصلحة الموارد البشرية'
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({
      ...initialFormState,
      originalSchool: schoolData.name
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
    setFormData(initialFormState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      const updatedList = staff.map(s => s.id === editingStaff.id ? { ...formData as StaffMember } : s);
      onUpdate(updatedList);
    } else {
      const staffMember: StaffMember = { ...formData as StaffMember, id: Math.random().toString(36).substr(2, 9) };
      onUpdate([...staff, staffMember]);
    }
    closeModal();
  };

  const removeStaff = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      onUpdate(staff.filter(s => s.id !== id));
      const newSelected = new Set(selectedIds);
      newSelected.delete(id);
      setSelectedIds(newSelected);
    }
  };

  const removeSelectedStaff = () => {
    if (selectedIds.size === 0) return;
    const idsToRemove = Array.from(selectedIds);
    if (confirm(`هل أنت متأكد من حذف ${selectedIds.size} موظف(ة)؟`)) {
      onUpdate(staff.filter(s => !idsToRemove.includes(s.id)));
      setSelectedIds(new Set());
    }
  };

  const formatDateForDisplay = (dateStr: string | undefined) => {
    if (!dateStr) return '---';
    // Clean the date string first (remove time part if present)
    const cleanDate = dateStr.split(/[T\s]/)[0];
    // Try splitting by - or /
    const parts = cleanDate.split(/[-/]/);
    if (parts.length === 3) {
      // Check if it's YYYY-MM-DD or YYYY/MM/DD
      if (parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      // Check if it's DD-MM-YYYY or DD/MM/YYYY
      if (parts[2].length === 4) {
        return `${parts[0]}/${parts[1]}/${parts[2]}`;
      }
    }
    return cleanDate;
  };

  const handleXmlImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const xmlString = event.target?.result as string;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      
      const getMap = (tagName: string, idTag: string, labelTag: string, fallbackTag?: string) => {
        const map: Record<string, string> = {};
        const elements = xmlDoc.getElementsByTagName(tagName);
        for (let i = 0; i < elements.length; i++) {
          const id = elements[i].getElementsByTagName(idTag)[0]?.textContent;
          let label = elements[i].getElementsByTagName(labelTag)[0]?.textContent;
          if ((!label || label.trim() === "") && fallbackTag) {
            label = elements[i].getElementsByTagName(fallbackTag)[0]?.textContent;
          }
          if (id && label) map[id] = label;
        }
        return map;
      };

      const subjectMapping: Record<string, string> = {
        '11': 'اللغة العربية', '12': 'اللغة الفرنسية', '13': 'اللغة الانجليزية',
        '18': 'التاريخ والجغرافيا', '19': 'الرياضيات', '20': 'علوم الحياة والأرض',
        '23': 'الفيزياء والكيمياء', '24': 'التربية الاسلامية', '26': 'التربية البدنية',
        '30': 'المعلوميات', '36': 'الفلسفة'
      };

      const cadreTranslationMap: Record<string, string> = {
        "Professeur de l enseig secondaire qualif": "أستاذ التعليم الثانوي التأهيلي",
        "ADMINISTRATEUR PEDAGOGIQUE": "متصرف تربوي",
        "Cadre spécialiste pédagogique": "أستاذ التعليم الثانوي التأهيلي",
        "Cadre spécialiste social": "مختص اجتماعي",
        "Cadre spécialiste d'économie and d'administration": "مختص الاقتصاد والإدارة",
        "Cadre adjoint pédagogique": "مساعد تربوي",
        "Professeur de l enseig secondaire collegial": "أستاذ التعليم الثانوي الإعدادي",
        "Professeur de l enseig primaire": "أستاذ التعليم الابتدائي",
        "Attaché Pédagogique": "ملحق تربوي",
        "ATTACHE D'ECONOMIE": "ملحق الاقتصاد والإدارة",
        "Intendant": "ممون",
        "Cadres des enseignants": "أستاذ التعليم الثانوي التأهيلي"
      };

      const familyStatusMapping: Record<string, string> = {
        'C': 'عازب(ة)', 'M': 'متزوج(ة)', 'D': 'مطلق(ة)', 'V': 'أرمل(ة)'
      };

      const genderMapping: Record<string, string> = {
        'M': 'ذكر',
        'F': 'أنثى'
      };

      const academicCertificateMapping: Record<string, string> = {
        '1': 'ش.الدروس الابتدائية',
        '2': 'ش.التعليم الثانوي الاعدادي',
        '3': 'الباكالوريا أو ما يعادلها',
        '4': 'شهادة الدرسات الجامعية العامة (D.E.U.G)',
        '5': 'الإجازة أو ما يعادلها',
        '6': 'الماستر',
        '7': 'دبلوم الدراسات العليا المعمقة (D.E.S.A)',
        '9': 'دبلوم الدراسات العليا المتخصصة (D.E.S.S)',
        '10': 'الميتريز',
        '11': 'دبلوم الدراسات المعمقة (D.E.A)',
        '12': 'دبلوم التقني',
        '13': 'د.الدراسات المعمقة',
        '14': 'د.الدراسات العليا',
        '15': 'د.مهندس أو ما يعادله',
        '16': 'دبلوم المعهد العالي للصحافة',
        '17': 'شهادة التقني العالي',
        '20': 'دكتوراه الدولة أو ما يعادلها',
        '21': 'الدكتوراه الوطنية',
        '22': 'الدكتوراة الفرنسية',
        '23': 'دكتورة السلك 3 (D.E.S)',
        '30': 'دبلوم التخرج من المدرسة الوطنية للإدارة',
        '31': 'دبلوم مدرسة علوم الإعلام',
        '32': 'دبلوم معهد التهيئة والتعمير',
        '33': 'بدون',
        '99': 'شهادة أخرى'
      };

      const professionalCertificateMapping: Record<string, string> = {
        '00': 'بدون',
        '1': 'ش.الأهلية التربوية',
        '2': 'ش.الدروس العادية',
        '3': 'ش.الدروس العادية لأساتذة الإبتدائي',
        '4': 'دبلـــوم التخرج مركز تكويــن المعلمين',
        '5': 'شهادة الكفاءة التربوية',
        '20': 'ش.الأهلية التربوية المهنية',
        '21': 'دبلوم التخرج من المركز التربوي الجهوي',
        '22': 'د.المدرسة العليا للأساتذة',
        '23': 'د.كلية علوم التربية',
        '24': 'امتحان التخرج من السلك الخاص بالمغرب',
        '25': 'امتحان التخرج من السلك الخاص بالخارج',
        '26': 'ش.الأهلية التربوية للتعليم الثانوي (سلك 1)',
        '27': 'ش.الأهلية التربوية للتعليم الثانوي (سلك 2)',
        '28': 'شهادة سلك الإدارة التربوية',
        '31': 'شهادة التبريز',
        '38': 'شهادة الدراسات الخاصة (أو ما يعادلها)',
        '40': 'دبلوم مفتش التعليم الثانوي',
        '41': 'دبلوم مفتش التعليم الإبتدائي',
        '60': 'دبلوم مستشار في التوجيه أو التخطيط التربوي',
        '97': 'شهادة السنة الثالثة للمدرسة العليا للأساتذة',
        '98': 'دبلوم مفتش في التوجيه أو التخطيط التربوي',
        '99': 'شهادة أخرى'
      };

      const hardcodedGradeMapping: Record<string, string> = {
        '11120401': 'متصرف تربوي الدرجة الممتازة',
        '11120402': 'متصرف تربوي من الدرجة الأولى',
        '11090301': 'أستاذ (ة) التعليم الثانوي التأهيلي الدرجة الممتازة',
        '11090302': 'أستاذ (ة) التعليم الثانوي التأهيلي الدرجة الاولى',
        '11090303': 'أستاذ (ة) التعليم الثانوي التأهيلي الدرجة الثانية',
        '11130141': 'أستاذ مبرز للتربية و التكوين من الدرجة الاولى',
        '11130142': 'أستاذ مبرز للتربية و التكوين من الدرجة الممتازة'
      };

      const cadreMap = getMap("R_CADRE", "CD_CADRE", "LL_CADRE");
      const gradeMap = getMap("R_GRADE", "CD_GRADE", "LA_GRADE", "LL_GRADE");
      const fonctMap = getMap("R_FONCT", "CD_Fonc", "LA_Fonc", "LL_FONC");

      const personnelElements = xmlDoc.getElementsByTagName("DATAIDENTIFPERSONNEL");
      const importedStaff: StaffMember[] = [];

      for (let i = 0; i < personnelElements.length; i++) {
        const p = personnelElements[i];
        const getVal = (tag: string) => (p.getElementsByTagName(tag)[0]?.textContent || '').trim();
        const discipCode = getVal('CD_DISCIP').replace(/^0+/, '');
        const specialization = subjectMapping[discipCode] || '';
        const famCode = getVal('SIT_FAM');
        const familyStatus = familyStatusMapping[famCode] || famCode;
        const genreVal = getVal('GENRE');
        const gender = genderMapping[genreVal] || 'ذكر';
        const gCode = getVal('CD_GRADE');
        const gradeLabel = hardcodedGradeMapping[gCode] || gradeMap[gCode] || gCode;
        
        const rawCadre = cadreMap[getVal('CD_CADRE')] || getVal('CD_CADRE');
        const translatedCadre = cadreTranslationMap[rawCadre] || rawCadre;

        const formatXmlDate = (dateStr: string) => {
          if (!dateStr) return '';
          // Clean the string first (remove time part if present)
          const clean = dateStr.trim().split(/[T\s]/)[0];
          // Match the date pattern
          const match = clean.match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})/);
          if (match) {
            const p1 = match[1];
            const p2 = match[2];
            const p3 = match[3];
            
            if (p1.length === 4) {
              // YYYY-MM-DD
              return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
            } else if (p3.length === 4) {
              // DD-MM-YYYY
              return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
            }
          }
          return clean;
        };

        const birthYear = getVal('AN_NAIS');
        const birthMonth = getVal('MOIS_NAIS').padStart(2, '0');
        const birthDay = getVal('JOUR_NAIS').padStart(2, '0');
        const birthDate = (birthYear && birthMonth && birthDay) ? `${birthYear}-${birthMonth}-${birthDay}` : '';

        const cdDipsRaw = getVal('CD_DIPS').trim();
        const cdDips = cdDipsRaw.replace(/^0+/, '') || '0';
        const academicCertificate = academicCertificateMapping[cdDips] || academicCertificateMapping[cdDipsRaw] || cdDipsRaw;

        const cdDippRaw = getVal('CD_DIPP').trim();
        const cdDipp = cdDippRaw.replace(/^0+/, '') || '0';
        const professionalCertificate = professionalCertificateMapping[cdDipp] || professionalCertificateMapping[cdDippRaw] || cdDippRaw;

        importedStaff.push({
          id: Math.random().toString(36).substr(2, 9),
          fullName: getVal('NOMA'),
          fullNameFr: getVal('NOML'),
          ppr: getVal('PPR'),
          cin: (getVal('CINA') + getVal('CINN')).trim(),
          cadre: translatedCadre,
          grade: gradeLabel,
          role: fonctMap[getVal('CD_LAST_FONC') || getVal('CD_FONC')] || '',
          specialization: specialization,
          familyStatus: familyStatus,
          gender: gender,
          phoneNumber: getVal('TEL_PORTABLE'),
          email: getVal('ADRESSE_ELEC'),
          address: getVal('ADRESSE'),
          surplusStatus: '',
          originalSchool: schoolData.name,
          mobility: 'لاشيء',
          birthDate: birthDate,
          birthPlace: getVal('LIEU_NAIS'),
          recruitmentDate: formatXmlDate(getVal('DATE_REC')),
          titularizationDate: formatXmlDate(getVal('DT_TITUL')),
          adminSeniority: formatXmlDate(getVal('ANC_ADM')),
          gradeSeniority: formatXmlDate(getVal('ANC_GRADE')),
          rank: getVal('ECHELON'),
          rankDate: formatXmlDate(getVal('DT_ECHELON')),
          rankSeniority: formatXmlDate(getVal('ANC_ECHELON')),
          academicCertificate: academicCertificate,
          academicCertificateDate: formatXmlDate(getVal('DT_DIPSCOL')),
          professionalCertificate: professionalCertificate,
          professionalCertificateDate: formatXmlDate(getVal('DT_DIPPROF')),
          gradeDate: formatXmlDate(getVal('DT_GRADE')),
          familySituationDate: formatXmlDate(getVal('DATE_SITFAM')),
          cadreDate: formatXmlDate(getVal('DT_CADRE')),
          assignmentDate: formatXmlDate(getVal('DATE_AFFECT')),
          currentAssignmentDate: formatXmlDate(getVal('DT_AFFECT_ACT')),
          lastInspectionDate: formatXmlDate(getVal('DT_DER_INSP')),
          lastAdminGradeDate: formatXmlDate(getVal('DT_DER_NOT_ADM'))
        });
      }

      if (importedStaff.length > 0) {
        const existingPprs = new Set(staff.map(s => s.ppr));
        const uniqueNewStaff = importedStaff.filter(s => !existingPprs.has(s.ppr));
        onUpdate([...staff, ...uniqueNewStaff]);
        alert(`تم استيراد ${uniqueNewStaff.length} موظف بنجاح.`);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleMobilityDocs = (type: 'وافد' | 'مغادر', individualMember?: StaffMember) => {
    const list = individualMember ? [individualMember] : staff.filter(s => s.mobility === type);
    if (list.length === 0) {
      alert(`لا يوجد موظفون بصيغة "${type}" حالياً.`);
      return;
    }

    const groups: Record<string, StaffMember[]> = {};
    list.forEach(s => {
      const schoolName = type === 'وافد' ? (s.startingSchool || 'مؤسسة غير محددة') : (s.destinationSchool || 'مؤسسة غير محددة');
      const directorate = type === 'وافد' ? (s.startingDirectorate || 'مديرية غير محددة') : (s.destinationDirectorate || 'مديرية غير محددة');
      const compositeKey = `${schoolName}#${directorate}`;
      
      if (!groups[compositeKey]) groups[compositeKey] = [];
      groups[compositeKey].push(s);
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let allPagesHtml = '';
    const compositeKeys = Object.keys(groups);

    compositeKeys.forEach((key, index) => {
      const group = groups[key];
      const representative = group[0];
      const [targetSchool, targetDirectorate] = key.split('#');
      
      const targetAcademy = type === 'وافد' ? (representative.startingAcademy || '........') : (representative.destinationAcademy || '........');
      const service = type === 'مغادر' ? (representative.destinationService || 'مصلحة الموارد البشرية') : (representative.startingService || 'مصلحة الموارد البشرية');
      const referenceText = type === 'وافد' ? (representative.startingReference || '...............') : (representative.destinationReference || '...............');

      const isPlural = group.length > 1;
      const docSubject = type === 'وافد' ? `الموضوع: طلب الملف${isPlural ? 'ات' : ''} الإداري${isPlural ? 'ة' : ''}` : `الموضوع: إرسال الملف${isPlural ? 'ات' : ''} الإداري${isPlural ? 'ة' : ''}`;

      const formatSupervisorLine = (academy: string, directorate: string) => {
        const cleanAcc = (academy || '').trim();
        const normalizedAcc = cleanAcc.startsWith('جهة') ? cleanAcc : `جهة ${cleanAcc}`;
        return `تحت إشراف السيد المدير الإقليمي للأكاديمية الجهوية ${normalizedAcc} - مديرية ${directorate.trim()} -`;
      };

      const lineSchool = formatSupervisorLine(schoolData.region, schoolData.city);
      const lineTarget = formatSupervisorLine(targetAcademy, targetDirectorate);
      const uniqueSupervisorLines = Array.from(new Set([lineSchool, lineTarget]));

      const pageHtml = `
        <div class="letter-page" style="${index < compositeKeys.length - 1 ? 'page-break-after: always;' : ''}">
          <div class="top-header">
            <div class="top-right">
              رقم الإرسال: ................. / ${new Date().getFullYear()}
            </div>
            <div class="top-logo">
              ${schoolData.logo ? `<img src="${schoolData.logo}" style="max-height: 70px;" />` : ''}
            </div>
            <div class="top-left">
              ${schoolData.municipality} في: ${new Date().toLocaleDateString('ar-MA')}
            </div>
          </div>

          <div class="sender-recipient">
            <div class="from">من مدير ${schoolData.name}</div>
            <div class="from">إلى</div>
            <div class="to-wrapper">
              السيد مدير الثانوية التأهيلية ${targetSchool} <br/> 
              ${uniqueSupervisorLines.map(line => `${line} <br/>`).join('')}
              ${service}
            </div>
          </div>

          <div class="doc-subject">
            <h2>${docSubject}</h2>
            <div class="reference">المرجع: ${referenceText}</div>
          </div>

          <div class="greeting">سلام تام بوجود مولانا الإمام</div>

          <div class="body-text">
            وبعد، ${type === 'وافد' 
              ? `يشرفني أن أطلب منكم موافاتي بالملف${isPlural ? 'ات' : ''} الإداري${isPlural ? 'ة' : ''} ل${isPlural ? 'لموظفين' : (isTeacherRole(representative.role) ? 'لأستاذ' : 'للموظف')} الآتية أسماؤهم قصد تحيين وضعيتهم الإدارية بمؤسستنا:` 
              : `يشرفني أن أرسل لكم الملف${isPlural ? 'ات' : ''} الإداري${isPlural ? 'ة' : ''} ل${isPlural ? 'لموظفين' : (isTeacherRole(representative.role) ? 'لأستاذ' : 'للموظف')} الآتية أسماؤهم قصد التحيين والمتابعة:`}
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 25%;">الاسم الكامل</th>
                <th style="width: 25%;">رقم التأجير</th>
                <th style="width: 25%;">المهمة داخل المؤسسة</th>
                <th style="width: 25%;">المادة</th>
              </tr>
            </thead>
            <tbody>
              ${group.map(s => `
                <tr>
                  <td>${s.fullName}</td>
                  <td>${s.ppr}</td>
                  <td>${isTeacherRole(s.role) ? 'التدريس' : s.role}</td>
                  <td>${s.specialization || '---'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="closing">
            مع كامل الاحترام والسلام
          </div>

          <div class="signature-area">
            <p>رئيس المؤسسة:</p>
            <p style="margin-top: 30px; font-size: 18px; font-weight: bold;">${schoolData.director}</p>
          </div>
        </div>
      `;
      allPagesHtml += pageHtml;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>المراسلات الجماعية</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body { font-family: 'Cairo', sans-serif; padding: 0; margin: 0; color: black; line-height: 1.6; font-size: 15px; }
          .letter-page { 
            padding: 1cm 1.5cm; 
            min-height: 297mm; 
            max-height: 297mm;
            width: 210mm;
            box-sizing: border-box; 
            position: relative; 
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .top-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .top-right { text-align: right; font-weight: bold; flex: 1; }
          .top-logo { text-align: center; flex: 1; }
          .top-left { text-align: left; font-weight: bold; flex: 1; }
          .sender-recipient { text-align: center; margin: 20px 0; line-height: 1.4; }
          .sender-recipient .from { font-weight: bold; margin-bottom: 3px; }
          .sender-recipient .to-wrapper { margin-top: 5px; font-weight: bold; }
          .doc-subject { margin-top: 30px; text-align: right; }
          .doc-subject h2 { font-size: 20px; font-weight: bold; text-decoration: underline; margin-bottom: 3px; }
          .reference { font-size: 14px; font-weight: bold; margin-top: 2px; }
          .greeting { text-align: center; margin: 20px 0; font-size: 18px; font-weight: bold; }
          .body-text { margin-bottom: 15px; font-size: 16px; font-weight: bold; text-indent: 15px; text-align: justify; }
          .data-table { width: 100%; border-collapse: collapse; margin: 20px auto; border: 2.5px solid black; }
          .data-table th, .data-table td { border: 1.5px solid black; padding: 8px 6px; text-align: center; font-weight: bold; }
          .data-table th { background: #f9fafb; font-size: 16px; text-decoration: underline; }
          .data-table td { font-size: 15px; }
          .closing { text-align: center; margin-top: 30px; font-size: 16px; font-weight: bold; }
          .signature-area { margin-top: 30px; text-align: left; padding-left: 80px; }
          .signature-area p { font-weight: bold; margin: 0; font-size: 16px; }
          @media print { 
            @page { size: A4; margin: 0 !important; } 
            body { margin: 0; padding: 1.5cm 2cm; }
            .letter-page { padding: 0; height: auto; width: auto; }
            .data-table th { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; } 
          }
        </style>
      </head>
      <body>
        ${allPagesHtml}
        <script>window.onload = () => { setTimeout(() => { window.print(); window.onafterprint = () => window.close(); }, 800); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportPDF = (data: StaffMember | StaffMember[], mode: 'cards' | 'list' = 'cards') => {
    const members = Array.isArray(data) ? data : [data];
    const isSingle = members.length === 1 && mode === 'cards';
    
    let fileName = '';
    if (mode === 'list') {
      fileName = `لائحة_موظفي_${schoolData.name}`;
    } else {
      fileName = isSingle ? `بطاقة_الموظف_${members[0].fullName}` : `بطاقات_الموظفين_المختارة`;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const commonFooter = `
      <div class="pdf-footer-branding">
        <div class="footer-grid">
          <div class="footer-item">
            <strong>المؤسسة:</strong> ${schoolData.name}
          </div>
          <div class="footer-item">
            <strong>الجماعة:</strong> ${schoolData.municipality}
          </div>
          <div class="footer-item">
            <strong>العنوان:</strong> ${schoolData.address}
          </div>
          <div class="footer-item">
            <strong>الهاتف:</strong> <span dir="ltr">${schoolData.phoneNumber}</span>
          </div>
          <div class="footer-item" dir="ltr">
            <strong>Email:</strong> ${schoolData.email}
          </div>
        </div>
        <div class="footer-copyright">
          صادر عن نظام تدبير الثانوية التأهيلية &copy; ${new Date().getFullYear()}
        </div>
      </div>
    `;

    let bodyContent = '';
    
    if (mode === 'list') {
      let lastRole = '';
      let lastSpec = '';
      let rows = '';
      
      let pdfFemales = 0;
      let pdfMales = 0;
      let pdfTeachers = 0;
      let pdfNonTeachers = 0;

      members.forEach(m => { 
        if(m.gender === 'أنثى') pdfFemales++; else pdfMales++;
        if(isTeacherRole(m.role)) pdfTeachers++; else pdfNonTeachers++;
      });

      const sortedForPdf = [...members].sort((a, b) => {
        const priorityA = getRolePriority(a.role);
        const priorityB = getRolePriority(b.role);
        const roleDiff = priorityA - priorityB;
        if (roleDiff !== 0) return roleDiff;
        if (priorityA === 100) {
          return (a.specialization || '').localeCompare(b.specialization || '', 'ar');
        }
        return a.fullName.localeCompare(b.fullName, 'ar');
      });

      sortedForPdf.forEach(m => {
        const isTeacher = isTeacherRole(m.role);
        
        if (!isTeacher) {
          if (m.role !== lastRole) {
            const count = stats.roleCounts[m.role] || 0;
            rows += `<tr><td colspan="13" class="group-header-role">المهمة: ${m.role} (العدد: ${count})</td></tr>`;
            lastRole = m.role;
            lastSpec = '';
          }
        } else {
          if (m.specialization !== lastSpec) {
            const specName = m.specialization || 'غير محدد';
            const count = stats.specCounts[m.specialization || 'غير محدد'] || 0;
            rows += `<tr><td colspan="13" class="group-header-spec">التخصص: ${specName} (العدد: ${count})</td></tr>`;
            lastSpec = m.specialization;
            lastRole = '';
          }
        }

        rows += `
          <tr>
            <td>${m.ppr}</td>
            <td>${m.fullName}</td>
            <td style="text-transform: uppercase;">${m.fullNameFr || '---'}</td>
            <td>${m.cin}</td>
            <td style="font-size: 9px;">${m.cadre || '---'}</td>
            <td style="font-size: 9px;">${m.grade || '---'}</td>
            <td>${m.role}</td>
            <td>${m.specialization || '---'}</td>
            <td>${m.surplusStatus || 'رسمي'}</td>
            <td>${m.mobility || 'لاشيء'}</td>
            <td>${m.originalSchool || schoolData.name}</td>
            <td dir="ltr">${m.phoneNumber || '---'}</td>
            <td style="font-size: 9px;">${m.address || '---'}</td>
          </tr>
        `;
      });

      bodyContent = `
        <div class="doc-title">
          <h2>لائحة موظفي المؤسسة</h2>
          <div style="font-size: 14px; margin-top: 5px; color: #444; font-weight: bold;">
             ( الإجمالي: ${members.length} | مدرسون: ${pdfTeachers} | غير مدرسين: ${pdfNonTeachers} | إناث: ${pdfFemales} | ذكور: ${pdfMales} )
          </div>
        </div>
        <table class="list-table">
          <thead>
            <tr>
              <th>PPR</th>
              <th>الاسم الكامل (Ar)</th>
              <th>الاسم الكامل (Fr)</th>
              <th>CIN</th>
              <th>الإطار</th>
              <th>الدرجة</th>
              <th>المهمة داخل المؤسسة</th>
              <th>التخصص</th>
              <th>وضعية الفائض</th>
              <th>الحركية</th>
              <th>المؤسسة الأصلية</th>
              <th>الهاتف</th>
              <th>العنوان</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top: 40px;">
          <div class="footer-sig-section">
            <div class="sig-box"><p>توقيع المعني</p><div class="sig-line"></div></div>
            <div class="sig-box">
              <p>ختم مدير المؤسسة</p>
              <p style="margin-top: 10px; font-weight: bold; font-size: 13px;">${schoolData.director}</p>
              <div class="sig-line"></div>
            </div>
          </div>
        </div>
      `;
    } else {
      members.forEach((m, index) => {
        const cardHtml = `
          <div class="page-card" style="${index < members.length - 1 ? 'page-break-after: always;' : ''}">
            <div class="header">
              <div class="header-right">
                <strong>المملكة المغربية</strong><br/>
                وزارة التربية الوطنية والتعليم الأولي والرياضة<br/>
                الأكاديمية الجهوية: ${schoolData.region}<br/>
                مديرية: ${schoolData.city}
              </div>
              <div class="header-center">
                <img src="${KINGDOM_LOGO_URL}" referrerpolicy="no-referrer" />
              </div>
              <div class="header-left tifinagh">
                <strong>ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ</strong><br/>
                ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ<br/>
                ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ ${toTifinagh(schoolData.region.replace('جهة ', ''))}<br/>
                ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ ⵏ ${toTifinagh(schoolData.city.replace('مديرية ', '').replace('المديرية الإقليمية لـ ', '').replace('المديرية الإقليمية ل', ''))}
              </div>
            </div>

            <div class="doc-title"><h2>بطاقة معلومات الموظف</h2></div>

            <div class="pdf-section">
              <h3 class="section-title">المعلومات الشخصية</h3>
              <table class="data-table">
                <tr><th>الاسم الكامل (Ar)</th><td>${m.fullName}</td></tr>
                <tr><th>الاسم الكامل (Fr)</th><td style="text-transform: uppercase;">${m.fullNameFr || '---'}</td></tr>
                <tr><th>CIN</th><td>${m.cin}</td></tr>
                <tr><th>تاريخ ومكان الازدياد</th><td>${formatDateForDisplay(m.birthDate)} بـ ${m.birthPlace || '---'}</td></tr>
                <tr><th>النوع / الحالة العائلية</th><td>${m.gender} / ${m.familyStatus}</td></tr>
                <tr><th>رقم الهاتف</th><td dir="ltr">${m.phoneNumber || '---'}</td></tr>
                <tr><th>البريد الإلكتروني</th><td dir="ltr">${m.email || '---'}</td></tr>
                <tr><th>العنوان</th><td style="font-size: 9px;">${m.address || '---'}</td></tr>
              </table>
            </div>

            <div class="pdf-section" style="margin-top: 15px;">
              <h3 class="section-title">المعلومات المهنية</h3>
              <table class="data-table">
                <tr><th>رقم التأجير (PPR)</th><td style="font-family: monospace;">${m.ppr}</td></tr>
                <tr><th>الإطار</th><td style="font-size: 11px;">${m.cadre || '---'}</td></tr>
                <tr><th>الدرجة</th><td style="font-size: 11px;">${m.grade || '---'}</td></tr>
                <tr><th>تاريخ الدرجة</th><td>${formatDateForDisplay(m.gradeDate)}</td></tr>
                <tr><th>الرتبة</th><td>${m.rank || '---'}</td></tr>
                <tr><th>تاريخ الرتبة</th><td>${formatDateForDisplay(m.rankDate)}</td></tr>
                <tr><th>المهمة داخل المؤسسة</th><td>${m.role}</td></tr>
                <tr><th>التخصص</th><td>${m.specialization || '---'}</td></tr>
                <tr><th>تاريخ التوظيف</th><td>${formatDateForDisplay(m.recruitmentDate)}</td></tr>
                <tr><th>تاريخ الترسيم</th><td>${formatDateForDisplay(m.titularizationDate)}</td></tr>
                <tr><th>الأقدمية في الإدارة</th><td>${formatDateForDisplay(m.adminSeniority)}</td></tr>
                <tr><th>الأقدمية في الدرجة</th><td>${formatDateForDisplay(m.gradeSeniority)}</td></tr>
                <tr><th>الأقدمية في الرتبة</th><td>${formatDateForDisplay(m.rankSeniority)}</td></tr>
                <tr><th>المؤسسة الأصلية</th><td>${m.originalSchool || schoolData.name}</td></tr>
                <tr><th>وضعية الفائض</th><td>${m.surplusStatus || 'رسمي'}</td></tr>
                <tr><th>الحركية</th><td>${m.mobility || 'لاشيء'}</td></tr>
              </table>
            </div>

            <div class="pdf-section" style="margin-top: 15px;">
              <h3 class="section-title">الشهادات</h3>
              <table class="data-table">
                <tr><th>الشهادة الأكاديمية</th><td>${m.academicCertificate || '---'}</td></tr>
                <tr><th>تاريخ الشهادة الأكاديمية</th><td>${formatDateForDisplay(m.academicCertificateDate)}</td></tr>
                <tr><th>الشهادة المهنية</th><td>${m.professionalCertificate || '---'}</td></tr>
                <tr><th>تاريخ الشهادة المهنية</th><td>${formatDateForDisplay(m.professionalCertificateDate)}</td></tr>
              </table>
            </div>

            <div class="sig-area">
              <div class="sig-box"><p>توقيع المعني</p><div class="sig-line"></div></div>
              <div class="sig-box">
                <p>ختم مدير المؤسسة</p>
                <p style="margin-top: 10px; font-weight: bold; font-size: 13px;">${schoolData.director}</p>
                <div class="sig-line"></div>
              </div>
            </div>

            <div class="page-footer-absolute">
              ${commonFooter}
            </div>
          </div>
        `;
        bodyContent += cardHtml;
      });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${fileName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
          body { font-family: 'Cairo', sans-serif; padding: 0; color: black; line-height: 1.1; font-size: 11px; margin: 0; }
          .page-card { padding: 20px; box-sizing: border-box; width: 100%; position: relative; min-height: 100vh; display: flex; flex-direction: column; }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-bottom: 2px solid #1e3a8a; 
            padding-bottom: 10px; 
            margin-bottom: 15px; 
          }
          .header-right, .header-left {
            width: 38%;
            font-size: 11px;
            line-height: 1.4;
            text-align: center;
          }
          .header-center {
            width: 24%;
            text-align: center;
          }
          .header-center img {
            width: 25mm;
            height: 25mm;
            object-fit: contain;
          }
          .tifinagh {
            font-family: 'Noto Sans Tifinagh', sans-serif;
          }
          .doc-title { text-align: center; margin: 10px 0; }
          .doc-title h2 { font-size: 18px; font-weight: bold; text-decoration: underline; color: black; display: inline-block; margin: 0; }
          .section-title { background: #f1f5f9; padding: 3px 8px; border-right: 3px solid #1e3a8a; margin-bottom: 5px; font-size: 11px; font-weight: bold; color: black; border-top: 1px solid #ccc; border-left: 1px solid #ccc; }
          .data-table, .list-table { width: 100%; border-collapse: collapse; margin-top: 5px; table-layout: fixed; border: 1px solid black; }
          .data-table th, .data-table td, .list-table th, .list-table td { border: 1px solid black; padding: 5px 4px; text-align: center; word-wrap: break-word; }
          .data-table th { width: 30%; background-color: #f8fafc; color: black; font-weight: bold; text-align: right; padding-right: 10px; }
          .list-table th { background-color: #f3f4f6; color: black; font-weight: bold; text-align: center; font-size: 14px; padding: 6px 4px; }
          .list-table td { font-size: 11px; font-weight: bold; color: black; }
          .group-header-role { background-color: #e2e8f0 !important; color: black !important; font-weight: bold; text-align: right !important; padding: 6px !important; font-size: 14px; border: 1px solid black; }
          .group-header-spec { background-color: #f8fafc !important; color: black !important; font-weight: bold; text-align: right !important; padding: 5px !important; font-size: 12px; border: 1px solid black; }
          
          .sig-area, .footer-sig-section { margin-top: 25px; display: flex; justify-content: space-between; font-size: 11px; }
          .sig-box { text-align: center; width: 180px; }
          .sig-line { margin-top: 25px; border-top: 1px dashed #000; }

          .page-footer-absolute { 
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            border-top: 2px solid #1e3a8a;
            padding-top: 10px;
          }
          
          .pdf-footer-branding {
            text-align: center;
          }
          
          .footer-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 5px;
            text-align: center;
            font-size: 10px;
            color: #333;
            margin-bottom: 5px;
          }
          
          .footer-item {
            padding: 2px;
          }
          
          .footer-copyright {
            font-size: 8px;
            color: #666;
            margin-top: 5px;
          }

          @media print { 
            @page { size: A4 ${mode === 'list' ? 'landscape' : 'portrait'}; margin: 0 !important; } 
            body { padding: 1.5cm 2cm; margin: 0; } 
            .list-table th, .group-header-role, .group-header-spec { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .pdf-section { page-break-inside: avoid; }
            .page-card { page-break-inside: avoid; page-break-after: always; height: auto; padding: 0; }
            .page-card:last-of-type { page-break-after: auto; }
            
            .page-footer-absolute {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
            }
          }
        </style>
      </head>
      <body>
        ${mode === 'list' ? `
          <div class="page-card" style="height: auto; page-break-after: auto; position: relative; padding-bottom: 120px;">
            <div class="header">
              <div class="header-right">
                <strong>المملكة المغربية</strong><br/>
                وزارة التربية الوطنية والتعليم الأولي والرياضة<br/>
                الأكاديمية الجهوية: ${schoolData.region}<br/>
                مديرية: ${schoolData.city}
              </div>
              <div class="header-center">
                <img src="${KINGDOM_LOGO_URL}" referrerpolicy="no-referrer" />
              </div>
              <div class="header-left tifinagh">
                <strong>ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ</strong><br/>
                ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ<br/>
                ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ ${toTifinagh(schoolData.region.replace('جهة ', ''))}<br/>
                ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ ⵏ ${toTifinagh(schoolData.city.replace('مديرية ', '').replace('المديرية الإقليمية لـ ', '').replace('المديرية الإقليمية ل', ''))}
              </div>
            </div>
            ${bodyContent}
            <div class="page-footer-absolute">
              ${commonFooter}
            </div>
          </div>
        ` : bodyContent}
        <script>window.onload = () => { setTimeout(() => { window.print(); window.onafterprint = () => window.close(); }, 1000); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };
  
  const handleExportSelectedCards = () => {
    const selectedStaff = staff.filter(s => selectedIds.has(s.id));
    if (selectedStaff.length === 0) {
      alert('الرجاء تحديد موظف واحد على الأقل.');
      return;
    }
    handleExportPDF(selectedStaff, 'cards');
  };

  const handlePrintTrackingList = () => {
    const incomingReceived = staff.filter(s => s.mobility === 'وافد' && s.adminFileStatus === 'received');
    const outgoingSent = staff.filter(s => s.mobility === 'مغادر' && s.adminFileStatus === 'sent');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>لائحة تتبع وضعية الملفات الإدارية</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
          @page { margin: 0; }
          body { 
            font-family: 'Cairo', sans-serif; 
            padding: 0.5cm; 
            margin: 0;
            display: block;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 5px;
          }
          .header-right, .header-left {
            width: 38%;
            font-size: 11px;
            line-height: 1.4;
            text-align: center;
          }
          .header-logo {
            width: 24%;
            text-align: center;
          }
          .header-logo img {
            width: 25mm;
            height: 25mm;
            object-fit: contain;
          }
          .tifinagh {
            font-family: 'Noto Sans Tifinagh', sans-serif;
          }
          
          h1 { text-align: center; color: #1e3a8a; margin: 5px 0; font-size: 20px; }
          .report-info { text-align: center; margin-bottom: 10px; font-weight: bold; color: #444; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 2px solid #000; }
          th, td { border: 1px solid #000; padding: 6px; text-align: right; font-size: 13px; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .section-title { background: #f1f5f9; padding: 6px; font-weight: bold; margin-top: 10px; border-right: 5px solid #1e3a8a; margin-bottom: 5px; border-top: 1px solid #000; border-left: 1px solid #000; border-bottom: 1px solid #000; }
          
          .content-wrapper { page-break-inside: auto; }
          
          .footer-container {
            margin-top: 15px;
            border-top: 2px solid #1e3a8a;
            padding-top: 5px;
            font-size: 9px;
            page-break-inside: avoid;
          }
          .footer-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 5px;
            text-align: center;
          }
          .footer-item { 
            margin-bottom: 0;
            padding: 2px;
            background: #f9fafb;
            border-radius: 4px;
          }
          .signature-section {
            display: flex;
            justify-content: center;
            margin-top: 15px;
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          .sig-box { 
            text-align: center; 
            width: 220px;
            padding: 10px;
            border: 1px dashed #ccc;
            border-radius: 8px;
          }
          
          @media print {
            @page { margin: 0; }
            body { padding: 1cm; margin: 0; }
            .footer-container { 
              position: fixed; 
              bottom: 1cm;
              left: 1cm;
              right: 1cm;
              margin-top: 0;
              padding-top: 5px;
              background: white;
            }
            .content-wrapper {
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="header-right">
            <strong>المملكة المغربية</strong><br/>
            وزارة التربية الوطنية والتعليم الأولي والرياضة<br/>
            الأكاديمية الجهوية: ${schoolData.region}<br/>
            مديرية: ${schoolData.city}
          </div>
          <div class="header-logo">
            <img src="${KINGDOM_LOGO_URL}" referrerpolicy="no-referrer" />
          </div>
          <div class="header-left tifinagh">
            <strong>ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ</strong><br/>
            ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ<br/>
            ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ ${toTifinagh(schoolData.region)}<br/>
            ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ ⵏ ${toTifinagh(schoolData.city)}
          </div>
        </div>

        <div class="content-wrapper">
          <h1 style="text-align: center; color: #1e3a8a; margin: 20px 0; font-size: 24px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">لائحة تتبع وضعية الملفات الإدارية</h1>
          <div class="section-title">أولاً: الملفات التي تم التوصل بها (الوافدون)</div>
          <table>
            <thead>
              <tr>
                <th>الاسم الكامل</th>
                <th>PPR</th>
                <th>تاريخ التوصل</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${incomingReceived.length === 0 ? '<tr><td colspan="4" style="text-align:center;">لا يوجد</td></tr>' : 
                incomingReceived.map(s => `
                  <tr>
                    <td>${s.fullName}</td>
                    <td>${s.ppr}</td>
                    <td>${s.adminFileDate || '---'}</td>
                    <td>${s.adminFileNotes || '---'}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>

          <div class="section-title">ثانياً: الملفات التي تم إرسالها (المغادرون)</div>
          <table>
            <thead>
              <tr>
                <th>الاسم الكامل</th>
                <th>PPR</th>
                <th>تاريخ الإرسال</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${outgoingSent.length === 0 ? '<tr><td colspan="4" style="text-align:center;">لا يوجد</td></tr>' : 
                outgoingSent.map(s => `
                  <tr>
                    <td>${s.fullName}</td>
                    <td>${s.ppr}</td>
                    <td>${s.adminFileDate || '---'}</td>
                    <td>${s.adminFileNotes || '---'}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
          
          <div class="signature-section">
            <div class="sig-box">
              <p style="margin-bottom: 50px; font-weight: bold;">توقيع مدير المؤسسة:</p>
              <strong>${schoolData.director}</strong>
            </div>
          </div>
        </div>

        <div class="footer-container">
          <div class="footer-grid">
            <div class="footer-item"><strong>العنوان:</strong> ${schoolData.address}</div>
            <div class="footer-item"><strong>الهاتف:</strong> <span dir="ltr">${schoolData.phoneNumber}</span></div>
            <div class="footer-item"><strong>البريد الإلكتروني:</strong> ${schoolData.email}</div>
            <div class="footer-item"><strong>الجماعة:</strong> ${schoolData.municipality}</div>
            <div class="footer-item"><strong>الإقليم:</strong> ${schoolData.city}</div>
            <div class="footer-item"><strong>الأكاديمية الجهوية:</strong> ${schoolData.region}</div>
          </div>
        </div>
        
        <script>window.onload = () => { setTimeout(() => { window.print(); window.onafterprint = () => window.close(); }, 500); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const renderTableRows = () => {
    let lastRole = '';
    let lastSpec = '';
    const rows: React.ReactNode[] = [];

    sortedStaff.forEach((member) => {
      const isTeacher = isTeacherRole(member.role);

      if (!isTeacher) {
        if (member.role !== lastRole) {
          const count = stats.roleCounts[member.role] || 0;
          rows.push(
            <tr key={`role-header-${member.role}-${member.id}`} className="bg-indigo-900 text-white font-bold text-lg border-x border-gray-300">
              <td colSpan={18} className="px-6 py-3 text-right border-b border-gray-300">
                المهمة: {member.role} <span className="mr-4 text-indigo-200">(العدد: {count})</span>
              </td>
            </tr>
          );
          lastRole = member.role;
          lastSpec = '';
        }
      } else {
        if (member.specialization !== lastSpec) {
          const specName = member.specialization || 'غير محدد';
          const count = stats.specCounts[member.specialization || 'غير محدد'] || 0;
          rows.push(
            <tr key={`spec-header-${specName}-${member.id}`} className="bg-slate-200 text-black font-bold text-md border-x border-gray-300">
              <td colSpan={18} className="px-10 py-2 text-right italic border-b border-gray-300">
                التخصص: {specName} <span className="mr-4 text-gray-700">(العدد: {count})</span>
              </td>
            </tr>
          );
          lastSpec = member.specialization;
          lastRole = '';
        }
      }

      const isSelected = selectedIds.has(member.id);

      rows.push(
        <motion.tr 
          key={member.id} 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "hover:bg-indigo-50/50 transition-colors group border-b border-gray-100",
            isSelected ? 'bg-indigo-50/30' : ''
          )}
        >
          <td className="px-6 py-4 text-center">
            <button 
              onClick={() => toggleSelect(member.id)}
              className="p-1 hover:bg-gray-200 rounded-md transition-colors"
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-indigo-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </td>
          <td className="px-4 py-4 text-xs font-black text-gray-900">{member.ppr}</td>
          <td className="px-4 py-4 text-sm font-black text-gray-900">{member.fullName}</td>
          <td className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-tighter" dir="ltr">{member.fullNameFr}</td>
          <td className="px-4 py-4 text-xs font-black text-gray-600">{member.cin}</td>
          <td className="px-4 py-4 text-[10px] font-bold text-gray-500 max-w-[120px] truncate" title={member.cadre}>{member.cadre || '-'}</td>
          <td className="px-4 py-4 text-[10px] font-bold text-gray-500">{member.grade || '-'}</td>
          <td className="px-4 py-4 text-xs font-black text-indigo-700">{member.role}</td>
          <td className="px-4 py-4 text-xs font-black text-emerald-700">{member.specialization || '-'}</td>
          <td className="px-4 py-4 text-[10px] font-bold text-gray-500">{formatDateForDisplay(member.birthDate)}</td>
          <td className="px-4 py-4 text-[10px] font-bold text-gray-500">{formatDateForDisplay(member.recruitmentDate)}</td>
          <td className="px-4 py-4 text-[10px] font-bold text-gray-500">{formatDateForDisplay(member.adminSeniority)}</td>
          <td className="px-4 py-4 text-[10px] font-bold text-gray-500">{formatDateForDisplay(member.gradeSeniority)}</td>
          <td className="px-4 py-4 text-[10px] font-bold text-gray-500">{formatDateForDisplay(member.rankSeniority)}</td>
          <td className="px-4 py-4 text-[10px] font-bold text-gray-500 truncate max-w-[100px]" title={member.academicCertificate}>{member.academicCertificate || '-'}</td>
          <td className="px-4 py-4">
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border",
              !member.surplusStatus ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-orange-50 text-orange-700 border-orange-100'
            )}>
              {member.surplusStatus || 'رسمي'}
            </span>
          </td>
          <td className="px-4 py-4">
            <span className={cn(
              "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm border",
              member.mobility === 'وافد' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
              member.mobility === 'مغادر' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-400 border-gray-200'
            )}>
              {member.mobility || 'لاشيء'}
            </span>
          </td>
          <td className="px-4 py-4 text-xs font-black text-gray-700" dir="ltr">{member.phoneNumber || '-'}</td>
          <td className="px-4 py-4 sticky left-0 bg-white/80 backdrop-blur-md group-hover:bg-indigo-50/80 transition-colors z-10 border-l border-gray-100">
            <div className="flex gap-1 justify-center">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleExportPDF(member, 'cards')} 
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" 
                title="بطاقة المعلومات"
              >
                 <FileText className="w-4 h-4" />
              </motion.button>
              {member.mobility !== 'لاشيء' && (
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleMobilityDocs(member.mobility as 'وافد' | 'مغادر', member)} 
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    member.mobility === 'وافد' ? "text-blue-600 hover:bg-blue-50" : "text-red-600 hover:bg-red-50"
                  )}
                  title={member.mobility === 'وافد' ? "طلب ملف إداري" : "إرسال ملف إداري"}
                >
                   <ArrowRightLeft className={cn("w-4 h-4", member.mobility === 'مغادر' && "rotate-180")} />
                </motion.button>
              )}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => openEditModal(member)} 
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" 
                title="تعديل"
              >
                 <Edit3 className="w-4 h-4" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeStaff(member.id)} 
                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                title="حذف"
              >
                 <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          </td>
        </motion.tr>
      );
    });

    return rows;
  };

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-gray-100 space-y-8"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="text-right space-y-1">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">إدارة الموظفين</h2>
            <p className="text-sm text-gray-500 font-bold">عرض وتدبير قاعدة بيانات الأطر التربوية والإدارية ({staff.length} موظف)</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <input type="file" accept=".xml" ref={fileInputRef} onChange={handleXmlImport} className="hidden" />
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()} 
              className="flex-1 lg:flex-none bg-white text-indigo-600 border-2 border-indigo-100 px-5 py-3 rounded-2xl font-black hover:border-indigo-600 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <FileUp className="w-5 h-5" />
              استيراد XML
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExportPDF(staff, 'list')} 
              className="flex-1 lg:flex-none bg-white text-emerald-600 border-2 border-emerald-100 px-5 py-3 rounded-2xl font-black hover:border-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <FileDown className="w-5 h-5" />
              تصدير اللائحة
            </motion.button>

            <div className="flex gap-2 flex-1 lg:flex-none">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMobilityDocs('وافد')} 
                className="flex-1 bg-blue-50 text-blue-700 border-2 border-blue-100 px-4 py-3 rounded-2xl font-black hover:bg-blue-100 transition-all text-xs flex items-center justify-center gap-2"
                title="طلب جماعي للملفات الإدارية للوافدين من نفس المؤسسة والمديرية"
              >
                <ArrowRightLeft className="w-4 h-4" />
                طلب ملف إداري
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMobilityDocs('مغادر')} 
                className="flex-1 bg-red-50 text-red-700 border-2 border-red-100 px-4 py-3 rounded-2xl font-black hover:bg-red-100 transition-all text-xs flex items-center justify-center gap-2"
                title="إرسال جماعي للملفات الإدارية للمغادرين إلى نفس المؤسسة والمديرية"
              >
                <ArrowRightLeft className="w-4 h-4 rotate-180" />
                إرسال ملف إداري
              </motion.button>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex gap-2 flex-1 lg:flex-none">
                <motion.button 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={handleExportSelectedCards} 
                  className="flex-1 lg:flex-none bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  تحميل البطاقات ({selectedIds.size})
                </motion.button>
                <motion.button 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={removeSelectedStaff} 
                  className="flex-1 lg:flex-none bg-red-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  حذف المختار ({selectedIds.size})
                </motion.button>
                {selectedIds.size === 1 && (
                  <motion.button 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => {
                      const id = Array.from(selectedIds)[0];
                      const member = staff.find(s => s.id === id);
                      if (member) openEditModal(member);
                    }} 
                    className="flex-1 lg:flex-none bg-blue-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-5 h-5" />
                    تعديل المختار
                  </motion.button>
                )}
              </div>
            )}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsTrackingModalOpen(true)} 
              className="flex-1 lg:flex-none bg-white text-amber-600 border-2 border-amber-100 px-5 py-3 rounded-2xl font-black hover:border-amber-600 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowRightLeft className="w-5 h-5" />
              تتبع الملفات الإدارية
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openAddModal} 
              className="flex-1 lg:flex-none bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              إضافة موظف
            </motion.button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="ابحث بالاسم، PPR، أو CIN..."
            className="w-full pr-12 pl-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800 text-right shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-gray-200 overflow-hidden"
      >
        <div className="py-8 px-10 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
               <Users className="w-6 h-6 text-indigo-600" />
             </div>
             <h2 className="text-xl font-black text-gray-900 tracking-tight">لائحة موظفي المؤسسة</h2>
           </div>
           <div className="flex items-center gap-3 text-gray-500 text-xs font-black uppercase tracking-widest bg-white px-5 py-2 rounded-full border border-gray-100 shadow-sm">
             <span>الإجمالي: {stats.total}</span>
             <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
             <span>مدرسون: {stats.teacherCount}</span>
             <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
             <span>إناث: {stats.females}</span>
             <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
             <span>ذكور: {stats.males}</span>
           </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-5 text-center">
                   <button 
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {selectedIds.size === sortedStaff.length && sortedStaff.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-5 text-right">PPR</th>
                <th className="px-4 py-5 text-right">الاسم الكامل (Ar)</th>
                <th className="px-4 py-5 text-right">الاسم الكامل (Fr)</th>
                <th className="px-4 py-5 text-right">CIN</th>
                <th className="px-4 py-5 text-right">الإطار</th>
                <th className="px-4 py-5 text-right">الدرجة</th>
                <th className="px-4 py-5 text-right">المهمة</th>
                <th className="px-4 py-5 text-right">التخصص</th>
                <th className="px-4 py-5 text-right">تاريخ الازدياد</th>
                <th className="px-4 py-5 text-right">تاريخ التوظيف</th>
                <th className="px-4 py-5 text-right">أ. الإدارة</th>
                <th className="px-4 py-5 text-right">أ. الدرجة</th>
                <th className="px-4 py-5 text-right">أ. الرتبة</th>
                <th className="px-4 py-5 text-right">الشهادة</th>
                <th className="px-4 py-5 text-right">الوضعية</th>
                <th className="px-4 py-5 text-right">الحركية</th>
                <th className="px-4 py-5 text-right">الهاتف</th>
                <th className="px-4 py-5 sticky left-0 bg-gray-50/50 z-10 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedStaff.length === 0 ? (
                <tr>
                  <td colSpan={18} className="px-6 py-20 text-center text-gray-300 italic">
                    <div className="flex flex-col items-center gap-4">
                      <Search className="w-12 h-12 opacity-20" />
                      <p className="font-bold">لا توجد بيانات موظفين مطابقة للبحث</p>
                    </div>
                  </td>
                </tr>
              ) : (
                renderTableRows()
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <div key="staff-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative z-10 border border-white/20"
            >
              <div className="bg-indigo-600 p-8 flex justify-between items-center text-white shrink-0 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black tracking-tight">{editingStaff ? 'تعديل بطاقة موظف' : 'إضافة موظف جديد'}</h3>
                  <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">يرجى ملء جميع الحقول المطلوبة بدقة</p>
                </div>
                <motion.button 
                  whileHover={{ rotate: 90 }}
                  onClick={closeModal} 
                  className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"
                >
                  <X className="w-6 h-6" />
                </motion.button>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-10 space-y-10 overflow-y-auto custom-scrollbar bg-gray-50/30">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Info className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 tracking-tight">معلومات شخصية</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">الاسم الكامل (Ar)</label>
                      <input type="text" required className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">الاسم الكامل (Fr)</label>
                      <input type="text" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 uppercase" dir="ltr" value={formData.fullNameFr || ''} onChange={e => setFormData({...formData, fullNameFr: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">CIN</label>
                      <input type="text" required className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.cin || ''} onChange={e => setFormData({...formData, cin: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">النوع</label>
                      <select className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 appearance-none" value={formData.gender || 'ذكر'} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="ذكر">ذكر</option>
                        <option value="أنثى">أنثى</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">الوضعية العائلية</label>
                      <select className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 appearance-none" value={formData.familyStatus || 'عازب(ة)'} onChange={e => setFormData({...formData, familyStatus: e.target.value})}>
                        <option value="عازب(ة)">عازب(ة)</option>
                        <option value="متزوج(ة)">متزوج(ة)</option>
                        <option value="مطلق(ة)">مطلق(ة)</option>
                        <option value="أرمل(ة)">أرمل(ة)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">رقم الهاتف</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input type="text" className="w-full pl-10 pr-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" dir="ltr" placeholder="06XXXXXXXX" value={formData.phoneNumber || ''} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                      </div>
                    </div>
                    <div className="lg:col-span-2 space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">البريد الإلكتروني</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input type="email" className="w-full pl-10 pr-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" dir="ltr" placeholder="example@mail.com" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                    </div>
                    <div className="lg:col-span-3 space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">العنوان الكامل</label>
                      <div className="relative">
                        <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input type="text" className="w-full pr-12 pl-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">تاريخ الازدياد</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.birthDate || ''} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">مكان الازدياد</label>
                      <input type="text" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.birthPlace || ''} onChange={e => setFormData({...formData, birthPlace: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">عدد الأطفال</label>
                      <input type="number" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.childrenCount || 0} onChange={e => setFormData({...formData, childrenCount: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">الزوج(ة) موظف(ة) بالتعليم؟</label>
                      <select className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 appearance-none" value={formData.spouseIsOfficial ? 'نعم' : 'لا'} onChange={e => setFormData({...formData, spouseIsOfficial: e.target.value === 'نعم'})}>
                        <option value="لا">لا</option>
                        <option value="نعم">نعم</option>
                      </select>
                    </div>
                    {formData.spouseIsOfficial && (
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">رقم تأجير الزوج(ة)</label>
                        <input type="text" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.spouseRegistryNumber || ''} onChange={e => setFormData({...formData, spouseRegistryNumber: e.target.value})} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Briefcase className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 tracking-tight">معلومات مهنية أساسية</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">رقم التأجير (PPR)</label>
                      <input type="text" required className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.ppr || ''} onChange={e => setFormData({...formData, ppr: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">الإطار</label>
                      <select 
                        className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 appearance-none" 
                        value={formData.cadre || ''} 
                        onChange={e => setFormData({...formData, cadre: e.target.value})}
                      >
                        <option value="">اختر الإطار...</option>
                        {cadres.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">الدرجة</label>
                      <input type="text" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.grade || ''} onChange={e => setFormData({...formData, grade: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">السلم</label>
                      <input type="text" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.scale || ''} onChange={e => setFormData({...formData, scale: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">تاريخ التوظيف (أول تعيين)</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.recruitmentDate || ''} onChange={e => setFormData({...formData, recruitmentDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">تاريخ التعيين بالمديرية</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.assignmentDate || ''} onChange={e => setFormData({...formData, assignmentDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">تاريخ التعيين بالمؤسسة</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.currentAssignmentDate || ''} onChange={e => setFormData({...formData, currentAssignmentDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">المهمة</label>
                      <input type="text" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.role || ''} onChange={e => setFormData({...formData, role: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">التخصص</label>
                      <select 
                        className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 appearance-none" 
                        value={formData.specialization || ''} 
                        onChange={e => setFormData({...formData, specialization: e.target.value})}
                      >
                        <option value="">اختر التخصص...</option>
                        {specializations.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">آخر نقطة تفتيش</label>
                      <div className="flex gap-2">
                        <input type="text" placeholder="النقطة" className="w-1/2 px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.lastInspectionGrade || ''} onChange={e => setFormData({...formData, lastInspectionGrade: e.target.value})} />
                        <input type="date" className="w-1/2 px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.lastInspectionDate || ''} onChange={e => setFormData({...formData, lastInspectionDate: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">آخر نقطة إدارية</label>
                      <div className="flex gap-2">
                        <input type="text" placeholder="النقطة" className="w-1/2 px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.lastAdminGrade || ''} onChange={e => setFormData({...formData, lastAdminGrade: e.target.value})} />
                        <input type="date" className="w-1/2 px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.lastAdminGradeDate || ''} onChange={e => setFormData({...formData, lastAdminGradeDate: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">المؤسسة الأصلية</label>
                      <input type="text" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.originalSchool || ''} onChange={e => setFormData({...formData, originalSchool: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">وضعية الفائض</label>
                      <select className="w-full px-5 py-3 bg-orange-50 border border-orange-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-orange-800 appearance-none" value={formData.surplusStatus || ''} onChange={e => setFormData({...formData, surplusStatus: e.target.value})}>
                        <option value="">رسمي</option>
                        <option value="مكلف خارج المؤسسة">مكلف خارج المؤسسة</option>
                        <option value="مكلف داخل المؤسسة">مكلف داخل المؤسسة</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-indigo-600 uppercase tracking-widest mr-1">الحركية</label>
                      <select 
                        className="w-full px-5 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-indigo-800 appearance-none" 
                        value={formData.mobility || 'لاشيء'} 
                        onChange={e => setFormData({...formData, mobility: e.target.value})}
                      >
                        <option value="لاشيء">لاشيء</option>
                        <option value="وافد">وافد</option>
                        <option value="مغادر">مغادر</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 tracking-tight">معلومات إدارية تكميلية</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">تاريخ الترسيم</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.titularizationDate || ''} onChange={e => setFormData({...formData, titularizationDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">الأقدمية في الإدارة</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.adminSeniority || ''} onChange={e => setFormData({...formData, adminSeniority: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">الأقدمية في الدرجة</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.gradeSeniority || ''} onChange={e => setFormData({...formData, gradeSeniority: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">الرتبة (Echelon)</label>
                      <input type="text" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.rank || ''} onChange={e => setFormData({...formData, rank: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">تاريخ الرتبة</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.rankDate || ''} onChange={e => setFormData({...formData, rankDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">الأقدمية في الرتبة</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.rankSeniority || ''} onChange={e => setFormData({...formData, rankSeniority: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">الشهادة الأكاديمية</label>
                      <input type="text" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.academicCertificate || ''} onChange={e => setFormData({...formData, academicCertificate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">تاريخ الشهادة الأكاديمية</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.academicCertificateDate || ''} onChange={e => setFormData({...formData, academicCertificateDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">الشهادة المهنية</label>
                      <input type="text" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.professionalCertificate || ''} onChange={e => setFormData({...formData, professionalCertificate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">تاريخ الشهادة المهنية</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.professionalCertificateDate || ''} onChange={e => setFormData({...formData, professionalCertificateDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">تاريخ الدرجة</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.gradeDate || ''} onChange={e => setFormData({...formData, gradeDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">تاريخ الحالة العائلية</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.familySituationDate || ''} onChange={e => setFormData({...formData, familySituationDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1">تاريخ الإطار</label>
                      <input type="date" className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" value={formData.cadreDate || ''} onChange={e => setFormData({...formData, cadreDate: e.target.value})} />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {formData.mobility === 'مغادر' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 p-8 bg-red-50/50 rounded-[2rem] border-2 border-dashed border-red-100 overflow-hidden"
                    >
                      <div className="flex items-center gap-3 pb-3 border-b border-red-100">
                        <ArrowRightLeft className="w-5 h-5 text-red-600 rotate-180" />
                        <h4 className="text-lg font-black text-red-900 tracking-tight">تفاصيل المغادرة</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-red-400 uppercase tracking-widest mr-1">المؤسسة المستقبلة</label>
                          <input type="text" className="w-full px-5 py-3 bg-white border border-red-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold text-red-800" value={formData.destinationSchool || ''} onChange={e => setFormData({...formData, destinationSchool: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-red-400 uppercase tracking-widest mr-1">الأكاديمية الجهوية</label>
                          <select 
                            className="w-full px-5 py-3 bg-white border border-red-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold text-red-800 appearance-none" 
                            value={formData.destinationAcademy || ''} 
                            onChange={e => {
                              const academy = e.target.value;
                              const directorates = moroccoData[academy] ? Object.keys(moroccoData[academy]) : [];
                              setFormData({
                                ...formData, 
                                destinationAcademy: academy,
                                destinationDirectorate: directorates.length > 0 ? directorates[0] : ''
                              });
                            }}
                          >
                            <option value="">اختر الأكاديمية الجهوية...</option>
                            {Object.keys(moroccoData).map(academy => (
                              <option key={academy} value={academy}>{academy}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-red-400 uppercase tracking-widest mr-1">المديرية الإقليمية</label>
                          <select 
                            className="w-full px-5 py-3 bg-white border border-red-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold text-red-800 appearance-none" 
                            value={formData.destinationDirectorate || ''} 
                            onChange={e => setFormData({...formData, destinationDirectorate: e.target.value})}
                          >
                            <option value="">اختر المديرية...</option>
                            {formData.destinationAcademy && moroccoData[formData.destinationAcademy] && 
                              Object.keys(moroccoData[formData.destinationAcademy]).map(dir => (
                                <option key={dir} value={dir}>{dir}</option>
                              ))
                            }
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-red-400 uppercase tracking-widest mr-1">المصلحة</label>
                          <input type="text" className="w-full px-5 py-3 bg-white border border-red-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold text-red-800" value={formData.destinationService || ''} onChange={e => setFormData({...formData, destinationService: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-black text-red-400 uppercase tracking-widest mr-1">المرجع</label>
                          <input type="text" className="w-full px-5 py-3 bg-white border border-red-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold text-red-800" value={formData.destinationReference || ''} onChange={e => setFormData({...formData, destinationReference: e.target.value})} placeholder="مثال: مراسلة رقم 24-23/25" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {formData.mobility === 'وافد' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 p-8 bg-blue-50/50 rounded-[2rem] border-2 border-dashed border-blue-100 overflow-hidden"
                    >
                      <div className="flex items-center gap-3 pb-3 border-b border-blue-100">
                        <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                        <h4 className="text-lg font-black text-blue-900 tracking-tight">تفاصيل الوفود</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-blue-400 uppercase tracking-widest mr-1">مؤسسة الانطلاق</label>
                          <input type="text" className="w-full px-5 py-3 bg-white border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-blue-800" value={formData.startingSchool || ''} onChange={e => setFormData({...formData, startingSchool: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-blue-400 uppercase tracking-widest mr-1">الأكاديمية الجهوية</label>
                          <select 
                            className="w-full px-5 py-3 bg-white border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-blue-800 appearance-none" 
                            value={formData.startingAcademy || ''} 
                            onChange={e => {
                              const academy = e.target.value;
                              const directorates = moroccoData[academy] ? Object.keys(moroccoData[academy]) : [];
                              setFormData({
                                ...formData, 
                                startingAcademy: academy,
                                startingDirectorate: directorates.length > 0 ? directorates[0] : ''
                              });
                            }}
                          >
                            <option value="">اختر الأكاديمية الجهوية...</option>
                            {Object.keys(moroccoData).map(academy => (
                              <option key={academy} value={academy}>{academy}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-blue-400 uppercase tracking-widest mr-1">المديرية الإقليمية</label>
                          <select 
                            className="w-full px-5 py-3 bg-white border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-blue-800 appearance-none" 
                            value={formData.startingDirectorate || ''} 
                            onChange={e => setFormData({...formData, startingDirectorate: e.target.value})}
                          >
                            <option value="">اختر المديرية...</option>
                            {formData.startingAcademy && moroccoData[formData.startingAcademy] && 
                              Object.keys(moroccoData[formData.startingAcademy]).map(dir => (
                                <option key={dir} value={dir}>{dir}</option>
                              ))
                            }
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-blue-400 uppercase tracking-widest mr-1">المصلحة</label>
                          <input type="text" className="w-full px-5 py-3 bg-white border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-blue-800" value={formData.startingService || ''} onChange={e => setFormData({...formData, startingService: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-black text-blue-400 uppercase tracking-widest mr-1">المرجع</label>
                          <input type="text" className="w-full px-5 py-3 bg-white border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-blue-800" value={formData.startingReference || ''} onChange={e => setFormData({...formData, startingReference: e.target.value})} placeholder="مثال: مراسلة رقم 24-23/25" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-10 flex gap-6 shrink-0">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-3"
                  >
                    <Plus className="w-5 h-5" />
                    حفظ البيانات
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button" 
                    onClick={closeModal} 
                    className="flex-1 bg-white text-gray-500 border-2 border-gray-100 py-4 rounded-2xl font-black hover:bg-gray-50 transition-all"
                  >
                    إلغاء
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTrackingModalOpen && (
          <div key="tracking-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrackingModalOpen(false)}
              className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-6xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative z-10 border border-white/20"
            >
              <div className="bg-amber-600 p-8 flex justify-between items-center text-white shrink-0 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black tracking-tight">تتبع وصول وإرسال الملفات الإدارية</h3>
                  <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mt-1">إدارة وضعية الملفات الإدارية للموظفين الوافدين والمغادرين</p>
                </div>
                <motion.button 
                  whileHover={{ rotate: 90 }}
                  onClick={() => setIsTrackingModalOpen(false)} 
                  className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar bg-gray-50/30 space-y-8">
                {/* إحصائيات مرئية */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black text-blue-600 uppercase mb-1">ملفات وافدة مطلوبة</span>
                    <span className="text-3xl font-black text-blue-900">{staff.filter(s => s.mobility === 'وافد' && s.adminFileStatus !== 'received').length}</span>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black text-emerald-600 uppercase mb-1">ملفات وافدة تم التوصل بها</span>
                    <span className="text-3xl font-black text-emerald-900">{staff.filter(s => s.mobility === 'وافد' && s.adminFileStatus === 'received').length}</span>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black text-amber-600 uppercase mb-1">ملفات مغادرة واجب إرسالها</span>
                    <span className="text-3xl font-black text-amber-900">{staff.filter(s => s.mobility === 'مغادر' && s.adminFileStatus !== 'sent').length}</span>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black text-indigo-600 uppercase mb-1">ملفات مغادرة تم إرسالها</span>
                    <span className="text-3xl font-black text-indigo-900">{staff.filter(s => s.mobility === 'مغادر' && s.adminFileStatus === 'sent').length}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* الوافدون */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b-2 border-blue-200">
                      <FileUp className="w-6 h-6 text-blue-600" />
                      <h4 className="text-xl font-black text-blue-900">الموظفون الوافدون (تتبع الوصول)</h4>
                    </div>
                    <div className="space-y-3">
                      {staff.filter(s => s.mobility === 'وافد').length === 0 ? (
                        <p className="text-center py-10 text-gray-400 font-bold italic">لا يوجد موظفون وافدون حالياً</p>
                      ) : (
                        staff.filter(s => s.mobility === 'وافد').map(s => (
                          <div key={s.id} className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-black text-gray-900">{s.fullName}</p>
                                <p className="text-xs text-gray-500 font-bold">PPR: {s.ppr} | من: {s.startingSchool}</p>
                              </div>
                              <select 
                                className={cn(
                                  "text-xs font-black px-3 py-1 rounded-full border outline-none",
                                  s.adminFileStatus === 'received' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                )}
                                value={s.adminFileStatus || 'pending'}
                                onChange={(e) => {
                                  const updated = staff.map(item => item.id === s.id ? { ...item, adminFileStatus: e.target.value as any } : item);
                                  onUpdate(updated);
                                }}
                              >
                                <option value="pending">في الانتظار</option>
                                <option value="received">تم التوصل به</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="date" 
                                className="text-xs p-2 border border-gray-100 rounded-lg outline-none focus:border-blue-400"
                                value={s.adminFileDate ? s.adminFileDate.split(/[T\s]/)[0] : ''}
                                onChange={(e) => {
                                  const updated = staff.map(item => item.id === s.id ? { ...item, adminFileDate: e.target.value } : item);
                                  onUpdate(updated);
                                }}
                              />
                              <input 
                                type="text" 
                                placeholder="ملاحظات..."
                                className="text-xs p-2 border border-gray-100 rounded-lg outline-none focus:border-blue-400"
                                value={s.adminFileNotes || ''}
                                onChange={(e) => {
                                  const updated = staff.map(item => item.id === s.id ? { ...item, adminFileNotes: e.target.value } : item);
                                  onUpdate(updated);
                                }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* المغادرون */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b-2 border-red-200">
                      <FileDown className="w-6 h-6 text-red-600" />
                      <h4 className="text-xl font-black text-red-900">الموظفون المغادرون (تتبع الإرسال)</h4>
                    </div>
                    <div className="space-y-3">
                      {staff.filter(s => s.mobility === 'مغادر').length === 0 ? (
                        <p className="text-center py-10 text-gray-400 font-bold italic">لا يوجد موظفون مغادرون حالياً</p>
                      ) : (
                        staff.filter(s => s.mobility === 'مغادر').map(s => (
                          <div key={s.id} className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-black text-gray-900">{s.fullName}</p>
                                <p className="text-xs text-gray-500 font-bold">PPR: {s.ppr} | إلى: {s.destinationSchool}</p>
                              </div>
                              <select 
                                className={cn(
                                  "text-xs font-black px-3 py-1 rounded-full border outline-none",
                                  s.adminFileStatus === 'sent' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                )}
                                value={s.adminFileStatus || 'pending'}
                                onChange={(e) => {
                                  const updated = staff.map(item => item.id === s.id ? { ...item, adminFileStatus: e.target.value as any } : item);
                                  onUpdate(updated);
                                }}
                              >
                                <option value="pending">في الانتظار</option>
                                <option value="sent">تم الإرسال</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="date" 
                                className="text-xs p-2 border border-gray-100 rounded-lg outline-none focus:border-red-400"
                                value={s.adminFileDate ? s.adminFileDate.split(/[T\s]/)[0] : ''}
                                onChange={(e) => {
                                  const updated = staff.map(item => item.id === s.id ? { ...item, adminFileDate: e.target.value } : item);
                                  onUpdate(updated);
                                }}
                              />
                              <input 
                                type="text" 
                                placeholder="ملاحظات..."
                                className="text-xs p-2 border border-gray-100 rounded-lg outline-none focus:border-red-400"
                                value={s.adminFileNotes || ''}
                                onChange={(e) => {
                                  const updated = staff.map(item => item.id === s.id ? { ...item, adminFileNotes: e.target.value } : item);
                                  onUpdate(updated);
                                }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-8 bg-white border-t border-gray-100 flex justify-between items-center">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrintTrackingList}
                  className="bg-white text-emerald-600 border-2 border-emerald-100 px-8 py-3 rounded-2xl font-black shadow-sm flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  طبع لائحة التتبع
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsTrackingModalOpen(false)}
                  className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black shadow-xl shadow-indigo-600/20"
                >
                  إغلاق
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
