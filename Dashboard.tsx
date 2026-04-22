
import React from 'react';
import { StaffMember, SchoolData, Student } from '../types';
import { motion } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Printer, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BookOpen, 
  Briefcase,
  GraduationCap,
  LayoutDashboard
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface DashboardProps {
  schoolData: SchoolData;
  staff: StaffMember[];
  students?: Student[];
}

interface SpecBreakdown {
  total: number;
  normal: number;
  inside: number;
  outside: number;
}

const isTeacherRole = (role: string) => {
  const r = role || '';
  return r.includes('أستاذ') || r.includes('مدرس') || r.includes('enseignant');
};

const StatBar: React.FC<{ label: string, count: number, total: number, colorClass: string }> = ({ label, count, total, colorClass }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-bold text-gray-700">{label}</span>
        <span className="text-gray-500 font-mono font-bold">{count} ({Math.round(percentage)}%)</span>
      </div>
      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${colorClass} shadow-sm`}
        ></motion.div>
      </div>
    </div>
  );
};

const SpecDetailedRow: React.FC<{ label: string, data: SpecBreakdown, totalTeachers: number }> = ({ label, data, totalTeachers }) => {
  const percentage = totalTeachers > 0 ? (data.total / totalTeachers) * 100 : 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="font-black text-gray-800">{label}</span>
        </div>
        <span className="bg-emerald-600/10 text-emerald-700 text-[10px] px-2.5 py-1 rounded-full font-black">الإجمالي: {data.total} ({Math.round(percentage)}%)</span>
      </div>
      
      <div className="h-3 w-full bg-gray-100 rounded-full flex overflow-hidden border border-gray-200/50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(data.normal / data.total) * 100}%` }}
          className="bg-emerald-500 h-full" 
          title="رسمي"
        />
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(data.inside / data.total) * 100}%` }}
          className="bg-orange-400 h-full" 
          title="مكلف داخل المؤسسة"
        />
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(data.outside / data.total) * 100}%` }}
          className="bg-red-400 h-full" 
          title="مكلف خارج المؤسسة"
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-[10px] font-black text-center">
        <div className="flex flex-col gap-1">
          <span className="text-emerald-600 uppercase tracking-tighter">رسمي</span>
          <span className="bg-emerald-50 text-emerald-700 py-1 rounded-lg border border-emerald-100 shadow-sm">{data.normal}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-orange-600 uppercase tracking-tighter">داخل المؤسسة</span>
          <span className="bg-orange-50 text-orange-700 py-1 rounded-lg border border-orange-100 shadow-sm">{data.inside}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-red-600 uppercase tracking-tighter">خارج المؤسسة</span>
          <span className="bg-red-50 text-red-700 py-1 rounded-lg border border-red-100 shadow-sm">{data.outside}</span>
        </div>
      </div>
    </motion.div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ schoolData, staff, students }) => {
  const staffCount = staff.length;
  const schoolName = schoolData.name;

  // Student Statistics
  const studentList = students || [];
  const totalStudents = studentList.length;
  
  const studentGenderStats = studentList.reduce((acc, curr) => {
    const g = curr.gender === 'أنثى' ? 'إناث' : 'ذكور';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  interface StudentGroup {
    male: number;
    female: number;
    total: number;
    section?: string;
    level?: string;
  }

  const studentsBySection = studentList.reduce((acc, curr) => {
    const s = curr.section || 'غير محدد';
    if (!acc[s]) acc[s] = { section: s, male: 0, female: 0, total: 0 };
    acc[s].total += 1;
    if (curr.gender === 'أنثى') acc[s].female += 1;
    else acc[s].male += 1;
    return acc;
  }, {} as Record<string, StudentGroup>);

  const studentsByLevel = studentList.reduce((acc, curr) => {
    const l = curr.level || 'غير محدد';
    if (!acc[l]) acc[l] = { level: l, male: 0, female: 0, total: 0 };
    acc[l].total += 1;
    if (curr.gender === 'أنثى') acc[l].female += 1;
    else acc[l].male += 1;
    return acc;
  }, {} as Record<string, StudentGroup>);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    try {
      // Handle different date formats if necessary, but assume standard for now
      const birth = new Date(birthDate);
      if (isNaN(birth.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const ageStats = studentList.reduce((acc, curr) => {
    const age = calculateAge(curr.birthDate);
    if (age !== null) {
      const group = `${age} سنة`;
      acc[group] = (acc[group] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Chart Data Preparation
  const studentGenderChartData = [
    { name: 'إناث', value: studentGenderStats['إناث'] || 0, color: '#ec4899' },
    { name: 'ذكور', value: studentGenderStats['ذكور'] || 0, color: '#3b82f6' }
  ];

  const sectionChartData = (Object.values(studentsBySection) as StudentGroup[])
    .sort((a, b) => (a.section || '').localeCompare(b.section || ''))
    .map(s => ({
      name: s.section,
      'إناث': s.female,
      'ذكور': s.male,
      total: s.total
    }));

  const levelChartData = (Object.values(studentsByLevel) as StudentGroup[])
    .sort((a, b) => b.total - a.total)
    .map(l => ({
      name: l.level,
      'إناث': l.female,
      'ذكور': l.male,
      total: l.total
    }));

  const ageChartData = Object.entries(ageStats)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([name, value]) => ({ name, value }));

  const genderStats = staff.reduce((acc, curr) => {
    const g = curr.gender === 'أنثى' ? 'إناث' : 'ذكور';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const surplusSynthesis = staff.reduce((acc, curr) => {
    const status = curr.surplusStatus;
    if (status === 'مكلف داخل المؤسسة') acc.inside += 1;
    else if (status === 'مكلف خارج المؤسسة') acc.outside += 1;
    else acc.official += 1;
    return acc;
  }, { official: 0, inside: 0, outside: 0 });

  const teachers = staff.filter(m => isTeacherRole(m.role));
  const teachersCount = teachers.length;

  const specStats = teachers.reduce((acc, curr) => {
    const s = curr.specialization || 'تخصص غير محدد';
    if (!acc[s]) acc[s] = { total: 0, normal: 0, inside: 0, outside: 0 };
    acc[s].total += 1;
    if (curr.surplusStatus === 'مكلف داخل المؤسسة') acc[s].inside += 1;
    else if (curr.surplusStatus === 'مكلف خارج المؤسسة') acc[s].outside += 1;
    else acc[s].normal += 1;
    return acc;
  }, {} as Record<string, SpecBreakdown>);

  const roleStats = staff.reduce((acc, curr) => {
    const r = curr.role || 'غير محدد';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cadreStats = staff.reduce((acc, curr) => {
    const c = curr.cadre || 'غير محدد';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Chart Data Preparation
  const genderChartData = [
    { name: 'إناث', value: genderStats['إناث'] || 0, color: '#ec4899' },
    { name: 'ذكور', value: genderStats['ذكور'] || 0, color: '#3b82f6' }
  ];

  const statusChartData = [
    { name: 'رسمي', value: surplusSynthesis.official, color: '#10b981' },
    { name: 'مكلف داخل', value: surplusSynthesis.inside, color: '#fb923c' },
    { name: 'مكلف خارج', value: surplusSynthesis.outside, color: '#f87171' }
  ];

  const specChartData = (Object.entries(specStats) as [string, SpecBreakdown][])
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10) // Top 10 for readability
    .map(([name, data]) => ({
      name,
      'رسمي': data.normal,
      'مكلف داخل': data.inside,
      'مكلف خارج': data.outside,
      total: data.total
    }));

  const roleChartData = (Object.entries(roleStats) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const cadreChartData = (Object.entries(cadreStats) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const mainStats = [
    { label: 'إجمالي الموظفين', value: staffCount, icon: Users, color: 'bg-indigo-600', shadow: 'shadow-indigo-200' },
    { label: 'عدد الإناث', value: genderStats['إناث'] || 0, icon: UserPlus, color: 'bg-pink-500', shadow: 'shadow-pink-200' },
    { label: 'عدد الذكور', value: genderStats['ذكور'] || 0, icon: UserMinus, color: 'bg-blue-500', shadow: 'shadow-blue-200' },
  ];

  const studentMainStats = [
    { label: 'إجمالي التلاميذ', value: totalStudents, icon: GraduationCap, color: 'bg-emerald-600', shadow: 'shadow-emerald-200' },
    { label: 'تلميذات (إناث)', value: studentGenderStats['إناث'] || 0, icon: UserPlus, color: 'bg-pink-400', shadow: 'shadow-pink-100' },
    { label: 'تلاميذ (ذكور)', value: studentGenderStats['ذكور'] || 0, icon: UserMinus, color: 'bg-blue-400', shadow: 'shadow-blue-100' },
  ];

  const synthesisStats = [
    { label: 'عدد الرسميين', value: surplusSynthesis.official, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100' },
    { label: 'مكلفون داخل المؤسسة', value: surplusSynthesis.inside, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-100' },
    { label: 'مكلفون خارج المؤسسة', value: surplusSynthesis.outside, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-100' },
  ];

  const handleExportStatsPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const commonFooter = `
      <div class="pdf-footer-branding">
        <div class="footer-grid">
          <div class="footer-item"><strong>المؤسسة:</strong> ${schoolData.name}</div>
          <div class="footer-item"><strong>الجماعة:</strong> ${schoolData.municipality}</div>
          <div class="footer-item"><strong>العنوان:</strong> ${schoolData.address}</div>
          <div class="footer-item"><strong>الهاتف:</strong> <span dir="ltr">${schoolData.phoneNumber}</span></div>
          <div class="footer-item" dir="ltr"><strong>Email:</strong> ${schoolData.email}</div>
        </div>
        <div class="footer-copyright">صادر عن نظام تدبير الثانوية التأهيلية &copy; ${new Date().getFullYear()}</div>
      </div>
    `;

    const statsTables = `
      <div class="stats-grid">
        <div class="stats-section">
          <h3>1. الخلاصة العامة</h3>
          <div class="flex-row">
            <table class="data-table">
              <thead>
                <tr><th>المؤشر</th><th>القيمة</th></tr>
              </thead>
              <tbody>
                <tr><td>إجمالي الموظفين</td><td>${staffCount}</td></tr>
                <tr><td>عدد الإناث</td><td>${genderStats['إناث'] || 0}</td></tr>
                <tr><td>عدد الذكور</td><td>${genderStats['ذكور'] || 0}</td></tr>
                <tr><td>نسبة التأنيث</td><td>${Math.round(((Number(genderStats['إناث'] || 0)) / (Number(staffCount || 1))) * 100)}%</td></tr>
              </tbody>
            </table>
            <div class="chart-container">
              <div class="pie-chart-css" style="--p:${Math.round(((Number(genderStats['إناث'] || 0)) / (Number(staffCount || 1))) * 100)}; --c:#ec4899; --b:#3b82f6;">
                <div class="pie-label">${Math.round(((Number(genderStats['إناث'] || 0)) / (Number(staffCount || 1))) * 100)}% إناث</div>
              </div>
            </div>
          </div>
        </div>

        <div class="stats-section">
          <h3>2. توزيع الموظفين حسب الوضعية</h3>
          <div class="flex-row">
            <table class="data-table">
              <thead>
                <tr><th>الوضعية</th><th>العدد</th></tr>
              </thead>
              <tbody>
                <tr><td>رسمي بالمؤسسة</td><td>${surplusSynthesis.official}</td></tr>
                <tr><td>مكلف داخل المؤسسة</td><td>${surplusSynthesis.inside}</td></tr>
                <tr><td>مكلف خارج المؤسسة</td><td>${surplusSynthesis.outside}</td></tr>
              </tbody>
            </table>
            <div class="chart-container">
              <div class="mini-bar-list">
                <div class="mini-bar-row">
                  <div class="mini-bar-fill" style="width:${(surplusSynthesis.official / (staffCount || 1)) * 100}%; background:#10b981;"></div>
                  <span class="mini-bar-text">رسمي</span>
                </div>
                <div class="mini-bar-row">
                  <div class="mini-bar-fill" style="width:${(surplusSynthesis.inside / (staffCount || 1)) * 100}%; background:#fb923c;"></div>
                  <span class="mini-bar-text">داخل</span>
                </div>
                <div class="mini-bar-row">
                  <div class="mini-bar-fill" style="width:${(surplusSynthesis.outside / (staffCount || 1)) * 100}%; background:#f87171;"></div>
                  <span class="mini-bar-text">خارج</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stats-section">
          <h3>3. التوزيع حسب الإطار</h3>
          <div class="flex-row">
            <table class="data-table">
              <thead>
                <tr><th>الإطار</th><th>العدد</th></tr>
              </thead>
              <tbody>
                ${(Object.entries(cadreStats) as [string, number][]).sort(([, a], [, b]) => b - a).map(([label, count]) => `
                  <tr><td>${label}</td><td>${count}</td></tr>
                `).join('')}
              </tbody>
            </table>
            <div class="chart-container">
              <div class="mini-bar-list">
                ${(Object.entries(cadreStats) as [string, number][]).sort(([, a], [, b]) => b - a).slice(0, 5).map(([label, count]) => `
                  <div class="mini-bar-row">
                    <div class="mini-bar-fill" style="width:${(count / (staffCount || 1)) * 100}%; background:#3b82f6;"></div>
                    <span class="mini-bar-text">${label}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="stats-section">
          <h3>4. التوزيع حسب المهمة</h3>
          <div class="flex-row">
            <table class="data-table">
              <thead>
                <tr><th>المهمة</th><th>العدد</th></tr>
              </thead>
              <tbody>
                ${(Object.entries(roleStats) as [string, number][]).sort(([, a], [, b]) => b - a).map(([label, count]) => `
                  <tr><td>${label}</td><td>${count}</td></tr>
                `).join('')}
              </tbody>
            </table>
            <div class="chart-container">
              <div class="mini-bar-list">
                ${(Object.entries(roleStats) as [string, number][]).sort(([, a], [, b]) => b - a).slice(0, 5).map(([label, count]) => `
                  <div class="mini-bar-row">
                    <div class="mini-bar-fill" style="width:${(count / (staffCount || 1)) * 100}%; background:#6366f1;"></div>
                    <span class="mini-bar-text">${label}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="stats-section" style="page-break-before: always;">
        <h3>5. التوزيع حسب التخصص والوضعية (الأساتذة)</h3>
        <div class="flex-row" style="align-items: flex-start;">
          <table class="data-table" style="width: 60%;">
            <thead>
              <tr>
                <th>التخصص</th>
                <th>رسمي</th>
                <th>مكلف داخل</th>
                <th>مكلف خارج</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${(Object.entries(specStats) as [string, SpecBreakdown][]).sort(([, a], [, b]) => b.total - a.total).map(([label, data]) => `
                <tr>
                  <td>${label}</td>
                  <td>${data.normal}</td>
                  <td>${data.inside}</td>
                  <td>${data.outside}</td>
                  <td style="font-weight: bold; background: #f1f5f9;">${data.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="chart-container" style="width: 40%;">
            <div class="spec-chart-pdf">
              ${(Object.entries(specStats) as [string, SpecBreakdown][]).sort(([, a], [, b]) => b.total - a.total).map(([label, data]) => `
                <div class="spec-row-pdf">
                  <div class="spec-label-pdf">${label}</div>
                  <div class="spec-bar-container-pdf">
                    <div class="spec-bar-pdf" style="width:${(data.normal / (teachersCount || 1)) * 100}%; background:#10b981;"></div>
                    <div class="spec-bar-pdf" style="width:${(data.inside / (teachersCount || 1)) * 100}%; background:#fb923c;"></div>
                    <div class="spec-bar-pdf" style="width:${(data.outside / (teachersCount || 1)) * 100}%; background:#f87171;"></div>
                  </div>
                </div>
              `).join('')}
              <div class="spec-legend-pdf">
                <span style="color:#10b981;">■ رسمي</span>
                <span style="color:#fb923c;">■ داخل</span>
                <span style="color:#f87171;">■ خارج</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const studentStatsTable = totalStudents > 0 ? `
      <div class="stats-grid" style="page-break-before: always;">
        <div class="stats-section">
          <h3>6. إحصائيات التلاميذ (الخلاصة)</h3>
          <table class="data-table">
            <thead>
              <tr><th>المؤشر</th><th>القيمة</th></tr>
            </thead>
            <tbody>
              <tr><td>إجمالي التلاميذ</td><td>${totalStudents}</td></tr>
              <tr><td>عدد الإناث</td><td>${studentGenderStats['إناث'] || 0}</td></tr>
              <tr><td>عدد الذكور</td><td>${studentGenderStats['ذكور'] || 0}</td></tr>
              <tr><td>نسبة التأنيث</td><td>${Math.round(((Number(studentGenderStats['إناث'] || 0)) / (Number(totalStudents || 1))) * 100)}%</td></tr>
            </tbody>
          </table>
        </div>
        <div class="stats-section">
          <h3>7. التوزيع حسب المستوى والجنس</h3>
          <table class="data-table">
            <thead>
              <tr><th>المستوى</th><th>إناث</th><th>ذكور</th><th>الإجمالي</th></tr>
            </thead>
            <tbody>
              ${(Object.values(studentsByLevel) as StudentGroup[]).sort((a, b) => b.total - a.total).map(l => `
                <tr><td>${l.level}</td><td>${l.female}</td><td>${l.male}</td><td>${l.total}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="stats-section">
        <h3>8. التوزيع حسب القسم</h3>
        <table class="data-table" style="width: 100%;">
          <thead>
            <tr><th>القسم</th><th>إناث</th><th>ذكور</th><th>الإجمالي</th></tr>
          </thead>
          <tbody>
            ${(Object.values(studentsBySection) as StudentGroup[]).sort((a, b) => (a.section || '').localeCompare(b.section || '')).map(s => `
              <tr><td>${s.section}</td><td>${s.female}</td><td>${s.male}</td><td>${s.total}</td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الإحصائيات - ${schoolData.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
          body { font-family: 'Cairo', sans-serif; padding: 0; color: #333; line-height: 1.4; font-size: 10px; margin: 0; }
          .report-page { padding: 30px; box-sizing: border-box; width: 100%; position: relative; min-height: 100vh; display: flex; flex-direction: column; }
          .header { display: grid; grid-template-columns: 250px 1fr 180px; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; }
          .school-info h1 { margin: 0; font-size: 12px; color: #1e3a8a; font-weight: bold; }
          .school-info p { margin: 1px 0; font-size: 10px; }
          .logo-container { display: flex; justify-content: center; align-items: center; height: 70px; }
          .logo-container img { max-height: 100%; max-width: 100%; object-fit: contain; }
          .header-left { text-align: left; font-size: 9px; }
          .doc-title { text-align: center; margin: 15px 0; }
          .doc-title h2 { font-size: 20px; font-weight: bold; color: #1e3a8a; display: inline-block; border-bottom: 3px double #1e3a8a; padding-bottom: 5px; }
          
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .stats-section { margin-bottom: 20px; }
          .stats-section h3 { background: #1e3a8a; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; margin-bottom: 8px; }
          
          .flex-row { display: flex; gap: 15px; align-items: center; }
          .chart-container { width: 35%; display: flex; justify-content: center; align-items: center; }
          .data-table { width: 65%; border-collapse: collapse; border: 1px solid #ddd; }
          .data-table th, .data-table td { border: 1px solid #ddd; padding: 6px; text-align: center; }
          .data-table th { background-color: #f8fafc; font-weight: bold; color: #1e3a8a; font-size: 9px; }
          
          /* CSS Charts */
          .pie-chart-css {
            width: 80px; height: 80px; border-radius: 50%;
            background: conic-gradient(var(--c) calc(var(--p)*1%), var(--b) 0);
            display: flex; align-items: center; justify-content: center; position: relative;
          }
          .pie-chart-css::after {
            content: ""; position: absolute; width: 50px; height: 50px; background: white; border-radius: 50%;
          }
          .pie-label { position: relative; z-index: 1; font-size: 8px; font-weight: bold; text-align: center; }

          .bar-chart-vertical { display: flex; align-items: flex-end; gap: 8px; height: 80px; padding-bottom: 15px; }
          .bar-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
          .bar { width: 15px; border-radius: 2px 2px 0 0; }
          .bar-item span { font-size: 7px; white-space: nowrap; }

          .mini-bar-list { width: 100%; display: flex; flex-direction: column; gap: 4px; }
          .mini-bar-row { display: flex; align-items: center; gap: 5px; height: 12px; }
          .mini-bar-fill { height: 100%; border-radius: 0 2px 2px 0; }
          .mini-bar-text { font-size: 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          .spec-chart-pdf { width: 100%; display: flex; flex-direction: column; gap: 6px; }
          .spec-row-pdf { display: flex; flex-direction: column; gap: 2px; }
          .spec-label-pdf { font-size: 8px; font-weight: bold; }
          .spec-bar-container-pdf { display: flex; height: 8px; background: #eee; border-radius: 2px; overflow: hidden; }
          .spec-bar-pdf { height: 100%; }
          .spec-legend-pdf { display: flex; gap: 10px; font-size: 8px; margin-top: 10px; justify-content: center; }

          .sig-area { margin-top: 30px; display: flex; justify-content: flex-start; }
          .sig-box { text-align: center; width: 200px; border: 1px solid #eee; padding: 10px; border-radius: 8px; }
          .sig-line { margin-top: 40px; border-top: 1px dashed #333; }
          
          .pdf-footer-branding { text-align: center; position: absolute; bottom: 20px; left: 30px; right: 30px; border-top: 1px solid #1e3a8a; padding-top: 8px; }
          .footer-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 9px; color: #555; }
          .footer-copyright { font-size: 7px; color: #999; margin-top: 8px; }
          
          @media print { 
            @page { size: A4; margin: 0 !important; } 
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
            .report-page { padding: 1.5cm 2cm; } 
          }
        </style>
      </head>
      <body>
        <div class="report-page">
          <div class="header">
            <div class="school-info">
              <h1>المملكة المغربية</h1>
              <p>وزارة التربية الوطنية والتعليم الأولي والرياضة</p>
              <p>أكاديمية: ${schoolData.region}</p>
              <p>مديرية: ${schoolData.city}</p>
              <p>مؤسسة: ${schoolData.name}</p>
            </div>
            <div class="logo-container">
              ${schoolData.logo ? `<img src="${schoolData.logo}" alt="Logo" />` : ''}
            </div>
            <div class="header-left">
              <p>الموسم الدراسي: ${schoolData.academicYear}</p>
              <p>رمز المؤسسة: ${schoolData.code}</p>
              <p>تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-MA')}</p>
            </div>
          </div>
          <div class="doc-title"><h2>تقرير الإحصائيات العامة للمؤسسة</h2></div>
          ${statsTables}
          ${studentStatsTable}
          <div class="sig-area">
            <div class="sig-box">
              <p>ختم وتوقيع مدير المؤسسة</p>
              <p style="margin-top: 8px; font-weight: bold;">السيد: ${schoolData.director}</p>
              <div class="sig-line"></div>
            </div>
          </div>
          ${commonFooter}
        </div>
        <script>window.onload = () => { setTimeout(() => { window.print(); window.onafterprint = () => window.close(); }, 800); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-10 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-[2rem] shadow-xl shadow-indigo-500/5 border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/30 overflow-hidden relative group"
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-right space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600/10 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest">
              <TrendingUp className="w-3 h-3" />
              لوحة التحكم
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
              مرحباً بك في <span className="text-indigo-600">{schoolName}</span>
            </h2>
            <p className="text-gray-500 max-w-xl font-medium leading-relaxed">
              نظرة عامة شاملة على الموارد البشرية والتركيبة التربوية للمؤسسة. يمكنك متابعة الإحصائيات وتصدير التقارير الرسمية بضغطة زر.
            </p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportStatsPDF}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/20 flex items-center gap-3 group/btn"
          >
            <Printer className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
            تصدير تقرير الإحصائيات (PDF)
          </motion.button>
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl group-hover:bg-indigo-300/20 transition-colors duration-1000"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-200/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
      </motion.div>

      {/* Student Overview Section */}
      {totalStudents > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <GraduationCap className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-800">إحصائيات التلاميذ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {studentMainStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex items-center gap-6`}
              >
                <div className={`p-5 rounded-2xl ${stat.color} text-white shadow-2xl ${stat.shadow} group-hover:scale-110 transition-transform duration-500`}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Students by Level Chart */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800">توزيع التلاميذ حسب المستوى والجنس</h3>
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={levelChartData} layout="vertical" margin={{ right: 30, left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      tick={{ fontSize: 12, fontWeight: 700, fill: '#4b5563' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', direction: 'rtl' }}
                      cursor={{ fill: '#f9fafb' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                    <Bar dataKey="إناث" stackId="a" fill="#ec4899" radius={[0, 0, 0, 0]} barSize={20} />
                    <Bar dataKey="ذكور" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Students by Section Chart */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 rounded-xl">
                    <PieChartIcon className="w-5 h-5 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800">توزيع التلاميذ حسب القسم والجنس</h3>
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionChartData} margin={{ bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      interval={0} 
                      height={80}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#4b5563' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#4b5563' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', direction: 'rtl' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                    <Bar dataKey="إناث" stackId="a" fill="#ec4899" barSize={15} />
                    <Bar dataKey="ذكور" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Age Distribution Suggestion */}
          {ageChartData.length > 0 && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800">توزيع التلاميذ حسب السن (مقترح)</h3>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#4b5563' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#4b5563' }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', direction: 'rtl' }} />
                    <Bar dataKey="value" name="عدد التلاميذ" fill="#f59e0b" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <Users className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-800">إحصائيات الموارد البشرية</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {mainStats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group cursor-default"
          >
            <div className={`${stat.color} p-5 rounded-2xl text-white shadow-2xl ${stat.shadow} group-hover:scale-110 transition-transform duration-500`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <PieChartIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              الإحصاء التركيبي لوضعيات الموظفين
            </h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {synthesisStats.map((stat, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className={`${stat.bgColor} ${stat.borderColor} border-2 p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-3 transition-all`}
              >
                <span className={`text-5xl font-black ${stat.color}`}>{stat.value}</span>
                <span className="text-sm font-black text-gray-600 uppercase tracking-tight">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-10">
        {/* Specialization Section */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center gap-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">التوزيع حسب التخصص والوضعية</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            <div className="h-[450px] w-full bg-gray-50/30 rounded-3xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={specChartData}
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 12, fontWeight: 700, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" />
                  <Bar dataKey="رسمي" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={20} />
                  <Bar dataKey="مكلف داخل" stackId="a" fill="#fb923c" radius={[0, 0, 0, 0]} barSize={20} />
                  <Bar dataKey="مكلف خارج" stackId="a" fill="#f87171" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
              {teachersCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-4">
                  <GraduationCap className="w-12 h-12 opacity-20" />
                  <p className="font-bold italic">لا توجد بيانات أساتذة حالياً</p>
                </div>
              ) : (
                (Object.entries(specStats) as [string, SpecBreakdown][])
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([label, data]) => (
                    <SpecDetailedRow key={label} label={label} data={data} totalTeachers={teachersCount} />
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Roles and Cadres Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {/* Role Section */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center gap-4">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <Briefcase className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">التوزيع حسب المهمة</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name.substring(0, 10)}...`}
                    >
                      {roleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(226, 70%, ${40 + (index * 5)}%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-6 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                {staff.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-4">
                    <Users className="w-12 h-12 opacity-20" />
                    <p className="font-bold italic">لا توجد بيانات حالياً</p>
                  </div>
                ) : (
                  (Object.entries(roleStats) as [string, number][])
                    .sort(([, a], [, b]) => b - a)
                    .map(([label, count]) => (
                      <StatBar key={label} label={label} count={count} total={staffCount} colorClass="bg-indigo-500" />
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Cadre Section */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center gap-4">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">التوزيع حسب الإطار</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cadreChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-6 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                {staff.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-4">
                    <Users className="w-12 h-12 opacity-20" />
                    <p className="font-bold italic">لا توجد بيانات حالياً</p>
                  </div>
                ) : (
                  (Object.entries(cadreStats) as [string, number][])
                    .sort(([, a], [, b]) => b - a)
                    .map(([label, count]) => (
                      <StatBar key={label} label={label} count={count} total={staffCount} colorClass="bg-blue-500" />
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-indigo-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-indigo-900/20 border border-indigo-800 relative overflow-hidden"
      >
        <div className="space-y-2 text-center md:text-right relative z-10">
          <h4 className="text-2xl font-black tracking-tight">ملخص الموارد البشرية</h4>
          <p className="text-indigo-300 text-sm font-medium">تحليل البيانات الديموغرافية والمهنية للمؤسسة بدقة عالية</p>
        </div>
        <div className="flex gap-12 relative z-10">
          <div className="text-center space-y-1">
            <p className="text-5xl font-black">{Math.round(((Number(genderStats['إناث'] || 0)) / (Number(staffCount || 1))) * 100) || 0}%</p>
            <p className="text-[10px] text-indigo-400 uppercase tracking-[0.2em] font-black">نسبة التأنيث</p>
          </div>
          <div className="w-px h-16 bg-white/10 hidden md:block"></div>
          <div className="text-center space-y-1">
            <p className="text-5xl font-black">{Object.keys(specStats).length}</p>
            <p className="text-[10px] text-indigo-400 uppercase tracking-[0.2em] font-black">عدد التخصصات</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </motion.div>
    </div>
  );
};
