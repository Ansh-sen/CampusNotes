import { useAcademicDropdowns } from '@/hooks/useAcademicData';
import { GraduationCap, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-2">{label}</label>
    <div className="relative group">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full h-14 pl-5 pr-10 rounded-2xl border appearance-none text-xs font-black transition-all outline-none",
          disabled
            ? "border-border/20 bg-muted/20 text-muted-foreground/30 cursor-not-allowed"
            : "border-border/50 bg-card text-foreground focus:ring-4 focus:ring-primary/5 focus:border-primary cursor-pointer hover:border-primary/40 shadow-sm"
        )}
      >
        <option value="" className="bg-card text-foreground">{disabled ? 'PROTOCOL LOCKED' : placeholder.toUpperCase()}</option>
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>
        ))}
      </select>
      <ChevronDown className={cn(
        "absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-transform duration-300 group-focus-within:rotate-180",
        disabled ? "text-muted-foreground/20" : "text-muted-foreground/40"
      )} />
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
      <div className="flex flex-col gap-2 mb-8 bg-card p-6 rounded-[2.5rem] border border-border/50 shadow-xl shadow-black/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight leading-none">Academic Details</h2>
        </div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40 ml-11">Phase 1: Course Information</p>
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
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-2">Subject Node</label>
        <div className="relative group">
          <select
            value={currentValues.subject_code}
            onChange={e => {
              const found = subjects.find(s => s.subject_code === e.target.value);
              notify({ subject_code: e.target.value, subject_name: found?.subject_name || '' });
            }}
            disabled={!currentValues.semester || subjects.length === 0}
            className={cn(
              "w-full h-14 pl-5 pr-10 rounded-2xl border appearance-none text-xs font-black transition-all outline-none",
              !currentValues.semester || subjects.length === 0
                ? "border-border/20 bg-muted/20 text-muted-foreground/30 cursor-not-allowed"
                : "border-border/50 bg-card text-foreground focus:ring-4 focus:ring-primary/5 focus:border-primary cursor-pointer hover:border-primary/40 shadow-sm"
            )}
          >
            <option value="" className="bg-card text-foreground">{!currentValues.semester ? 'PROTOCOL LOCKED' : 'SELECT SUBJECT'}</option>
            {subjects.map(s => (
              <option key={s.subject_code} value={s.subject_code} className="bg-card text-foreground uppercase">
                {s.subject_code} — {s.subject_name}
              </option>
            ))}
          </select>
          <ChevronDown className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-transform duration-300 group-focus-within:rotate-180",
            !currentValues.semester ? "text-muted-foreground/20" : "text-muted-foreground/40"
          )} />
        </div>
      </div>

      {/* Selected Summary Badge */}
      {currentValues.subject_code && (
        <div className="flex items-center gap-4 px-5 py-4 bg-primary/10 rounded-[1.5rem] border border-primary/20 shadow-xl shadow-primary/5 animate-in zoom-in-95 duration-500">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1 opacity-60">Verified Target</span>
            <span className="text-xs font-black text-foreground leading-tight uppercase tracking-tight">
              {currentValues.subject_code} — {currentValues.subject_name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
