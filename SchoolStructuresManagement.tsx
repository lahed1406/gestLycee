
import React, { useState, useMemo } from 'react';
import { SchoolStructure, StructureMember, StaffMember, SchoolData, TimetableActivity } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  UserPlus, 
  Search, 
  Shield, 
  Briefcase,
  UserCheck,
  Building2,
  GraduationCap,
  HeartHandshake,
  MessageSquare,
  Trophy,
  Rocket,
  UserCircle,
  ExternalLink,
  ChevronLeft,
  Info,
  Calendar,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SchoolStructuresManagementProps {
  structures: SchoolStructure[];
  onUpdate: (structures: SchoolStructure[]) => void;
  staff: StaffMember[];
  schoolData: SchoolData;
  timetable: TimetableActivity[];
}

const DEFAULT_STRUCTURES = [
  { id: 'class_councils', name: 'مجالس الأقسام', icon: Users, description: 'تضم أساتذة القسم وممثلين عن التلاميذ والآباء' },
  { id: 'educational_councils', name: 'المجالس التعليمية', icon: Briefcase, description: 'تضم أساتذة المادة الواحدة' },
  { id: 'pedagogical_council', name: 'المجلس التربوي', icon: GraduationCap, description: 'يضم ممثلين عن كل مادة ومستوى' },
  { id: 'management_council', name: 'مجلس التدبير', icon: Shield, description: 'أعلى هيئة تقريرية في المؤسسة' },
  { id: 'subject_coordinators', name: 'منسقو المواد', icon: UserCheck, description: 'المسؤولون عن تنسيق المواد الدراسية' },
  { id: 'club_coordinators', name: 'منسقو الأندية', icon: Rocket, description: 'المسؤولون عن تنشيط الأندية المدرسية' },
  { id: 'success_school_assoc', name: 'جمعية دعم مدرسة النجاح', icon: Building2, description: 'الجمعية المسؤولة عن تدبير ميزانية مشروع المؤسسة' },
  { id: 'sports_assoc', name: 'الجمعية الرياضية', icon: Trophy, description: 'الجمعية الرياضية المدرسية' },
  { id: 'school_project_team', name: 'فريق قيادة مشروع المؤسسة المندمج', icon: Rocket, description: 'الفريق المكلف ببلورة وتتبع مشروع المؤسسة' },
  { id: 'listening_cell', name: 'خلية الإنصات والوساطة', icon: HeartHandshake, description: 'خلية الدعم النفسي والاجتماعي للتلاميذ' },
  { id: 'student_council', name: 'المجلس التلاميذي', icon: MessageSquare, description: 'ممثلوا التلاميذ في هياكل المؤسسة' },
  { id: 'inclusive_edu_cell', name: 'خلية التربية الدامجة', icon: UserCircle, description: 'الخلية المكلفة بمواكبة التلاميذ في وضعية إعاقة' },
];

const EXTERNAL_PARTNERS = [
  'ممثل جمعية أمهات وآباء وأولياء التلاميذ',
  'ممثل المجلس الجماعي',
  'المستشار في التوجيه'
];

export const SchoolStructuresManagement: React.FC<SchoolStructuresManagementProps> = ({
  structures,
  onUpdate,
  staff,
  schoolData,
  timetable
}) => {
  const [selectedStructureId, setSelectedStructureId] = useState(DEFAULT_STRUCTURES[0].id);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberType, setMemberType] = useState<'staff' | 'external' | 'student'>('staff');
  const [searchQuery, setSearchQuery] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffOverrides, setStaffOverrides] = useState<{ [staffId: string]: { role: string; task: string } }>({});
  const [externalName, setExternalName] = useState('');
  const [ppr, setPpr] = useState('');
  const [cin, setCin] = useState('');
  const [task, setTask] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [massarNumber, setMassarNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentGender, setStudentGender] = useState('');
  const [assignedClasses, setAssignedClasses] = useState('');

  const groupedStaff = useMemo(() => {
    const groups: { [key: string]: StaffMember[] } = {};
    staff.forEach(s => {
      const spec = s.specialization || 'أخرى';
      if (!groups[spec]) groups[spec] = [];
      groups[spec].push(s);
    });
    return groups;
  }, [staff]);

  const currentStructure = useMemo(() => {
    const found = structures.find(s => s.id === selectedStructureId);
    if (found) return found;
    
    const def = DEFAULT_STRUCTURES.find(d => d.id === selectedStructureId);
    return {
      id: selectedStructureId,
      name: def?.name || '',
      members: []
    };
  }, [structures, selectedStructureId]);

  const filteredStaff = useMemo(() => {
    return staff.filter(s => 
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ppr.includes(searchQuery)
    );
  }, [staff, searchQuery]);

  const handleAddMember = () => {
    if (memberType === 'external' && !externalName) return;
    if (memberType === 'staff' && selectedStaffIds.length === 0) return;
    if (memberType === 'student' && !studentName) return;
    if (!memberRole) return;

    const updatedStructures = [...structures];
    let structureIndex = updatedStructures.findIndex(s => s.id === selectedStructureId);
    
    if (structureIndex === -1) {
      updatedStructures.push({
        id: selectedStructureId,
        name: DEFAULT_STRUCTURES.find(d => d.id === selectedStructureId)?.name || '',
        members: []
      });
      structureIndex = updatedStructures.length - 1;
    }

    const newMembers: StructureMember[] = [];

    if (memberType === 'staff') {
      selectedStaffIds.forEach(id => {
        const s = staff.find(st => st.id === id);
        if (s) {
          const teacherClasses = (s.role.includes('أستاذ') || s.role.includes('مدرس')) 
            ? Array.from(new Set(timetable.filter(t => t.teacher === s.fullName).map(t => t.studentSet))).join(' - ')
            : undefined;

          const override = staffOverrides[id] || {};
          
          // Auto-role logic
          let autoRole = memberRole || 'عضو';
          if (!memberRole && !override.role) {
            if (s.role.includes('مدرس') || s.role.includes('أستاذ')) autoRole = 'عضو';
            if (s.role.includes('مدير')) autoRole = 'رئيس المجلس';
          }

          newMembers.push({
            id: crypto.randomUUID(),
            fullName: s.fullName,
            roleInStructure: override.role || autoRole,
            isExternal: false,
            isStudent: false,
            staffId: id,
            ppr: s.ppr,
            task: override.task || task || s.role,
            assignedClasses: (selectedStructureId === 'class_councils') ? teacherClasses : undefined
          });
        }
      });
    } else if (memberType === 'external') {
      newMembers.push({
        id: crypto.randomUUID(),
        fullName: externalName,
        roleInStructure: memberRole,
        isExternal: true,
        isStudent: false,
        ppr: ppr || undefined,
        cin: cin || undefined
      });
    } else {
      newMembers.push({
        id: crypto.randomUUID(),
        fullName: studentName,
        roleInStructure: memberRole,
        isExternal: false,
        isStudent: true,
        task: task || undefined,
        studentClass: studentClass || undefined,
        massarNumber: massarNumber || undefined,
        gender: studentGender || undefined
      });
    }

    updatedStructures[structureIndex] = {
      ...updatedStructures[structureIndex],
      members: [...updatedStructures[structureIndex].members, ...newMembers]
    };

    onUpdate(updatedStructures);
    resetModal();
  };

  const resetModal = () => {
    setShowAddMemberModal(false);
    setMemberRole('');
    setSelectedStaffIds([]);
    setStaffOverrides({});
    setExternalName('');
    setMemberType('staff');
    setPpr('');
    setCin('');
    setTask('');
    setStudentClass('');
    setMassarNumber('');
    setStudentName('');
    setStudentGender('');
    setSearchQuery('');
    setAssignedClasses('');
  };

  const handleRemoveMember = (memberId: string) => {
    const updatedStructures = structures.map(s => {
      if (s.id === selectedStructureId) {
        return {
          ...s,
          members: s.members.filter(m => m.id !== memberId)
        };
      }
      return s;
    });
    onUpdate(updatedStructures);
    setSelectedMemberIds(prev => prev.filter(id => id !== memberId));
  };

  const handleUpdateMember = (memberId: string, updates: Partial<StructureMember>) => {
    const updatedStructures = structures.map(s => {
      if (s.id === selectedStructureId) {
        return {
          ...s,
          members: s.members.map(m => m.id === memberId ? { ...m, ...updates } : m)
        };
      }
      return s;
    });
    onUpdate(updatedStructures);
  };

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState('');
  const [bulkTask, setBulkTask] = useState('');

  const handleBulkUpdate = () => {
    if (selectedMemberIds.length === 0) return;
    const updatedStructures = structures.map(s => {
      if (s.id === selectedStructureId) {
        return {
          ...s,
          members: s.members.map(m => {
            if (selectedMemberIds.includes(m.id)) {
              return {
                ...m,
                roleInStructure: bulkRole || m.roleInStructure,
                task: bulkTask || m.task
              };
            }
            return m;
          })
        };
      }
      return s;
    });
    onUpdate(updatedStructures);
    setBulkRole('');
    setBulkTask('');
    setSelectedMemberIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedMemberIds.length === 0) return;
    const updatedStructures = structures.map(s => {
      if (s.id === selectedStructureId) {
        return {
          ...s,
          members: s.members.filter(m => !selectedMemberIds.includes(m.id))
        };
      }
      return s;
    });
    onUpdate(updatedStructures);
    setSelectedMemberIds([]);
  };

  const handlePrintClassCouncils = () => {
    // Define subject order priority strictly as requested
    const subjectPriority = [
      'العربية',
      'الإنجليزية',
      'الفرنسية',
      'التربية الإسلامية',
      'الاجتماعيات',
      'التاريخ والجغرافيا',
      'الإعلاميات',
      'المعلوميات',
      'الفلسفة',
      'التربية البدنية',
      'الرياضيات',
      'الفيزياء والكيمياء',
      'علوم الحياة والأرض'
    ];

    const normalizeArabic = (s: string) => 
      s.replace(/[أإآ]/g, 'ا')
       .replace(/ة/g, 'ه')
       .replace(/\s+/g, ' ')
       .trim();

    // Extract unique subjects and sort them based on priority
    const subjects = Array.from(new Set<string>(timetable.map(t => t.subject))).sort((a, b) => {
      const getPriority = (subjectName: string) => {
        const normSubject = normalizeArabic(subjectName);
        const index = subjectPriority.findIndex(p => {
          const normP = normalizeArabic(p);
          return normSubject.includes(normP) || normP.includes(normSubject);
        });
        return index === -1 ? 999 : index;
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.localeCompare(b, 'ar');
    });
    
    // Filter out classes ending with G followed by a number (e.g., :G1, :G2)
    const classes = Array.from(new Set<string>(timetable.map(t => t.studentSet)))
      .filter((c: string) => !/:G\d+$/.test(c) && !/G\d+$/.test(c))
      .sort();

    // Create a mapping of (subject, class) -> teacher
    const teacherMap: { [key: string]: string } = {};
    timetable.forEach(t => {
      // We take the first teacher found for that subject/class combination
      if (!teacherMap[`${t.subject}-${t.studentSet}`]) {
        teacherMap[`${t.subject}-${t.studentSet}`] = t.teacher;
      }
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const generalSupervisor = staff.find(s => s.role.includes('حارس عام'))?.fullName || '............';

    const html = `
      <html dir="rtl">
        <head>
          <title>تقرير مجالس الأقسام</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
            @media print {
              @page { size: landscape; margin: 0; }
              body { -webkit-print-color-adjust: exact; padding: 1cm; }
              .no-print { display: none; }
            }
            body { 
              font-family: 'Amiri', serif; 
              margin: 0; 
              padding: 20px; 
              background-color: white;
              color: black;
            }
            .header-container {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;
              margin-bottom: 2px;
              min-height: 70px;
            }
            .title-section {
              text-align: center;
              margin-bottom: 5px;
            }
            .title { 
              font-size: 22px; 
              font-weight: bold; 
              text-decoration: underline; 
              margin-bottom: 2px;
            }
            .council-info {
              display: flex;
              justify-content: center;
              gap: 60px;
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              table-layout: fixed; 
              border: 2px solid black;
            }
            th, td { 
              border: 1px solid black; 
              padding: 1px; 
              text-align: center; 
              font-size: 10px; 
              height: 20px;
              word-wrap: break-word;
            }
            th { 
              background-color: #e5e5e5 !important; 
              font-weight: bold;
              font-size: 11px;
            }
            .class-col { 
              width: 70px; 
              font-weight: bold;
              background-color: #f0f0f0 !important;
            }
            .footer {
              margin-top: 10px;
              display: flex;
              justify-content: flex-end;
              padding-left: 100px;
            }
            .signature-box {
              text-align: center;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            ${schoolData.logo ? `<img src="${schoolData.logo}" style="max-width: 90%; height: 70px; object-fit: contain; margin: 0 auto;" />` : '<div style="height: 70px; display: flex; align-items: center; font-weight: bold; font-size: 20px;">${schoolData.name}</div>'}
          </div>
          
          <div class="title-section">
            <div class="title">أعضاء مجالس الأقسام للموسم الدراسي ${schoolData.academicYear || '............'}</div>
          </div>

          <div class="council-info">
            <span>رئيس المجلس: السيد ${schoolData.director || '............'}</span>
            <span>عضو المجلس: السيد ${generalSupervisor} (حارس عام للخارجية)</span>
          </div>
          
          <table>
            <thead>
              <tr>
                <th class="class-col">القسم</th>
                ${subjects.map(s => `<th>${s}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${classes.map(c => `
                <tr>
                  <td class="class-col">${c}</td>
                  ${subjects.map(s => `<td>${teacherMap[`${s}-${c}`] || '-----'}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div class="signature-box">
              <p>توقيع السيد المدير:</p>
              <p style="margin-top: 10px;">${schoolData.director || '............'}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    // Give fonts time to load
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handlePrintEducationalCouncils = () => {
    // Define subject order priority strictly as requested
    const subjectPriority = [
      'العربية',
      'الإنجليزية',
      'الفرنسية',
      'التربية الإسلامية',
      'الاجتماعيات',
      'التاريخ والجغرافيا',
      'الإعلاميات',
      'المعلوميات',
      'الفلسفة',
      'التربية البدنية',
      'الرياضيات',
      'الفيزياء والكيمياء',
      'علوم الحياة والأرض'
    ];

    const normalizeArabic = (s: string) => 
      s.replace(/[أإآ]/g, 'ا')
       .replace(/ة/g, 'ه')
       .replace(/\s+/g, ' ')
       .trim();

    // Extract unique teachers per subject
    const subjectTeachers: { [key: string]: Set<string> } = {};
    timetable.forEach(t => {
      if (!subjectTeachers[t.subject]) {
        subjectTeachers[t.subject] = new Set<string>();
      }
      subjectTeachers[t.subject].add(t.teacher);
    });

    // Sort subjects based on priority
    const subjects = Object.keys(subjectTeachers).sort((a, b) => {
      const getPriority = (subjectName: string) => {
        const normSubject = normalizeArabic(subjectName);
        const index = subjectPriority.findIndex(p => {
          const normP = normalizeArabic(p);
          return normSubject.includes(normP) || normP.includes(normSubject);
        });
        return index === -1 ? 999 : index;
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.localeCompare(b, 'ar');
    });

    // Find max number of teachers in any subject for row generation
    const maxRows = Math.max(...subjects.map(s => subjectTeachers[s].size), 1);
    
    // Calculate total unique teachers across all subjects
    const allTeachers = new Set<string>();
    timetable.forEach(t => allTeachers.add(t.teacher));
    const totalTeachersCount = allTeachers.size;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const directorOfStudies = staff.find(s => s.role.includes('ناظر'))?.fullName || '............';

    const html = `
      <html dir="rtl">
        <head>
          <title>تقرير المجالس التعليمية</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
            @media print {
              @page { size: landscape; margin: 0; }
              body { -webkit-print-color-adjust: exact; padding: 1cm; }
            }
            body { 
              font-family: 'Amiri', serif; 
              margin: 0; 
              padding: 20px; 
              background-color: white;
              color: black;
            }
            .header-container {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;
              margin-bottom: 2px;
              min-height: 70px;
            }
            .title-section {
              text-align: center;
              margin-bottom: 5px;
            }
            .title { 
              font-size: 22px; 
              font-weight: bold; 
              text-decoration: underline; 
              margin-bottom: 2px;
            }
            .council-info {
              display: flex;
              justify-content: center;
              gap: 60px;
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              table-layout: fixed; 
              border: 2px solid black;
            }
            th, td { 
              border: 1px solid black; 
              padding: 1px; 
              text-align: center; 
              font-size: 10px; 
              height: 22px;
              word-wrap: break-word;
            }
            th { 
              background-color: #e5e5e5 !important; 
              font-weight: bold;
              font-size: 11px;
            }
            .stats-row td {
              background-color: #f5f5f5 !important;
              font-weight: bold;
              font-size: 13px;
            }
            .total-row td {
              background-color: #e0e0e0 !important;
              font-weight: bold;
              font-size: 15px;
              height: 30px;
            }
            .footer {
              margin-top: 10px;
              display: flex;
              justify-content: flex-end;
              padding-left: 100px;
            }
            .signature-box {
              text-align: center;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            ${schoolData.logo ? `<img src="${schoolData.logo}" style="max-width: 90%; height: 70px; object-fit: contain; margin: 0 auto;" />` : '<div style="height: 70px; display: flex; align-items: center; font-weight: bold; font-size: 20px;">${schoolData.name}</div>'}
          </div>
          
          <div class="title-section">
            <div class="title">أعضاء المجالس التعليمية للموسم الدراسي ${schoolData.academicYear || '............'}</div>
          </div>

          <div class="council-info">
            <span>رئيس المجلس: السيد ${schoolData.director || '............'}</span>
            <span>عضو المجلس: السيد ${directorOfStudies} (ناظر الدروس)</span>
          </div>
          
          <table>
            <thead>
              <tr>
                ${subjects.map(s => `<th>${s}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: maxRows }).map((_, rowIndex) => `
                <tr>
                  ${subjects.map(s => {
                    const teachers = Array.from(subjectTeachers[s]);
                    return `<td>${teachers[rowIndex] || ''}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
              <tr class="stats-row">
                ${subjects.map(s => `<td>${String(subjectTeachers[s].size).padStart(2, '0')}</td>`).join('')}
              </tr>
              <tr class="total-row">
                <td colspan="${subjects.length}">${totalTeachersCount}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div class="signature-box">
              <p>توقيع السيد المدير:</p>
              <p style="margin-top: 10px;">${schoolData.director || '............'}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handlePrintGenericStructure = (title: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Determine column headers based on structure
    let taskHeader = 'المهمة داخل المؤسسة';
    let roleHeader = 'المهمة داخل المجلس';

    if (selectedStructureId === 'success_school_assoc' || selectedStructureId === 'sports_assoc') {
      roleHeader = 'المهمة داخل المكتب';
    } else if (selectedStructureId === 'school_project_team') {
      roleHeader = 'المهمة داخل الفريق';
    } else if (selectedStructureId === 'listening_cell') {
      roleHeader = 'المهمة داخل الخلية';
    }

    const isStudentCouncil = selectedStructureId === 'student_council';

    const html = `
      <html dir="rtl">
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
            @media print {
              @page { size: portrait; margin: 0; }
              body { -webkit-print-color-adjust: exact; padding: 1cm; }
            }
            body { 
              font-family: 'Amiri', serif; 
              margin: 0; 
              padding: 20px; 
              background-color: white;
              color: black;
            }
            .header-container {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;
              margin-bottom: 5px;
              min-height: 80px;
            }
            .title-section {
              text-align: center;
              margin-bottom: 15px;
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              text-decoration: underline; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              border: 2px solid black;
            }
            th, td { 
              border: 1px solid black; 
              padding: 8px; 
              text-align: center; 
              font-size: 14px;
            }
            th { 
              background-color: #e5e5e5 !important; 
              font-weight: bold;
            }
            .index-col { width: 50px; background-color: #f0f0f0 !important; }
            .footer {
              margin-top: 50px;
              display: flex;
              justify-content: flex-end;
              padding-left: 50px;
            }
            .signature-box {
              text-align: center;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            ${schoolData.logo ? `<img src="${schoolData.logo}" style="max-width: 100%; max-height: 80px; object-fit: contain; display: block; margin: 0 auto;" />` : `<div style="height: 80px; display: flex; align-items: center; font-weight: bold; font-size: 20px;">${schoolData.name}</div>`}
          </div>
          
          <div class="title-section">
            <div class="title">${title} ${schoolData.academicYear || '............'}</div>
          </div>

          <table>
            <thead>
              ${isStudentCouncil ? `
                <tr>
                  <th class="index-col">رت</th>
                  <th>الإسم الكامل</th>
                  <th>رقم مسار</th>
                  <th>الجنس</th>
                  <th>المستوى الدراسي</th>
                </tr>
              ` : `
                <tr>
                  <th class="index-col">رت</th>
                  <th>الإسم الكامل</th>
                  <th>${taskHeader}</th>
                  <th>${roleHeader}</th>
                </tr>
              `}
            </thead>
            <tbody>
              ${currentStructure.members.map((m, index) => isStudentCouncil ? `
                <tr>
                  <td class="index-col">${index + 1}</td>
                  <td>${m.fullName}</td>
                  <td>${m.massarNumber || '-----'}</td>
                  <td>${m.gender || '-----'}</td>
                  <td>${m.studentClass || '-----'}</td>
                </tr>
              ` : `
                <tr>
                  <td class="index-col">${index + 1}</td>
                  <td>${m.fullName}</td>
                  <td>${m.task || '-----'}</td>
                  <td>${m.roleInStructure}</td>
                </tr>
              `).join('')}
              ${currentStructure.members.length === 0 ? `
                <tr>
                  <td colspan="${isStudentCouncil ? 5 : 4}" style="height: 100px; color: #999;">لا يوجد أعضاء مضافون حالياً</td>
                </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="footer">
            <div class="signature-box">
              <p>توقيع مدير المؤسسة:</p>
              <p style="margin-top: 30px;">${schoolData.director || '............'}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const selectedDef = DEFAULT_STRUCTURES.find(d => d.id === selectedStructureId);

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
      {/* Sidebar - Structures List */}
      <div className="lg:w-80 flex-shrink-0 space-y-3">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 bg-gray-50/50">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              هياكل المؤسسة
            </h3>
          </div>
          <div className="p-2 space-y-1">
            {DEFAULT_STRUCTURES.map((struct) => (
              <button
                key={struct.id}
                onClick={() => setSelectedStructureId(struct.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-right ${
                  selectedStructureId === struct.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <struct.icon className={`w-5 h-5 ${selectedStructureId === struct.id ? 'text-white' : 'text-indigo-500'}`} />
                <span className="text-xs font-bold flex-1">{struct.name}</span>
                {selectedStructureId === struct.id && <ChevronLeft className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Partners Quick Info */}
        <div className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100">
          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <HeartHandshake className="w-3 h-3" />
            الشركاء الخارجيون
          </h4>
          <ul className="space-y-2">
            {EXTERNAL_PARTNERS.map((partner, idx) => (
              <li key={idx} className="text-[10px] text-indigo-700 font-bold flex items-center gap-2">
                <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                {partner}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content - Members Management */}
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-full flex flex-col">
          {/* Header */}
          <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-indigo-100 rounded-2xl">
                {selectedDef && <selectedDef.icon className="w-8 h-8 text-indigo-600" />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">{selectedDef?.name}</h2>
                <p className="text-xs text-gray-500 font-bold mt-1">{selectedDef?.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedStructureId === 'class_councils' && (
                <button
                  onClick={handlePrintClassCouncils}
                  className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Printer className="w-5 h-5" />
                  <span>طبع التقرير</span>
                </button>
              )}
              {selectedStructureId === 'educational_councils' && (
                <button
                  onClick={handlePrintEducationalCouncils}
                  className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Printer className="w-5 h-5" />
                  <span>طبع التقرير</span>
                </button>
              )}
              {selectedStructureId === 'pedagogical_council' && (
                <button
                  onClick={() => handlePrintGenericStructure('أعضاء المجلس التربوي للموسم الدراسي')}
                  className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Printer className="w-5 h-5" />
                  <span>طبع التقرير</span>
                </button>
              )}
              {selectedStructureId === 'management_council' && (
                <button
                  onClick={() => handlePrintGenericStructure('أعضاء مجلس التدبير للموسم الدراسي')}
                  className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Printer className="w-5 h-5" />
                  <span>طبع التقرير</span>
                </button>
              )}
              {selectedStructureId === 'subject_coordinators' && (
                <button
                  onClick={() => handlePrintGenericStructure('لائحة منسقي المواد للموسم الدراسي')}
                  className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Printer className="w-5 h-5" />
                  <span>طبع التقرير</span>
                </button>
              )}
              {selectedStructureId === 'club_coordinators' && (
                <button
                  onClick={() => handlePrintGenericStructure('لائحة منسقي الأندية المدرسية للموسم الدراسي')}
                  className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Printer className="w-5 h-5" />
                  <span>طبع التقرير</span>
                </button>
              )}
              {selectedStructureId === 'success_school_assoc' && (
                <button
                  onClick={() => handlePrintGenericStructure('أعضاء مكتب جمعية دعم مدرسة النجاح للموسم الدراسي')}
                  className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Printer className="w-5 h-5" />
                  <span>طبع التقرير</span>
                </button>
              )}
              {selectedStructureId === 'sports_assoc' && (
                <button
                  onClick={() => handlePrintGenericStructure('أعضاء مكتب الجمعية الرياضية المدرسية للموسم الدراسي')}
                  className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Printer className="w-5 h-5" />
                  <span>طبع التقرير</span>
                </button>
              )}
              {selectedStructureId === 'school_project_team' && (
                <button
                  onClick={() => handlePrintGenericStructure('أعضاء فريق قيادة مشروع المؤسسة المندمج للموسم الدراسي')}
                  className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Printer className="w-5 h-5" />
                  <span>طبع التقرير</span>
                </button>
              )}
              {selectedStructureId === 'listening_cell' && (
                <button
                  onClick={() => handlePrintGenericStructure('أعضاء خلية الإنصات والوساطة للموسم الدراسي')}
                  className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Printer className="w-5 h-5" />
                  <span>طبع التقرير</span>
                </button>
              )}
              {selectedStructureId === 'student_council' && (
                <button
                  onClick={() => handlePrintGenericStructure('أعضاء المجلس التلاميذي للموسم الدراسي')}
                  className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Printer className="w-5 h-5" />
                  <span>طبع التقرير</span>
                </button>
              )}
              {selectedStructureId === 'inclusive_edu_cell' && (
                <button
                  onClick={() => handlePrintGenericStructure('أعضاء خلية التربية الدامجة للموسم الدراسي')}
                  className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Printer className="w-5 h-5" />
                  <span>طبع التقرير</span>
                </button>
              )}
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
              >
                <UserPlus className="w-5 h-5" />
                <span>إضافة عضو</span>
              </button>
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 p-8">
            {currentStructure.members.length > 0 && (
              <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={currentStructure.members.length > 0 && currentStructure.members.every(m => selectedMemberIds.includes(m.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMemberIds(currentStructure.members.map(m => m.id));
                      } else {
                        setSelectedMemberIds([]);
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-black text-indigo-900">اختيار الكل ({selectedMemberIds.length})</span>
                </div>
                
                {selectedMemberIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      placeholder="تغيير الصفة للكل..."
                      value={bulkRole}
                      onChange={(e) => setBulkRole(e.target.value)}
                      className="p-2 text-[10px] font-bold rounded-xl border border-indigo-200 bg-white w-32"
                    />
                    <input
                      type="text"
                      placeholder="تغيير المهمة للكل..."
                      value={bulkTask}
                      onChange={(e) => setBulkTask(e.target.value)}
                      className="p-2 text-[10px] font-bold rounded-xl border border-indigo-200 bg-white w-32"
                    />
                    <button
                      onClick={handleBulkUpdate}
                      className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl hover:bg-indigo-700 transition-all"
                    >
                      تطبيق التعديل
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-4 py-2 bg-rose-100 text-rose-600 text-[10px] font-black rounded-xl hover:bg-rose-200 transition-all"
                    >
                      حذف المختار
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentStructure.members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {currentStructure.members.map((member) => (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-5 rounded-3xl border transition-all group relative ${
                      selectedMemberIds.includes(member.id) 
                        ? 'bg-indigo-50 border-indigo-200 shadow-md' 
                        : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMemberIds([...selectedMemberIds, member.id]);
                            } else {
                              setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-lg ${
                        member.isExternal ? 'bg-amber-50 text-amber-600' : 
                        member.isStudent ? 'bg-emerald-50 text-emerald-600' :
                        'bg-indigo-50 text-indigo-600'
                      }`}>
                        {member.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-gray-900 truncate">{member.fullName}</h4>
                          {member.isExternal && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded-full">شريك</span>
                          )}
                          {member.isStudent && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-full">تلميذ</span>
                          )}
                        </div>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-indigo-400" />
                            <input
                              type="text"
                              value={member.roleInStructure}
                              onChange={(e) => handleUpdateMember(member.id, { roleInStructure: e.target.value })}
                              className="flex-1 p-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50/50 rounded-lg border-transparent focus:border-indigo-200 focus:bg-white transition-all"
                              placeholder="الصفة..."
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Rocket className="w-3 h-3 text-amber-400" />
                            <input
                              type="text"
                              value={member.task || ''}
                              onChange={(e) => handleUpdateMember(member.id, { task: e.target.value })}
                              className="flex-1 p-1.5 text-[10px] font-black text-amber-600 bg-amber-50/50 rounded-lg border-transparent focus:border-amber-200 focus:bg-white transition-all"
                              placeholder="المهمة..."
                            />
                          </div>
                        </div>

                        {!member.isExternal && !member.isStudent && (
                          <div className="mt-3 pt-3 border-t border-gray-50 space-y-0.5">
                            <p className="text-[9px] text-gray-400 font-bold">
                              {staff.find(s => s.id === member.staffId)?.specialization || '---'}
                              {member.ppr && ` | PPR: ${member.ppr}`}
                            </p>
                            {member.assignedClasses && (
                              <p className="text-[9px] text-emerald-600 font-black flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                الأقسام: {member.assignedClasses}
                              </p>
                            )}
                          </div>
                        )}
                        {member.isExternal && member.ppr && (
                          <p className="text-[9px] text-gray-400 font-bold mt-2">
                            PPR: {member.ppr} {member.cin && `| CIN: ${member.cin}`}
                          </p>
                        )}
                        {member.isStudent && (
                          <p className="text-[9px] text-gray-400 font-bold mt-2">
                            {member.studentClass} {member.massarNumber && `| مسار: ${member.massarNumber}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="absolute top-4 left-4 p-2 text-gray-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-lg font-black text-gray-400">لا يوجد أعضاء مسجلون</h3>
                <p className="text-xs text-gray-400 font-bold mt-1">ابدأ بإضافة أعضاء لهذا الهيكل</p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center gap-3">
            <Info className="w-4 h-4 text-indigo-400" />
            <p className="text-[10px] text-gray-500 font-bold">
              يمكنك إضافة أعضاء من الطاقم الإداري والتربوي للمؤسسة، أو شركاء خارجيين (جمعية الآباء، الجماعة، إلخ).
            </p>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <div key="add-member-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-2xl">
                    <UserPlus className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">إضافة عضو جديد</h3>
                    <p className="text-xs text-gray-500 font-bold">لـ: {selectedDef?.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowAddMemberModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <Plus className="w-6 h-6 text-gray-400 rotate-45" />
                </button>
              </div>

              <div className="p-8 space-y-6 text-right" dir="rtl">
                {/* Member Type Toggle */}
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                  <button
                    onClick={() => setMemberType('staff')}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${memberType === 'staff' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    موظف
                  </button>
                  <button
                    onClick={() => setMemberType('student')}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${memberType === 'student' ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    تلميذ
                  </button>
                  <button
                    onClick={() => setMemberType('external')}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${memberType === 'external' ? 'bg-white text-amber-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    شريك خارجي
                  </button>
                </div>

                {memberType === 'external' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700">الاسم الكامل للشريك</label>
                        <input
                          type="text"
                          value={externalName}
                          onChange={(e) => setExternalName(e.target.value)}
                          placeholder="أدخل اسم الشريك..."
                          className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700">الصفة / الشريك</label>
                        <select
                          value={memberRole}
                          onChange={(e) => setMemberRole(e.target.value)}
                          className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                        >
                          <option value="">اختر الصفة...</option>
                          {EXTERNAL_PARTNERS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                          <option value="شريك آخر">شريك آخر (إدخال يدوي)</option>
                        </select>
                        {memberRole === 'شريك آخر' && (
                          <input
                            type="text"
                            placeholder="أدخل الصفة يدوياً..."
                            className="w-full mt-2 p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                            onChange={(e) => setMemberRole(e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700">رقم التأجير (إن وجد)</label>
                        <input
                          type="text"
                          value={ppr}
                          onChange={(e) => setPpr(e.target.value)}
                          placeholder="PPR..."
                          className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700">رقم البطاقة الوطنية</label>
                        <input
                          type="text"
                          value={cin}
                          onChange={(e) => setCin(e.target.value)}
                          placeholder="CIN..."
                          className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                ) : memberType === 'staff' ? (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث بالاسم أو رقم التأجير..."
                            className="w-full pr-12 pl-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                          />
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                          <input
                            type="checkbox"
                            id="selectAll"
                            checked={filteredStaff.length > 0 && filteredStaff.every(s => selectedStaffIds.includes(s.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const allIds = filteredStaff.map(s => s.id);
                                setSelectedStaffIds(Array.from(new Set([...selectedStaffIds, ...allIds])));
                              } else {
                                const filteredIds = filteredStaff.map(s => s.id);
                                setSelectedStaffIds(selectedStaffIds.filter(id => !filteredIds.includes(id)));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor="selectAll" className="text-xs font-black text-gray-600 cursor-pointer">تعليم الكل</label>
                        </div>
                      </div>

                      <div className="max-h-[400px] overflow-auto border border-gray-100 rounded-2xl custom-scrollbar">
                        <table className="w-full text-right border-collapse">
                          <thead className="sticky top-0 bg-gray-50 z-10">
                            <tr className="border-b border-gray-100">
                              <th className="p-3 text-[10px] font-black text-gray-400 w-10"></th>
                              <th className="p-3 text-[10px] font-black text-gray-400">الموظف</th>
                              <th className="p-3 text-[10px] font-black text-gray-400">الصفة في الهيكل</th>
                              <th className="p-3 text-[10px] font-black text-gray-400">المهمة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStaff.map((s) => (
                              <tr 
                                key={s.id} 
                                className={`border-b border-gray-50 transition-colors ${selectedStaffIds.includes(s.id) ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'}`}
                              >
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedStaffIds.includes(s.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedStaffIds([...selectedStaffIds, s.id]);
                                      } else {
                                        setSelectedStaffIds(selectedStaffIds.filter(id => id !== s.id));
                                      }
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                </td>
                                <td className="p-3">
                                  <p className="text-xs font-black text-gray-900">{s.fullName}</p>
                                  <p className="text-[9px] text-gray-400 font-bold">{s.role} | {s.ppr}</p>
                                </td>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    placeholder={s.role.includes('مدير') ? 'رئيس المجلس' : (s.role.includes('مدرس') || s.role.includes('أستاذ') ? 'عضو' : 'عضو')}
                                    value={staffOverrides[s.id]?.role || ''}
                                    onChange={(e) => setStaffOverrides({
                                      ...staffOverrides,
                                      [s.id]: { ...(staffOverrides[s.id] || { task: s.role }), role: e.target.value }
                                    })}
                                    className="w-full p-2 text-[10px] font-bold rounded-lg border border-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    placeholder={s.role}
                                    value={staffOverrides[s.id]?.task || ''}
                                    onChange={(e) => setStaffOverrides({
                                      ...staffOverrides,
                                      [s.id]: { ...(staffOverrides[s.id] || { role: '' }), task: e.target.value }
                                    })}
                                    className="w-full p-2 text-[10px] font-bold rounded-lg border border-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                        <div className="space-y-2">
                          <label className="text-sm font-black text-gray-700">تطبيق صفة موحدة (اختياري)</label>
                          <input
                            type="text"
                            value={memberRole}
                            onChange={(e) => setMemberRole(e.target.value)}
                            placeholder="تطبق على من لم تحدد صفته..."
                            className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-black text-gray-700">تطبيق مهمة موحدة (اختياري)</label>
                          <input
                            type="text"
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                            placeholder="تطبق على من لم تحدد مهمته..."
                            className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700">اسم التلميذ</label>
                        <input
                          type="text"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="أدخل اسم التلميذ..."
                          className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700">القسم</label>
                        <input
                          type="text"
                          value={studentClass}
                          onChange={(e) => setStudentClass(e.target.value)}
                          placeholder="مثال: 2 باك علوم..."
                          className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700">رقم مسار</label>
                        <input
                          type="text"
                          value={massarNumber}
                          onChange={(e) => setMassarNumber(e.target.value)}
                          placeholder="G123456789..."
                          className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700">الجنس</label>
                        <select
                          value={studentGender}
                          onChange={(e) => setStudentGender(e.target.value)}
                          className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                        >
                          <option value="">اختر الجنس...</option>
                          <option value="ذكر">ذكر</option>
                          <option value="أنثى">أنثى</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700">الصفة</label>
                        <input
                          type="text"
                          value={memberRole}
                          onChange={(e) => setMemberRole(e.target.value)}
                          placeholder="مثال: رئيس المجلس التلاميذي..."
                          className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700">المهمة</label>
                        <input
                          type="text"
                          value={task}
                          onChange={(e) => setTask(e.target.value)}
                          placeholder="أدخل المهمة..."
                          className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleAddMember}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                  >
                    إضافة العضو
                  </button>
                  <button
                    onClick={() => setShowAddMemberModal(false)}
                    className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
