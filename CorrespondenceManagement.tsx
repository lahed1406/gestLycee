
import React, { useState, useEffect } from 'react';
import { Correspondence, SchoolData, CorrespondenceItem } from '../types';
import { 
  Mail, 
  Send, 
  Inbox, 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  Edit3, 
  Printer, 
  Save,
  ArrowRightLeft,
  Filter,
  CheckSquare,
  Square,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CorrespondenceManagementProps {
  correspondence: Correspondence[];
  onUpdate: (data: Correspondence[]) => void;
  schoolData: SchoolData;
  onUpdateSchoolData: (data: SchoolData) => void;
}

export const CorrespondenceManagement: React.FC<CorrespondenceManagementProps> = ({ 
  correspondence, 
  onUpdate, 
  schoolData,
  onUpdateSchoolData
}) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showStartNumberSettings, setShowStartNumberSettings] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [filterDates, setFilterDates] = useState({
    start: '',
    end: ''
  });
  const [printDates, setPrintDates] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const getNextNumber = (type: 'incoming' | 'outgoing', dateString?: string) => {
    const date = dateString ? new Date(dateString) : new Date();
    const year = date.getFullYear();
    const yearPrefix = `${year}/`;
    
    const yearItems = correspondence.filter(item => 
      item.type === type && item.number.startsWith(yearPrefix)
    );
    
    const startNum = type === 'incoming' 
      ? (schoolData.incomingStartNumber || 1) 
      : (schoolData.outgoingStartNumber || 1);

    if (yearItems.length === 0) {
      return `${yearPrefix}${startNum.toString().padStart(3, '0')}`;
    }
    
    const numbers = yearItems.map(item => {
      const parts = item.number.split('/');
      return parts.length > 1 ? parseInt(parts[1]) : 0;
    }).filter(n => !isNaN(n));
    
    const maxNum = Math.max(startNum - 1, ...numbers);
    return `${yearPrefix}${(maxNum + 1).toString().padStart(3, '0')}`;
  };

  const [formData, setFormData] = useState<Partial<Correspondence>>({
    type: activeTab,
    number: getNextNumber('incoming'),
    date: new Date().toISOString().split('T')[0],
    attachmentsCount: 0,
    notes: '',
    office: '',
    items: [{ subject: '', attachmentsCount: 0, notes: '' }]
  });

  const handleTabChange = (tab: 'incoming' | 'outgoing') => {
    setActiveTab(tab);
    setIsAdding(false);
    setSelectedIds(new Set());
    setFormData({
      type: tab,
      number: getNextNumber(tab),
      date: new Date().toISOString().split('T')[0],
      attachmentsCount: 0,
      notes: '',
      office: '',
      items: [{ subject: '', attachmentsCount: 0, notes: '' }]
    });
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

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(item => item.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const idsToRemove = Array.from(selectedIds);
    if (confirm(`هل أنت متأكد من حذف ${selectedIds.size} مراسلة؟`)) {
      onUpdate(correspondence.filter(c => !idsToRemove.includes(c.id)));
      setSelectedIds(new Set());
    }
  };

  const filteredData = correspondence.filter(item => 
    item.type === activeTab && 
    (item.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.sourceOrDestination.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!filterDates.start || item.date >= filterDates.start) &&
    (!filterDates.end || item.date <= filterDates.end)
  );

  const handleSave = () => {
    const items = formData.items || [];
    const hasValidItem = items.some(item => item.subject.trim() !== '');
    
    if (!formData.sourceOrDestination || !hasValidItem) {
      alert('المرجو ملء جميع الحقول الأساسية (الجهة وموضوع واحد على الأقل)');
      return;
    }

    // Filter out empty subjects
    const validItems = items.filter(item => item.subject.trim() !== '');

    // Generate the number at the moment of saving for new entries
    const finalNumber = formData.id ? (formData.number || '') : getNextNumber(activeTab, formData.date);

    const newEntry: Correspondence = {
      id: formData.id || Math.random().toString(36).substr(2, 9),
      type: activeTab,
      number: finalNumber,
      date: formData.date || '',
      subject: validItems.map(i => i.subject).join(' | '),
      sourceOrDestination: formData.sourceOrDestination || '',
      department: formData.department || '',
      service: formData.service || '',
      office: formData.office || '',
      attachmentsCount: validItems.reduce((sum, i) => sum + (i.attachmentsCount || 0), 0),
      notes: validItems.map(i => i.notes).filter(n => n).join(' | '),
      items: validItems,
      hierarchyType: activeTab === 'outgoing' ? (formData.hierarchyType || 'regional') : undefined
    };

    if (formData.id) {
      onUpdate(correspondence.map(c => c.id === formData.id ? newEntry : c));
    } else {
      onUpdate([newEntry, ...correspondence]);
    }

    setIsAdding(false);
    const nextType = activeTab;
    setFormData({
      type: nextType,
      number: getNextNumber(nextType),
      date: new Date().toISOString().split('T')[0],
      attachmentsCount: 0,
      notes: '',
      department: '',
      service: '',
      office: '',
      items: [{ subject: '', attachmentsCount: 0, notes: '' }],
      hierarchyType: 'regional'
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المراسلة؟')) {
      onUpdate(correspondence.filter(c => c.id !== id));
    }
  };

  const handleEdit = (item: Correspondence) => {
    setFormData({
      ...item,
      items: item.items && item.items.length > 0 ? item.items : [{ subject: item.subject, attachmentsCount: item.attachmentsCount, notes: item.notes }]
    });
    setIsAdding(true);
  };

  const handlePrint = () => {
    const dataToPrint = correspondence.filter(item => 
      item.type === activeTab && 
      item.date >= printDates.start && 
      item.date <= printDates.end
    ).sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number));

    if (dataToPrint.length === 0) {
      alert('لا توجد بيانات في هذه الفترة الزمنية');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = activeTab === 'incoming' ? 'سجل الواردات' : 'سجل الصادرات';
    
    let isGray = true;
    let lastDate = '';
    const tableRows = dataToPrint.flatMap((item, index) => {
      if (index === 0) {
        lastDate = item.date;
      } else if (item.date !== lastDate) {
        isGray = !isGray;
        lastDate = item.date;
      }
      const bgColor = isGray ? '#f2f2f2' : '#ffffff';
      
      const items = item.items && item.items.length > 0 
        ? item.items 
        : [{ subject: item.subject, attachmentsCount: item.attachmentsCount, notes: item.notes }];

      return items.map((subItem, subIndex) => `
        <tr style="background-color: ${bgColor}; color: #000;">
          ${subIndex === 0 ? `<td rowspan="${items.length}" style="color: #000; vertical-align: middle; text-align: center; font-weight: bold;">${item.number}</td>` : ''}
          ${subIndex === 0 ? `<td rowspan="${items.length}" style="color: #000; vertical-align: middle; text-align: center;">${item.date}</td>` : ''}
          <td style="color: #000;">${subItem.subject}</td>
          ${subIndex === 0 ? `<td rowspan="${items.length}" style="color: #000; vertical-align: middle;">${item.sourceOrDestination}</td>` : ''}
          <td style="text-align: center; color: #000;">${subItem.attachmentsCount}</td>
          <td style="color: #000;">${subItem.notes || ''}</td>
        </tr>
      `);
    }).join('');

    const html = `
      <html dir="rtl" lang="ar">
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 20px; color: #000; line-height: 1.4; }
            .report-title { text-align: center; margin: 20px 0; }
            .report-title h1 { margin: 0; font-size: 24px; text-decoration: underline; }
            .report-title p { margin: 5px 0; font-size: 14px; color: #444; }
            table { width: 100%; border-collapse: collapse; color: #000; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 10px 8px; text-align: right; font-size: 12px; color: #000; }
            th { background-color: #f0f0f0; font-weight: bold; }
            @media print {
              @page { size: A4 landscape; margin: 0; }
              body { padding: 1.5cm; }
              thead { display: table-header-group; }
              tr { page-break-inside: avoid; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="report-title">
            <h1>${title}</h1>
            <p>الفترة من: ${printDates.start} إلى: ${printDates.end}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 10%">الرقم</th>
                <th style="width: 12%">التاريخ</th>
                <th style="width: 35%">الموضوع</th>
                <th style="width: 20%">${activeTab === 'incoming' ? 'المصدر' : 'الوجهة'}</th>
                <th style="width: 8%">المرفقات</th>
                <th style="width: 15%">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setShowPrintModal(false);
  };

  const handlePrintTransmissionSheet = (item: Correspondence) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const items = item.items && item.items.length > 0 
      ? item.items 
      : [{ subject: item.subject, attachmentsCount: item.attachmentsCount, notes: item.notes }];

    const tableRows = items.map((row, index) => `
      <tr style="height: 60px; vertical-align: top;">
        <td class="subject-cell">${row.subject}</td>
        <td>${row.attachmentsCount}</td>
        <td>${row.notes || ''}</td>
      </tr>
    `).join('');

    // Add empty rows if needed to fill space (at least 3 rows total)
    const emptyRowsCount = Math.max(0, 3 - items.length);
    const emptyRows = Array(emptyRowsCount).fill(0).map(() => `
      <tr style="height: 60px;"><td></td><td></td><td></td></tr>
    `).join('');

    const generateSheetHtml = () => {
      const isAcademy = item.hierarchyType === 'academy';
      return `
        <div class="page-break">
          <div class="logo-container">
            ${schoolData.logo ? `<img src="${schoolData.logo}" class="school-logo" alt="Logo" />` : ''}
          </div>

          <div class="header-info">
            <div class="number-box">
              <div class="number-label">رقم الإرسال :</div>
              <div class="number-value">${item.number}</div>
            </div>
            <div class="location-date">
              ${schoolData.municipality} في : ${item.date}
            </div>
          </div>

          <div class="destination-box">
            <div class="destination-line">
              <div class="line-label">من مدير :</div>
              <div class="line-content">${schoolData.name}</div>
            </div>
            <div class="destination-line" style="margin: 10px 0;">
              <div style="font-weight: bold; font-size: 15px;">إلى السيد(ة) :</div>
            </div>
            ${isAcademy ? `
              <div class="destination-line">
                <div class="line-label">مدير(ة) الأكاديمية الجهوية للتربية والتكوين :</div>
                <div class="line-content">${schoolData.region}</div>
              </div>
              <div class="destination-line">
                <div class="line-label">قسم :</div>
                <div class="line-content">${item.department || '..................................................................'}</div>
              </div>
              <div class="destination-line">
                <div class="line-label">مصلحة :</div>
                <div class="line-content">${item.service || '..................................................................'}</div>
              </div>
              <div class="destination-line">
                <div class="line-label">مكتب :</div>
                <div class="line-content">${item.office || '..................................................................'}</div>
              </div>
              <div class="destination-line" style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px;">
                <div class="line-label">تحت إشراف السيد(ة) المدير(ة) الإقليمي لوزارة التربية الوطنية والتعليم الأولي :</div>
                <div class="line-content">${schoolData.city}</div>
              </div>
            ` : `
              <div class="destination-line">
                <div class="line-label">المدير(ة) الإقليمي لوزارة التربية الوطنية والتعليم الأولي :</div>
                <div class="line-content">${schoolData.city}</div>
              </div>
              <div class="destination-line">
                <div class="line-label">مصلحة :</div>
                <div class="line-content">${item.sourceOrDestination}</div>
              </div>
              <div class="destination-line">
                <div class="line-label">مكتب :</div>
                <div class="line-content">${item.office || '..................................................................'}</div>
              </div>
            `}
          </div>

          <div class="sheet-title">
            <span>ورقة الإرسال</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 60%">الموضوع</th>
                <th style="width: 15%">عدد المرفقات</th>
                <th style="width: 25%">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              ${emptyRows}
            </tbody>
          </table>

          <div style="margin-top: 40px; text-align: left; padding-left: 50px;">
            <p style="font-weight: bold; text-decoration: underline;">توقيع المدير(ة)</p>
          </div>
        </div>
      `;
    };

    const html = `
      <html dir="rtl" lang="ar">
        <head>
          <title>ورقة الإرسال - ${item.number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 0; color: #000; line-height: 1.4; }
            .page-break { page-break-after: always; padding: 0 40px 40px 40px; display: flex; flex-direction: column; }
            .page-break:last-child { page-break-after: auto; }
            .logo-container { text-align: center; margin-bottom: 10px; margin-top: 0; }
            .school-logo { width: 250px; height: auto; max-height: 120px; object-fit: contain; }
            
            .header-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .number-box { display: flex; align-items: center; gap: 5px; }
            .number-label { border: 1px solid #000; padding: 5px 10px; font-weight: bold; font-size: 14px; }
            .number-value { border: 1px solid #000; padding: 5px 20px; font-weight: bold; min-width: 80px; text-align: center; font-size: 14px; }
            .location-date { font-weight: bold; font-size: 14px; }
            
            .destination-box { border: 1px solid #000; padding: 15px; margin-bottom: 25px; }
            .destination-line { margin-bottom: 8px; display: flex; align-items: center; gap: 8px; justify-content: center; }
            .line-label { font-weight: bold; font-size: 15px; }
            .line-content { font-weight: bold; font-size: 15px; }
            
            .sheet-title { text-align: center; margin: 20px 0; }
            .sheet-title span { border: 1px solid #000; padding: 5px 40px; font-weight: bold; font-size: 18px; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #000; padding: 12px 8px; text-align: center; font-size: 13px; }
            th { font-weight: bold; background-color: #f9f9f9; }
            .subject-cell { text-align: right; }
            
            @media print {
              @page { size: A4; margin: 0; }
              body { padding: 0; }
              .page-break { padding: 0 1.5cm 1.5cm 1.5cm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${generateSheetHtml()}
          ${generateSheetHtml()}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintAllTransmissionSheetsForDate = () => {
    const dateToPrint = filterDates.start || new Date().toISOString().split('T')[0];
    const itemsToPrint = correspondence.filter(item => 
      item.type === 'outgoing' && 
      item.date === dateToPrint
    ).sort((a, b) => a.number.localeCompare(b.number));

    if (itemsToPrint.length === 0) {
      alert('لا توجد صادرات في هذا التاريخ');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const generateSheetHtml = (item: Correspondence) => {
      const items = item.items && item.items.length > 0 
        ? item.items 
        : [{ subject: item.subject, attachmentsCount: item.attachmentsCount, notes: item.notes }];

      const tableRows = items.map((row) => `
        <tr style="height: 60px; vertical-align: top;">
          <td class="subject-cell">${row.subject}</td>
          <td>${row.attachmentsCount}</td>
          <td>${row.notes || ''}</td>
        </tr>
      `).join('');

      const emptyRowsCount = Math.max(0, 3 - items.length);
      const emptyRows = Array(emptyRowsCount).fill(0).map(() => `
        <tr style="height: 60px;"><td></td><td></td><td></td></tr>
      `).join('');

      const isAcademy = item.hierarchyType === 'academy';

      return `
        <div class="page-break">
          <div class="logo-container">
            ${schoolData.logo ? `<img src="${schoolData.logo}" class="school-logo" alt="Logo" />` : ''}
          </div>

          <div class="header-info">
            <div class="number-box">
              <div class="number-label">رقم الإرسال :</div>
              <div class="number-value">${item.number}</div>
            </div>
            <div class="location-date">
              ${schoolData.municipality} في : ${item.date}
            </div>
          </div>

          <div class="destination-box">
            <div class="destination-line">
              <div class="line-label">من مدير :</div>
              <div class="line-content">${schoolData.name}</div>
            </div>
            <div class="destination-line" style="margin: 10px 0;">
              <div style="font-weight: bold; font-size: 15px;">إلى السيد(ة) :</div>
            </div>
            ${isAcademy ? `
              <div class="destination-line">
                <div class="line-label">مدير(ة) الأكاديمية الجهوية للتربية والتكوين :</div>
                <div class="line-content">${schoolData.region}</div>
              </div>
              <div class="destination-line">
                <div class="line-label">قسم :</div>
                <div class="line-content">${item.department || '..................................................................'}</div>
              </div>
              <div class="destination-line">
                <div class="line-label">مصلحة :</div>
                <div class="line-content">${item.service || '..................................................................'}</div>
              </div>
              <div class="destination-line">
                <div class="line-label">مكتب :</div>
                <div class="line-content">${item.office || '..................................................................'}</div>
              </div>
              <div class="destination-line" style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px;">
                <div class="line-label">تحت إشراف السيد(ة) المدير(ة) الإقليمي لوزارة التربية الوطنية والتعليم الأولي :</div>
                <div class="line-content">${schoolData.city}</div>
              </div>
            ` : `
              <div class="destination-line">
                <div class="line-label">المدير(ة) الإقليمي لوزارة التربية الوطنية والتعليم الأولي :</div>
                <div class="line-content">${schoolData.city}</div>
              </div>
              <div class="destination-line">
                <div class="line-label">مصلحة :</div>
                <div class="line-content">${item.sourceOrDestination}</div>
              </div>
              <div class="destination-line">
                <div class="line-label">مكتب :</div>
                <div class="line-content">${item.office || '..................................................................'}</div>
              </div>
            `}
          </div>

          <div class="sheet-title">
            <span>ورقة الإرسال</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 60%">الموضوع</th>
                <th style="width: 15%">عدد المرفقات</th>
                <th style="width: 25%">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              ${emptyRows}
            </tbody>
          </table>

          <div style="margin-top: 40px; text-align: left; padding-left: 50px;">
            <p style="font-weight: bold; text-decoration: underline;">توقيع المدير(ة)</p>
          </div>
        </div>
      `;
    };

    const allSheetsHtml = itemsToPrint.flatMap(item => [generateSheetHtml(item), generateSheetHtml(item)]).join('');

    const html = `
      <html dir="rtl" lang="ar">
        <head>
          <title>أوراق الإرسال الجماعية - ${dateToPrint}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 0; color: #000; line-height: 1.4; }
            .page-break { page-break-after: always; padding: 0 40px 40px 40px; display: flex; flex-direction: column; }
            .page-break:last-child { page-break-after: auto; }
            .logo-container { text-align: center; margin-bottom: 10px; margin-top: 0; }
            .school-logo { width: 250px; height: auto; max-height: 120px; object-fit: contain; }
            
            .header-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .number-box { display: flex; align-items: center; gap: 5px; }
            .number-label { border: 1px solid #000; padding: 5px 10px; font-weight: bold; font-size: 14px; }
            .number-value { border: 1px solid #000; padding: 5px 20px; font-weight: bold; min-width: 80px; text-align: center; font-size: 14px; }
            .location-date { font-weight: bold; font-size: 14px; }
            
            .destination-box { border: 1px solid #000; padding: 15px; margin-bottom: 25px; }
            .destination-line { margin-bottom: 8px; display: flex; align-items: center; gap: 8px; justify-content: center; }
            .line-label { font-weight: bold; font-size: 15px; }
            .line-content { font-weight: bold; font-size: 15px; }
            
            .sheet-title { text-align: center; margin: 20px 0; }
            .sheet-title span { border: 1px solid #000; padding: 5px 40px; font-weight: bold; font-size: 18px; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #000; padding: 12px 8px; text-align: center; font-size: 13px; }
            th { font-weight: bold; background-color: #f9f9f9; }
            .subject-cell { text-align: right; }
            
            @media print {
              @page { size: A4; margin: 0; }
              body { padding: 0; }
              .page-break { padding: 0 1.5cm 1.5cm 1.5cm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${allSheetsHtml}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
            <Mail className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">تدبير المراسلات</h2>
            <p className="text-sm text-gray-500 font-medium">سجل الواردات والصادرات للمؤسسة</p>
          </div>
        </div>

        <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => handleTabChange('incoming')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all",
              activeTab === 'incoming' 
              ? "bg-white text-indigo-600 shadow-sm" 
              : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Inbox className="w-4 h-4" />
            سجل الواردات
          </button>
          <button
            onClick={() => handleTabChange('outgoing')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all",
              activeTab === 'outgoing' 
              ? "bg-white text-indigo-600 shadow-sm" 
              : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Send className="w-4 h-4" />
            سجل الصادرات
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Section */}
        <div className={cn(
          "lg:col-span-4 space-y-6 transition-all duration-500",
          isAdding ? "opacity-100 translate-x-0" : "opacity-100"
        )}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {formData.id ? <Edit3 className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                {formData.id ? 'تعديل مراسلة' : `إضافة ${activeTab === 'incoming' ? 'وارد' : 'صادر'} جديد`}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowStartNumberSettings(!showStartNumberSettings)}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    showStartNumberSettings ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                  )}
                  title="إعدادات ترقيم البداية"
                >
                  <Settings className="w-4 h-4" />
                </button>
                {formData.id && (
                  <button 
                    onClick={() => {
                      setIsAdding(false);
                      setFormData({ 
                        type: activeTab, 
                        number: getNextNumber(activeTab),
                        date: new Date().toISOString().split('T')[0], 
                        attachmentsCount: 0, 
                        notes: '' 
                      });
                    }}
                    className="text-xs text-gray-400 hover:text-red-500 font-bold"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {showStartNumberSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3 overflow-hidden"
                >
                  <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">إعدادات ترقيم البداية</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-indigo-700 mb-1">بداية رقم الورود</label>
                      <input 
                        type="number"
                        min="1"
                        value={schoolData.incomingStartNumber || 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          onUpdateSchoolData({ ...schoolData, incomingStartNumber: val });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-indigo-700 mb-1">بداية رقم الإرسال</label>
                      <input 
                        type="number"
                        min="1"
                        value={schoolData.outgoingStartNumber || 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          onUpdateSchoolData({ ...schoolData, outgoingStartNumber: val });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-indigo-500 font-medium leading-relaxed">
                    * سيتم استخدام هذا الرقم كبداية للترقيم في حالة عدم وجود مراسلات سابقة لهذا الموسم، أو إذا كان أكبر من آخر رقم مسجل.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider flex justify-between">
                  <span>رقم {activeTab === 'incoming' ? 'الورود' : 'الإرسال'}</span>
                  {!formData.id && <span className="text-indigo-500 text-[10px]">توليد تلقائي</span>}
                </label>
                <input
                  type="text"
                  value={formData.number || ''}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm bg-white"
                  placeholder="رقم المراسلة..."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider">التاريخ</label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider">
                  {activeTab === 'incoming' ? 'مصدر المراسلة' : 'الجهة المرسل إليها'}
                </label>
                <input
                  type="text"
                  value={formData.sourceOrDestination || ''}
                  onChange={(e) => setFormData({ ...formData, sourceOrDestination: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                  placeholder={activeTab === 'incoming' ? "المديرية الإقليمية، الأكاديمية..." : "المديرية الإقليمية، أستاذ..."}
                />
              </div>

              {activeTab === 'outgoing' && formData.hierarchyType === 'academy' && (
                <>
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider">القسم</label>
                    <input
                      type="text"
                      value={formData.department || ''}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                      placeholder="اسم القسم..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider">المصلحة</label>
                    <input
                      type="text"
                      value={formData.service || ''}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                      placeholder="اسم المصلحة..."
                    />
                  </div>
                </>
              )}

              {activeTab === 'outgoing' && (
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider">السلم الإداري</label>
                  <select
                    value={formData.hierarchyType || 'regional'}
                    onChange={(e) => setFormData({ ...formData, hierarchyType: e.target.value as 'regional' | 'academy' })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm bg-white"
                  >
                    <option value="regional">إلى المديرية الإقليمية</option>
                    <option value="academy">إلى الأكاديمية الجهوية (عبر السلم الإداري)</option>
                  </select>
                </div>
              )}

              {activeTab === 'outgoing' && (
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider">المكتب</label>
                  <input
                    type="text"
                    value={formData.office || ''}
                    onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                    placeholder="مكتب الضبط، مصلحة الموارد البشرية..."
                  />
                </div>
              )}

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">مواضيع المراسلة</label>
                  <button 
                    onClick={() => setFormData({ 
                      ...formData, 
                      items: [...(formData.items || []), { subject: '', attachmentsCount: 0, notes: '' }] 
                    })}
                    className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-black hover:bg-indigo-100 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    إضافة موضوع
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {(formData.items || []).map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3 relative group/item">
                      {index > 0 && (
                        <button 
                          onClick={() => {
                            const newItems = [...(formData.items || [])];
                            newItems.splice(index, 1);
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="absolute left-2 top-2 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover/item:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <div>
                        <input
                          type="text"
                          value={item.subject}
                          onChange={(e) => {
                            const newItems = [...(formData.items || [])];
                            newItems[index].subject = e.target.value;
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-xs"
                          placeholder="الموضوع..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="0"
                          value={item.attachmentsCount}
                          onChange={(e) => {
                            const newItems = [...(formData.items || [])];
                            newItems[index].attachmentsCount = parseInt(e.target.value) || 0;
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-xs"
                          placeholder="المرفقات"
                        />
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => {
                            const newItems = [...(formData.items || [])];
                            newItems[index].notes = e.target.value;
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-xs"
                          placeholder="ملاحظات"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSave}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  حفظ المراسلة
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="بحث في السجل..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-11 pl-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف المختار ({selectedIds.size})
                      </button>
                      {selectedIds.size === 1 && (
                        <button 
                          onClick={() => {
                            const id = Array.from(selectedIds)[0];
                            const item = correspondence.find(c => c.id === id);
                            if (item) handleEdit(item);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                          تعديل المختار
                        </button>
                      )}
                    </div>
                  )}
                  <button 
                    onClick={() => setShowPrintModal(true)}
                    className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="طباعة السجل"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setFilterDates({ start: '', end: '' })}
                    className={cn(
                      "p-2.5 rounded-xl transition-all",
                      filterDates.start || filterDates.end ? "text-indigo-600 bg-indigo-50" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                    )}
                    title="إعادة ضبط الفلترة"
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Date Filter Bar */}
              <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-xs font-black text-gray-400 uppercase tracking-wider">فلترة بالتاريخ:</span>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-gray-500">من:</label>
                  <input 
                    type="date" 
                    value={filterDates.start}
                    onChange={(e) => setFilterDates(prev => ({ ...prev, start: e.target.value }))}
                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-gray-500">إلى:</label>
                  <input 
                    type="date" 
                    value={filterDates.end}
                    onChange={(e) => setFilterDates(prev => ({ ...prev, end: e.target.value }))}
                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                {activeTab === 'outgoing' && (
                  <button 
                    onClick={handlePrintAllTransmissionSheetsForDate}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-[10px] hover:bg-indigo-700 transition-all shadow-sm"
                  >
                    <Printer className="w-3 h-3" />
                    طباعة أوراق الإرسال (نسختين لكل مراسلة)
                  </button>
                )}
                {(filterDates.start || filterDates.end) && (
                  <button 
                    onClick={() => setFilterDates({ start: '', end: '' })}
                    className="text-[10px] font-bold text-red-500 hover:underline"
                  >
                    إلغاء الفلترة
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-center">
                      <button 
                        onClick={toggleSelectAll}
                        className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        {selectedIds.size === filteredData.length && filteredData.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">الرقم</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">التاريخ</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">الموضوع</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">
                      {activeTab === 'incoming' ? 'المصدر' : 'الوجهة'}
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">المرفقات</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence mode="popLayout">
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <motion.tr
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={item.id}
                          className="hover:bg-gray-50/80 transition-colors group"
                        >
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => toggleSelect(item.id)}
                              className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                            >
                              {selectedIds.has(item.id) ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-300" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-gray-900 text-sm">{item.number}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-gray-500 text-xs font-medium">{item.date}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs space-y-1">
                              {item.items && item.items.length > 1 ? (
                                <ul className="list-disc list-inside space-y-1">
                                  {item.items.map((sub, i) => (
                                    <li key={i} className="text-xs font-bold text-gray-800">{sub.subject}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm font-bold text-gray-800 line-clamp-2">{item.subject}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black w-fit">
                                {item.sourceOrDestination}
                              </span>
                              {item.office && (
                                <span className="text-[9px] text-gray-400 font-bold mr-2">
                                  {item.office}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-xs font-bold text-gray-600">{item.attachmentsCount}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2 transition-opacity">
                              <button 
                                onClick={() => handleEdit(item)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                title="تعديل"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {item.type === 'outgoing' && (
                                <button 
                                  onClick={() => handlePrintTransmissionSheet(item)}
                                  className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                                  title="طبع ورقة الإرسال"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-20">
                            <FileText className="w-16 h-16" />
                            <p className="text-xl font-black">لا توجد مراسلات مسجلة</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            
            {filteredData.length > 0 && (
              <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400">
                  إجمالي السجلات: <span className="text-indigo-600">{filteredData.length}</span>
                </p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">السابق</button>
                  <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">التالي</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Modal */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Printer className="w-5 h-5" />
                  طباعة {activeTab === 'incoming' ? 'سجل الواردات' : 'سجل الصادرات'}
                </h3>
                <button 
                  onClick={() => setShowPrintModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500 font-medium mb-4">
                  حدد الفترة الزمنية التي تريد استخراج السجل الخاص بها:
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider">من تاريخ</label>
                    <input
                      type="date"
                      value={printDates.start}
                      onChange={(e) => setPrintDates({ ...printDates, start: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider">إلى تاريخ</label>
                    <input
                      type="date"
                      value={printDates.end}
                      onChange={(e) => setPrintDates({ ...printDates, end: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={handlePrint}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    تأكيد الطباعة
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl transition-all"
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
