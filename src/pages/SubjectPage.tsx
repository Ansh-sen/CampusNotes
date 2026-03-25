import { useState, useEffect } from 'react';
import { API_URL } from '@/config';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, Search, GraduationCap } from 'lucide-react';
import { ListingCard } from '@/components/domain/ListingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

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
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--text-muted))] hover:text-[hsl(var(--primary))] transition-colors pt-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Subject Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-[hsl(var(--primary))/10] rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-[hsl(var(--primary))]" />
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[hsl(var(--primary))/10] text-[hsl(var(--primary))] text-xs font-bold tracking-wide">
                    {subject_code}
                  </span>
                  {subject?.programme && (
                    <span className="text-xs text-gray-400 font-medium">{subject.programme}</span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-[hsl(var(--text))] mt-1 leading-tight">
                  {subject?.subject_name || subject_code}
                </h1>
                {subject?.branch && (
                  <p className="text-sm text-[hsl(var(--text-muted))] font-medium mt-0.5">{subject.branch}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats bar */}
        {!loading && (
          <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[hsl(var(--primary))]" />
              <span className="text-sm font-bold text-[hsl(var(--text))]">{listings.length}</span>
              <span className="text-sm text-gray-400">listing{listings.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>

      {/* Listings */}
      <div>
        <h2 className="text-lg font-bold tracking-tight border-l-4 border-[hsl(var(--primary))] pl-3 mb-4">
          Notes & Materials
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="space-y-2">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[hsl(var(--muted))] p-10 text-center space-y-4">
            <div className="mx-auto bg-[hsl(var(--muted))] w-14 h-14 rounded-full flex items-center justify-center">
              <Search className="h-7 w-7 text-[hsl(var(--text-muted))]" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-[hsl(var(--text))]">No listings yet</p>
              <p className="text-sm text-[hsl(var(--text-muted))]">Be the first to share notes for this subject!</p>
            </div>
            <Link to="/create">
              <Button className="mt-2 bg-[hsl(var(--primary))] text-white rounded-xl px-6">
                Sell Notes
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {listings.map((listing: any) => (
              <Link key={listing.id} to={`/listing/${listing.id}`}>
                <ListingCard listing={listing} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
