
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student, SchoolData } from '../types';
import { Upload, Users, FileSpreadsheet, AlertCircle, CheckCircle2, Search, Trash2 } from 'lucide-react';

interface StudentManagementProps {
  students: Student[];
  onUpdate: (students: Student[]) => void;
  schoolData: SchoolData;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ students, onUpdate, schoolData }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isImportingParents, setIsImportingParents] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parentFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    const processFile = (file: File): Promise<Student[]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const fileStudents: Student[] = [];

            workbook.SheetNames.forEach(sheetName => {
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
              
              if (jsonData.length < 5) return;

              let level = '';
              if (jsonData[6] && jsonData[6][2]) {
                level = String(jsonData[6][2]).trim();
                if (level.includes(':')) level = level.split(':')[1].trim();
                if (level.includes('المستوى')) level = level.replace('المستوى', '').trim();
              }

              const section = sheetName;
              const academicYear = schoolData.academicYear;

              let tableHeaderRowIndex = -1;
              for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
                const row = jsonData[i];
                if (row && row.some(cell => typeof cell === 'string' && 
                  (cell.includes('الرمز') || cell.includes('Code') || cell.includes('مسار') || cell.includes('Massar') || cell.includes('رقم التلميذ')))) {
                  tableHeaderRowIndex = i;
                  break;
                }
              }

              let codeIdx = -1;
              let lastNameIdx = -1;
              let firstNameIdx = -1;
              let genderIdx = -1;
              let birthDateIdx = -1;
              let birthPlaceIdx = -1;
              let sectionIdx = -1;

              if (tableHeaderRowIndex !== -1) {
                const headers = jsonData[tableHeaderRowIndex];
                codeIdx = headers.findIndex((h: any) => typeof h === 'string' && (h.includes('الرمز') || h.includes('Code') || h.includes('مسار') || h.includes('Massar') || h.includes('رقم التلميذ')));
                lastNameIdx = headers.findIndex((h: any) => typeof h === 'string' && (h.includes('النسب') || h.includes('Nom') || h.includes('العائلي')));
                firstNameIdx = headers.findIndex((h: any) => typeof h === 'string' && (h.includes('الإسم') || h.includes('Prénom') || h.includes('الشخصي')));
                genderIdx = headers.findIndex((h: any) => typeof h === 'string' && (h.includes('النوع') || h.includes('Sexe') || h.includes('الجنس')));
                birthDateIdx = headers.findIndex((h: any) => typeof h === 'string' && (h.includes('تاريخ') || h.includes('Date de naissance') || h.includes('الازدياد')));
                birthPlaceIdx = headers.findIndex((h: any) => typeof h === 'string' && (h.includes('مكان') || h.includes('Lieu de naissance') || h.includes('مكان الازدياد')));
                sectionIdx = headers.findIndex((h: any) => typeof h === 'string' && (h.includes('القسم') || h.includes('Classe') || h.includes('Section')));
              }

              // Fallback for Massar code in Column C (index 2)
              if (codeIdx === -1) {
                for (let i = 0; i < Math.min(jsonData.length, 50); i++) {
                  const val = jsonData[i]?.[2];
                  if (val && typeof val === 'string' && /^[A-Z]\d{9}$/i.test(val.trim())) {
                    codeIdx = 2;
                    if (tableHeaderRowIndex === -1) tableHeaderRowIndex = 0;
                    break;
                  }
                }
              }

              if (codeIdx === -1) return;

              for (let i = tableHeaderRowIndex + 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || !row[codeIdx]) continue;

                const student: Student = {
                  id: crypto.randomUUID(),
                  massarCode: String(row[codeIdx] || '').trim(),
                  lastName: String(row[lastNameIdx] || '').trim(),
                  firstName: String(row[firstNameIdx] || '').trim(),
                  gender: String(row[genderIdx] || '').includes('ذكر') || String(row[genderIdx] || '').toLowerCase() === 'm' ? 'ذكر' : 'أنثى',
                  birthDate: row[birthDateIdx] ? (typeof row[birthDateIdx] === 'number' ? XLSX.SSF.format('yyyy-mm-dd', row[birthDateIdx]) : String(row[birthDateIdx])) : '',
                  birthPlace: String(row[birthPlaceIdx] || '').trim(),
                  level: level || 'غير محدد',
                  section: sectionIdx !== -1 ? String(row[sectionIdx] || '').trim() : section,
                  academicYear: academicYear
                };
                fileStudents.push(student);
              }
            });
            resolve(fileStudents);
          } catch (err) {
            reject(new Error(`خطأ في معالجة الملف ${file.name}: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`));
          }
        };
        reader.onerror = () => reject(new Error(`خطأ في قراءة الملف ${file.name}`));
        reader.readAsArrayBuffer(file);
      });
    };

    try {
      const fileList = Array.from(files);
      const results = await Promise.allSettled(fileList.map(processFile));
      
      const allNewStudents: Student[] = [];
      const errors: string[] = [];
      let successfulFiles = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allNewStudents.push(...result.value);
          successfulFiles++;
        } else {
          errors.push(result.reason.message);
        }
      });

      if (allNewStudents.length === 0 && errors.length > 0) {
        throw new Error(errors.join(' | '));
      }

      if (allNewStudents.length === 0) {
        throw new Error('لم يتم العثور على تلاميذ في الملفات المختارة.');
      }

      const existingCodes = new Set(students.map(s => s.massarCode));
      const uniqueNewStudents = allNewStudents.filter(s => !existingCodes.has(s.massarCode));
      
      // Remove duplicates within the imported files themselves
      const finalUniqueNewStudents: Student[] = [];
      const seenInImport = new Set<string>();
      uniqueNewStudents.forEach(s => {
        if (!seenInImport.has(s.massarCode)) {
          finalUniqueNewStudents.push(s);
          seenInImport.add(s.massarCode);
        }
      });

      onUpdate([...students, ...finalUniqueNewStudents]);
      
      let message = `تم استيراد ${finalUniqueNewStudents.length} تلميذ من ${successfulFiles} ملفات بنجاح.`;
      if (errors.length > 0) {
        message += ` (فشل استيراد ${errors.length} ملفات)`;
      }
      if (allNewStudents.length > finalUniqueNewStudents.length) {
        message += ` (تم تجاهل ${allNewStudents.length - finalUniqueNewStudents.length} تلميذ موجود مسبقاً أو مكرر)`;
      }
      
      setImportSuccess(message);
      if (errors.length > 0) {
        setImportError(`بعض الملفات واجهت مشاكل: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
      }
    } catch (err: any) {
      setImportError(err.message || 'حدث خطأ أثناء معالجة الملفات');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleParentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImportingParents(true);
    setImportError(null);
    setImportSuccess(null);

    const currentStudents = [...students];
    const updatedStudentIds = new Set<string>();
    const errors: string[] = [];

    const processParentFile = (file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            workbook.SheetNames.forEach(sheetName => {
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
              
              if (jsonData.length < 2) return;

                  const normalize = (s: any) => {
                    if (!s) return '';
                    return String(s)
                      .toLowerCase()
                      .replace(/[أإآ]/g, 'ا')
                      .replace(/[ة]/g, 'ه')
                      .replace(/[^\u0621-\u064A0-9a-zA-Z]/g, '')
                      .trim();
                  };

                  let headerRowIndex = -1;
                  for (let i = 0; i < Math.min(jsonData.length, 30); i++) {
                    const row = jsonData[i];
                    if (row && row.some(cell => {
                      const nc = normalize(cell);
                      return nc.includes('تلميذ') || nc.includes('مسار') || nc.includes('massar') || nc.includes('code');
                    })) {
                      headerRowIndex = i;
                      break;
                    }
                  }

                  if (headerRowIndex === -1) {
                    // Fallback search for Massar code in any column to find header row
                    for (let i = 0; i < Math.min(jsonData.length, 50); i++) {
                      const row = jsonData[i];
                      if (row && row.some(cell => typeof cell === 'string' && /^[A-Z]\d{9}$/i.test(cell.trim()))) {
                        headerRowIndex = i - 1 >= 0 ? i - 1 : 0;
                        break;
                      }
                    }
                  }

                  // Specific check for the user's provided template layout (Massar in C, Guardian CIN in G)
                  let isUserTemplate = false;
                  for (let i = 0; i < Math.min(jsonData.length, 25); i++) {
                    const row = jsonData[i];
                    const massarVal = String(row?.[2] || '').trim();
                    const cinVal = String(row?.[6] || '').trim();
                    // Massar code pattern: Letter + 9 digits
                    // CIN pattern: 1-2 letters + digits
                    if (/^[A-Z]\d{9}$/i.test(massarVal) && /^[A-Z]{1,2}\d+$/i.test(cinVal)) {
                      isUserTemplate = true;
                      headerRowIndex = i - 1 >= 0 ? i - 1 : 0;
                      break;
                    }
                  }

                  if (headerRowIndex === -1) {
                    resolve(); // Skip this file if no header found
                    return;
                  }

                  const headers = jsonData[headerRowIndex];
                  const mainHeaders = headerRowIndex > 0 ? jsonData[headerRowIndex - 1] : [];
                  
                  let codeIdx = headers.findIndex((h: any) => {
                    const nh = normalize(h);
                    return nh.includes('تلميذ') || nh.includes('مسار') || nh.includes('massar') || nh.includes('code');
                  });

                  if (codeIdx === -1) {
                    // Try to find column with Massar codes
                    for (let i = headerRowIndex; i < Math.min(jsonData.length, headerRowIndex + 10); i++) {
                      const row = jsonData[i];
                      const idx = row?.findIndex(cell => typeof cell === 'string' && /^[A-Z]\d{9}$/i.test(cell.trim()));
                      if (idx !== undefined && idx !== -1) {
                        codeIdx = idx;
                        break;
                      }
                    }
                  }

                  if (codeIdx === -1) {
                    resolve();
                    return;
                  }

                  // Find all indices for sub-headers
                  const allNameIndices = headers.map((h: any, i: number) => {
                    const nh = normalize(h);
                    return (nh.includes('اسم') || nh.includes('name')) && 
                           !nh.includes('بطاقه') && !nh.includes('cin') && 
                           !nh.includes('هاتف') && !nh.includes('عنوان') && 
                           !nh.includes('ربو') ? i : -1;
                  }).filter(i => i !== -1);
                  
                  const allSurnameIndices = headers.map((h: any, i: number) => {
                    const nh = normalize(h);
                    return (nh.includes('نسب') || nh.includes('surname')) && 
                           !nh.includes('بطاقه') && !nh.includes('cin') && 
                           !nh.includes('هاتف') && !nh.includes('عنوان') && 
                           !nh.includes('ربو') ? i : -1;
                  }).filter(i => i !== -1);
                  
                  const allCinIndices = headers.map((h: any, i: number) => {
                    const nh = normalize(h);
                    return (nh.includes('بطاقه') || nh.includes('cin') || nh.includes('ربو')) ? i : -1;
                  }).filter(i => i !== -1);

                  const allPhoneIndices = headers.map((h: any, i: number) => {
                    const nh = normalize(h);
                    return (nh.includes('هاتف') || nh.includes('phone') || nh.includes('جوال')) ? i : -1;
                  }).filter(i => i !== -1);

                  const allAddressIndices = headers.map((h: any, i: number) => {
                    const nh = normalize(h);
                    return (nh.includes('عنوان') || nh.includes('address')) ? i : -1;
                  }).filter(i => i !== -1);

                  // Detect category sections in mainHeaders
                  const fatherCatIdx = mainHeaders.findIndex((h: any) => {
                    const nh = normalize(h);
                    return nh.includes('اب') || nh.includes('father');
                  });
                  const motherCatIdx = mainHeaders.findIndex((h: any) => {
                    const nh = normalize(h);
                    return nh.includes('ام') || nh.includes('mother');
                  });
                  const guardianCatIdx = mainHeaders.findIndex((h: any) => {
                    const nh = normalize(h);
                    return nh.includes('ولي') || nh.includes('guardian');
                  });

                  // Helper to find index within a category's range
                  const getIdxInRange = (catIdx: number, nextCatIdx: number, subIndices: number[]) => {
                    if (catIdx === -1 || subIndices.length === 0) return -1;
                    const limit = (nextCatIdx === -1 || nextCatIdx <= catIdx) ? 999 : nextCatIdx;
                    const inRange = subIndices.find(idx => idx >= catIdx && idx < limit);
                    if (inRange !== undefined) return inRange;
                    return subIndices.reduce((prev, curr) => 
                      Math.abs(curr - catIdx) < Math.abs(prev - catIdx) ? curr : prev
                    , -1);
                  };

                  // Determine next category indices for range limiting
                  const sortedCats = [fatherCatIdx, motherCatIdx, guardianCatIdx].filter(c => c !== -1).sort((a, b) => a - b);
                  const getNextCat = (current: number) => {
                    const next = sortedCats.find(c => c > current);
                    return next !== undefined ? next : -1;
                  };

                  let fNameIdx = -1, fSurnameIdx = -1, fCinIdx = -1, fPhoneIdx = -1, fAddressIdx = -1;
                  let mNameIdx = -1, mSurnameIdx = -1, mCinIdx = -1, mPhoneIdx = -1, mAddressIdx = -1;
                  let gNameIdx = -1, gSurnameIdx = -1, gCinIdx = -1, gPhoneIdx = -1, gAddressIdx = -1;

                  if (fatherCatIdx !== -1) {
                    const next = getNextCat(fatherCatIdx);
                    fNameIdx = getIdxInRange(fatherCatIdx, next, allNameIndices);
                    fSurnameIdx = getIdxInRange(fatherCatIdx, next, allSurnameIndices);
                    fCinIdx = getIdxInRange(fatherCatIdx, next, allCinIndices);
                    fPhoneIdx = getIdxInRange(fatherCatIdx, next, allPhoneIndices);
                    fAddressIdx = getIdxInRange(fatherCatIdx, next, allAddressIndices);
                  }
                  if (motherCatIdx !== -1) {
                    const next = getNextCat(motherCatIdx);
                    mNameIdx = getIdxInRange(motherCatIdx, next, allNameIndices);
                    mSurnameIdx = getIdxInRange(motherCatIdx, next, allSurnameIndices);
                    mCinIdx = getIdxInRange(motherCatIdx, next, allCinIndices);
                    mPhoneIdx = getIdxInRange(motherCatIdx, next, allPhoneIndices);
                    mAddressIdx = getIdxInRange(motherCatIdx, next, allAddressIndices);
                  }
                  if (guardianCatIdx !== -1) {
                    const next = getNextCat(guardianCatIdx);
                    gNameIdx = getIdxInRange(guardianCatIdx, next, allNameIndices);
                    gSurnameIdx = getIdxInRange(guardianCatIdx, next, allSurnameIndices);
                    gCinIdx = getIdxInRange(guardianCatIdx, next, allCinIndices);
                    gPhoneIdx = getIdxInRange(guardianCatIdx, next, allPhoneIndices);
                    gAddressIdx = getIdxInRange(guardianCatIdx, next, allAddressIndices);
                  }

                  // Override with user-specific template indices if detected
                  if (isUserTemplate) {
                    codeIdx = 2;
                    gCinIdx = 6; gNameIdx = 7; gSurnameIdx = 8; gPhoneIdx = 12; gAddressIdx = 13;
                    fCinIdx = 14; fNameIdx = 15; fSurnameIdx = 16; fPhoneIdx = 20; fAddressIdx = 21;
                    mCinIdx = 22; mNameIdx = 23; mSurnameIdx = 24; mPhoneIdx = 28; mAddressIdx = 29;
                  }

                  // Final fallbacks if still not found (using order of appearance)
                  // Try to identify student name column to exclude it from parent names
                  const studentNameIdx = headers.findIndex((h: any) => {
                    const nh = normalize(h);
                    return (nh.includes('تلميذ') || nh.includes('student')) && (nh.includes('اسم') || nh.includes('name'));
                  });

                  const parentNameIndices = allNameIndices.filter(idx => idx !== studentNameIdx && idx !== codeIdx);
                  const parentSurnameIndices = allSurnameIndices.filter(idx => idx !== studentNameIdx && idx !== codeIdx);

                  if (fNameIdx === -1 && parentNameIndices.length > 0) fNameIdx = parentNameIndices[0];
                  if (mNameIdx === -1 && parentNameIndices.length > 1) mNameIdx = parentNameIndices[1];
                  if (gNameIdx === -1 && parentNameIndices.length > 2) gNameIdx = parentNameIndices[2];
                  
                  if (fSurnameIdx === -1 && parentSurnameIndices.length > 0) fSurnameIdx = parentSurnameIndices[0];
                  if (mSurnameIdx === -1 && parentSurnameIndices.length > 1) mSurnameIdx = parentSurnameIndices[1];
                  if (gSurnameIdx === -1 && parentSurnameIndices.length > 2) gSurnameIdx = parentSurnameIndices[2];

                  if (fCinIdx === -1 && allCinIndices.length > 0) fCinIdx = allCinIndices[0];
                  if (mCinIdx === -1 && allCinIndices.length > 1) mCinIdx = allCinIndices[1];
                  if (gCinIdx === -1 && allCinIndices.length > 2) gCinIdx = allCinIndices[2];

                  if (gPhoneIdx === -1 && allPhoneIndices.length > 0) gPhoneIdx = allPhoneIndices[0];
                  if (gAddressIdx === -1 && allAddressIndices.length > 0) gAddressIdx = allAddressIndices[0];

              // Fallback for Massar code in Column C (index 2) as requested by user
              if (codeIdx === -1) {
                for (let i = 0; i < Math.min(jsonData.length, 50); i++) {
                  const val = jsonData[i]?.[2];
                  if (val && typeof val === 'string' && /^[A-Z]\d{9}$/i.test(val.trim())) {
                    codeIdx = 2;
                    if (headerRowIndex === -1) headerRowIndex = 0;
                    break;
                  }
                }
              }

              if (codeIdx === -1) return;

              for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || !row[codeIdx]) continue;

                const massarCode = String(row[codeIdx] || '').trim();
                const studentIdx = currentStudents.findIndex(s => s.massarCode === massarCode);

                if (studentIdx !== -1) {
                  const s = currentStudents[studentIdx];
                  
                  // Construct names by combining first and last names if available
                  const getFullName = (nameIdx: number, surnameIdx: number, fallback: string | undefined) => {
                    const name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : '';
                    const surname = surnameIdx !== -1 && row[surnameIdx] ? String(row[surnameIdx]).trim() : '';
                    
                    // If the "name" looks like a CIN (e.g. starts with letter, followed by digits), 
                    // it's likely a mis-detected column.
                    const isCinLike = (val: string) => /^[A-Z]{1,2}\d+$/i.test(val) && val.length < 15;
                    if (isCinLike(name) && !surname) return fallback;

                    if (name || surname) return `${name} ${surname}`.trim();
                    return fallback;
                  };

                  const newGuardianName = getFullName(gNameIdx, gSurnameIdx, s.guardianName);
                  const newFatherName = getFullName(fNameIdx, fSurnameIdx, s.fatherName);
                  const newMotherName = getFullName(mNameIdx, mSurnameIdx, s.motherName);
                  
                  const newFatherCin = (fCinIdx !== -1 && row[fCinIdx]) ? String(row[fCinIdx]).trim() : s.fatherCin;
                  const newFatherPhone = (fPhoneIdx !== -1 && row[fPhoneIdx]) ? String(row[fPhoneIdx]).trim() : s.fatherPhone;
                  const newFatherAddress = (fAddressIdx !== -1 && row[fAddressIdx]) ? String(row[fAddressIdx]).trim() : s.fatherAddress;
                  const newMotherCin = (mCinIdx !== -1 && row[mCinIdx]) ? String(row[mCinIdx]).trim() : s.motherCin;
                  const newMotherPhone = (mPhoneIdx !== -1 && row[mPhoneIdx]) ? String(row[mPhoneIdx]).trim() : s.motherPhone;
                  const newMotherAddress = (mAddressIdx !== -1 && row[mAddressIdx]) ? String(row[mAddressIdx]).trim() : s.motherAddress;
                  const newGuardianCin = (gCinIdx !== -1 && row[gCinIdx]) ? String(row[gCinIdx]).trim() : s.guardianCin;
                  const newGuardianPhone = (gPhoneIdx !== -1 && row[gPhoneIdx]) ? String(row[gPhoneIdx]).trim() : s.guardianPhone;
                  const newGuardianAddress = (gAddressIdx !== -1 && row[gAddressIdx]) ? String(row[gAddressIdx]).trim() : s.guardianAddress;

                  // Only update if we actually found some data in this row
                  const hasNewData = (
                    (gNameIdx !== -1 && row[gNameIdx]) || 
                    (fNameIdx !== -1 && row[fNameIdx]) || 
                    (mNameIdx !== -1 && row[mNameIdx]) || 
                    (fCinIdx !== -1 && row[fCinIdx]) || 
                    (mCinIdx !== -1 && row[mCinIdx]) ||
                    (gCinIdx !== -1 && row[gCinIdx]) || 
                    (gPhoneIdx !== -1 && row[gPhoneIdx]) || 
                    (gAddressIdx !== -1 && row[gAddressIdx]) ||
                    (fPhoneIdx !== -1 && row[fPhoneIdx]) ||
                    (fAddressIdx !== -1 && row[fAddressIdx]) ||
                    (mPhoneIdx !== -1 && row[mPhoneIdx]) ||
                    (mAddressIdx !== -1 && row[mAddressIdx])
                  );

                  if (hasNewData) {
                    currentStudents[studentIdx] = {
                      ...s,
                      guardianName: newGuardianName,
                      fatherName: newFatherName,
                      fatherCin: newFatherCin,
                      fatherPhone: newFatherPhone,
                      fatherAddress: newFatherAddress,
                      motherName: newMotherName,
                      motherCin: newMotherCin,
                      motherPhone: newMotherPhone,
                      motherAddress: newMotherAddress,
                      guardianCin: newGuardianCin,
                      guardianPhone: newGuardianPhone,
                      guardianAddress: newGuardianAddress,
                    };
                    updatedStudentIds.add(s.id);
                  }
                }
              }
            });
            resolve();
          } catch (err) {
            reject(new Error(`خطأ في معالجة ملف الأولياء ${file.name}: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`));
          }
        };
        reader.onerror = () => reject(new Error(`خطأ في قراءة ملف أولياء الأمور ${file.name}`));
        reader.readAsArrayBuffer(file);
      });
    };

    try {
      const fileList = Array.from(files);
      const results = await Promise.allSettled(fileList.map(processParentFile));
      
      let successfulFiles = 0;
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          successfulFiles++;
        } else {
          errors.push(result.reason.message);
        }
      });

      if (updatedStudentIds.size === 0 && errors.length > 0) {
        throw new Error(errors.join(' | '));
      }

      if (updatedStudentIds.size === 0) {
        throw new Error('لم يتم العثور على تطابق لرموز مسار في الملفات المختارة.');
      }

      onUpdate(currentStudents);
      
      let message = `تم تحديث معلومات أولياء الأمور لـ ${updatedStudentIds.size} تلميذ من ${successfulFiles} ملفات بنجاح.`;
      if (errors.length > 0) {
        message += ` (فشل استيراد ${errors.length} ملفات)`;
      }
      
      setImportSuccess(message);
      if (errors.length > 0) {
        setImportError(`بعض ملفات الأولياء واجهت مشاكل: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
      }
    } catch (err: any) {
      setImportError(err.message || 'حدث خطأ أثناء معالجة ملفات أولياء الأمور');
    } finally {
      setIsImportingParents(false);
      if (parentFileInputRef.current) parentFileInputRef.current.value = '';
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    try {
      const birth = new Date(birthDate);
      if (isNaN(birth.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const filteredStudents = students.filter(s => 
    s.firstName.includes(searchTerm) || 
    s.lastName.includes(searchTerm) || 
    s.massarCode.includes(searchTerm) ||
    s.section.includes(searchTerm)
  );

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التلميذ؟')) {
      onUpdate(students.filter(s => s.id !== id));
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('هل أنت متأكد من حذف جميع التلاميذ؟')) {
      onUpdate([]);
    }
  };

  const totalStudents = students.length;
  const femaleCount = students.filter(s => s.gender === 'أنثى').length;
  const maleCount = totalStudents - femaleCount;
  const sectionsCount = new Set(students.map(s => s.section)).size;
  const levelsCount = new Set(students.map(s => s.level)).size;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            إدارة التلاميذ
          </h1>
          <p className="text-slate-500 mt-1">استيراد وتدبير بيانات التلاميذ من منظومة مسار</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls"
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-5 h-5" />
            {isImporting ? 'جاري الاستيراد...' : 'استيراد من إكسيل'}
          </button>

          <input
            type="file"
            ref={parentFileInputRef}
            onChange={handleParentFileUpload}
            accept=".xlsx, .xls"
            multiple
            className="hidden"
          />
          <button
            onClick={() => parentFileInputRef.current?.click()}
            disabled={isImportingParents || students.length === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50"
            title="استيراد معلومات ولي الأمر (اسم، هاتف، عنوان)"
          >
            <Users className="w-5 h-5" />
            {isImportingParents ? 'جاري الاستيراد...' : 'معلومات الأولياء'}
          </button>
          
          {students.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg transition-all border border-red-200"
            >
              <Trash2 className="w-5 h-5" />
              حذف الكل
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {totalStudents > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">إجمالي التلاميذ</p>
            <p className="text-2xl font-black text-slate-900">{totalStudents}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-pink-400 uppercase mb-1">إناث</p>
            <p className="text-2xl font-black text-slate-900">{femaleCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-blue-400 uppercase mb-1">ذكور</p>
            <p className="text-2xl font-black text-slate-900">{maleCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-emerald-400 uppercase mb-1">الأقسام</p>
            <p className="text-2xl font-black text-slate-900">{sectionsCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-orange-400 uppercase mb-1">المستويات</p>
            <p className="text-2xl font-black text-slate-900">{levelsCount}</p>
          </div>
        </div>
      )}

      {importError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{importError}</p>
        </div>
      )}

      {importSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>{importSuccess}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-bottom border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث بالاسم، رمز مسار أو القسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            عدد التلاميذ: {filteredStudents.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 min-w-[110px]">رمز مسار</th>
                <th className="px-6 py-4 min-w-[120px]">النسب</th>
                <th className="px-6 py-4 min-w-[120px]">الإسم</th>
                <th className="px-6 py-4 min-w-[70px]">السن</th>
                <th className="px-6 py-4 min-w-[70px]">النوع</th>
                <th className="px-6 py-4 min-w-[120px]">تاريخ الازدياد</th>
                <th className="px-6 py-4 min-w-[130px]">مكان الازدياد</th>
                <th className="px-6 py-4 min-w-[140px]">المستوى / القسم</th>
                <th className="px-6 py-4 min-w-[350px]">ولي الأمر</th>
                <th className="px-6 py-4 min-w-[100px]">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono text-sm text-indigo-600 font-medium whitespace-nowrap align-top">{student.massarCode}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium whitespace-nowrap align-top">{student.lastName}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium whitespace-nowrap align-top">{student.firstName}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium whitespace-nowrap align-top">
                      {calculateAge(student.birthDate) !== null ? `${calculateAge(student.birthDate)} سنة` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        student.gender === 'ذكر' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                      }`}>
                        {student.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap align-top">{student.birthDate}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap align-top">{student.birthPlace}</td>
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                      <div className="text-sm text-slate-900 font-medium">{student.level}</div>
                      <div className="text-xs text-slate-500">{student.section}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-normal align-top">
                      {(student.guardianName || student.fatherName || student.motherName) ? (
                        <div className="text-[11px] space-y-1.5 leading-tight text-black">
                          {student.guardianName && (
                            <div className="font-bold text-black bg-slate-100/50 p-1 rounded flex items-center justify-between">
                              <div>
                                <span className="text-slate-600 font-normal ml-1">الولي:</span>
                                {student.guardianName}
                              </div>
                              {student.guardianCin && <span className="text-[9px] text-slate-700 font-mono">({student.guardianCin})</span>}
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {student.fatherName && (
                              <div className="flex flex-col gap-0.5 text-black">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-slate-600 shrink-0">الأب:</span>
                                  <span className="truncate font-medium" title={student.fatherName}>{student.fatherName}</span>
                                  {student.fatherCin && <span className="text-[9px] text-slate-700 font-mono shrink-0">({student.fatherCin})</span>}
                                </div>
                                {(student.fatherPhone || student.fatherAddress) && (
                                  <div className="text-[9px] text-slate-800 flex flex-col gap-0.5 pr-2 border-r border-slate-200">
                                    {student.fatherPhone && <span>الهاتف: {student.fatherPhone}</span>}
                                    {student.fatherAddress && <span className="truncate" title={student.fatherAddress}>العنوان: {student.fatherAddress}</span>}
                                  </div>
                                )}
                              </div>
                            )}
                            {student.motherName && (
                              <div className="flex flex-col gap-0.5 text-black">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-slate-600 shrink-0">الأم:</span>
                                  <span className="truncate font-medium" title={student.motherName}>{student.motherName}</span>
                                  {student.motherCin && <span className="text-[9px] text-slate-700 font-mono shrink-0">({student.motherCin})</span>}
                                </div>
                                {(student.motherPhone || student.motherAddress) && (
                                  <div className="text-[9px] text-slate-800 flex flex-col gap-0.5 pr-2 border-r border-slate-200">
                                    {student.motherPhone && <span>الهاتف: {student.motherPhone}</span>}
                                    {student.motherAddress && <span className="truncate" title={student.motherAddress}>العنوان: {student.motherAddress}</span>}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {(student.guardianPhone || student.guardianAddress) && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-200 pt-1">
                              {student.guardianPhone && (
                                <div className="text-black font-medium">
                                  <span className="text-slate-600 font-normal ml-1">هاتف الولي:</span>
                                  <span className="font-mono">{student.guardianPhone}</span>
                                </div>
                              )}
                              {student.guardianAddress && (
                                <div className="text-black text-[10px]" title={student.guardianAddress}>
                                  <span className="text-slate-600 ml-1">عنوان الولي:</span>
                                  {student.guardianAddress}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs italic">لا توجد بيانات</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Users className="w-12 h-12 opacity-20" />
                      <p>لا يوجد تلاميذ حالياً. قم باستيراد البيانات من ملف إكسيل.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
