
import React, { useState } from 'react';
import { ViewState, SchoolData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Archive,
  LayoutDashboard, 
  Settings, 
  Users, 
  Calendar, 
  GraduationCap,
  ChevronLeft,
  ChevronDown,
  School,
  LogOut,
  Mail,
  Save,
  Clock,
  AlertCircle,
  BookOpen,
  MessageCircle,
  FileDown,
  History,
  ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DataArchive } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  schoolData: SchoolData;
  onSaveAll: () => void;
  archives: DataArchive[];
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, schoolData, onSaveAll, archives }) => {
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(
    ['staffManagement', 'timetable', 'attendance', 'administrativeInquiry'].includes(currentView)
  );
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as ViewState, label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'schoolSettings' as ViewState, label: 'إعداد بيانات المؤسسة', icon: Settings },
    { 
      id: 'staffGroup', 
      label: 'نظام إدارة الموظفين', 
      icon: Users,
      isGroup: true,
      children: [
        { id: 'staffManagement' as ViewState, label: 'لائحة الموظفين', icon: Users },
        { id: 'timetable' as ViewState, label: 'جداول الحصص', icon: Calendar },
        { id: 'attendance' as ViewState, label: 'تغيبات الموظفين', icon: Clock },
        { id: 'administrativeInquiry' as ViewState, label: 'الاستفسارات الإدارية', icon: AlertCircle },
        { id: 'educationalSupport' as ViewState, label: 'الدعم التربوي', icon: GraduationCap },
      ]
    },
    { id: 'correspondence' as ViewState, label: 'تدبير الصادر والوارد', icon: Mail },
    { id: 'studentManagement' as ViewState, label: 'نظام إدارة التلاميذ', icon: GraduationCap },
    { id: 'requestsAndPrints' as ViewState, label: 'الطلبات والمطبوعات', icon: FileDown },
    { id: 'internalMemos' as ViewState, label: 'المذكرات الداخلية', icon: AlertCircle },
    { id: 'schoolStructures' as ViewState, label: 'هياكل المؤسسة', icon: School },
    { id: 'legislativeArchive' as ViewState, label: 'أرشيف المراجع التشريعية', icon: BookOpen },
    { id: 'whatsAppMessaging' as ViewState, label: 'مراسلة الواتساب', icon: MessageCircle },
  ];

  const handleNavClick = (item: any) => {
    if (item.isGroup) {
      setIsStaffMenuOpen(!isStaffMenuOpen);
    } else {
      setView(item.id);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-950 text-white flex-shrink-0 flex flex-col shadow-2xl z-20 print:hidden">
        <div className="p-6 border-b border-indigo-900/50 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <School className="w-7 h-7 text-indigo-300" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">سيس مدرستي</span>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => handleNavClick(item)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  (currentView === item.id || (item.isGroup && isStaffMenuOpen))
                  ? 'bg-indigo-600/50 text-white' 
                  : 'text-indigo-300 hover:bg-white/5 hover:text-white',
                  currentView === item.id && 'bg-indigo-600 shadow-lg'
                )}
              >
                {currentView === item.id && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute inset-0 bg-indigo-600 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                  (currentView === item.id || (item.isGroup && isStaffMenuOpen)) ? "text-white" : "text-indigo-400 group-hover:text-white"
                )} />
                <span className="font-semibold text-sm">{item.label}</span>
                
                <div className="mr-auto">
                  {item.isGroup ? (
                    isStaffMenuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
                  ) : (
                    currentView === item.id && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </motion.div>
                    )
                  )}
                </div>
              </button>

              {item.isGroup && isStaffMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mr-4 space-y-1 border-r border-indigo-800/50 pr-2"
                >
                  {item.children?.map((child: any) => (
                    <button
                      key={child.id}
                      onClick={() => setView(child.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative",
                        currentView === child.id 
                        ? 'bg-indigo-500/30 text-white' 
                        : 'text-indigo-400 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <child.icon className={cn(
                        "w-4 h-4",
                        currentView === child.id ? "text-indigo-300" : "text-indigo-500 group-hover:text-indigo-300"
                      )} />
                      <span className="text-xs font-bold">{child.label}</span>
                      {currentView === child.id && (
                        <div className="mr-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </nav>
        
        <div className="p-6 bg-indigo-950/50 text-indigo-400 text-[10px] text-center border-t border-indigo-900/30 flex flex-col gap-2">
           <div className="flex items-center justify-center gap-2 opacity-60">
             <Calendar className="w-3 h-3" />
             <span>الموسم الدراسي: {schoolData.academicYear}</span>
           </div>
           <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()}</p>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 relative print:bg-white">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-10 shadow-sm z-10 print:hidden">
          <div className="flex items-center gap-5">
            <AnimatePresence mode="wait">
              <motion.div 
                key={schoolData.logo || 'default'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-inner"
              >
                {schoolData.logo ? (
                  <img src={schoolData.logo} alt="شعار" className="h-full w-full object-contain p-1" />
                ) : (
                  <School className="w-6 h-6 text-gray-300" />
                )}
              </motion.div>
            </AnimatePresence>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">{schoolData.name}</h1>
              <p className="text-xs text-gray-500 font-medium">رمز المؤسسة: {schoolData.code}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsArchiveOpen(!isArchiveOpen)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border",
                  currentView === 'archives' 
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20" 
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                )}
              >
                <History className="w-4 h-4" />
                <span>المواسم والأرشيف</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isArchiveOpen && "rotate-180")} />
              </motion.button>

              <AnimatePresence>
                {isArchiveOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsArchiveOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-40 overflow-hidden"
                    >
                      <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">المواسم المؤرشفة</p>
                      </div>
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {archives.length === 0 ? (
                          <div className="p-6 text-center">
                            <Archive className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-xs text-gray-400 font-bold">لا يوجد أرشيف حالياً</p>
                          </div>
                        ) : (
                          archives.map((archive) => (
                            <button
                              key={archive.academicYear}
                              onClick={() => {
                                setView('archives');
                                setIsArchiveOpen(false);
                              }}
                              className="w-full flex items-center justify-between px-5 py-3 hover:bg-indigo-50 transition-colors text-right group"
                            >
                              <div>
                                <p className="text-sm font-black text-gray-800 group-hover:text-indigo-600">{archive.academicYear}</p>
                                <p className="text-[10px] text-gray-400 font-bold">
                                  {new Date(archive.archivedAt).toLocaleDateString('ar-MA')}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400" />
                            </button>
                          ))
                        )}
                      </div>
                      <div className="p-3 bg-indigo-50/50 border-t border-indigo-100">
                        <button
                          onClick={() => {
                            setView('archives');
                            setIsArchiveOpen(false);
                          }}
                          className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md"
                        >
                          إدارة الأرشيف بالكامل
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-bold text-gray-800">
                {new Date().toLocaleDateString('ar-MA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                {new Date().toLocaleDateString('ar-MA', { year: 'numeric' })}
              </span>
            </div>
            
            <div className="h-10 w-px bg-gray-200 hidden lg:block"></div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSaveAll}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>حفظ البيانات</span>
            </motion.button>
            
            <div className="flex items-center gap-3 bg-gray-50 pl-4 pr-1 py-1 rounded-full border border-gray-100 shadow-sm">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-gray-900">{schoolData.director}</span>
                <span className="text-[9px] text-indigo-600 font-black uppercase">مدير المؤسسة</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black border-2 border-white shadow-md">
                {schoolData.director.charAt(0)}
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar print:p-0 print:overflow-visible">
          <AnimatePresence>
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
