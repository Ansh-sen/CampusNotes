import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

export interface SubjectOption {
  subject_code: string;
  subject_name: string;
}

// Fetch unique programmes
export function useProgrammes() {
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/programmes`)
      .then(r => r.json())
      .then(json => setProgrammes(json.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { programmes, loading };
}

// Fetch branches for a programme
export function useBranches(programme: string) {
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!programme) { setBranches([]); return; }
    setLoading(true);
    fetch(`${API_BASE}/branches?programme=${encodeURIComponent(programme)}`)
      .then(r => r.json())
      .then(json => setBranches(json.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [programme]);

  return { branches, loading };
}

// Fetch semesters for a programme + branch
export function useSemesters(programme: string, branch: string) {
  const [semesters, setSemesters] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!programme || !branch) { setSemesters([]); return; }
    setLoading(true);
    fetch(`${API_BASE}/semesters?programme=${encodeURIComponent(programme)}&branch=${encodeURIComponent(branch)}`)
      .then(r => r.json())
      .then(json => setSemesters(json.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [programme, branch]);

  return { semesters, loading };
}

// Fetch subjects for a programme + branch + semester
export function useSubjects(programme: string, branch: string, semester: string | number) {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!programme || !branch || !semester) { setSubjects([]); return; }
    setLoading(true);
    fetch(`${API_BASE}/subjects?programme=${encodeURIComponent(programme)}&branch=${encodeURIComponent(branch)}&semester=${semester}`)
      .then(r => r.json())
      .then(json => setSubjects(json.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [programme, branch, semester]);

  return { subjects, loading };
}

// Combined cascading hook — ideal for forms
export function useAcademicDropdowns(values: {
  programme: string;
  branch: string;
  semester: string;
  subject_code: string;
  subject_name: string;
}) {
  const { programmes } = useProgrammes();
  const { branches } = useBranches(values.programme);
  const { semesters } = useSemesters(values.programme, values.branch);
  const { subjects } = useSubjects(values.programme, values.branch, values.semester);

  return {
    programmes, branches, semesters, subjects,
  };
}
