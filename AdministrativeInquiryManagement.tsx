import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Printer, Trash2, Edit2, AlertCircle, 
  History, User, Calendar, FileText, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { StaffMember, SchoolData, AdministrativeInquiry } from '../types';
import { KINGDOM_LOGO_URL, toTifinagh } from '../constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdministrativeInquiryManagementProps {
  inquiries: AdministrativeInquiry[];
  onUpdate: (inquiries: AdministrativeInquiry[]) => void;
  staff: StaffMember[];
  schoolData: SchoolData;
}

export const AdministrativeInquiryManagement: React.FC<AdministrativeInquiryManagementProps> = ({
  inquiries,
  onUpdate,
  staff,
  schoolData
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingInquiryId, setEditingInquiryId] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [currentPrintInquiry, setCurrentPrintInquiry] = useState<AdministrativeInquiry | null>(null);

  const [formData, setFormData] = useState<Partial<AdministrativeInquiry>>({
    staffId: '',
    staffName: '',
    reference: 'المرسوم رقم 2.99.1216 الصادر في 6 صفر 1421 (10/05/2000).',
    city: schoolData.municipality || schoolData.city || '',
    date: new Date().toISOString().split('T')[0],
    intro: 'وبعد، فقد لوحظ أنك (م) قمت بسلوك يتنافى والقوانين الجاري بها العمل والمتمثل في :',
    outro: 'لذا أطلب منك (م) موافاتي بالبيانات المفصلة في الموضوع مصحوبة بالوثائق المبررة وذلك في أجل لا يتعدى 03 أيام ابتداء من تاريخ توصلك (م) بهذا الكتاب .',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inquiry => 
      inquiry.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.intro.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [inquiries, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffId || !formData.intro) {
      alert('يرجى ملء جميع الحقول الأساسية');
      return;
    }

    const selectedStaff = staff.find(s => s.id === formData.staffId);
    const newInquiry: AdministrativeInquiry = {
      id: editingInquiryId || Date.now().toString(),
      staffId: formData.staffId!,
      staffName: selectedStaff?.fullName || '',
      reference: formData.reference || '',
      city: formData.city || '',
      date: formData.date || new Date().toISOString().split('T')[0],
      intro: formData.intro!,
      outro: formData.outro || '',
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate || new Date().toISOString().split('T')[0],
      createdAt: editingInquiryId ? (inquiries.find(i => i.id === editingInquiryId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    if (editingInquiryId) {
      onUpdate(inquiries.map(i => i.id === editingInquiryId ? newInquiry : i));
    } else {
      onUpdate([...inquiries, newInquiry]);
    }

    setEditingInquiryId(null);
    setFormData({
      staffId: '',
      staffName: '',
      reference: 'المرسوم رقم 2.99.1216 الصادر في 6 صفر 1421 (10/05/2000).',
      city: schoolData.municipality || schoolData.city || '',
      date: new Date().toISOString().split('T')[0],
      intro: 'وبعد، فقد لوحظ أنك (م) قمت بسلوك يتنافى والقوانين الجاري بها العمل والمتمثل في :',
      outro: 'لذا أطلب منك (م) موافاتي بالبيانات المفصلة في الموضوع مصحوبة بالوثائق المبررة وذلك في أجل لا يتعدى 03 أيام ابتداء من تاريخ توصلك (م) بهذا الكتاب .',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });
    setActiveTab('list');
  };

  const handleEdit = (inquiry: AdministrativeInquiry) => {
    setFormData(inquiry);
    setEditingInquiryId(inquiry.id);
    setActiveTab('form');
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الاستفسار؟')) {
      onUpdate(inquiries.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className={cn(showPrintModal && "print:hidden")}>
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">استفسارات السلوك الإداري</h2>
            <p className="text-gray-500 text-sm font-medium">تدبير وتوليد استفسارات عن السلوكات الإدارية للموظفين</p>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm print:hidden">
            <button
              onClick={() => {
                setActiveTab('list');
                setEditingInquiryId(null);
              }}
              className={cn(
                "px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2",
                activeTab === 'list' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <History className="w-4 h-4" />
              <span>سجل الاستفسارات</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('form');
                setEditingInquiryId(null);
                setFormData({
                  staffId: '',
                  staffName: '',
                  reference: 'المرسوم رقم 2.99.1216 الصادر في 6 صفر 1421 (10/05/2000).',
                  city: schoolData.municipality || schoolData.city || '',
                  date: new Date().toISOString().split('T')[0],
                  intro: 'وبعد، فقد لوحظ أنك (م) قمت بسلوك يتنافى والقوانين الجاري بها العمل والمتمثل في :',
                  outro: 'لذا أطلب منك (م) موافاتي بالبيانات المفصلة في الموضوع مصحوبة بالوثائق المبررة وذلك في أجل لا يتعدى 03 أيام ابتداء من تاريخ توصلك (م) بهذا الكتاب .',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                });
              }}
              className={cn(
                "px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2",
                activeTab === 'form' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <Plus className="w-4 h-4" />
              <span>استفسار جديد</span>
            </button>
          </div>
        </div>

        {activeTab === 'list' ? (
          <div className="space-y-4">
            <div className="relative max-w-md print:hidden">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن موظف أو نص استفسار..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold"
              />
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">الموظف</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">التاريخ</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">الموضوع (مختصر)</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInquiries.map((inquiry) => (
                      <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">
                              {inquiry.staffName.charAt(0)}
                            </div>
                            <div className="text-sm font-black text-gray-900">{inquiry.staffName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-gray-600">
                            {inquiry.date.split('-').reverse().join('/')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-500 font-medium truncate max-w-xs">
                            {inquiry.intro}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(inquiry)}
                              className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="تعديل"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setCurrentPrintInquiry(inquiry);
                                setShowPrintModal(true);
                              }}
                              className="p-2 text-amber-500 hover:text-amber-600 transition-colors"
                              title="طباعة الاستفسار"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(inquiry.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredInquiries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <History className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                          <p className="text-sm text-gray-400 font-bold">لا توجد استفسارات مسجلة</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    الموظف المعني
                  </label>
                  <select
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold"
                  >
                    <option value="">اختر الموظف...</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      من تاريخ
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      إلى تاريخ
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    المراجع (كل مرجع في سطر)
                  </label>
                  <textarea
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold h-24"
                    placeholder="أدخل المراجع هنا، كل مرجع في سطر مستقل..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    المدينة
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700">نص الاستهلال (وصف السلوك)</label>
                  <textarea
                    value={formData.intro}
                    onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold h-32"
                    placeholder="اكتب وصف السلوك الإداري هنا..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700">نص الخاتمة</label>
                  <textarea
                    value={formData.outro}
                    onChange={(e) => setFormData({ ...formData, outro: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold h-32"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  {editingInquiryId ? 'تحديث الاستفسار' : 'حفظ وتوليد الاستفسار'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>

      {/* Print Modal */}
      <AnimatePresence>
        {showPrintModal && currentPrintInquiry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:static print:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none print:max-h-none print:max-w-none print:h-auto print:w-full print:m-0 print:overflow-visible print:static print:block print:transform-none print:opacity-100"
            >
              <div className="p-8 print:p-0 print:overflow-visible">
                <div className="flex justify-between items-center mb-8 print:hidden">
                  <h3 className="text-xl font-black text-gray-900">معاينة الاستفسار الإداري</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة</span>
                    </button>
                    <button
                      onClick={() => setShowPrintModal(false)}
                      className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>

                {/* Print Content */}
                <div className="print-content w-full text-right dir-rtl p-4 print:p-0">
                  <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                      @page {
                        size: A4 portrait;
                        margin: 0;
                      }
                      body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                      }
                      .print-content {
                        width: 100% !important;
                        display: block !important;
                        padding: 0 10mm 10mm 10mm !important;
                        box-sizing: border-box !important;
                      }
                      header, footer, .no-print { display: none !important; }
                    }
                  `}} />
                  
                  <div className="mb-8 w-full">
                    <table className="w-full border-collapse" style={{ border: '1px solid #000' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '35%', textAlign: 'center', verticalAlign: 'middle', fontSize: '10px', lineHeight: '1.6', fontFamily: "'Noto Sans Tifinagh', sans-serif", border: '1px solid #000', padding: '5px' }}>
                            ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ<br/>
                            ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ<br/>
                            ⵜⴰⵙⵏⵓⵔⴰⵢⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ {toTifinagh(schoolData.region)}<br/>
                            ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ ⵏ {toTifinagh(schoolData.city)}
                          </td>
                          <td style={{ width: '30%', textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '5px' }}>
                            <img 
                              src={KINGDOM_LOGO_URL}
                              alt="شعار المملكة" 
                              style={{ width: '25mm', height: '25mm', margin: '0 auto', objectFit: 'contain' }}
                              referrerPolicy="no-referrer"
                            />
                          </td>
                          <td style={{ width: '35%', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px', lineHeight: '1.6', fontWeight: 'bold', border: '1px solid #000', padding: '5px' }}>
                            المملكة المغربية<br/>
                            وزارة التربية الوطنية والتعليم الأولي والرياضة<br/>
                            الأكاديمية الجهوية للتربية والتكوين لجهة {schoolData.region}<br/>
                            المديرية الإقليمية لـ {schoolData.city}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px', marginTop: '10px' }}>
                      المؤسسة: {schoolData.name}
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginTop: '5px', fontFamily: "'Noto Sans Tifinagh', sans-serif" }}>
                      ⵜⴰⵙⵏⵓⵔⵜ: {toTifinagh(schoolData.name)}
                    </div>
                  </div>

                  <div className="flex flex-col items-center mb-6 space-y-3">
                    <div className="text-center">
                      <p className="text-sm font-black">من مدير(ة): {schoolData.name}</p>
                    </div>
                    <div className="text-center space-y-1 text-sm font-bold">
                      <p>إلى السيد (ة) : <span className="font-black">{currentPrintInquiry.staffName}</span></p>
                      <p>رقم التأجير : <span className="font-black">{staff.find(s => s.id === currentPrintInquiry.staffId)?.ppr || '---'}</span></p>
                      <p>الإطار : <span className="font-black">{staff.find(s => s.id === currentPrintInquiry.staffId)?.cadre || '---'}</span></p>
                    </div>
                  </div>

                  <div className="space-y-4 print:space-y-2">
                    <div className="flex items-baseline gap-4">
                      <span className="font-black text-lg underline">الموضوع :</span>
                      <span className="text-xl font-black">استفسار</span>
                    </div>

                    <div className="text-sm font-bold leading-tight">
                      <p className="underline mb-1">المرجع :</p>
                      <p className="pr-4 whitespace-pre-wrap">{currentPrintInquiry.reference}</p>
                    </div>

                    <div className="text-center py-1">
                      <p className="font-bold">سلام تام بوجود مولانا الإمام المؤيد بالله</p>
                    </div>

                    <div className="text-base leading-normal space-y-3 print:space-y-1.5">
                      <p className="whitespace-pre-wrap">{currentPrintInquiry.intro}</p>
                      
                      <div className="border-2 border-gray-900 p-2 font-black text-center">
                        {currentPrintInquiry.startDate === currentPrintInquiry.endDate ? (
                          <div>بتاريخ : {currentPrintInquiry.startDate.split('-').reverse().join('/')}</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-8">
                            <div>من : {currentPrintInquiry.startDate.split('-').reverse().join('/')}</div>
                            <div>إلى : {currentPrintInquiry.endDate.split('-').reverse().join('/')}</div>
                          </div>
                        )}
                      </div>

                      <p className="text-justify whitespace-pre-wrap">{currentPrintInquiry.outro}</p>
                    </div>

                    <div className="flex justify-between items-start pt-4">
                      <div className="text-center space-y-1">
                        <p className="font-black">والسلام</p>
                      </div>
                      <div className="text-center space-y-2 print:space-y-1">
                        <p className="font-black">حرر بـ : {currentPrintInquiry.city}</p>
                        <p className="font-black">بتاريخ : {currentPrintInquiry.date.split('-').reverse().join('/')}</p>
                        <div className="pt-1">
                          <p className="font-black">توقيع وطابع السيد مدير المؤسسة :</p>
                          <div className="h-12"></div>
                        </div>
                      </div>
                    </div>

                    {/* Response Area */}
                    <div className="border-t-2 border-dashed border-gray-400 pt-2 mt-2 space-y-2 print:space-y-1">
                      <p className="font-black text-lg underline">جواب المعني بالأمر :</p>
                      <div className="space-y-2 print:space-y-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="border-b border-dotted border-gray-400 h-5 w-full"></div>
                        ))}
                      </div>
                      <div className="flex justify-end pt-1">
                        <div className="text-center w-64 space-y-2 print:space-y-1">
                          <p className="font-black underline">توقيع المعني بالأمر :</p>
                          <div className="h-8"></div>
                        </div>
                      </div>
                    </div>

                    {/* Receipt Acknowledgement */}
                    <div className="border-2 border-gray-900 p-2 mt-0 space-y-2 text-xs">
                      <div className="text-center font-black underline mb-1">اشعار باستلام استفسار</div>
                      <div className="grid grid-cols-2 gap-2">
                        <p>يشهد السيد (ة) : <span className="font-black">{currentPrintInquiry.staffName}</span></p>
                        <p>رقم التأجير : <span className="font-black">{staff.find(s => s.id === currentPrintInquiry.staffId)?.ppr || '---'}</span></p>
                      </div>
                      <p>أنه توصل (ت) باستفسار عن سلوك إداري 
                        {currentPrintInquiry.startDate === currentPrintInquiry.endDate ? (
                          <span> بتاريخ: <span className="font-black">{currentPrintInquiry.startDate.split('-').reverse().join('/')}</span></span>
                        ) : (
                          <span> خلال الفترة الممتدة من: <span className="font-black">{currentPrintInquiry.startDate.split('-').reverse().join('/')}</span> إلى <span className="font-black">{currentPrintInquiry.endDate.split('-').reverse().join('/')}</span></span>
                        )}
                      </p>
                      <div className="flex justify-between pt-2">
                        <p>بتاريخ : {currentPrintInquiry.date.split('-').reverse().join('/')}</p>
                        <p>توقيع المعني بالأمر : ................................</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
