import { useState, useEffect } from 'react';
import { API_URL } from '@/config';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, Search, GraduationCap } from 'lucide-react';
import { ListingCard } from '@/components/domain/ListingCard';
import { Skeleton } from '@/components/ui/skeleton';

interface Subject {
  subject_code: string;
  subject_name: string;
  programme?: string;
  branch?: string;
}

export function SubjectPage() {
  const { subject_code } = useParams<{ subject_code: string }>();
  const [listings, setListings] = useState<any[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subject_code) return;
    fetchData();
  }, [subject_code]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch listings for this subject
      const [listingsRes] = await Promise.all([
        fetch(`${API_URL}/listings/subject/${encodeURIComponent(subject_code!)}`),
        // Fetch subject info from the rgpv_subjects table via subjects endpoint
        fetch(`${API_URL}/subjects?programme=&branch=&semester=0&subject_code=${encodeURIComponent(subject_code!)}`)
          .catch(() => null),
      ]);

      const listingsJson = await listingsRes.json();
      setListings(listingsJson.data || []);

      // Try to get subject info from listings or build from subject_code
      const data = listingsJson.data || [];
      if (data.length > 0 && data[0].subject_code) {
        setSubject({
          subject_code: data[0].subject_code,
          subject_name: data[0].subject || data[0].subject_code,
          programme: data[0].programme,
          branch: data[0].branch,
        });
      } else {
        setSubject({ subject_code: subject_code!, subject_name: subject_code! });
      }
    } catch (error) {
      console.error('Failed to fetch subject page data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch subject name from RGPV table separately
  useEffect(() => {
    if (!subject_code) return;
    // Try to resolve subject name from a known listing's data if not already resolved
    fetch(`${API_URL}/subjects?programme=B.E.&branch=Computer Science %26 Engineering&semester=1`)
      .then(r => r.json())
      .catch(() => ({}));
  }, []);

  return (
    <div className="w-full max-w-screen-sm mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-primary transition-all group/back pt-4">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover/back:-translate-x-1" />
        Return to Nexus
      </Link>

      {/* Subject Header */}
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-32 bg-muted/50 rounded-lg" />
                <Skeleton className="h-8 w-64 bg-muted/50 rounded-lg" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                    {subject_code}
                  </span>
                  {subject?.programme && (
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{subject.programme}</span>
                  )}
                </div>
                <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-[0.9]">
                  {subject?.subject_name || subject_code}
                </h1>
                {subject?.branch && (
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] opacity-40 mt-1">{subject.branch}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        {!loading && (
          <div className="flex items-center gap-6 px-6 py-4 bg-muted/30 rounded-[2rem] border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-foreground tabular-nums leading-none">{listings.length}</span>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Assets Available</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Listings */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
            Intelligence Repository
          </h2>
          <div className="h-[1px] flex-1 bg-border/50 ml-4" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="space-y-4">
                <Skeleton className="aspect-video w-full rounded-[2.5rem] bg-muted/30" />
                <div className="space-y-3 px-4">
                  <Skeleton className="h-6 w-3/4 bg-muted/30" />
                  <Skeleton className="h-4 w-1/2 bg-muted/20" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-[3rem] border border-dashed border-border/50 bg-muted/10 p-16 text-center space-y-8 animate-in zoom-in-95 duration-700">
            <div className="mx-auto bg-muted w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-inner">
              <Search className="h-8 w-8 text-muted-foreground/20" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black text-foreground uppercase tracking-tight">Void Detected</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Be the first to seed intelligence for this subject</p>
            </div>
            <Link to="/create" className="inline-block">
              <button className="h-14 px-10 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all">
                Publish Assets
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {listings.map((listing, idx) => (
              <Link key={listing.id} to={`/listing/${listing.id}`}>
                <ListingCard listing={listing} index={idx} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
