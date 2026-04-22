
import React, { useState, useMemo, useEffect } from 'react';
import { InternalMemo, SchoolStructure, SchoolData } from '../types';
import { KINGDOM_LOGO_URL } from '../constants';
import { 
  Plus, 
  Trash2, 
  Search, 
  FileText, 
  Printer, 
  ClipboardList,
  Calendar as CalendarIcon,
  UserCircle,
  Hash,
  BookOpen,
  ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InternalMemosManagementProps {
  memos: InternalMemo[];
  onUpdate: (memos: InternalMemo[]) => void;
  structures: SchoolStructure[];
  schoolData: SchoolData;
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
    'درعة تافيلالت': 'ⴷⵔⴰ ⵜⴰⴼⵉⵍⴰⵍⵜ',
    'سوس ماسة': 'ⵙⵓⵙ ⵎⴰⵙⵙⴰ',
    'جهة سوس ماسة': 'ⵙⵓⵙ ⵎⴰⵙⵙⴰ',
    'كلميم واد نون': 'ⴳⵍⵎⵉⵎ ⵡⴰⴷ ⵏⵓⵏ',
    'العيون الساقية الحمراء': 'ⵍⵄⵢⵓⵏ ⵜⴰⵔⴳⴰ ⵜⴰⵣⴳⴳⵯⴰⵖⵜ',
    'الداخلة وادي الذهب': 'ⴷⴷⴰⵅⵍⴰ ⵡⴰⴷ ⴷⴷⴰⵀⴰⴱ'
  };
  let cleanText = text.trim();
  if (cleanText.startsWith('جهة ')) cleanText = cleanText.substring(4);
  if (cleanText.startsWith('المديرية الإقليمية لـ ')) cleanText = cleanText.substring(22);
  if (cleanText.startsWith('المديرية الإقليمية ل ')) cleanText = cleanText.substring(21);
  
  return dictionary[cleanText] || dictionary[text.trim()] || cleanText;
};

export const InternalMemosManagement: React.FC<InternalMemosManagementProps> = ({
  memos,
  onUpdate,
  structures,
  schoolData
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recipientStructureId, setRecipientStructureId] = useState('');
  const [reference, setReference] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [agenda, setAgenda] = useState('');
  const [meetingNumber, setMeetingNumber] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingReferences, setMeetingReferences] = useState('');
  const [showAgendaInPrint, setShowAgendaInPrint] = useState(true);

  useEffect(() => {
    if (!showAddModal && !editingMemoId) {
      resetForm();
    }
  }, [showAddModal, editingMemoId]);

  const handleAgendaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;

      const beforeCursor = value.substring(0, selectionStart);
      const afterCursor = value.substring(selectionEnd);
      const linesBefore = beforeCursor.split('\n');
      const currentLine = linesBefore[linesBefore.length - 1];

      // Find the last number used in previous lines
      let nextNumber = 1;
      for (let i = linesBefore.length - 1; i >= 0; i--) {
        const match = linesBefore[i].match(/^(\d+)\./);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
          break;
        }
      }

      // If current line is empty or just whitespace, insert number here
      // If current line has text, insert newline + number
      const prefix = currentLine.trim() === '' ? `${nextNumber}. ` : `\n${nextNumber}. `;
      const newValue = beforeCursor + prefix + afterCursor;
      setAgenda(newValue);

      // Set cursor position after the inserted text
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + prefix.length;
      }, 0);
    }
  };

  const filteredMemos = useMemo(() => {
    return memos.filter(m => 
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.number.includes(searchQuery) ||
      m.reference.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [memos, searchQuery]);

  const getNextMemoNumber = (selectedDate: string) => {
    const dateObj = new Date(selectedDate);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // 1-12

    // Determine the start of the current "numbering period"
    // If month is >= 9 (Sept), period starts Sept 1st of current year
    // If month is < 9, period starts Sept 1st of previous year
    let periodStart: Date;
    if (month >= 9) {
      periodStart = new Date(year, 8, 1); // Sept is index 8
    } else {
      periodStart = new Date(year - 1, 8, 1);
    }

    // Filter memos in the same period
    const periodMemos = memos.filter(m => {
      const mDate = new Date(m.date);
      return mDate >= periodStart && mDate < new Date(periodStart.getFullYear() + 1, 8, 1);
    });

    const nextNum = periodMemos.length + 1;
    return `${nextNum}/${year}`;
  };

  const handleAddMemo = () => {
    if (!recipientStructureId || !subject) return;

    if (editingMemoId) {
      const updatedMemos = memos.map(m => 
        m.id === editingMemoId 
          ? { 
              ...m, 
              date, 
              recipientStructureId, 
              reference, 
              subject, 
              bodyText, 
              agenda, 
              meetingNumber,
              meetingDate,
              meetingTime,
              meetingReferences,
              showAgendaInPrint 
            }
          : m
      );
      onUpdate(updatedMemos);
    } else {
      const newMemo: InternalMemo = {
        id: crypto.randomUUID(),
        number: getNextMemoNumber(date),
        date,
        recipientStructureId,
        reference,
        subject,
        bodyText,
        agenda,
        meetingNumber,
        meetingDate,
        meetingTime,
        meetingReferences,
        showAgendaInPrint,
        createdAt: new Date().toISOString()
      };
      onUpdate([...memos, newMemo]);
    }

    resetForm();
  };

  const handleEditMemo = (memo: InternalMemo) => {
    setEditingMemoId(memo.id);
    setDate(memo.date);
    setRecipientStructureId(memo.recipientStructureId);
    setReference(memo.reference);
    setSubject(memo.subject);
    setBodyText(memo.bodyText || '');
    setAgenda(memo.agenda);
    setMeetingNumber(memo.meetingNumber || '');
    setMeetingDate(memo.meetingDate || '');
    setMeetingTime(memo.meetingTime || '');
    setMeetingReferences(memo.meetingReferences || '');
    setShowAgendaInPrint(memo.showAgendaInPrint ?? true);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setShowAddModal(false);
    setEditingMemoId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setRecipientStructureId('');
    setReference('');
    setSubject('');
    setBodyText('');
    setAgenda('');
    setMeetingNumber('');
    setMeetingDate('');
    setMeetingTime('');
    setMeetingReferences('');
    setShowAgendaInPrint(true);
  };

  const handleDeleteMemo = (id: string) => {
    onUpdate(memos.filter(m => m.id !== id));
  };

  const handlePrintMemo = (memo: InternalMemo) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const structure = structures.find(s => s.id === memo.recipientStructureId);
    const recipientName = structure?.name || memo.recipientStructureId;
    const members = structure?.members || [];

    // Split agenda into numbered lines, stripping existing numbers to avoid duplicates
    const agendaLines = memo.agenda
      .split('\n')
      .map(line => line.replace(/^\d+[\.\-\s]*/, '').trim())
      .filter(line => line !== '');
    
    const numberedAgenda = agendaLines.map((line, i) => `${i + 1}. ${line}`).join('\n');

    // Split members into two groups for side-by-side tables
    const midPoint = Math.ceil(members.length / 2);
    const firstHalf = members.slice(0, midPoint);
    const secondHalf = members.slice(midPoint);

    const renderSignatureTable = (memberList: any[], startIndex: number) => `
      <table style="width: 49%; float: right; margin-left: 1%;">
        <thead>
          <tr>
            <th style="width: 30px; font-size: 10px; padding: 2px;">ر.ت</th>
            <th style="font-size: 10px; padding: 2px;">الاسم الكامل</th>
            <th style="font-size: 10px; padding: 2px;">الصفة</th>
            <th style="width: 80px; font-size: 10px; padding: 2px;">التوقيع</th>
          </tr>
        </thead>
        <tbody>
          ${memberList.map((m, i) => `
            <tr>
              <td style="font-size: 10px; padding: 1px; height: 18px;">${startIndex + i + 1}</td>
              <td style="font-size: 10px; padding: 1px; height: 18px;">${m.fullName}</td>
              <td style="font-size: 10px; padding: 1px; height: 18px;">${m.roleInStructure}</td>
              <td style="height: 18px; padding: 1px;"></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const html = `
      <html dir="rtl">
        <head>
          <title>مذكرة داخلية رقم ${memo.number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
            @media print {
              @page { size: portrait; margin: 0; }
              body { -webkit-print-color-adjust: exact; padding: 1cm 1.5cm; }
              .page-break { page-break-before: always; }
            }
            body { 
              font-family: 'Amiri', serif; 
              padding: 10px;
              color: black;
              line-height: 1.4;
              font-size: 16px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
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
            .logo {
              width: 25mm;
              height: 25mm;
              object-fit: contain;
            }
            .tifinagh {
              font-family: 'Noto Sans Tifinagh', sans-serif;
            }
            
            .memo-header-line {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              font-size: 17px;
              margin-bottom: 30px; /* Increased space after date line */
            }
            
            .sender-recipient {
              margin-bottom: 30px; /* Increased space after sender/recipient */
              font-size: 18px;
              text-align: center;
            }
            .sender { font-weight: bold; margin-bottom: 2px; }
            .recipient { font-weight: bold; }
            
            .subject-ref {
              margin-bottom: 30px; /* Increased space after subject/reference */
            }
            .subject { font-weight: bold; font-size: 17px; }
            .reference { font-size: 11px; color: #333; }
            
            .greeting {
              text-align: center;
              font-weight: bold;
              font-size: 17px;
              margin: 15px 0;
            }
            
            .body-text {
              margin-bottom: 15px;
              white-space: pre-wrap;
              text-align: justify;
            }
            
            .agenda-section {
              border: 1px solid #000;
              padding: 10px;
              margin-top: 10px;
              margin-bottom: 15px;
            }
            .agenda-title {
              font-weight: bold;
              text-decoration: underline;
              margin-bottom: 5px;
              display: block;
            }

            .closing-greeting {
              text-align: center;
              font-weight: bold;
              font-size: 17px;
              margin: 20px 0;
            }
            
            .footer {
              margin-top: 30px;
              display: flex;
              justify-content: flex-end;
            }
            .signature {
              text-align: center;
              font-weight: bold;
              width: 250px;
            }

            /* Second Page Styles */
            .ack-title {
              text-align: center;
              font-weight: bold;
              font-size: 18px;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #000;
              padding: 2px 4px; /* Significantly reduced padding */
              text-align: center;
              font-size: 12px; /* Smaller font size */
              height: 20px; /* Fixed small height */
            }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <!-- Page 1: The Memo -->
          <div class="header">
            <div class="header-right tifinagh">
              <strong>ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ</strong><br/>
              ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ<br/>
              ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ ${toTifinagh(schoolData.region)}<br/>
              ⵜⴰⵎⵀⵍⴰ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ${toTifinagh(schoolData.city)}
            </div>
            <div class="header-center">
              <img src="${KINGDOM_LOGO_URL}" class="logo" referrerpolicy="no-referrer" />
            </div>
            <div class="header-left">
              <strong>المملكة المغربية</strong><br/>
              وزارة التربية الوطنية والتعليم الأولي والرياضة<br/>
              الأكاديمية الجهوية: ${schoolData.region}<br/>
              مديرية: ${schoolData.city}
            </div>
          </div>

          <div class="memo-header-line">
            <span>مذكرة داخلية رقم: ${memo.number}</span>
            <span>التاريخ: ${new Date(memo.date).toLocaleDateString('ar-MA')}</span>
          </div>

          <div class="sender-recipient">
            <div class="sender">من مدير ${schoolData.name}</div>
            <div class="recipient">إلى السادة أعضاء ${recipientName}</div>
          </div>

          <div class="subject-ref">
            <div class="subject">الموضوع: ${memo.subject}</div>
            <div class="reference">المرجع: ${memo.reference || '---'}</div>
          </div>

          <div class="greeting">"سلام تام بوجود مولانا الامام أيده الله بنصره"</div>

          <div class="body-text">${memo.bodyText || ''}</div>

          ${memo.showAgendaInPrint ? `
          <div class="agenda-section">
            <span class="agenda-title">جدول الأعمال:</span>
            <div style="white-space: pre-wrap;">${numberedAgenda}</div>
          </div>
          ` : ''}

          <div class="closing-greeting">"وتقبلوا أزكى التحيات والسلام"</div>

          <div class="footer">
            <div class="signature">
              توقيع مدير المؤسسة:<br/>
              <div style="margin-top: 30px;">${schoolData.director}</div>
            </div>
          </div>

          <!-- Page 2: Acknowledgment List -->
          <div class="page-break"></div>
          <div class="ack-title">
            محضر الاطلاع على المذكرة رقم ${memo.number} بتاريخ ${new Date(memo.date).toLocaleDateString('ar-MA')} بشأن ${memo.subject}
          </div>

          <div style="overflow: hidden;">
            ${renderSignatureTable(firstHalf, 0)}
            ${renderSignatureTable(secondHalf, midPoint)}
          </div>
          <div style="clear: both;"></div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handlePrintMeetingMinutes = (memo: InternalMemo) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const structure = structures.find(s => s.id === memo.recipientStructureId);
    const recipientName = structure?.name || memo.recipientStructureId;
    const members = structure?.members || [];
    
    // Split agenda into lines, stripping existing numbers
    const agendaLines = memo.agenda
      .split('\n')
      .map(line => line.replace(/^\d+[\.\-\s]*/, '').trim())
      .filter(line => line !== '');
    
    // Create rows for each agenda item with 10 lines of space (approx 200px)
    const agendaRows = agendaLines.map((line, index) => `
      <tr>
        <td style="text-align: right; vertical-align: top; padding: 10px; font-weight: bold; border-bottom: 1px solid #000; width: 15%; font-size: 11px;">${index + 1}. ${line}</td>
        <td style="height: 200px; border-bottom: 1px solid #000; width: 42.5%; padding: 0; vertical-align: top;">
          <div style="height: 100%; display: flex; flex-direction: column;">
            ${Array(10).fill('<div style="flex: 1; border-bottom: 1px dotted #ccc;"></div>').join('')}
          </div>
        </td>
        <td style="height: 200px; border-bottom: 1px solid #000; width: 42.5%; padding: 0; vertical-align: top;">
          <div style="height: 100%; display: flex; flex-direction: column;">
            ${Array(10).fill('<div style="flex: 1; border-bottom: 1px dotted #ccc;"></div>').join('')}
          </div>
        </td>
      </tr>
    `).join('');

    // Split members into two groups for the side-by-side signature tables
    const midPoint = Math.ceil(members.length / 2);
    const firstHalf = members.slice(0, midPoint);
    const secondHalf = members.slice(midPoint);

    const renderSignatureTable = (memberList: any[], startIndex: number) => `
      <table style="width: 49%; float: right; margin-left: 1%;">
        <thead>
          <tr>
            <th style="width: 30px; font-size: 10px; padding: 2px;">ر.ت</th>
            <th style="font-size: 10px; padding: 2px;">الاسم الكامل</th>
            <th style="font-size: 10px; padding: 2px;">الصفة</th>
            <th style="width: 80px; font-size: 10px; padding: 2px;">التوقيع</th>
          </tr>
        </thead>
        <tbody>
          ${memberList.map((m, i) => `
            <tr>
              <td style="font-size: 10px; padding: 1px; height: 15px;">${startIndex + i + 1}</td>
              <td style="font-size: 10px; padding: 1px; height: 15px;">${m.fullName}</td>
              <td style="font-size: 10px; padding: 1px; height: 15px;">${m.roleInStructure}</td>
              <td style="height: 15px; padding: 1px;"></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Helper to extract date and time from text
    const extractDate = (text: string) => {
      const dateRegex = /(\d{4}[-/]\d{1,2}[-/]\d{1,2})|(\d{1,2}[-/]\d{1,2}[-/]\d{4})/;
      const match = text.match(dateRegex);
      return match ? match[0] : '...........';
    };

    const extractTime = (text: string) => {
      const timeRegex = /(\d{1,2}[:h]\d{2})/;
      const match = text.match(timeRegex);
      return match ? match[0] : '...........';
    };

    const meetingDateText = extractDate(memo.bodyText || '');
    const meetingTimeText = extractTime(memo.bodyText || '');

    // Helper to add 1 hour to time
    const addOneHour = (timeStr: string) => {
      if (!timeStr || timeStr === '...........') return '...........';
      const match = timeStr.match(/(\d{1,2})[:h](\d{2})/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2];
        hours = (hours + 1) % 24;
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
      }
      return '...........';
    };

    const closingTime = addOneHour(meetingTimeText);

    // Format references
    const mainRefs = (memo.meetingReferences || memo.reference || '---')
      .split('\n')
      .filter(r => r.trim())
      .map(ref => `<div>${ref}</div>`)
      .join('');
    
    const memoRef = `<div>المذكرة الداخلية رقم ${memo.number} بتاريخ ${new Date(memo.date).toLocaleDateString('ar-MA')} في شأن ${memo.subject}</div>`;

    const html = `
      <html dir="rtl">
        <head>
          <title>محضر اجتماع ${memo.subject}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
            @media print {
              @page { size: portrait; margin: 0.5cm; }
              body { -webkit-print-color-adjust: exact; padding: 0.5cm; }
              .no-print { display: none; }
              .page-break { page-break-before: always; }
            }
            body { 
              font-family: 'Amiri', serif; 
              color: black;
              line-height: 1.4;
              font-size: 14px;
              margin: 0;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              border-bottom: 1px solid #000;
              padding-bottom: 5px;
            }
            .header-right { text-align: center; font-size: 12px; }
            .logo { max-height: 50px; object-fit: contain; }
            .header-left { text-align: left; font-size: 12px; }
            
            .top-info {
              text-align: left;
              margin-bottom: 10px;
              font-weight: bold;
            }
            .title-centered {
              text-align: center;
              font-weight: bold;
              font-size: 18px;
              margin: 10px 0;
              text-decoration: underline;
            }
            .ref-right {
              text-align: right;
              font-size: 10px;
              margin-bottom: 10px;
            }
            .intro-text {
              text-align: justify;
              margin-bottom: 10px;
            }
            .intermediate-text {
              font-weight: bold;
              margin-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            th, td {
              border: 1px solid #000;
              padding: 4px;
              text-align: center;
            }
            th { background-color: #f2f2f2; font-size: 12px; }
            .closing-text {
              margin-bottom: 10px;
            }
            .sig-section {
              margin-top: 10px;
              overflow: hidden;
            }
            .sig-title {
              font-weight: bold;
              text-decoration: underline;
              margin-bottom: 5px;
              font-size: 14px;
            }
            .clear { clear: both; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-right tifinagh">
              <strong>ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ</strong><br/>
              ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ<br/>
              ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ ${toTifinagh(schoolData.region)}<br/>
              ⵜⴰⵎⵀⵍⴰ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ${toTifinagh(schoolData.city)}
            </div>
            <div class="header-center">
              <img src="${KINGDOM_LOGO_URL}" class="logo" referrerpolicy="no-referrer" />
            </div>
            <div class="header-left">
              <strong>المملكة المغربية</strong><br/>
              وزارة التربية الوطنية والتعليم الأولي والرياضة<br/>
              الأكاديمية الجهوية: ${schoolData.region}<br/>
              مديرية: ${schoolData.city}
            </div>
          </div>

          <div class="top-info">
            ${schoolData.municipality || schoolData.city} في: ${meetingDateText}
          </div>

          <div class="title-centered">
            محضر اجتماع ${memo.subject}
          </div>

          <div class="ref-right">
            <div style="font-weight: bold; margin-bottom: 2px;">المراجع:</div>
            ${mainRefs}
            ${memoRef}
          </div>

          <div class="intro-text">
            تطبيقا للمقتضيات الواردة في المراجع أعلاه، انعقد بقاعة الاجتماعات بـ ${schoolData.name} اجتماع ${recipientName} يوم ${meetingDateText} على الساعة ${meetingTimeText} وذلك لتدارس النقاط المدرجة في جدول الأعمال التالي:
            <div style="margin-top: 5px; padding-right: 20px;">
              ${agendaLines.map((line, i) => `${i + 1}. ${line}`).join('<br/>')}
            </div>
          </div>

          <div class="intermediate-text">
            وبعد عرض مضامين مختلف نقط جدول الأعمال وتناولها بنقاش مستفيض من طرف الحاضرين تمت المصادقة على المخرجات التالية:
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">النقاط المتداول فيها</th>
                <th style="width: 42.5%;">ملاحظات الاكراهات والمعيقات</th>
                <th style="width: 42.5%;">مخرجات مقترحات الحلول المتوافق حولها</th>
              </tr>
            </thead>
            <tbody>
              ${agendaRows}
            </tbody>
          </table>

          <div class="closing-text">
            اختتم الاجتماع بالمصادقة بالإجماع على المخرجات أعلاه ورفعت الجلسة على الساعة ${closingTime}
          </div>

          <div class="sig-section">
            <div class="sig-title">
              توقيعات أعضاء ${recipientName} بتاريخ ${meetingDateText}
            </div>
            ${renderSignatureTable(firstHalf, 0)}
            ${renderSignatureTable(secondHalf, midPoint)}
            <div class="clear"></div>
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

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-2xl">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">نظام المذكرات الداخلية</h2>
            <p className="text-xs text-gray-500 font-bold">تحرير وتدبير المذكرات الموجهة لهياكل المؤسسة</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في المذكرات..."
              className="pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>تحرير مذكرة جديدة</span>
          </button>
        </div>
      </div>

      {/* Memos List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredMemos.map((memo) => (
            <motion.div
              key={memo.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 rounded-xl">
                    <Hash className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-indigo-600">مذكرة رقم: {memo.number}</span>
                    <p className="text-[10px] text-gray-400 font-bold">{new Date(memo.date).toLocaleDateString('ar-MA')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditMemo(memo)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="تعديل"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePrintMeetingMinutes(memo)}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    title="طبع محضر الاجتماع"
                  >
                    <ClipboardList className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePrintMemo(memo)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="طبع"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMemo(memo.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-black text-gray-700">المعني:</span>
                  <span className="text-xs font-bold text-gray-600">
                    {structures.find(s => s.id === memo.recipientStructureId)?.name || memo.recipientStructureId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-black text-gray-700">الموضوع:</span>
                  <span className="text-xs font-bold text-gray-900 truncate flex-1">{memo.subject}</span>
                </div>
                {memo.reference && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-black text-gray-700">المرجع:</span>
                    <span className="text-xs font-bold text-gray-500 truncate flex-1">{memo.reference}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">جدول الأعمال</span>
                </div>
                <p className="text-[11px] text-gray-600 font-medium line-clamp-2 leading-relaxed">
                  {memo.agenda || 'لا يوجد جدول أعمال محدد'}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredMemos.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-lg font-black text-gray-400">لا توجد مذكرات حالياً</h3>
            <p className="text-xs text-gray-400 font-bold mt-1">ابدأ بتحرير أول مذكرة داخلية للمؤسسة</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm">
            <motion.div
              key={editingMemoId || 'new-memo-modal'}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-2xl">
                    <Plus className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">
                      {editingMemoId ? 'تعديل المذكرة الداخلية' : 'تحرير مذكرة داخلية جديدة'}
                    </h3>
                    <p className="text-xs text-gray-500 font-bold">
                      {editingMemoId ? 'قم بتعديل تفاصيل المذكرة' : 'أدخل تفاصيل المذكرة ليتم ترقيمها آلياً'}
                    </p>
                  </div>
                </div>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <Plus className="w-6 h-6 text-gray-400 rotate-45" />
                </button>
              </div>

              <div className="p-8 space-y-6 text-right" dir="rtl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-indigo-500" />
                      التاريخ
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-indigo-500" />
                      المعني بالمذكرة (هياكل المؤسسة)
                    </label>
                    <select
                      value={recipientStructureId}
                      onChange={(e) => setRecipientStructureId(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                    >
                      <option value="">اختر الهيكل المعني...</option>
                      {structures.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                      <option value="جميع العاملين بالمؤسسة">جميع العاملين بالمؤسسة</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      المرجع
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="مثال: المقرر الوزاري رقم..."
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      الموضوع
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="أدخل موضوع المذكرة..."
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    نص المذكرة
                  </label>
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="اكتب نص المذكرة هنا..."
                    rows={4}
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-indigo-500" />
                    جدول الأعمال
                  </label>
                  <textarea
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    onKeyDown={handleAgendaKeyDown}
                    placeholder="اكتب نقاط جدول الأعمال هنا (اضغط TAB للترقيم التلقائي)..."
                    rows={6}
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold bg-gray-50 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <input
                    type="checkbox"
                    id="showAgenda"
                    checked={showAgendaInPrint}
                    onChange={(e) => setShowAgendaInPrint(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="showAgenda" className="text-sm font-bold text-gray-700 cursor-pointer">
                    إظهار جدول الأعمال في المذكرة عند الطبع
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleAddMemo}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                  >
                    {editingMemoId ? 'حفظ التعديلات' : 'حفظ وتحرير المذكرة'}
                  </button>
                  <button
                    onClick={resetForm}
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
