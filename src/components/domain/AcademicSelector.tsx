import { useAcademicDropdowns } from '@/hooks/useAcademicData';
import { GraduationCap, ChevronDown } from 'lucide-react';

interface AcademicSelectorProps {
  onChange: (data: {
    programme: string;
    branch: string;
    semester: string;
    subject_code: string;
    subject_name: string;
  }) => void;
  values?: {
    programme: string;
    branch: string;
    semester: string;
    subject_code: string;
    subject_name: string;
  };
  className?: string;
}

const SelectField = ({
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  disabled: boolean;
  placeholder: string;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full h-11 pl-3 pr-8 rounded-xl border appearance-none text-sm font-medium transition-all
          ${disabled
            ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
            : 'border-[hsl(var(--muted))] bg-white focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none cursor-pointer hover:border-[hsl(var(--primary))/50]'
          }`}
      >
        <option value="">{disabled ? '— locked —' : placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
    </div>
  </div>
);

export function AcademicSelector({ onChange, values, className = '' }: AcademicSelectorProps) {
  const currentValues = {
    programme: values?.programme || '',
    branch: values?.branch || '',
    semester: values?.semester || '',
    subject_code: values?.subject_code || '',
    subject_name: values?.subject_name || ''
  };

  const {
    programmes, branches, semesters, subjects
  } = useAcademicDropdowns(currentValues);

  const notify = (updates: Partial<typeof currentValues>) => {
    onChange({
      ...currentValues,
      ...updates,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <GraduationCap className="w-5 h-5 text-[hsl(var(--primary))]" />
        <span className="text-sm font-bold text-[hsl(var(--text))]">Academic Details</span>
      </div>

      {/* Programme */}
      <SelectField
        label="Programme"
        value={currentValues.programme}
        onChange={val => notify({ programme: val, branch: '', semester: '', subject_code: '', subject_name: '' })}
        options={programmes}
        disabled={false}
        placeholder="Select Programme"
      />

      {/* Branch */}
      <SelectField
        label="Branch / Specialization"
        value={currentValues.branch}
        onChange={val => notify({ branch: val, semester: '', subject_code: '', subject_name: '' })}
        options={branches}
        disabled={!currentValues.programme}
        placeholder="Select Branch"
      />

      {/* Semester */}
      <SelectField
        label="Semester"
        value={currentValues.semester}
        onChange={val => notify({ semester: val, subject_code: '', subject_name: '' })}
        options={semesters.map(String)}
        disabled={!currentValues.branch}
        placeholder="Select Semester"
      />

      {/* Subject */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Subject</label>
        <div className="relative">
          <select
            value={currentValues.subject_code}
            onChange={e => {
              const found = subjects.find(s => s.subject_code === e.target.value);
              notify({ subject_code: e.target.value, subject_name: found?.subject_name || '' });
            }}
            disabled={!currentValues.semester || subjects.length === 0}
            className={`w-full h-11 pl-3 pr-8 rounded-xl border appearance-none text-sm font-medium transition-all
              ${!currentValues.semester || subjects.length === 0
                ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                : 'border-[hsl(var(--muted))] bg-white focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none cursor-pointer hover:border-[hsl(var(--primary))/50]'
              }`}
          >
            <option value="">{!currentValues.semester ? '— locked —' : 'Select Subject'}</option>
            {subjects.map(s => (
              <option key={s.subject_code} value={s.subject_code}>
                {s.subject_code} — {s.subject_name}
              </option>
            ))}
          </select>
          <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${!currentValues.semester ? 'text-gray-300' : 'text-gray-400'}`} />
        </div>
      </div>

      {/* Selected Summary Badge */}
      {currentValues.subject_code && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[hsl(var(--primary))/8] rounded-xl border border-[hsl(var(--primary))/20]">
          <GraduationCap className="w-4 h-4 text-[hsl(var(--primary))] shrink-0" />
          <span className="text-xs font-semibold text-[hsl(var(--primary))] leading-tight">
            {currentValues.subject_code} — {currentValues.subject_name}
          </span>
        </div>
      )}
    </div>
  );
}
