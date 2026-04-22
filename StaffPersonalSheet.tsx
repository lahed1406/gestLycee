
import React from 'react';
import { StaffMember, SchoolData, TimetableActivity, SchoolStructure, Student } from '../types';
import { Printer, X } from 'lucide-react';
import { KINGDOM_LOGO_URL, toTifinagh } from '../constants';

interface StaffPersonalSheetProps {
  staff: StaffMember;
  schoolData: SchoolData;
  activities: TimetableActivity[];
  structures: SchoolStructure[];
  students: Student[];
  onClose: () => void;
}

export const StaffPersonalSheet: React.FC<StaffPersonalSheetProps> = ({ 
  staff, 
  schoolData, 
  activities, 
  structures,
  students,
  onClose 
}) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Helper to get activities for a specific day and time index
    const getActivity = (arabicDay: string, hourIndex: number) => {
      const dayKey = ARABIC_DAYS_TO_KEY[arabicDay];
      if (!dayKey) return null;
      const isMorning = hourIndex < 4;
      const fullDayKey = isMorning ? `${dayKey}_m` : `${dayKey}_s`;
      const hKey = `H${(hourIndex % 4) + 1}`;
      return activities.find(a => a.day.toLowerCase() === fullDayKey.toLowerCase() && a.hour === hKey);
    };

    const days = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const times = schoolData.hourLabels || ['09h - 08h', '10h - 09h', '11h - 10h', '12h - 11h', '15h - 14h', '16h - 15h', '17h - 16h', '18h - 17h'];

    const studentSets = Array.from(new Set(activities.map(a => a.studentSet)));

    const v = (val: any) => (val === undefined || val === null || val === '' ? '.......' : val);

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>البطاقة الشخصية - ${staff.fullName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tifinagh&display=swap');
          body { 
            font-family: 'Cairo', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: white; 
            color: black;
            font-size: 12px;
            line-height: 1.4;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm;
            margin: 0 auto;
            box-sizing: border-box;
            page-break-after: always;
            position: relative;
            display: flex;
            flex-direction: column;
          }
          .page:last-child { page-break-after: avoid; }
          
          .header { 
            display: table; 
            width: 100%; 
            border-collapse: collapse; 
            border: 1px solid black;
            margin-bottom: 10px;
          }
          .header-row { display: table-row; }
          .header-side { 
            display: table-cell;
            width: 35%; 
            font-weight: bold; 
            font-size: 10px; 
            line-height: 1.5; 
            border: 1px solid black;
            padding: 5px;
            text-align: center;
            vertical-align: middle;
          }
          .header-center { 
            display: table-cell;
            width: 30%; 
            text-align: center; 
            border: 1px solid black;
            padding: 5px;
            vertical-align: middle;
          }
          .logo { width: 25mm; height: 25mm; object-fit: contain; }
          
          .school-info {
            text-align: center;
            margin-bottom: 15px;
            font-weight: bold;
          }
          .school-info .arabic { font-size: 16px; margin-bottom: 2px; }
          .school-info .tifinagh { font-size: 14px; font-family: 'Noto Sans Tifinagh', sans-serif; }
          
          h1 { text-align: center; font-size: 22px; font-weight: 900; text-decoration: underline; margin: 20px 0; }
          
          .main-border { border: 2px solid black; width: 100%; }
          .row { display: flex; border-bottom: 1.5px solid black; min-height: 32px; align-items: center; }
          .row:last-child { border-bottom: none; }
          .cell { padding: 6px 10px; flex: 1; display: flex; align-items: center; }
          .cell-label { font-weight: bold; margin-left: 12px; white-space: nowrap; }
          .cell-value { flex: 1; text-align: center; font-weight: bold; font-size: 13px; }
          .border-l { border-left: 1.5px solid black; }
          
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
          .box { border: 1.5px solid black; padding: 8px; display: flex; align-items: center; }
          
          .symbols-table { margin-top: 20px; flex-grow: 1; }
          .symbols-title { background: #e5e7eb; border: 1.5px solid black; text-align: center; font-weight: bold; padding: 4px; font-size: 12px; }
          .symbols-grid { display: grid; grid-template-columns: repeat(5, 1fr); border: 1.5px solid black; border-top: none; font-size: 9px; }
          .symbol-col { border-left: 1px solid black; display: flex; flex-direction: column; }
          .symbol-col:last-child { border-left: none; }
          
          .symbol-section-header { background: #f3f4f6; font-weight: bold; text-align: center; border-bottom: 1px solid black; padding: 2px; font-size: 10px; }
          .symbol-row { display: flex; border-bottom: 0.5px solid #ccc; padding: 1px 4px; align-items: center; }
          .symbol-row:last-child { border-bottom: none; }
          .symbol-label { flex: 1; text-align: right; padding-left: 4px; }
          .symbol-code { width: 25px; text-align: center; font-weight: bold; border-right: 1px solid #ccc; padding-right: 4px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          th, td { border: 1.5px solid black; padding: 4px; text-align: center; }
          th { background: #f3f4f6; font-weight: bold; }
          
          .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-top: auto; padding-top: 10px; text-align: center; font-weight: bold; }
          .sig-box { height: 40px; display: flex; flex-direction: column; justify-content: flex-start; }
          .sig-date { font-size: 10px; margin-top: 8px; font-weight: normal; }

          @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0; }
            .page { border: none; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <!-- Page 1 -->
        <div class="page">
          <div class="header">
            <div class="header-row">
              <div class="header-side">
                المملكة المغربية<br/>
                وزارة التربية الوطنية والتعليم الأولي والرياضة<br/>
                الأكاديمية الجهوية للتربية والتكوين لجهة ${v(schoolData.region)}<br/>
                المديرية الإقليمية لـ ${v(schoolData.city)}
              </div>
              <div class="header-center">
                <img src="${KINGDOM_LOGO_URL}" class="logo" />
              </div>
              <div class="header-side tifinagh" style="font-family: 'Noto Sans Tifinagh', sans-serif;">
                ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ<br/>
                ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ<br/>
                ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ ${toTifinagh(schoolData.region.replace('جهة ', ''))}<br/>
                ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ ⵏ ${toTifinagh(schoolData.city.replace('مديرية ', '').replace('المديرية الإقليمية لـ ', '').replace('المديرية الإقليمية ل', ''))}
              </div>
            </div>
          </div>

          <h1>البطاقة الشخصية للموظف</h1>

          <div class="main-border">
            <div class="row">
              <div class="cell border-l"><span class="cell-label">رقم التأجير :</span><span class="cell-value">${v(staff.ppr)}</span></div>
              <div class="cell"><span class="cell-label">بطاقة التعريف الوطنية :</span><span class="cell-value">${v(staff.cin)}</span></div>
            </div>
            <div class="row">
              <div class="cell"><span class="cell-label">الاسم الكامل (بالعربية) :</span><span class="cell-value">${v(staff.fullName)}</span></div>
            </div>
            <div class="row" dir="ltr">
              <div class="cell"><span class="cell-label" style="margin-right:10px;">Nom et Prénom :</span><span class="cell-value" style="text-transform:uppercase;">${v(staff.fullNameFr)}</span></div>
            </div>
            <div class="row">
              <div class="cell"><span class="cell-label">تاريخ الازدياد و مكانه :</span><span class="cell-value">${v(staff.birthDate)} - ${v(staff.birthPlace)}</span></div>
            </div>
            <div class="row">
              <div class="cell border-l">
                <span class="cell-label">الجنس :</span>
                <span class="cell-value">${v(staff.gender)}</span>
              </div>
              <div class="cell">
                <span class="cell-label">الحالة المدنية :</span>
                <span class="cell-value">${v(staff.familyStatus)}</span>
              </div>
            </div>
            <div class="row">
              <div class="cell border-l"><span class="cell-label">تاريخ التوظيف :</span><span class="cell-value">${v(staff.recruitmentDate)}</span></div>
              <div class="cell"><span class="cell-label">الإطار الحالي :</span><span class="cell-value">${v(staff.cadre)}</span></div>
            </div>
            <div class="row">
              <div class="cell border-l"><span class="cell-label">السلم :</span><span class="cell-value">${v(staff.scale)}</span></div>
              <div class="cell"><span class="cell-label">الرتبة :</span><span class="cell-value">${v(staff.grade)}</span></div>
            </div>
            <div class="row">
              <div class="cell border-l"><span class="cell-label">المادة المدرسة :</span><span class="cell-value">${v(staff.specialization)}</span></div>
              <div class="cell"><span class="cell-label">تاريخ التعيين بالمؤسسة :</span><span class="cell-value">${v(staff.currentAssignmentDate)}</span></div>
            </div>
            <div class="row" style="min-height: 45px;">
              <div class="cell border-l"><span class="cell-label">عدد الأطفال :</span><span class="cell-value">${v(staff.childrenCount)}</span></div>
              <div class="cell" style="flex-direction: column; align-items: flex-start; justify-content: center;">
                <div style="display: flex; width: 100%;">
                  <span class="cell-label">الزوج موظف بالوزارة؟ :</span>
                  <span class="cell-value">${staff.spouseIsOfficial ? `نعم (${v(staff.spouseRegistryNumber)})` : 'لا'}</span>
                </div>
                <div style="font-size: 9px; font-weight: bold; margin-top: 2px;">اذا كان الجواب بنعم اذكر رقم تاجيره (ا)</div>
              </div>
            </div>
            <div class="row">
              <div class="cell"><span class="cell-label">العنوان الشخصي :</span><span class="cell-value">${v(staff.address)}</span></div>
            </div>
            <div class="row">
              <div class="cell border-l"><span class="cell-label">الهاتف :</span><span class="cell-value">${v(staff.phoneNumber)}</span></div>
              <div class="cell"><span class="cell-label">البريد الإلكتروني :</span><span class="cell-value">${v(staff.email)}</span></div>
            </div>
          </div>

          <div class="grid-2">
            <div class="box">
              <span class="cell-label">آخر نقطة تفتيش :</span><span class="cell-value">${v(staff.lastInspectionGrade)}</span>
              <span class="cell-label">سنة :</span><span class="cell-value">${v(staff.lastInspectionDate)}</span>
            </div>
            <div class="box">
              <span class="cell-label">آخر نقطة إدارية :</span><span class="cell-value">${v(staff.lastAdminGrade)}</span>
              <span class="cell-label">سنة :</span><span class="cell-value">${v(staff.lastAdminGradeDate)}</span>
            </div>
          </div>

          <div class="symbols-table">
            <div class="symbols-title">جدول الرموز</div>
            <div class="symbols-grid">
              <!-- Col 1 -->
              <div class="symbol-col">
                <div class="symbol-section-header">الاطار</div>
                <div class="symbol-row"><span class="symbol-label">اساتذة . ت . الابتدائي</span><span class="symbol-code">1</span></div>
                <div class="symbol-row"><span class="symbol-label">اساتذة . ثا . اعدادي</span><span class="symbol-code">2</span></div>
                <div class="symbol-row"><span class="symbol-label">اساتذة . ثا . تاهيلي</span><span class="symbol-code">3</span></div>
                <div class="symbol-row"><span class="symbol-label">ملحق تربوي</span><span class="symbol-code">51</span></div>
                <div class="symbol-row"><span class="symbol-label">م . ادارة و اقتصاد</span><span class="symbol-code">52</span></div>
                <div class="symbol-row"><span class="symbol-label">مستشار في التخطيط</span><span class="symbol-code">60</span></div>
                <div class="symbol-row"><span class="symbol-label">مفتش تربوي</span><span class="symbol-code">22</span></div>
                <div class="symbol-section-header">المهمة</div>
                <div class="symbol-row"><span class="symbol-label">التدريس</span><span class="symbol-code">1</span></div>
                <div class="symbol-row"><span class="symbol-label">مدير مؤسسة تعليمية</span><span class="symbol-code">3</span></div>
                <div class="symbol-row"><span class="symbol-label">ناظر الدروس</span><span class="symbol-code">4</span></div>
                <div class="symbol-row"><span class="symbol-label">حارس عام</span><span class="symbol-code">5</span></div>
                <div class="symbol-row"><span class="symbol-label">رئيس اشغال</span><span class="symbol-code">6</span></div>
                <div class="symbol-row"><span class="symbol-label">محضر مختبر</span><span class="symbol-code">7</span></div>
              </div>
              <!-- Col 2 -->
              <div class="symbol-col">
                <div class="symbol-section-header">المهمة</div>
                <div class="symbol-row"><span class="symbol-label">معيد</span><span class="symbol-code">8</span></div>
                <div class="symbol-row"><span class="symbol-label">حارس عام للداخلية</span><span class="symbol-code">9</span></div>
                <div class="symbol-row"><span class="symbol-label">مدير الدروس</span><span class="symbol-code">11</span></div>
                <div class="symbol-row"><span class="symbol-label">مدير الدراسة</span><span class="symbol-code">12</span></div>
                <div class="symbol-section-header">شهادات مدرسية او جامعية</div>
                <div class="symbol-row"><span class="symbol-label">ش. التعليم الثانوي</span><span class="symbol-code">2</span></div>
                <div class="symbol-row"><span class="symbol-label">البكالوريا او مايعادلها</span><span class="symbol-code">3</span></div>
                <div class="symbol-row"><span class="symbol-label">د. السلك الاول من الاجازة</span><span class="symbol-code">40</span></div>
                <div class="symbol-row"><span class="symbol-label">الاجازة او ما يعادلها</span><span class="symbol-code">41</span></div>
                <div class="symbol-row"><span class="symbol-label">د. الدراسات المعمقة</span><span class="symbol-code">42</span></div>
                <div class="symbol-row"><span class="symbol-label">د. الدولة</span><span class="symbol-code">52</span></div>
              </div>
              <!-- Col 3 -->
              <div class="symbol-col">
                <div class="symbol-section-header">الشهادات المهنية</div>
                <div class="symbol-row"><span class="symbol-label">شهادة الاهلية التربوية</span><span class="symbol-code">8</span></div>
                <div class="symbol-row"><span class="symbol-label">التخرج من المركز التربوي</span><span class="symbol-code">9</span></div>
                <div class="symbol-row"><span class="symbol-label">د. المدرسة العليا للاساتذة</span><span class="symbol-code">11</span></div>
                <div class="symbol-row"><span class="symbol-label">كلية علوم التربية</span><span class="symbol-code">12</span></div>
                <div class="symbol-row"><span class="symbol-label">شهادات اخرى</span><span class="symbol-code">52</span></div>
                <div class="symbol-section-header">التخصصات</div>
                <div class="symbol-row"><span class="symbol-label">اللغة العربية</span><span class="symbol-code">1</span></div>
                <div class="symbol-row"><span class="symbol-label">التربية الاسلامية</span><span class="symbol-code">2</span></div>
                <div class="symbol-row"><span class="symbol-label">الفلسفة</span><span class="symbol-code">3</span></div>
                <div class="symbol-row"><span class="symbol-label">الاجتماعيات</span><span class="symbol-code">4</span></div>
                <div class="symbol-row"><span class="symbol-label">التربية البدنية</span><span class="symbol-code">5</span></div>
                <div class="symbol-row"><span class="symbol-label">التربية التشكيلية</span><span class="symbol-code">6</span></div>
                <div class="symbol-row"><span class="symbol-label">التربية الاسرية</span><span class="symbol-code">7</span></div>
                <div class="symbol-row"><span class="symbol-label">اللغة الفرنسية</span><span class="symbol-code">8</span></div>
              </div>
              <!-- Col 4 -->
              <div class="symbol-col">
                <div class="symbol-section-header">التخصصات (تابع)</div>
                <div class="symbol-row"><span class="symbol-label">اللغة الانجليزية</span><span class="symbol-code">19</span></div>
                <div class="symbol-row"><span class="symbol-label">اللغة الاسبانية</span><span class="symbol-code">20</span></div>
                <div class="symbol-row"><span class="symbol-label">اللغة الالمانية</span><span class="symbol-code">21</span></div>
                <div class="symbol-row"><span class="symbol-label">الرياضيات</span><span class="symbol-code">22</span></div>
                <div class="symbol-row"><span class="symbol-label">ع. الحياة و الارض</span><span class="symbol-code">23</span></div>
                <div class="symbol-row"><span class="symbol-label">الفيزياء و الكيمياء</span><span class="symbol-code">24</span></div>
                <div class="symbol-row"><span class="symbol-label">الاعلاميات</span><span class="symbol-code">25</span></div>
                <div class="symbol-section-header">التخصصات</div>
                <div class="symbol-row"><span class="symbol-label">التكنولوجيا الصناعية</span><span class="symbol-code">10</span></div>
                <div class="symbol-row"><span class="symbol-label">الهندسة الميكانيكية</span><span class="symbol-code">11</span></div>
                <div class="symbol-row"><span class="symbol-label">الصناعة الميكانيكية</span><span class="symbol-code">12</span></div>
                <div class="symbol-row"><span class="symbol-label">البناء الميكانيكي</span><span class="symbol-code">13</span></div>
                <div class="symbol-row"><span class="symbol-label">الميكرو ميكانيك</span><span class="symbol-code">15</span></div>
                <div class="symbol-row"><span class="symbol-label">السباكة</span><span class="symbol-code">16</span></div>
                <div class="symbol-row"><span class="symbol-label">الالكتروميكانيك</span><span class="symbol-code">17</span></div>
              </div>
              <!-- Col 5 -->
              <div class="symbol-col">
                <div class="symbol-section-header">التخصصات</div>
                <div class="symbol-row"><span class="symbol-label">الالكترونيك</span><span class="symbol-code">58</span></div>
                <div class="symbol-row"><span class="symbol-label">التبريد و التكييف</span><span class="symbol-code">59</span></div>
                <div class="symbol-row"><span class="symbol-label">الهندسة المدنية</span><span class="symbol-code">60</span></div>
                <div class="symbol-row"><span class="symbol-label">البناء و الاشغال العمومية</span><span class="symbol-code">61</span></div>
                <div class="symbol-row"><span class="symbol-label">الفنون التشكيلية</span><span class="symbol-code">62</span></div>
                <div class="symbol-row"><span class="symbol-label">فنون صناعة الطباعة</span><span class="symbol-code">63</span></div>
                <div class="symbol-row"><span class="symbol-label">الكمياء الصناعية</span><span class="symbol-code">64</span></div>
                <div class="symbol-row"><span class="symbol-label">الاقتصاد و المحاسبة</span><span class="symbol-code">65</span></div>
                <div class="symbol-row"><span class="symbol-label">صيانة المخازن</span><span class="symbol-code">67</span></div>
                <div class="symbol-row"><span class="symbol-label">صيانة الالات المعلوماتية</span><span class="symbol-code">68</span></div>
                <div class="symbol-row"><span class="symbol-label">علوم المهندس</span><span class="symbol-code">69</span></div>
                <div class="symbol-row"><span class="symbol-label">العلوم و التكنولوجيات الميكانيكية</span><span class="symbol-code">70</span></div>
                <div class="symbol-row"><span class="symbol-label">العلوم و التكنولوجيات الكهربائية</span><span class="symbol-code">71</span></div>
                <div class="symbol-row"><span class="symbol-label">علوم الاقتصاد و التدبير</span><span class="symbol-code">72</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Page 2 -->
        <div class="page">
          <div class="header">
             <div class="header-side">الاسم والنسب: ${v(staff.fullName)}</div>
             <div class="header-side" style="text-align: left;">المؤسسة: ${v(schoolData.name)}</div>
          </div>

          <p style="font-weight:bold; text-decoration:underline; margin-top: 5px;">الشهادات المدرسية أو الجامعية:</p>
          <table>
            <thead>
              <tr><th>الشهادة</th><th>التخصص</th><th>اللجنة أو الكلية</th><th>السنة</th></tr>
            </thead>
            <tbody>
              ${(staff.certificates && staff.certificates.length > 0 ? staff.certificates : Array(3).fill({})).map(cert => `
                <tr style="height:25px;"><td>${v(cert.degree)}</td><td>${v(cert.specialization)}</td><td>${v(cert.institution)}</td><td>${v(cert.year)}</td></tr>
              `).join('')}
            </tbody>
          </table>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top:5px;">
            <div>
              <p style="font-weight:bold; text-decoration:underline;">لائحة الخدمات:</p>
              <table>
                <thead><tr><th>المهمة</th><th>المؤسسة</th><th>من</th><th>إلى</th></tr></thead>
                <tbody>
                  ${(staff.serviceHistory && staff.serviceHistory.length > 0 ? staff.serviceHistory : Array(5).fill({})).map(s => `
                    <tr style="height:25px;"><td>${v(s.mission)}</td><td>${v(s.institution)}</td><td>${v(s.from)}</td><td>${v(s.to)}</td></tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div>
              <p style="font-weight:bold; text-decoration:underline;">مجمل الحصص:</p>
              <table>
                <thead><tr><th>المادة</th><th>القسم</th><th>ساعات</th><th>تلاميذ</th></tr></thead>
                <tbody>
                  ${studentSets.map(setObj => {
                    const set = String(setObj);
                    const classActs = activities.filter(a => a.studentSet === set);
                    
                    // Improved flexible matching logic
                    const count = students.filter(s => {
                      const sSection = (s.section || '').trim();
                      const sLevel = (s.level || '').trim();
                      
                      const clean = (str: string) => str.replace(/[^a-z0-9]/gi, '').toLowerCase();
                      const target = clean(set);
                      if (!target) return false;

                      const check = (val: string) => {
                        const cleanedVal = clean(val);
                        if (!cleanedVal) return false;
                        
                        // 1. Exact match after cleaning
                        if (cleanedVal === target) return true;
                        
                        // 2. Inclusion match with digit-boundary protection
                        // This handles "Arabic Text TCSF-1" matching "TCSF1"
                        const idx = cleanedVal.indexOf(target);
                        if (idx !== -1) {
                          // Check if the character immediately after the match is a digit
                          // to avoid matching TCSF1 in TCSF11
                          const charAfter = cleanedVal[idx + target.length];
                          const lastCharOfTarget = target[target.length - 1];
                          
                          if (charAfter && /[0-9]/.test(charAfter) && /[0-9]/.test(lastCharOfTarget)) {
                            return false;
                          }
                          return true;
                        }
                        return false;
                      };

                      return check(sSection) || check(sLevel);
                    }).length;
                    
                    // Fallback to structures if no students found in student management
                    const structureCount = count || structures.find(s => s.name === set)?.members.filter(m => m.isStudent).length || 0;
                    
                    return `<tr><td>${v(staff.specialization)}</td><td>${v(set)}</td><td>${classActs.length}</td><td>${structureCount || '-'}</td></tr>`;
                  }).join('')}
                  ${Array(Math.max(0, 5 - studentSets.length)).fill(0).map(() => `<tr style="height:25px;"><td></td><td></td><td></td><td></td></tr>`).join('')}
                </tbody>
                <tfoot>
                  <tr style="font-weight:bold;">
                    <td colspan="2">المجموع</td>
                    <td>${activities.length}</td>
                    <td>${studentSets.reduce((acc, setObj) => {
                      const set = String(setObj);
                      const clean = (str: string) => str.replace(/[^a-z0-9]/gi, '').toLowerCase();
                      const target = clean(set);
                      
                      const count = students.filter(s => {
                        if (!target) return false;
                        const sSection = (s.section || '').trim();
                        const sLevel = (s.level || '').trim();
                        
                        const check = (val: string) => {
                          const cleanedVal = clean(val);
                          if (cleanedVal === target) return true;
                          const idx = cleanedVal.indexOf(target);
                          if (idx !== -1) {
                            const charAfter = cleanedVal[idx + target.length];
                            const lastCharOfTarget = target[target.length - 1];
                            if (charAfter && /[0-9]/.test(charAfter) && /[0-9]/.test(lastCharOfTarget)) return false;
                            return true;
                          }
                          return false;
                        };
                        return check(sSection) || check(sLevel);
                      }).length;
                      const structureCount = count || structures.find(s => s.name === set)?.members.filter(m => m.isStudent).length || 0;
                      return acc + structureCount;
                    }, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <p style="font-weight:bold; text-decoration:underline; margin-top:5px;">جدول الحصص الأسبوعي:</p>
          <table>
            <thead>
              <tr><th style="width:80px;">اليوم / الحصة</th>${times.map(t => `<th>${t}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${days.map(day => `
                <tr style="height:30px;">
                  <td style="font-weight:bold; background:#f9f9f9;">${day}</td>
                  ${times.map((_, idx) => {
                    const act = getActivity(day, idx);
                    return `<td>${act ? `<div style="font-weight:bold;">${act.studentSet}</div><div style="font-size:10px;">${act.room}</div>` : ''}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-box">
              <div>توقيع الموظف:</div>
              <div class="sig-date">بتاريخ: ........................</div>
            </div>
            <div class="sig-box">
              <div>توقيع رئيس المؤسسة:</div>
              <div class="sig-date">بتاريخ: ........................</div>
            </div>
            <div class="sig-box">
              <div>توقيع المفتش:</div>
              <div class="sig-date">بتاريخ: ........................</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.onafterprint = () => window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const ARABIC_DAYS_TO_KEY: Record<string, string> = {
    'الاثنين': 'lundi',
    'الثلاثاء': 'Mardi',
    'الأربعاء': 'Mercredi',
    'الخميس': 'Jeudi',
    'الجمعة': 'Vendredi',
    'السبت': 'Samedi',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm no-print">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col">
        {/* Header with controls */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">معاينة البطاقة الشخصية</h2>
          <div className="flex gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Printer className="w-5 h-5" />
              <span>طباعة البطاقة</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-white text-gray-500 rounded-xl hover:bg-gray-100 border transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Preview Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-200/50 custom-scrollbar">
          <div className="bg-white shadow-sm mx-auto p-8 w-[210mm] min-h-[297mm] mb-8" dir="rtl">
             <p className="text-center text-gray-400 italic">-- الصفحة الأولى --</p>
             {/* Simple preview of content */}
             <div className="border-b pb-4 mb-4 flex justify-between">
                <div className="font-bold text-xs">المملكة المغربية</div>
                <div className="font-bold text-lg">البطاقة الشخصية للموظف</div>
                <div className="font-bold text-xs">المؤسسة: {schoolData.name}</div>
             </div>
             <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                   <div className="border p-2"><strong>رقم التأجير:</strong> {staff.ppr}</div>
                   <div className="border p-2"><strong>رقم البطاقة:</strong> {staff.cin}</div>
                </div>
                <div className="border p-2"><strong>الاسم الكامل:</strong> {staff.fullName}</div>
                <div className="border p-2"><strong>تاريخ الازدياد و مكانه:</strong> {staff.birthDate} - {staff.birthPlace}</div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="border p-2"><strong>تاريخ التوظيف:</strong> {staff.recruitmentDate}</div>
                   <div className="border p-2"><strong>تاريخ التعيين بالمؤسسة:</strong> {staff.currentAssignmentDate}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="border p-2"><strong>الإطار:</strong> {staff.cadre}</div>
                   <div className="border p-2"><strong>المادة:</strong> {staff.specialization}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="border p-2"><strong>الهاتف:</strong> {staff.phoneNumber}</div>
                   <div className="border p-2"><strong>البريد الإلكتروني:</strong> {staff.email}</div>
                </div>
             </div>
          </div>
          <div className="bg-white shadow-sm mx-auto p-8 w-[210mm] min-h-[297mm]" dir="rtl">
             <p className="text-center text-gray-400 italic">-- الصفحة الثانية --</p>
             <div className="mt-8">
                <h3 className="font-bold underline mb-4">جدول الحصص الأسبوعي</h3>
                <div className="border p-4 text-center text-gray-500">
                   سيتم توليد الجدول الكامل والشهادات والخدمات في نسخة الطباعة النهائية.
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
