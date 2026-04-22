
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SchoolSettings } from './components/SchoolSettings';
import { StaffManagement } from './components/StaffManagement';
import { CorrespondenceManagement } from './components/CorrespondenceManagement';
import { StudentManagement } from './components/StudentManagement';
import { ViewState, SchoolData, StaffMember, Correspondence, TimetableActivity, StaffAbsence, AdministrativeInquiry, EducationalSupport, SchoolStructure, InternalMemo, LegislativeReference, Student, DataArchive } from './types';
import { TimetableManagement } from './components/TimetableManagement';
import { StaffAttendanceManagement } from './components/StaffAttendanceManagement';
import { AdministrativeInquiryManagement } from './components/AdministrativeInquiryManagement';
import { EducationalSupportManagement } from './components/EducationalSupportManagement';
import { SchoolStructuresManagement } from './components/SchoolStructuresManagement';
import { InternalMemosManagement } from './components/InternalMemosManagement';
import LegislativeArchive from './components/LegislativeArchive';
import WhatsAppMessaging from './components/WhatsAppMessaging';
import { RequestsAndPrints } from './components/RequestsAndPrints';
import { ArchiveManagement } from './components/ArchiveManagement';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [correspondenceList, setCorrespondenceList] = useState<Correspondence[]>([]);
  const [attendanceList, setAttendanceList] = useState<StaffAbsence[]>([]);
  const [administrativeInquiries, setAdministrativeInquiries] = useState<AdministrativeInquiry[]>([]);
  const [educationalSupportList, setEducationalSupportList] = useState<EducationalSupport[]>([]);
  const [schoolStructures, setSchoolStructures] = useState<SchoolStructure[]>([]);
  const [internalMemos, setInternalMemos] = useState<InternalMemo[]>([]);
  const [legislativeReferences, setLegislativeReferences] = useState<LegislativeReference[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [archives, setArchives] = useState<DataArchive[]>([]);
  
  const getCurrentAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (currentMonth < 9) {
      return `${currentYear - 1}/${currentYear}`;
    } else {
      return `${currentYear}/${currentYear + 1}`;
    }
  };

  const [schoolData, setSchoolData] = useState<SchoolData>({
    name: "الثانوية التأهيلية",
    code: "MAR-2024",
    director: "جاري البحث عن مدير...", 
    address: "شارع التعليم، حي المعرفة",
    email: "contact@school.ma",
    phoneNumber: "05XXXXXXXX",
    academicYear: getCurrentAcademicYear(),
    region: "جهة الدار البيضاء سطات",
    city: "سطات",
    municipality: "سطات",
    hourLabels: [
      '09h - 08h', '10h - 09h', '11h - 10h', '12h - 11h',
      '15h - 14h', '16h - 15h', '17h - 16h', '18h - 17h'
    ]
  });

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [timetableActivities, setTimetableActivities] = useState<TimetableActivity[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load data from server on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const data = await response.json();
          if (data.staffList) setStaffList(data.staffList);
          if (data.schoolData) setSchoolData(data.schoolData);
          if (data.correspondenceList) setCorrespondenceList(data.correspondenceList);
          if (data.timetableActivities) setTimetableActivities(data.timetableActivities);
          if (data.attendanceList) setAttendanceList(data.attendanceList);
          if (data.administrativeInquiries) setAdministrativeInquiries(data.administrativeInquiries);
          if (data.educationalSupportList) setEducationalSupportList(data.educationalSupportList);
          if (data.schoolStructures) setSchoolStructures(data.schoolStructures);
          if (data.internalMemos) setInternalMemos(data.internalMemos);
          if (data.legislativeReferences) setLegislativeReferences(data.legislativeReferences);
          if (data.students) setStudents(data.students);
          if (data.archives) setArchives(data.archives);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setHasLoaded(true);
      }
    };
    fetchData();
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!hasLoaded) return;

    const saveData = async () => {
      try {
        const dataToSave = {
          staffList,
          schoolData,
          correspondenceList,
          timetableActivities,
          attendanceList,
          administrativeInquiries,
          educationalSupportList,
          schoolStructures,
          internalMemos,
          legislativeReferences,
          students,
          archives
        };
        
        await fetch('/api/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSave),
        });
      } catch (error) {
        console.error('Error auto-saving data:', error);
      }
    };

    const timeoutId = setTimeout(saveData, 1000); // Debounce save by 1 second
    return () => clearTimeout(timeoutId);
  }, [staffList, schoolData, correspondenceList, timetableActivities, attendanceList, administrativeInquiries, educationalSupportList, schoolStructures, internalMemos, legislativeReferences, students, archives, hasLoaded]);

  const handleSaveAll = async () => {
    try {
      const dataToSave = {
        staffList,
        schoolData,
        correspondenceList,
        timetableActivities,
        attendanceList,
        administrativeInquiries,
        educationalSupportList,
        schoolStructures,
        internalMemos,
        legislativeReferences,
        students,
        archives
      };
      
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        alert('تم حفظ جميع البيانات بنجاح في السحابة (Cloud)');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('حدث خطأ أثناء حفظ البيانات في السحابة');
    }
  };

  useEffect(() => {
    if (!hasLoaded) return;

    const directorFound = staffList.find(m => 
      (m.role.includes('مدير') || m.role.includes('Directeur')) && 
      !m.role.includes('حارس عام') && 
      !m.role.includes('مساعد')
    );

    if (directorFound) {
      if (schoolData.director !== directorFound.fullName || schoolData.phoneNumber !== directorFound.phoneNumber) {
        setSchoolData(prev => ({ 
          ...prev, 
          director: directorFound.fullName,
          phoneNumber: directorFound.phoneNumber || prev.phoneNumber
        }));
      }
    } else if (staffList.length > 0 && (schoolData.director === "جاري البحث عن مدير..." || schoolData.director === "")) {
      setSchoolData(prev => ({ ...prev, director: "لم يتم تحديد مدير" }));
    }
  }, [staffList, hasLoaded]);

  const archiveCurrentYear = (isAuto = false) => {
    const newArchive: DataArchive = {
      academicYear: schoolData.academicYear,
      staffList: [...staffList],
      students: [...students],
      correspondenceList: [...correspondenceList],
      timetableActivities: [...timetableActivities],
      attendanceList: [...attendanceList],
      administrativeInquiries: [...administrativeInquiries],
      educationalSupportList: [...educationalSupportList],
      schoolStructures: [...schoolStructures],
      internalMemos: [...internalMemos],
      legislativeReferences: [...legislativeReferences],
      schoolData: { ...schoolData },
      archivedAt: new Date().toISOString()
    };

    setArchives(prev => {
      const existingIdx = prev.findIndex(a => a.academicYear === schoolData.academicYear);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newArchive;
        return updated;
      }
      return [...prev, newArchive];
    });
    if (!isAuto) {
      alert(`تمت أرشفة بيانات الموسم ${schoolData.academicYear} بنجاح`);
    }
  };

  const importFromArchive = (archive: DataArchive, options: { 
    staff?: boolean, 
    students?: boolean, 
    schoolSettings?: boolean,
    correspondence?: boolean,
    timetable?: boolean,
    attendance?: boolean,
    inquiries?: boolean,
    support?: boolean,
    structures?: boolean,
    memos?: boolean,
    legislative?: boolean
  }) => {
    if (options.staff) {
      setStaffList(prev => {
        const existingPprs = new Set(prev.map(s => s.ppr));
        const newStaff = archive.staffList.filter(s => !existingPprs.has(s.ppr));
        return [...prev, ...newStaff];
      });
    }
    if (options.students) {
      setStudents(prev => {
        const existingMassars = new Set(prev.map(s => s.massarCode));
        const newStudents = archive.students.filter(s => !existingMassars.has(s.massarCode));
        return [...prev, ...newStudents];
      });
    }
    if (options.correspondence) {
      setCorrespondenceList(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newItems = archive.correspondenceList.filter(c => !existingIds.has(c.id));
        return [...prev, ...newItems];
      });
    }
    if (options.timetable) {
      setTimetableActivities(prev => [...prev, ...archive.timetableActivities]);
    }
    if (options.attendance) {
      setAttendanceList(prev => [...prev, ...archive.attendanceList]);
    }
    if (options.inquiries) {
      setAdministrativeInquiries(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const newItems = archive.administrativeInquiries.filter(i => !existingIds.has(i.id));
        return [...prev, ...newItems];
      });
    }
    if (options.support) {
      setEducationalSupportList(prev => [...prev, ...archive.educationalSupportList]);
    }
    if (options.structures) {
      setSchoolStructures(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const newItems = archive.schoolStructures.filter(s => !existingIds.has(s.id));
        return [...prev, ...newItems];
      });
    }
    if (options.memos) {
      setInternalMemos(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newItems = archive.internalMemos.filter(m => !existingIds.has(m.id));
        return [...prev, ...newItems];
      });
    }
    if (options.legislative) {
      setLegislativeReferences(prev => {
        const existingIds = new Set(prev.map(r => r.id));
        const newItems = archive.legislativeReferences.filter(r => !existingIds.has(r.id));
        return [...prev, ...newItems];
      });
    }
    if (options.schoolSettings) {
      setSchoolData(prev => ({
        ...prev,
        ...archive.schoolData,
        academicYear: schoolData.academicYear // Keep current year
      }));
    }
    alert('تم جلب البيانات المختارة بنجاح وإضافتها للموسم الحالي');
  };

  const deleteArchive = (year: string) => {
    setArchives(prev => prev.filter(a => a.academicYear !== year));
    alert(`تم حذف أرشيف الموسم ${year} بنجاح`);
  };

  // Auto-archive logic (July 1st)
  useEffect(() => {
    if (!hasLoaded) return;

    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    
    // If it's July (month 7) or later, check if current academic year is archived
    if (month >= 7) {
      const isAlreadyArchived = archives.some(a => a.academicYear === schoolData.academicYear);
      if (!isAlreadyArchived) {
        console.log(`Auto-archiving academic year: ${schoolData.academicYear}`);
        archiveCurrentYear(true);
      }
    }
  }, [archives, schoolData.academicYear, hasLoaded]);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard schoolData={schoolData} staff={staffList} students={students} />;
      case 'schoolSettings':
        return <SchoolSettings data={schoolData} onSave={setSchoolData} />;
      case 'staffManagement':
        return <StaffManagement staff={staffList} onUpdate={setStaffList} schoolData={schoolData} />;
      case 'correspondence':
        return <CorrespondenceManagement correspondence={correspondenceList} onUpdate={setCorrespondenceList} schoolData={schoolData} onUpdateSchoolData={setSchoolData} />;
      case 'timetable':
        return <TimetableManagement activities={timetableActivities} onUpdate={setTimetableActivities} schoolData={schoolData} onUpdateSchoolData={setSchoolData} staff={staffList} structures={schoolStructures} students={students} />;
      case 'attendance':
        return <StaffAttendanceManagement absences={attendanceList} onUpdate={setAttendanceList} staff={staffList} timetable={timetableActivities} schoolData={schoolData} />;
      case 'administrativeInquiry':
        return <AdministrativeInquiryManagement inquiries={administrativeInquiries} onUpdate={setAdministrativeInquiries} staff={staffList} schoolData={schoolData} />;
      case 'educationalSupport':
        return <EducationalSupportManagement staff={staffList} supportList={educationalSupportList} setSupportList={setEducationalSupportList} timetable={timetableActivities} schoolData={schoolData} />;
      case 'schoolStructures':
        return <SchoolStructuresManagement structures={schoolStructures} onUpdate={setSchoolStructures} staff={staffList} schoolData={schoolData} timetable={timetableActivities} />;
      case 'internalMemos':
        return <InternalMemosManagement memos={internalMemos} onUpdate={setInternalMemos} structures={schoolStructures} schoolData={schoolData} />;
      case 'legislativeArchive':
        return (
          <LegislativeArchive 
            references={legislativeReferences} 
            onAdd={(ref) => setLegislativeReferences([...legislativeReferences, ref])}
            onDelete={(id) => setLegislativeReferences(legislativeReferences.filter(r => r.id !== id))}
          />
        );
      case 'whatsAppMessaging':
        return <WhatsAppMessaging staff={staffList} schoolData={schoolData} />;
      case 'studentManagement':
        return <StudentManagement students={students} onUpdate={setStudents} schoolData={schoolData} />;
      case 'requestsAndPrints':
        return <RequestsAndPrints staff={staffList} schoolData={schoolData} absences={attendanceList} />;
      case 'archives':
        return (
          <ArchiveManagement 
            archives={archives} 
            currentYear={schoolData.academicYear} 
            onArchive={archiveCurrentYear} 
            onImport={importFromArchive}
            onDelete={deleteArchive}
          />
        );
      default:
        return <Dashboard schoolData={schoolData} staff={staffList} students={students} />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView} schoolData={schoolData} onSaveAll={handleSaveAll} archives={archives}>
      {renderContent()}
    </Layout>
  );
};

export default App;
