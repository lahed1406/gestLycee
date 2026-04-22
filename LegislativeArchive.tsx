
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { LegislativeReference } from '../types';
import { 
  FileText, 
  Upload, 
  Eye, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  Plus,
  X,
  FileDown,
  FileSearch,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LegislativeArchiveProps {
  references: LegislativeReference[];
  onAdd: (ref: LegislativeReference) => void;
  onDelete: (id: string) => void;
}

export default function LegislativeArchive({ references, onAdd, onDelete }: LegislativeArchiveProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [viewingRef, setViewingRef] = useState<LegislativeReference | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle preview URL creation/cleanup
  useEffect(() => {
    if (viewingRef && (viewingRef.fileType.includes('pdf') || viewingRef.fileType.includes('image'))) {
      const createPreview = async () => {
        try {
          const res = await fetch(viewingRef.fileData);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        } catch (error) {
          console.error('Error creating preview URL:', error);
        }
      };
      createPreview();
    } else {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [viewingRef]);

  const categories = ['الكل', ...Array.from(new Set(references.map(r => r.category)))];

  const filteredReferences = useMemo(() => {
    return references.filter(ref => {
      const matchesSearch = 
        ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'الكل' || ref.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [references, searchQuery, selectedCategory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const getFileType = (file: File) => {
    if (file.type) return file.type;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    if (['txt', 'md', 'json', 'csv'].includes(ext || '')) return 'text/plain';
    return 'application/octet-stream';
  };

  const handleUpload = async () => {
    if (!title || !category || !date || !file) {
      alert('يرجى ملء جميع الخانات الضرورية واختيار ملف');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        const newRef: LegislativeReference = {
          id: Date.now().toString(),
          title,
          category,
          date,
          description,
          fileName: file.name,
          fileType: getFileType(file),
          fileData: base64Data,
          createdAt: new Date().toISOString()
        };
        onAdd(newRef);
        resetForm();
        setShowAddModal(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('حدث خطأ أثناء رفع الملف');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setDate('');
    setDescription('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const decodeBase64Text = (base64: string) => {
    try {
      const binString = atob(base64.split(',')[1]);
      const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return "خطأ في قراءة محتوى الملف النصي. قد يكون الملف مشفراً أو بتنسيق غير مدعوم.";
    }
  };

  const handleDownload = (ref: LegislativeReference) => {
    const link = document.createElement('a');
    link.href = ref.fileData;
    link.download = ref.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">أرشيف المراجع التشريعية</h1>
            <p className="text-gray-500 text-sm font-medium">إدارة وتوثيق النصوص القانونية والتشريعية</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة مرجع جديد</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative col-span-2">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في العناوين أو الوصف..."
            className="w-full pr-12 pl-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pr-12 pl-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm appearance-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* References Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredReferences.map((ref) => (
            <motion.div
              key={ref.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <FileText className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingRef(ref)}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    title="عرض"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDownload(ref)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="تحميل"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذا المرجع؟')) {
                        onDelete(ref.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="حذف"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-black text-gray-900 mb-2 line-clamp-1">{ref.title}</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full">
                  {ref.category}
                </span>
                <span className="text-gray-400 text-[10px] font-bold">
                  {new Date(ref.date).toLocaleDateString('ar-MA')}
                </span>
              </div>
              <p className="text-gray-500 text-xs font-medium line-clamp-2 mb-4 h-8">
                {ref.description || 'لا يوجد وصف متاح'}
              </p>
              
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400">
                <span className="flex items-center gap-1">
                  <FileDown className="w-3 h-3" />
                  {ref.fileName}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredReferences.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
          <FileSearch className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-xl font-black text-gray-400">لا توجد مراجع تشريعية</h3>
          <p className="text-gray-300 font-bold">ابدأ بإضافة أول مرجع للأرشيف</p>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <Upload className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">إضافة مرجع جديد</h2>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-gray-700 mb-2 mr-2">عنوان المرجع</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: الظهير الشريف رقم..."
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-bold bg-gray-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-2 mr-2">التصنيف</label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="مثال: قوانين، مراسيم..."
                        className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-bold bg-gray-50"
                        list="category-list"
                      />
                      <datalist id="category-list">
                        <option value="قوانين" />
                        <option value="مراسيم" />
                        <option value="قرارات" />
                        <option value="مذكرات وزارية" />
                        <option value="دوريات" />
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-2 mr-2">تاريخ الصدور</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-bold bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-700 mb-2 mr-2">وصف مختصر</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="وصف لمحتوى المرجع..."
                      rows={3}
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-bold bg-gray-50 resize-none"
                    />
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all ${
                      file ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {file ? (
                      <div className="flex flex-col items-center">
                        <FileText className="w-12 h-12 text-emerald-600 mb-2" />
                        <span className="text-sm font-black text-emerald-700">{file.name}</span>
                        <span className="text-[10px] text-emerald-500 font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-12 h-12 text-gray-300 mb-2" />
                        <span className="text-sm font-black text-gray-400">انقر لاختيار ملف المرجع</span>
                        <span className="text-[10px] text-gray-300 font-bold">جميع الامتدادات مدعومة</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                      <span>رفع المرجع</span>
                    </button>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewingRef && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">{viewingRef.title}</h2>
                    <p className="text-[10px] text-gray-400 font-bold">{viewingRef.fileName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(viewingRef)}
                    className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-100 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل</span>
                  </button>
                  <button onClick={() => setViewingRef(null)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden bg-gray-100 p-4">
                {viewingRef.fileType.includes('pdf') && previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full rounded-2xl shadow-inner border-0"
                    title={viewingRef.title}
                  />
                ) : viewingRef.fileType.includes('image') && previewUrl ? (
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                    <img src={previewUrl} alt={viewingRef.title} className="max-w-full rounded-2xl shadow-lg" />
                  </div>
                ) : viewingRef.fileType.includes('text') ? (
                  <div className="w-full h-full bg-white p-8 rounded-2xl shadow-inner overflow-auto font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {decodeBase64Text(viewingRef.fileData)}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-3xl p-12 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6">
                      <FileDown className="w-12 h-12 text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">معاينة غير متاحة</h3>
                    <p className="text-gray-500 font-bold mb-8 max-w-md">
                      هذا النوع من الملفات ({viewingRef.fileType}) لا يمكن عرضه مباشرة في المتصفح. يرجى تحميل الملف لفتحه على جهازك.
                    </p>
                    <button
                      onClick={() => handleDownload(viewingRef)}
                      className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-3"
                    >
                      <Download className="w-6 h-6" />
                      <span>تحميل الملف الآن</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
