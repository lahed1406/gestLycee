
import React, { useState } from 'react';
import { DataArchive, SchoolData } from '../types';
import { motion } from 'motion/react';
import { 
  Archive, 
  Download, 
  History, 
  PlusCircle, 
  Trash2, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Users,
  GraduationCap,
  Settings,
  Mail,
  Calendar,
  Clock,
  AlertCircle,
  School,
  BookOpen,
  FileText
} from 'lucide-react';

interface ArchiveManagementProps {
  archives: DataArchive[];
  currentYear: string;
  onArchive: (isAuto?: boolean) => void;
  onImport: (archive: DataArchive, options: { 
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
  }) => void;
  onDelete: (year: string) => void;
}

export const ArchiveManagement: React.FC<ArchiveManagementProps> = ({ 
  archives, 
  currentYear, 
  onArchive, 
  onImport,
  onDelete
}) => {
  const [selectedArchive, setSelectedArchive] = useState<DataArchive | null>(null);
  const [importOptions, setImportOptions] = useState({
    staff: true,
    students: true,
    schoolSettings: false,
    correspondence: false,
    timetable: false,
    attendance: false,
    inquiries: false,
    support: false,
    structures: false,
    memos: false,
    legislative: false
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
            <Archive className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">إدارة الأرشيف والمواسم الدراسية</h2>
            <p className="text-sm text-gray-500 font-bold">الموسم الحالي: <span className="text-indigo-600">{currentYear}</span></p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onArchive}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <PlusCircle className="w-5 h-5" />
          أرشفة الموسم الحالي
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 px-2">
            <History className="w-5 h-5 text-indigo-500" />
            المواسم المؤرشفة
          </h3>
          
          <div className="space-y-3">
            {archives.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center">
                <Archive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">لا توجد مواسم مؤرشفة حالياً</p>
              </div>
            ) : (
              archives.map((archive) => (
                <motion.div
                  key={archive.academicYear}
                  whileHover={{ x: 5 }}
                  onClick={() => setSelectedArchive(archive)}
                  className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
                    selectedArchive?.academicYear === archive.academicYear
                      ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-600/10'
                      : 'border-gray-100 bg-white hover:border-indigo-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-gray-900 text-lg">{archive.academicYear}</h4>
                      <p className="text-xs text-gray-500 font-bold mt-1">
                        تاريخ الأرشفة: {new Date(archive.archivedAt).toLocaleDateString('ar-MA')}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('هل أنت متأكد من حذف هذا الأرشيف؟')) {
                          onDelete(archive.academicYear);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mt-4 flex gap-3">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      <Users className="w-3 h-3" />
                      {archive.staffList.length} موظف
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      <GraduationCap className="w-3 h-3" />
                      {archive.students.length} تلميذ
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedArchive ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-gray-100 overflow-hidden h-full"
            >
              <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-black text-gray-900">تفاصيل أرشيف موسم {selectedArchive.academicYear}</h3>
                <p className="text-sm text-gray-500 font-bold mt-1">يمكنك جلب بيانات محددة من هذا الموسم إلى الموسم الحالي</p>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                    <h4 className="font-black text-indigo-900 mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      خيارات الجلب (Import)
                    </h4>
                    
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 cursor-pointer hover:border-indigo-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={importOptions.staff}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, staff: e.target.checked }))}
                          className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="font-black text-gray-900 text-sm">قائمة الموظفين</p>
                          <p className="text-[10px] text-gray-500 font-bold">إضافة الموظفين المسجلين في هذا الموسم</p>
                        </div>
                        <Users className="w-5 h-5 text-gray-400" />
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 cursor-pointer hover:border-indigo-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={importOptions.students}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, students: e.target.checked }))}
                          className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="font-black text-gray-900 text-sm">قائمة التلاميذ</p>
                          <p className="text-[10px] text-gray-500 font-bold">إضافة التلاميذ المسجلين في هذا الموسم</p>
                        </div>
                        <GraduationCap className="w-5 h-5 text-gray-400" />
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 cursor-pointer hover:border-indigo-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={importOptions.correspondence}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, correspondence: e.target.checked }))}
                          className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="font-black text-gray-900 text-sm">المراسلات</p>
                          <p className="text-[10px] text-gray-500 font-bold">إضافة الصادر والوارد من هذا الموسم</p>
                        </div>
                        <Mail className="w-5 h-5 text-gray-400" />
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 cursor-pointer hover:border-indigo-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={importOptions.timetable}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, timetable: e.target.checked }))}
                          className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="font-black text-gray-900 text-sm">جداول الحصص</p>
                          <p className="text-[10px] text-gray-500 font-bold">إضافة الأنشطة والجداول الزمنية</p>
                        </div>
                        <Calendar className="w-5 h-5 text-gray-400" />
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 cursor-pointer hover:border-indigo-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={importOptions.attendance}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, attendance: e.target.checked }))}
                          className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="font-black text-gray-900 text-sm">تغيبات الموظفين</p>
                          <p className="text-[10px] text-gray-500 font-bold">إضافة سجلات الغياب والتأخر</p>
                        </div>
                        <Clock className="w-5 h-5 text-gray-400" />
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 cursor-pointer hover:border-indigo-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={importOptions.inquiries}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, inquiries: e.target.checked }))}
                          className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="font-black text-gray-900 text-sm">الاستفسارات الإدارية</p>
                          <p className="text-[10px] text-gray-500 font-bold">إضافة سجل الاستفسارات</p>
                        </div>
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 cursor-pointer hover:border-indigo-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={importOptions.structures}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, structures: e.target.checked }))}
                          className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="font-black text-gray-900 text-sm">هياكل المؤسسة</p>
                          <p className="text-[10px] text-gray-500 font-bold">إضافة البنية التربوية والإدارية</p>
                        </div>
                        <School className="w-5 h-5 text-gray-400" />
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 cursor-pointer hover:border-indigo-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={importOptions.memos}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, memos: e.target.checked }))}
                          className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="font-black text-gray-900 text-sm">المذكرات الداخلية</p>
                          <p className="text-[10px] text-gray-500 font-bold">إضافة سجل المذكرات الداخلية</p>
                        </div>
                        <FileText className="w-5 h-5 text-gray-400" />
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 cursor-pointer hover:border-indigo-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={importOptions.legislative}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, legislative: e.target.checked }))}
                          className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="font-black text-gray-900 text-sm">المراجع التشريعية</p>
                          <p className="text-[10px] text-gray-500 font-bold">إضافة المراجع المؤرشفة</p>
                        </div>
                        <BookOpen className="w-5 h-5 text-gray-400" />
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 cursor-pointer hover:border-indigo-300 transition-all">
                        <input 
                          type="checkbox" 
                          checked={importOptions.schoolSettings}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, schoolSettings: e.target.checked }))}
                          className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="font-black text-gray-900 text-sm">إعدادات المؤسسة</p>
                          <p className="text-[10px] text-gray-500 font-bold">تحديث بيانات المؤسسة الحالية</p>
                        </div>
                        <Settings className="w-5 h-5 text-gray-400" />
                      </label>
                    </div>

                    <div className="mt-8">
                      <button
                        onClick={() => onImport(selectedArchive, importOptions)}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
                      >
                        <RefreshCw className="w-5 h-5" />
                        جلب البيانات المختارة
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                        <div>
                          <h4 className="font-black text-amber-900">تنبيه هام</h4>
                          <p className="text-xs text-amber-700 font-bold mt-1 leading-relaxed">
                            عملية جلب البيانات ستقوم بإضافة البيانات المختارة إلى الموسم الحالي دون حذف البيانات الموجودة مسبقاً. سيتم تجنب تكرار العناصر التي لها نفس المعرف (مثل رقم التأجير أو رمز مسار).
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <h4 className="font-black text-gray-900 mb-4">ملخص الأرشيف</h4>
                      <ul className="space-y-3">
                        <li className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-bold">المراسلات:</span>
                          <span className="font-black text-gray-900">{selectedArchive.correspondenceList.length}</span>
                        </li>
                        <li className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-bold">الأنشطة المدرسية:</span>
                          <span className="font-black text-gray-900">{selectedArchive.timetableActivities.length}</span>
                        </li>
                        <li className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-bold">الهياكل المدرسية:</span>
                          <span className="font-black text-gray-900">{selectedArchive.schoolStructures.length}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-gray-100 p-20 text-center flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <History className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900">اختر موسماً من القائمة</h3>
              <p className="text-gray-500 font-bold mt-2">قم باختيار أحد المواسم المؤرشفة لعرض تفاصيله أو جلب بياناته</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
