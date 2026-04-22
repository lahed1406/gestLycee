
import React, { useState, useMemo } from 'react';
import { StaffMember, SchoolData } from '../types';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Search, 
  CheckCircle2, 
  Circle,
  MessageCircle,
  Clock,
  AlertCircle,
  Info,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WhatsAppMessagingProps {
  staff: StaffMember[];
  schoolData: SchoolData;
}

export default function WhatsAppMessaging({ staff, schoolData }: WhatsAppMessagingProps) {
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('الكل');

  const roles = ['الكل', ...Array.from(new Set(staff.map(s => s.role)))];

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (s.phoneNumber || '').includes(searchQuery);
      const matchesRole = filterRole === 'الكل' || s.role === filterRole;
      return matchesSearch && matchesRole && s.phoneNumber;
    });
  }, [staff, searchQuery, filterRole]);

  const toggleStaffSelection = (id: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const allIds = filteredStaff.map(s => s.id);
    setSelectedStaffIds(allIds);
  };

  const deselectAll = () => {
    setSelectedStaffIds([]);
  };

  const templates = [
    {
      title: 'تذكير باجتماع',
      icon: Clock,
      text: `تحية طيبة،\nنذكركم بموعد الاجتماع المقرر يوم [التاريخ] على الساعة [الساعة] بمقر المؤسسة.\nالحضور ضروري.\nإدارة ${schoolData.name}`
    },
    {
      title: 'استفسار إداري',
      icon: AlertCircle,
      text: `تحية طيبة،\nيرجى التوجه إلى الإدارة بخصوص [الموضوع] في أقرب وقت ممكن.\nإدارة ${schoolData.name}`
    },
    {
      title: 'إخبار عام',
      icon: Info,
      text: `إخبار لجميع الأطر:\n[نص الخبر]\nمع تحيات إدارة ${schoolData.name}`
    }
  ];

  const applyTemplate = (templateText: string) => {
    setMessage(templateText);
  };

  const formatPhoneNumber = (phone: string) => {
    // Basic cleanup: remove spaces, dashes, etc.
    let cleaned = phone.replace(/\D/g, '');
    // If it starts with 0 and is 10 digits (Moroccan format), replace 0 with 212
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '212' + cleaned.substring(1);
    }
    // If it doesn't have a country code, assume 212
    if (cleaned.length === 9) {
      cleaned = '212' + cleaned;
    }
    return cleaned;
  };

  const sendToWhatsApp = (staffMember: StaffMember) => {
    if (!staffMember.phoneNumber) return;
    const phone = formatPhoneNumber(staffMember.phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  const sendBulk = () => {
    if (selectedStaffIds.length === 0) {
      alert('يرجى اختيار موظف واحد على الأقل');
      return;
    }
    if (!message.trim()) {
      alert('يرجى كتابة نص الرسالة');
      return;
    }

    // Since we can't send to multiple people at once with wa.me API easily without a business API,
    // we will open them one by one or provide a list. 
    // Opening many tabs at once might be blocked by browser.
    // We'll open the first one and suggest the user to continue.
    
    const selectedStaff = staff.filter(s => selectedStaffIds.includes(s.id));
    
    if (selectedStaff.length === 1) {
      sendToWhatsApp(selectedStaff[0]);
    } else {
      // For bulk, we'll open them sequentially with a small delay or just tell the user
      // browser might block multiple popups.
      alert(`سيتم فتح ${selectedStaff.length} نافذة واتساب. يرجى السماح بالنوافذ المنبثقة (Popups) في متصفحك.`);
      
      selectedStaff.forEach((s, index) => {
        setTimeout(() => {
          sendToWhatsApp(s);
        }, index * 1000); // 1 second delay between each to avoid browser blocking
      });
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">نظام مراسلة الواتساب</h1>
            <p className="text-gray-500 text-sm font-medium">التواصل السريع والفعال مع الأطر التربوية والإدارية</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Selection List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col h-[600px]">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-black text-gray-900">اختيار الموظفين</h2>
            </div>

            <div className="space-y-3 mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث..."
                  className="w-full pr-10 pl-3 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-between gap-2 mb-4">
              <button 
                onClick={selectAll}
                className="flex-1 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition-all"
              >
                اختيار الكل
              </button>
              <button 
                onClick={deselectAll}
                className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black hover:bg-gray-100 transition-all"
              >
                إلغاء الكل
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {filteredStaff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleStaffSelection(s.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${
                    selectedStaffIds.includes(s.id)
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                    : 'bg-white border-gray-50 hover:border-indigo-100'
                  }`}
                >
                  {selectedStaffIds.includes(s.id) ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-200 shrink-0" />
                  )}
                  <div className="text-right flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-900 truncate">{s.fullName}</p>
                    <p className="text-[10px] text-gray-400 font-bold truncate">{s.role}</p>
                  </div>
                </button>
              ))}
              {filteredStaff.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-xs text-gray-400 font-bold">لا يوجد موظفون بهذا البحث</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-[10px] font-black text-indigo-600">
                تم اختيار: {selectedStaffIds.length} موظف
              </p>
            </div>
          </div>
        </div>

        {/* Message Composition */}
        <div className="lg:col-span-2 space-y-6">
          {/* Templates */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-black text-gray-900">نماذج جاهزة</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((t, i) => (
                <button
                  key={i}
                  onClick={() => applyTemplate(t.text)}
                  className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-indigo-600 transition-all">
                    <t.icon className="w-5 h-5 text-indigo-600 group-hover:text-white transition-all" />
                  </div>
                  <span className="text-xs font-black text-gray-700">{t.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-black text-gray-900">نص الرسالة</h2>
              </div>
              <span className="text-[10px] font-bold text-gray-400">
                عدد الحروف: {message.length}
              </span>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              rows={10}
              className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all resize-none leading-relaxed"
            />

            <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                ملاحظة: عند الإرسال لمجموعة، سيقوم النظام بفتح نافذة واتساب لكل موظف على حدة. يرجى التأكد من تفعيل النوافذ المنبثقة (Popups) في متصفحك.
              </p>
            </div>

            <button
              onClick={sendBulk}
              className="w-full py-5 bg-green-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-3 group"
            >
              <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
              <span>إرسال عبر واتساب</span>
              <ExternalLink className="w-4 h-4 opacity-50" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
