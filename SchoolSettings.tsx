
import React, { useState, useRef } from 'react';
import { SchoolData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  Info,
  Building2,
  Hash,
  User,
  Calendar
} from 'lucide-react';
import { moroccoData } from '../constants';

interface SchoolSettingsProps {
  data: SchoolData;
  onSave: (newData: SchoolData) => void;
}

export const SchoolSettings: React.FC<SchoolSettingsProps> = ({ data, onSave }) => {
  const [formData, setFormData] = useState<SchoolData>(data);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'region') {
      const provinces = moroccoData[value] ? Object.keys(moroccoData[value]) : [];
      const firstProvince = provinces.length > 0 ? provinces[0] : '';
      const municipalities = firstProvince ? moroccoData[value][firstProvince] : [];
      
      setFormData(prev => ({ 
        ...prev, 
        region: value, 
        city: firstProvince,
        municipality: municipalities.length > 0 ? municipalities[0] : ''
      }));
    } else if (name === 'city') {
      const municipalities = moroccoData[formData.region]?.[value] || [];
      setFormData(prev => ({ 
        ...prev, 
        city: value,
        municipality: municipalities.length > 0 ? municipalities[0] : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { 
        alert("حجم الملف كبير جداً. يرجى اختيار صورة أقل من 1 ميجابايت.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-gray-100 overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">إعداد بيانات المؤسسة</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">تحديث المعلومات الأساسية والمكانية</p>
            </div>
          </div>
          
          <AnimatePresence>
            {isSaved && (
              <motion.span 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl text-sm font-black flex items-center gap-2 border border-emerald-100 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                تم الحفظ بنجاح
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="flex flex-col md:flex-row items-center gap-10 p-8 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200 group transition-colors hover:border-indigo-300">
            <div className="relative">
              <div className="w-40 h-40 bg-white rounded-3xl border-2 border-gray-100 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-4" />
                ) : (
                  <Building2 className="w-16 h-16 text-gray-200" />
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-3 -right-3 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 transition-colors border-4 border-white"
              >
                <Upload className="w-5 h-5" />
              </motion.button>
            </div>
            
            <div className="flex-1 space-y-4 text-center md:text-right">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">شعار المؤسسة</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">سيظهر هذا الشعار في الجزء العلوي من جميع المراسلات والوثائق الرسمية والتقارير المصدرة.</p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-600/10 text-indigo-700 px-6 py-2.5 rounded-xl text-sm font-black hover:bg-indigo-600 hover:text-white transition-all"
                >
                  تغيير الشعار
                </button>
                {formData.logo && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="bg-red-50 text-red-600 border border-red-100 px-6 py-2.5 rounded-xl text-sm font-black hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700 mr-1">
                <Building2 className="w-4 h-4 text-indigo-500" />
                اسم المؤسسة
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700 mr-1">
                <Hash className="w-4 h-4 text-indigo-500" />
                رمز المؤسسة (GRESA)
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700 mr-1">
                <User className="w-4 h-4 text-indigo-500" />
                المدير(ة)
              </label>
              <input
                type="text"
                name="director"
                value={formData.director}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700 mr-1">
                <Calendar className="w-4 h-4 text-indigo-500" />
                الموسم الدراسي
              </label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700 mr-1">
                <MapPin className="w-4 h-4 text-indigo-500" />
                الأكاديمية الجهوية
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800 appearance-none"
                required
              >
                <option value="">اختر الجهة...</option>
                {Object.keys(moroccoData).map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700 mr-1">
                <MapPin className="w-4 h-4 text-indigo-500" />
                المديرية الإقليمية
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800 appearance-none disabled:opacity-50"
                required
                disabled={!formData.region}
              >
                <option value="">اختر الإقليم...</option>
                {formData.region && Object.keys(moroccoData[formData.region] || {}).map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700 mr-1">
                <MapPin className="w-4 h-4 text-indigo-500" />
                الجماعة
              </label>
              <select
                name="municipality"
                value={formData.municipality}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800 appearance-none disabled:opacity-50"
                required
                disabled={!formData.city}
              >
                <option value="">اختر الجماعة...</option>
                {formData.region && formData.city && (moroccoData[formData.region]?.[formData.city] || []).map(muni => (
                  <option key={muni} value={muni}>{muni}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700 mr-1">
                <Phone className="w-4 h-4 text-indigo-500" />
                رقم الهاتف
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
                required
                placeholder="05XXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700 mr-1">
                <Mail className="w-4 h-4 text-indigo-500" />
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
                required
                placeholder="example@mail.com"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700 mr-1">
                <Info className="w-4 h-4 text-indigo-500" />
                عنوان المؤسسة
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
                required
              />
            </div>
          </div>

          <div className="pt-10 border-t border-gray-100 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/20 flex items-center gap-3"
            >
              <Save className="w-5 h-5" />
              حفظ التغييرات
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
