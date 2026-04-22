import React, { useState, useMemo, useEffect } from 'react';
import { StaffMember, SchoolData, StaffAbsence } from '../types';
import { motion } from 'motion/react';
import { toTifinagh, KINGDOM_LOGO_URL } from '../constants';
import { 
  FileText, 
  Printer, 
  Search, 
  User, 
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  FileDown
} from 'lucide-react';

interface RequestsAndPrintsProps {
  staff: StaffMember[];
  schoolData: SchoolData;
  absences: StaffAbsence[];
}

export const RequestsAndPrints: React.FC<RequestsAndPrintsProps> = ({ staff, schoolData, absences }) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'leaveRequest' | 'birthDeathCard' | 'marriageDivorceDeathCard' | 'noDisciplinaryAction' | 'serviceStatement'>('leaveRequest');

  // Manual fields for Leave Request
  const [leaveDuration, setLeaveDuration] = useState('');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [workResumptionDate, setWorkResumptionDate] = useState('');
  const [supervisorOpinion, setSupervisorOpinion] = useState('');
  const [leaveType, setLeaveType] = useState('ترخيص بالتغيب');
  const [sendingNumber, setSendingNumber] = useState('');
  const [sendingDate, setSendingDate] = useState(new Date().toISOString().split('T')[0]);

  // Common fields for Presentation Cards
  const [indexNumber, setIndexNumber] = useState('');

  // Fields for Birth/Death Card
  const [childOrder, setChildOrder] = useState('');
  const [spouseOrder, setSpouseOrder] = useState('');
  const [childName, setChildName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [birthDeathType, setBirthDeathType] = useState('ازدياد');

  // Fields for Marriage/Divorce/Death Card
  const [marriageDate, setMarriageDate] = useState('');
  const [divorceDate, setDivorceDate] = useState('');
  const [spouseDeathDate, setSpouseDeathDate] = useState('');
  const [spouseLastName, setSpouseLastName] = useState('');
  const [spouseFirstName, setSpouseFirstName] = useState('');
  const [spouseProfession, setSpouseProfession] = useState('');
  const [spouseCin, setSpouseCin] = useState('');
  const [marriageDivorceDeathType, setMarriageDivorceDeathType] = useState('زواج');

  // Fields for No Disciplinary Action
  const [disciplinaryActionPurpose, setDisciplinaryActionPurpose] = useState('اجتياز مباراة ولوج مسلك المفتشين التربويين دورة أبريل 2025');

  // Fields for Service Statement
  const [serviceTableRows, setServiceTableRows] = useState(
    Array(4).fill(null).map(() => ({
      institution: '',
      province: '',
      cadre: '',
      role: '',
      specialty: '',
      academicYear: '',
      notes: ''
    }))
  );

  // Editable Staff fields for cards
  const [staffPpr, setStaffPpr] = useState('');
  const [staffFamilyName, setStaffFamilyName] = useState('');
  const [staffPersonalName, setStaffPersonalName] = useState('');
  const [staffFamilyNameFr, setStaffFamilyNameFr] = useState('');
  const [staffPersonalNameFr, setStaffPersonalNameFr] = useState('');
  const [staffCin, setStaffCin] = useState('');
  const [staffScale, setStaffScale] = useState('');
  const [staffCadre, setStaffCadre] = useState('');
  const [staffGrade, setStaffGrade] = useState('');
  const [staffRecruitmentDate, setStaffRecruitmentDate] = useState('');

  // Auto-calculate duration
  useEffect(() => {
    if (leaveFrom && leaveTo) {
      const start = new Date(leaveFrom);
      const end = new Date(leaveTo);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        // Convert to Arabic words for common values or just number + "يوم"
        let durationText = `${diffDays} يوم`;
        if (diffDays === 1) durationText = 'يوم واحد';
        else if (diffDays === 2) durationText = 'يومان';
        else if (diffDays >= 3 && diffDays <= 10) durationText = `${diffDays} أيام`;
        
        setLeaveDuration(durationText);
      } else {
        setLeaveDuration('');
      }
    }
  }, [leaveFrom, leaveTo]);

  const filteredStaff = useMemo(() => {
    return staff.filter(s => 
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ppr.includes(searchTerm)
    );
  }, [staff, searchTerm]);

  const selectedStaff = useMemo(() => {
    return staff.find(s => s.id === selectedStaffId);
  }, [staff, selectedStaffId]);

  // Pre-fill editable staff fields when selectedStaff changes
  useEffect(() => {
    if (selectedStaff) {
      setStaffPpr(selectedStaff.ppr || '');
      
      const names = (selectedStaff.fullName || '').split(' ');
      setStaffFamilyName(names.slice(-1)[0] || '');
      setStaffPersonalName(names.slice(0, -1).join(' ') || '');
      
      const namesFr = (selectedStaff.fullNameFr || '').split(' ');
      setStaffFamilyNameFr(namesFr.slice(-1)[0] || '');
      setStaffPersonalNameFr(namesFr.slice(0, -1).join(' ') || '');

      setStaffCin(selectedStaff.cin || '');
      setStaffScale(selectedStaff.scale || '');
      setStaffCadre(selectedStaff.cadre || '');
      setStaffGrade(selectedStaff.grade || '');
      setStaffRecruitmentDate(selectedStaff.recruitmentDate || selectedStaff.assignmentDate || '');
    }
  }, [selectedStaff]);

  const staffLeaves = useMemo(() => {
    if (!selectedStaffId) return [];
    return absences.filter(a => 
      a.staffId === selectedStaffId && 
      (a.reason.includes('رخصة') || a.reason.includes('مرض') || a.reason.includes('ولادة') || a.reason.includes('حج') || a.reason.includes('استثنائية'))
    ).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [absences, selectedStaffId]);

  const handlePrint = () => {
    if (!selectedStaff) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const renderHeader = () => `
      <div class="main-header">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
          <tr>
            <td style="width: 35%; text-align: center; vertical-align: middle; font-size: 11px; line-height: 1.6; font-weight: bold; border: 1px solid #000; padding: 5px;">
              المملكة المغربية<br/>
              وزارة التربية الوطنية والتعليم الأولي والرياضة<br/>
              الأكاديمية الجهوية للتربية والتكوين لجهة ${schoolData.region}<br/>
              المديرية الإقليمية لـ ${schoolData.city}
            </td>
            <td style="width: 30%; text-align: center; vertical-align: middle; border: 1px solid #000; padding: 5px;">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Coat_of_arms_of_Morocco.svg/1200px-Coat_of_arms_of_Morocco.svg.png" 
                alt="شعار المملكة" 
                style="width: 25mm; height: 25mm; margin: 0 auto; object-fit: contain;"
                referrerpolicy="no-referrer"
              />
            </td>
            <td style="width: 35%; text-align: center; vertical-align: middle; font-size: 10px; line-height: 1.6; font-family: 'Noto Sans Tifinagh', sans-serif; border: 1px solid #000; padding: 5px;">
              ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ<br/>
              ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍﻤⴷ ⴰⵏⵣⵡⴰⵔ ⴷ ⵜⵓⵏⵏⵓⵏⵜ<br/>
              ⵜⴰⴽⴰⴷⵉⵎⵉⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ ${toTifinagh(schoolData.region)}<br/>
              ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ ⵏ ${toTifinagh(schoolData.city)}
            </td>
          </tr>
        </table>
        <div style="display: flex; flex-direction: column; align-items: center; font-weight: bold; font-size: 16px; margin-top: 10px; border-bottom: 2px solid #000; padding-bottom: 5px;">
          <span>المؤسسة: ${schoolData.name}</span>
          <span style="font-family: 'Noto Sans Tifinagh', sans-serif;">ⵜⴰⵙⵏⵓⵔⵜ: ${toTifinagh(schoolData.name)}</span>
        </div>
      </div>
    `;

    const renderLeaveRequest = (copyTitle: string) => `
      <div class="page-container">
        <div style="text-align: left; font-size: 10px; font-weight: bold; margin-bottom: 5px; color: #666;">
          ${copyTitle}
        </div>
        ${renderHeader()}

        <div class="header">
          <div>رقم الإرسال: ${sendingNumber || '................'} بتاريخ ${sendingDate || '................'}</div>
        </div>

        <div class="title">طلب رخصة</div>

        <div class="options">
          - ولادة - امتحان - <span style="${leaveType === 'ترخيص بالتغيب' ? 'font-weight: bold; text-decoration: underline;' : ''}">ترخيص بالتغيب(1)</span> - حج - رخصة استثنائية لأسباب عائلية أو خطيرة (2)
        </div>

        <div class="info-section">
          <div class="info-row">
            <div class="info-item" style="display:flex;">
              <span class="label">الاسم والنسب :</span>
              <span class="value">${selectedStaff.fullName}</span>
            </div>
            <div class="info-item" style="display:flex; margin-right: 20px;">
              <span class="label">رقم التأجير :</span>
              <span class="value">${selectedStaff.ppr}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item" style="display:flex;">
              <span class="label">الإطار :</span>
              <span class="value">${selectedStaff.cadre}</span>
            </div>
            <div class="info-item" style="display:flex; margin-right: 20px;">
              <span class="label">الدرجة :</span>
              <span class="value">${selectedStaff.grade}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item" style="display:flex;">
              <span class="label">العنوان الشخصي (القريب من مقر العمل):</span>
              <span class="value">${selectedStaff.address}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item" style="display:flex;">
              <span class="label">مدة الرخصة :</span>
              <span class="value">${leaveDuration}</span>
              <span class="label" style="margin-right: 10px;">من</span>
              <span class="value">${leaveFrom}</span>
              <span class="label" style="margin-right: 10px;">إلى</span>
              <span class="value">${leaveTo}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item" style="display:flex;">
              <span class="label">تاريخ انتهاء العمل :</span>
              <span class="value">${workResumptionDate}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item" style="display:flex;">
              <span class="label">رأي الرئيس المباشر :</span>
              <span class="value">${supervisorOpinion}</span>
            </div>
          </div>
        </div>

        <div class="table-title">الرخص التي تمتع بها الموظف أثناء السنة الدراسية الحالية :</div>
        <table>
          <thead>
            <tr>
              <th style="width: 15%">نوع الرخصة</th>
              <th style="width: 15%">مدتها</th>
              <th style="width: 20%">من</th>
              <th style="width: 20%">إلى</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${staffLeaves.length > 0 ? staffLeaves.slice(0, 6).map(l => `
              <tr>
                <td>${l.reason}</td>
                <td>${l.totalDays || '-'} يوم</td>
                <td>${l.startDate}</td>
                <td>${l.endDate || '-'}</td>
                <td></td>
              </tr>
            `).join('') : `
              <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
              <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
            `}
          </tbody>
        </table>

        <div style="text-align: left; margin-top: 15px;">
          حرر بـ ${schoolData.municipality} في : ${new Date().toLocaleDateString('ar-MA')}
        </div>

        <div class="footer" style="margin-top: 15px;">
          <div class="footer-item">توقيع المعني بالأمر</div>
          <div class="footer-item">توقيع رئيس المؤسسة</div>
        </div>

        <div class="footnotes">
          (1) لفائدة أعضاء المجالس الجماعية - لفائدة ممثلي النقابات والتعاضديات والمنظمات - لفائدة الموظفين المدعوين للقيام بتداريب إعدادية أو المشاركة في منافسات رياضية وطنية أو دولية - المشاركة في التكوينات التي تدعو لها الوزارة - حضور التظاهرات التي تدعو لها النقابات المعترف بها قانونيا.
          <br>
          (2) ازدياد - وفاة قريب - زواج - مرافقة الابن لزيارة الطبيب .................................................................................
          <br>
          <strong>ملحوظة: في جميع الحالات يجب أن يرفق هذا المطبوع بوثيقة تبريرية</strong>
        </div>
      </div>
    `;

    const renderBirthDeathCard = () => `
      <div class="page-container">
        ${renderHeader()}
        <div class="card-title-banner">بطاقة تقديم (${birthDeathType})</div>
        
        <div class="info-grid">
          <div class="info-cell"><strong>الرقم المالي:</strong> ${staffPpr}</div>
          <div class="info-cell"><strong>الاسم العائلي:</strong> ${staffFamilyName} / Nom: ${staffFamilyNameFr}</div>
          <div class="info-cell"><strong>الاسم الشخصي:</strong> ${staffPersonalName} / Prénom: ${staffPersonalNameFr}</div>
          <div class="info-cell"><strong>رقم البطاقة الوطنية:</strong> ${staffCin || '................'}</div>
          <div class="info-cell"><strong>السلم:</strong> ${staffScale || '................'}</div>
          <div class="info-cell"><strong>الإطار:</strong> ${staffCadre}</div>
          <div class="info-cell"><strong>الرتبة:</strong> ${staffGrade}</div>
          <div class="info-cell"><strong>الرقم الاستدلالي:</strong> ${indexNumber || '................'}</div>
          <div class="info-cell"><strong>تاريخ التوظيف:</strong> ${staffRecruitmentDate || '................'}</div>
          <div class="info-cell"><strong>مقر العمل:</strong> ${schoolData.name}</div>
        </div>

        <div class="section-title">معلومات الابن (ة)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>ترتيب الابن(ة)</th>
              <th>ترتيب الزوج(ة)</th>
              <th>الاسم و النسب</th>
              <th>تاريخ الازدياد</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${childOrder || '................'}</td>
              <td>${spouseOrder || '................'}</td>
              <td>${childName || '................'}</td>
              <td>${childBirthDate || '................'}</td>
            </tr>
          </tbody>
        </table>

        <div class="signature-section">
          توقيع رئيس المؤسسة
        </div>

        <div class="bottom-bar">
          مصلحة تدبير الموارد البشرية : مكتب التعويضات العائلية / الهاتف (الكتابة الخاصة): 05 28 33 99 00
        </div>
      </div>
    `;

    const renderMarriageDivorceDeathCard = () => `
      <div class="page-container">
        ${renderHeader()}
        <div class="card-title-banner">بطاقة تقديم (${marriageDivorceDeathType})</div>
        
        <div class="info-grid">
          <div class="info-cell"><strong>الرقم المالي:</strong> ${staffPpr}</div>
          <div class="info-cell"><strong>الاسم العائلي:</strong> ${staffFamilyName} / Nom: ${staffFamilyNameFr}</div>
          <div class="info-cell"><strong>الاسم الشخصي:</strong> ${staffPersonalName} / Prénom: ${staffPersonalNameFr}</div>
          <div class="info-cell"><strong>رقم البطاقة الوطنية:</strong> ${staffCin || '................'}</div>
          <div class="info-cell"><strong>السلم:</strong> ${staffScale || '................'}</div>
          <div class="info-cell"><strong>الإطار:</strong> ${staffCadre}</div>
          <div class="info-cell"><strong>الرتبة:</strong> ${staffGrade}</div>
          <div class="info-cell"><strong>الرقم الاستدلالي:</strong> ${indexNumber || '................'}</div>
          <div class="info-cell"><strong>تاريخ التوظيف:</strong> ${staffRecruitmentDate || '................'}</div>
          <div class="info-cell"><strong>مقر العمل:</strong> ${schoolData.name}</div>
          <div class="info-cell"><strong>تاريخ الزواج:</strong> ${marriageDate || '................'}</div>
          <div class="info-cell"><strong>تاريخ الطلاق:</strong> ${divorceDate || '................'}</div>
          <div class="info-cell"><strong>تاريخ الوفاة:</strong> ${spouseDeathDate || '................'}</div>
        </div>

        <div class="section-title">معلومات الزوج(ة)</div>
        <div class="info-grid">
          <div class="info-cell"><strong>الاسم العائلي للزوج(ة):</strong> ${spouseLastName || '................'} / Nom: .................</div>
          <div class="info-cell"><strong>الاسم الشخصي للزوج(ة):</strong> ${spouseFirstName || '................'} / Prénom: .................</div>
          <div class="info-cell"><strong>مهنة الزوج(ة):</strong> ${spouseProfession || '................'}</div>
          <div class="info-cell"><strong>رقم البطاقة الوطنية:</strong> ${spouseCin || '................'}</div>
        </div>

        <div class="signature-section">
          توقيع رئيس المؤسسة
        </div>

        <div class="bottom-bar">
          مصلحة تدبير الموارد البشرية : مكتب التعويضات العائلية / الهاتف (الكتابة الخاصة): 05 28 33 99 00
        </div>
      </div>
    `;

    const renderNoDisciplinaryAction = () => `
      <div class="page-container" style="padding: 20px 30px; min-height: 240mm; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="text-align: left; font-size: 14px; margin-bottom: 15px;">
            حرر بـ ${schoolData.municipality || schoolData.city} في : ${new Date().toLocaleDateString('ar-MA')}
          </div>
          
          <div style="margin-bottom: 20px; line-height: 1.6; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <div style="width: 48%;"><strong>الاسم والنسب :</strong> ${selectedStaff.fullName}</div>
              <div style="width: 48%;"><strong>رقم التأجير :</strong> ${selectedStaff.ppr}</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <div style="width: 48%;"><strong>الإطار :</strong> ${selectedStaff.cadre}</div>
              <div style="width: 48%;"><strong>المهمة :</strong> ${selectedStaff.role}</div>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <div style="width: 48%;"><strong>مقر العمل :</strong> ${schoolData.name}</div>
              <div style="width: 48%;"><strong>الهاتف الشخصي :</strong> ${selectedStaff.phoneNumber || '................'}</div>
            </div>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="font-size: 20px; margin-bottom: 5px;">إلى</h2>
            <p style="font-size: 17px; font-weight: bold; line-height: 1.4;">
              السيد المدير الإقليمي للأكاديمية الجهوية للتربية والتكوين لجهة ${schoolData.region}<br/>
              بمديرية ${schoolData.city}<br/>
              مصلحة تدبير الموارد البشرية<br/>
              على يد السيد مدير ${schoolData.name}
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <p style="font-weight: bold; font-size: 17px; text-decoration: underline; margin-bottom: 10px;">
              الموضوع : طلب شهادة إدارية تثبت خلو ملفي الإداري من أي عقوبة تأديبية
            </p>
            <p style="text-align: center; font-weight: bold; margin-bottom: 10px; font-size: 16px;">سالم تام بوجود مولانا الإمام</p>
            <p style="text-indent: 30px; text-align: justify; line-height: 1.6; font-size: 16px;">
              وبعد يشرفني أن أطلب من سيادتكم موافاتي بشهادة إدارية تثبت خلو ملفي الإداري من أي عقوبة تأديبية خلال مساري المهني قصد الادلاء بها في ملف الترشح لـ ${disciplinaryActionPurpose}.
            </p>
            <p style="text-align: left; font-weight: bold; margin-top: 10px; font-size: 16px;">والسلام</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="width: 50%; border: 1px solid #000; height: 100px; vertical-align: top; padding: 10px; font-weight: bold; font-size: 14px;">امضاء المعني بالأمر</td>
              <td style="width: 50%; border: 1px solid #000; height: 100px; vertical-align: top; padding: 10px; font-weight: bold; font-size: 14px;">رأي وتوقيع الرئيس المباشر</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 20px; border-top: 2px solid #000; padding-top: 10px;">
          <h2 style="text-align: center; text-decoration: underline; font-size: 18px; margin-bottom: 10px;">تصريح بالشرف</h2>
          <div style="line-height: 1.6; font-size: 15px;">
            <p style="margin-bottom: 5px;">أنا الموقع أسفله :</p>
            <p style="margin-bottom: 5px;"><strong>الاسم والنسب :</strong> ${selectedStaff.fullName}</p>
            <p style="margin-bottom: 5px;"><strong>رقم التأجير :</strong> ${selectedStaff.ppr}</p>
            <p style="margin-bottom: 5px;"><strong>رقم البطاقة الوطنية :</strong> ${selectedStaff.cin || '................'}</p>
            <p style="margin-bottom: 5px;"><strong>العنوان الشخصي :</strong> ${selectedStaff.address || '................'}</p>
            <p style="margin-bottom: 5px;"><strong>الهاتف الشخصي :</strong> ${selectedStaff.phoneNumber || '................'}</p>
            <p style="margin-top: 15px; font-weight: bold; text-align: center; font-size: 17px;">
              أشهد على نفسي أنني لم أتعرض لأية عقوبة تأديبية طيلة مساري المهني
            </p>
            <div style="display: flex; justify-content: space-between; margin-top: 20px;">
              <p>والسلام</p>
              <p style="font-weight: bold; text-decoration: underline;">توقيع المعني بالأمر</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const renderTimetableHeader = () => `
      <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
        <div style="text-align: center; font-size: 11px; line-height: 1.4;">
          <strong>المملكة المغربية</strong><br/>
          وزارة التربية الوطنية والتعليم الأولي والرياضة<br/>
          أكاديمية: ${schoolData.region}<br/>
          مديرية: ${schoolData.city}<br/>
          المؤسسة: ${schoolData.name}
        </div>
        <div style="text-align: center;">
          <img src="${KINGDOM_LOGO_URL}" style="width: 60px; height: 60px; object-fit: contain;" />
        </div>
        <div style="text-align: center; font-size: 10px; line-height: 1.4; font-family: 'Noto Sans Tifinagh', sans-serif;">
          <strong>ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ</strong><br/>
          ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ<br/>
          ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ ${toTifinagh(schoolData.region.replace('جهة ', ''))}<br/>
          ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ ⵏ ${toTifinagh(schoolData.city.replace('مديرية ', '').replace('المديرية الإقليمية لـ ', '').replace('المديرية الإقليمية ل', ''))}<br/>
          ⵜⴰⵙⵏⵓⵔⴰⵢⵜ: ${toTifinagh(schoolData.name)}
        </div>
      </div>
    `;

    const renderServiceStatement = () => `
      <div class="page-container" style="padding: 30px 40px;">
        ${renderTimetableHeader()}
        
        <div style="text-align: center; margin: 30px 0;">
          <h2 style="border: 2px solid #000; padding: 10px 30px; display: inline-block; font-size: 22px; font-weight: bold;">بيان الخدمات لأربع سنوات الأخيرة</h2>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; font-size: 16px; line-height: 2;">
          <div>
            <p><strong>السيد(ة) :</strong> ${selectedStaff.fullName}</p>
            <p><strong>الإطار :</strong> ${staffCadre}</p>
            <p><strong>مقر العمل :</strong> ${schoolData.name}</p>
          </div>
          <div>
            <p><strong>رقم التأجير :</strong> ${staffPpr}</p>
            <p><strong>رقم ب.ت.و :</strong> ${staffCin || '................'}</p>
            <p><strong>تاريخ التوظيف :</strong> ${staffRecruitmentDate || '................'}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f9f9f9;">
              <th style="border: 1px solid #000; padding: 10px; font-size: 14px;">المؤسسة</th>
              <th style="border: 1px solid #000; padding: 10px; font-size: 14px;">المديرية الإقليمية</th>
              <th style="border: 1px solid #000; padding: 10px; font-size: 14px;">الإطار</th>
              <th style="border: 1px solid #000; padding: 10px; font-size: 14px;">المهمة</th>
              <th style="border: 1px solid #000; padding: 10px; font-size: 14px;">التخصص</th>
              <th style="border: 1px solid #000; padding: 10px; font-size: 14px;">الموسم الدراسي</th>
              <th style="border: 1px solid #000; padding: 10px; font-size: 14px;">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${serviceTableRows.map(row => `
              <tr style="height: 40px;">
                <td style="border: 1px solid #000; padding: 5px;">${row.institution}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.province}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.cadre}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.role}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.specialty}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.academicYear}</td>
                <td style="border: 1px solid #000; padding: 5px;">${row.notes}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 50px; display: flex; flex-direction: column; align-items: center; gap: 20px;">
          <p style="font-weight: bold; font-size: 18px;">توقيع الرئيس المباشر</p>
          <div style="height: 100px;"></div>
          <p style="align-self: flex-end; font-size: 16px;">حرر في: ${schoolData.municipality || schoolData.city} بتاريخ: ${new Date().toLocaleDateString('ar-MA')}</p>
        </div>
      </div>
    `;

    let bodyContent = '';
    let pageTitle = '';

    if (activeTab === 'leaveRequest') {
      bodyContent = `${renderLeaveRequest('نسخة الإدارة')} ${renderLeaveRequest('نسخة الموظف')}`;
      pageTitle = `طلب رخصة - ${selectedStaff.fullName}`;
    } else if (activeTab === 'birthDeathCard') {
      bodyContent = renderBirthDeathCard();
      pageTitle = `بطاقة تقديم (${birthDeathType}) - ${selectedStaff.fullName}`;
    } else if (activeTab === 'marriageDivorceDeathCard') {
      bodyContent = renderMarriageDivorceDeathCard();
      pageTitle = `بطاقة تقديم (${marriageDivorceDeathType}) - ${selectedStaff.fullName}`;
    } else if (activeTab === 'noDisciplinaryAction') {
      bodyContent = renderNoDisciplinaryAction();
      pageTitle = `طلب خلو الملف من العقوبة - ${selectedStaff.fullName}`;
    } else if (activeTab === 'serviceStatement') {
      bodyContent = renderServiceStatement();
      pageTitle = `بيان الخدمات - ${selectedStaff.fullName}`;
    }

    const html = `
      <html dir="rtl" lang="ar">
        <head>
          <title>${pageTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri&family=Tajawal:wght@400;700&family=Noto+Sans+Tifinagh&display=swap');
            body { 
              font-family: 'Tajawal', sans-serif; 
              padding: 0;
              margin: 0;
              line-height: 1.4;
              color: #000;
            }
            .page-container {
              padding: 20px;
              min-height: 265mm;
              position: relative;
              box-sizing: border-box;
              page-break-after: always;
            }
            .page-container:last-of-type {
              page-break-after: avoid;
            }
            .main-header {
              text-align: center;
              margin-bottom: 8px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 12px;
            }
            .title {
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              margin: 4px 0;
              text-decoration: underline;
              font-family: 'Amiri', serif;
            }
            .options {
              background-color: #f0f0f0;
              padding: 5px;
              text-align: center;
              margin-bottom: 8px;
              font-size: 11px;
              border: 1px solid #ccc;
            }
            .info-section {
              margin-bottom: 8px;
            }
            .info-row {
              display: flex;
              margin-bottom: 4px;
            }
            .info-item {
              flex: 1;
            }
            .label {
              font-weight: bold;
              text-decoration: underline;
              font-size: 12px;
            }
            .value {
              border-bottom: 1px dotted #000;
              padding: 0 8px;
              flex-grow: 1;
              font-size: 12px;
            }
            .table-title {
              text-align: center;
              font-weight: bold;
              margin: 8px 0 4px 0;
              text-decoration: underline;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
            }
            th, td {
              border: 1px solid #000;
              padding: 3px;
              text-align: center;
              font-size: 11px;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
            }
            .footer-item {
              text-align: center;
              width: 30%;
              font-weight: bold;
              font-size: 12px;
            }
            .footnotes {
              position: absolute;
              bottom: 30px;
              left: 40px;
              right: 40px;
              font-size: 10px;
              border-top: 1px solid #ccc;
              padding-top: 5px;
              line-height: 1.5;
            }
            
            /* New Card Styles */
            .card-title-banner {
              background-color: #000;
              color: #fff;
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              padding: 10px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 20px;
            }
            .info-cell {
              border-bottom: 1px dotted #000;
              padding: 5px;
              font-size: 13px;
            }
            .section-title {
              font-weight: bold;
              font-size: 16px;
              margin: 20px 0 10px 0;
              text-decoration: underline;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .data-table th, .data-table td {
              border: 1px solid #000;
              padding: 8px;
              text-align: center;
            }
            .signature-section {
              margin-top: 50px;
              text-align: left;
              font-weight: bold;
              padding-left: 50px;
            }
            .bottom-bar {
              position: absolute;
              bottom: 20px;
              left: 20px;
              right: 20px;
              border-top: 2px solid #000;
              padding-top: 10px;
              text-align: center;
              font-size: 10px;
              font-weight: bold;
            }

            @media print {
              @page { margin: 0; }
              body { margin: 0; }
              .page-container { padding: 15px; }
            }
          </style>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </head>
        <body>${bodyContent}</body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };


  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileDown className="w-8 h-8 text-indigo-600" />
            الطلبات والمطبوعات
          </h1>
          <p className="text-gray-500 mt-1">توليد وطباعة الوثائق الإدارية والطلبات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Staff Selection */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              اختيار الموظف
            </h2>
            
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم التأجير..."
                className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredStaff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStaffId(s.id)}
                  className={`w-full text-right p-3 rounded-xl transition-all border ${
                    selectedStaffId === s.id
                      ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                      : 'bg-white border-gray-100 hover:border-indigo-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-gray-900">{s.fullName}</div>
                  <div className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span>PPR: {s.ppr}</span>
                    <span>{s.role}</span>
                  </div>
                </button>
              ))}
              {filteredStaff.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  لا يوجد موظفين يطابقون البحث
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setActiveTab('leaveRequest')}
                className={`flex-1 min-w-[120px] py-4 text-sm font-bold transition-all border-b-2 ${
                  activeTab === 'leaveRequest'
                    ? 'text-indigo-600 border-indigo-600 bg-indigo-50/30'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                طلب رخصة
              </button>
              <button
                onClick={() => setActiveTab('birthDeathCard')}
                className={`flex-1 min-w-[120px] py-4 text-sm font-bold transition-all border-b-2 ${
                  activeTab === 'birthDeathCard'
                    ? 'text-indigo-600 border-indigo-600 bg-indigo-50/30'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                بطاقة تقديم (ازدياد-وفاة)
              </button>
              <button
                onClick={() => setActiveTab('marriageDivorceDeathCard')}
                className={`flex-1 min-w-[120px] py-4 text-sm font-bold transition-all border-b-2 ${
                  activeTab === 'marriageDivorceDeathCard'
                    ? 'text-indigo-600 border-indigo-600 bg-indigo-50/30'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                بطاقة تقديم (زواج-طالق-وفاة)
              </button>
              <button
                onClick={() => setActiveTab('noDisciplinaryAction')}
                className={`flex-1 min-w-[120px] py-4 text-sm font-bold transition-all border-b-2 ${
                  activeTab === 'noDisciplinaryAction'
                    ? 'text-indigo-600 border-indigo-600 bg-indigo-50/30'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                طلب خلو الملف من العقوبة
              </button>
              <button
                onClick={() => setActiveTab('serviceStatement')}
                className={`flex-1 min-w-[120px] py-4 text-sm font-bold transition-all border-b-2 ${
                  activeTab === 'serviceStatement'
                    ? 'text-indigo-600 border-indigo-600 bg-indigo-50/30'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                بيان الخدمات
              </button>
            </div>

            <div className="p-8">
              {!selectedStaff ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-indigo-200" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">برجاء اختيار موظف</h3>
                  <p className="text-gray-500">اختر موظفاً من القائمة الجانبية لتوليد الطلب</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xl">
                        {selectedStaff.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{selectedStaff.fullName}</h3>
                        <p className="text-sm text-gray-500">{selectedStaff.ppr} • {selectedStaff.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                      <Printer className="w-5 h-5" />
                      طباعة الوثيقة
                    </button>
                  </div>

                  {activeTab === 'noDisciplinaryAction' && (
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                          <FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg mb-1">طلب خلو الملف من أي عقوبة تأديبية</h4>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            سيتم توليد طلب موجه للسيد المدير الإقليمي، يتضمن طلباً للحصول على شهادة إدارية تثبت خلو الملف من العقوبات، بالإضافة إلى تصريح بالشرف.
                            <br />
                            <strong>ملاحظة:</strong> يتم جلب كافة البيانات تلقائياً من ملف الموظف المختار.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'leaveRequest' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">رقم الإرسال</label>
                        <input
                          type="text"
                          value={sendingNumber}
                          onChange={(e) => setSendingNumber(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="مثال: 123/2024"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">تاريخ الإرسال</label>
                        <input
                          type="date"
                          value={sendingDate}
                          onChange={(e) => setSendingDate(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">نوع الرخصة</label>
                        <select
                          value={leaveType}
                          onChange={(e) => setLeaveType(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="ترخيص بالتغيب">ترخيص بالتغيب</option>
                          <option value="ولادة">ولادة</option>
                          <option value="امتحان">امتحان</option>
                          <option value="حج">حج</option>
                          <option value="رخصة استثنائية">رخصة استثنائية</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">مدة الرخصة (تلقائي)</label>
                        <input
                          type="text"
                          value={leaveDuration}
                          readOnly
                          className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-not-allowed"
                          placeholder="سيتم الحساب تلقائياً"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">من تاريخ</label>
                        <input
                          type="date"
                          value={leaveFrom}
                          onChange={(e) => setLeaveFrom(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">إلى تاريخ</label>
                        <input
                          type="date"
                          value={leaveTo}
                          onChange={(e) => setLeaveTo(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">تاريخ انتهاء العمل</label>
                        <input
                          type="date"
                          value={workResumptionDate}
                          onChange={(e) => setWorkResumptionDate(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-gray-700">رأي الرئيس المباشر</label>
                        <textarea
                          value={supervisorOpinion}
                          onChange={(e) => setSupervisorOpinion(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                          placeholder="اكتب رأي الرئيس المباشر هنا..."
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'birthDeathCard' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-600" />
                          بيانات الموظف
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">الرقم المالي (PPR)</label>
                            <input
                              type="text"
                              value={staffPpr}
                              onChange={(e) => setStaffPpr(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">الاسم الشخصي</label>
                            <input
                              type="text"
                              value={staffPersonalName}
                              onChange={(e) => setStaffPersonalName(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">الاسم العائلي</label>
                            <input
                              type="text"
                              value={staffFamilyName}
                              onChange={(e) => setStaffFamilyName(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Prénom (Fr)</label>
                            <input
                              type="text"
                              value={staffPersonalNameFr}
                              onChange={(e) => setStaffPersonalNameFr(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Nom (Fr)</label>
                            <input
                              type="text"
                              value={staffFamilyNameFr}
                              onChange={(e) => setStaffFamilyNameFr(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">رقم البطاقة الوطنية</label>
                            <input
                              type="text"
                              value={staffCin}
                              onChange={(e) => setStaffCin(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">السلم</label>
                            <input
                              type="text"
                              value={staffScale}
                              onChange={(e) => setStaffScale(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">الإطار</label>
                            <input
                              type="text"
                              value={staffCadre}
                              onChange={(e) => setStaffCadre(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">الرتبة</label>
                            <input
                              type="text"
                              value={staffGrade}
                              onChange={(e) => setStaffGrade(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">تاريخ التوظيف</label>
                            <input
                              type="text"
                              value={staffRecruitmentDate}
                              onChange={(e) => setStaffRecruitmentDate(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="YYYY-MM-DD"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">نوع البطاقة</label>
                        <select
                          value={birthDeathType}
                          onChange={(e) => setBirthDeathType(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="ازدياد">ازدياد</option>
                          <option value="وفاة">وفاة</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">الرقم الاستدلالي</label>
                        <input
                          type="text"
                          value={indexNumber}
                          onChange={(e) => setIndexNumber(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="الرقم الاستدلالي..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">ترتيب الابن(ة)</label>
                        <input
                          type="text"
                          value={childOrder}
                          onChange={(e) => setChildOrder(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="مثال: 1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">ترتيب الزوج(ة)</label>
                        <input
                          type="text"
                          value={spouseOrder}
                          onChange={(e) => setSpouseOrder(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="مثال: 1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">الاسم والنسب (الابن)</label>
                        <input
                          type="text"
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="الاسم والنسب..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">تاريخ الازدياد</label>
                        <input
                          type="date"
                          value={childBirthDate}
                          onChange={(e) => setChildBirthDate(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'marriageDivorceDeathCard' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-600" />
                          بيانات الموظف
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">الرقم المالي (PPR)</label>
                            <input
                              type="text"
                              value={staffPpr}
                              onChange={(e) => setStaffPpr(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">الاسم الشخصي</label>
                            <input
                              type="text"
                              value={staffPersonalName}
                              onChange={(e) => setStaffPersonalName(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">الاسم العائلي</label>
                            <input
                              type="text"
                              value={staffFamilyName}
                              onChange={(e) => setStaffFamilyName(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Prénom (Fr)</label>
                            <input
                              type="text"
                              value={staffPersonalNameFr}
                              onChange={(e) => setStaffPersonalNameFr(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Nom (Fr)</label>
                            <input
                              type="text"
                              value={staffFamilyNameFr}
                              onChange={(e) => setStaffFamilyNameFr(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">رقم البطاقة الوطنية</label>
                            <input
                              type="text"
                              value={staffCin}
                              onChange={(e) => setStaffCin(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">السلم</label>
                            <input
                              type="text"
                              value={staffScale}
                              onChange={(e) => setStaffScale(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">الإطار</label>
                            <input
                              type="text"
                              value={staffCadre}
                              onChange={(e) => setStaffCadre(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">الرتبة</label>
                            <input
                              type="text"
                              value={staffGrade}
                              onChange={(e) => setStaffGrade(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">تاريخ التوظيف</label>
                            <input
                              type="text"
                              value={staffRecruitmentDate}
                              onChange={(e) => setStaffRecruitmentDate(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="YYYY-MM-DD"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">نوع البطاقة</label>
                        <select
                          value={marriageDivorceDeathType}
                          onChange={(e) => setMarriageDivorceDeathType(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="زواج">زواج</option>
                          <option value="طلاق">طلاق</option>
                          <option value="وفاة">وفاة</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">الرقم الاستدلالي</label>
                        <input
                          type="text"
                          value={indexNumber}
                          onChange={(e) => setIndexNumber(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="الرقم الاستدلالي..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">تاريخ الزواج</label>
                        <input
                          type="date"
                          value={marriageDate}
                          onChange={(e) => setMarriageDate(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">تاريخ الطلاق</label>
                        <input
                          type="date"
                          value={divorceDate}
                          onChange={(e) => setDivorceDate(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">تاريخ الوفاة (الزوج)</label>
                        <input
                          type="date"
                          value={spouseDeathDate}
                          onChange={(e) => setSpouseDeathDate(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">الاسم العائلي للزوج(ة)</label>
                        <input
                          type="text"
                          value={spouseLastName}
                          onChange={(e) => setSpouseLastName(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Nom..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">الاسم الشخصي للزوج(ة)</label>
                        <input
                          type="text"
                          value={spouseFirstName}
                          onChange={(e) => setSpouseFirstName(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Prénom..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">رقم البطاقة الوطنية للزوج(ة)</label>
                        <input
                          type="text"
                          value={spouseCin}
                          onChange={(e) => setSpouseCin(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="CIN..."
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-gray-700">مهنة الزوج(ة)</label>
                        <input
                          type="text"
                          value={spouseProfession}
                          onChange={(e) => setSpouseProfession(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="المهنة..."
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'noDisciplinaryAction' && (
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          تفاصيل الطلب
                        </h4>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">الغرض من الطلب (متغير)</label>
                          <textarea
                            value={disciplinaryActionPurpose}
                            onChange={(e) => setDisciplinaryActionPurpose(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                            placeholder="مثال: اجتياز مباراة ولوج مسلك المفتشين التربويين دورة أبريل 2025"
                          />
                          <p className="text-xs text-gray-500">هذا النص سيظهر بعد عبارة "قصد الادلاء بها في ملف الترشح لـ"</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'serviceStatement' && (
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-600" />
                          المعلومات الشخصية (للطبع فقط)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">رقم التأجير</label>
                            <input
                              type="text"
                              value={staffPpr}
                              onChange={(e) => setStaffPpr(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">رقم ب.ت.و</label>
                            <input
                              type="text"
                              value={staffCin}
                              onChange={(e) => setStaffCin(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">تاريخ التوظيف</label>
                            <input
                              type="text"
                              value={staffRecruitmentDate}
                              onChange={(e) => setStaffRecruitmentDate(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="YYYY-MM-DD"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">الإطار</label>
                            <input
                              type="text"
                              value={staffCadre}
                              onChange={(e) => setStaffCadre(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          بيان الخدمات لأربع سنوات الأخيرة
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-200 text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-200 p-2">المؤسسة</th>
                                <th className="border border-gray-200 p-2">المديرية الإقليمية</th>
                                <th className="border border-gray-200 p-2">الإطار</th>
                                <th className="border border-gray-200 p-2">المهمة</th>
                                <th className="border border-gray-200 p-2">التخصص</th>
                                <th className="border border-gray-200 p-2">الموسم الدراسي</th>
                                <th className="border border-gray-200 p-2">ملاحظات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {serviceTableRows.map((row, idx) => (
                                <tr key={idx}>
                                  <td className="border border-gray-200 p-1">
                                    <input
                                      type="text"
                                      value={row.institution}
                                      onChange={(e) => {
                                        const newRows = [...serviceTableRows];
                                        newRows[idx].institution = e.target.value;
                                        setServiceTableRows(newRows);
                                      }}
                                      className="w-full px-2 py-1 outline-none focus:bg-indigo-50"
                                    />
                                  </td>
                                  <td className="border border-gray-200 p-1">
                                    <input
                                      type="text"
                                      value={row.province}
                                      onChange={(e) => {
                                        const newRows = [...serviceTableRows];
                                        newRows[idx].province = e.target.value;
                                        setServiceTableRows(newRows);
                                      }}
                                      className="w-full px-2 py-1 outline-none focus:bg-indigo-50"
                                    />
                                  </td>
                                  <td className="border border-gray-200 p-1">
                                    <input
                                      type="text"
                                      value={row.cadre}
                                      onChange={(e) => {
                                        const newRows = [...serviceTableRows];
                                        newRows[idx].cadre = e.target.value;
                                        setServiceTableRows(newRows);
                                      }}
                                      className="w-full px-2 py-1 outline-none focus:bg-indigo-50"
                                    />
                                  </td>
                                  <td className="border border-gray-200 p-1">
                                    <input
                                      type="text"
                                      value={row.role}
                                      onChange={(e) => {
                                        const newRows = [...serviceTableRows];
                                        newRows[idx].role = e.target.value;
                                        setServiceTableRows(newRows);
                                      }}
                                      className="w-full px-2 py-1 outline-none focus:bg-indigo-50"
                                    />
                                  </td>
                                  <td className="border border-gray-200 p-1">
                                    <input
                                      type="text"
                                      value={row.specialty}
                                      onChange={(e) => {
                                        const newRows = [...serviceTableRows];
                                        newRows[idx].specialty = e.target.value;
                                        setServiceTableRows(newRows);
                                      }}
                                      className="w-full px-2 py-1 outline-none focus:bg-indigo-50"
                                    />
                                  </td>
                                  <td className="border border-gray-200 p-1">
                                    <input
                                      type="text"
                                      value={row.academicYear}
                                      onChange={(e) => {
                                        const newRows = [...serviceTableRows];
                                        newRows[idx].academicYear = e.target.value;
                                        setServiceTableRows(newRows);
                                      }}
                                      className="w-full px-2 py-1 outline-none focus:bg-indigo-50"
                                    />
                                  </td>
                                  <td className="border border-gray-200 p-1">
                                    <input
                                      type="text"
                                      value={row.notes}
                                      onChange={(e) => {
                                        const newRows = [...serviceTableRows];
                                        newRows[idx].notes = e.target.value;
                                        setServiceTableRows(newRows);
                                      }}
                                      className="w-full px-2 py-1 outline-none focus:bg-indigo-50"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'leaveRequest' && (
                    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                      <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        الرخص السابقة (السنة الحالية)
                      </h4>
                      {staffLeaves.length > 0 ? (
                        <div className="space-y-3">
                          {staffLeaves.map((l) => (
                            <div key={l.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                              <div>
                                <div className="font-bold text-gray-900">{l.reason}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {l.startDate} {l.endDate ? `إلى ${l.endDate}` : ''}
                                </div>
                              </div>
                              <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                {l.totalDays || '-'} يوم
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-indigo-300 text-sm">
                          لا توجد رخص مسجلة لهذا الموظف في السنة الحالية
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
