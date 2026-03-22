import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({ title: 'Invalid Link', description: 'Reset token is missing.', type: 'error' });
      navigate('/login');
    }
  }, [token, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Mismatch', description: 'Passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        toast({ title: 'Success', description: 'Password updated! Please log in.', type: 'success' });
        navigate('/login');
      } else {
        toast({ title: 'Error', description: data.error, type: 'error' });
      }
    } catch (error) {
      toast({ title: 'Connection Error', description: 'Failed to reset password.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-white to-[hsl(var(--muted))/30]">
        <div className="w-full max-w-md">
            <Card className="border-none shadow-2xl glass rounded-[2.5rem] overflow-hidden">
                <div className="h-2 bg-[hsl(var(--primary))] w-full"></div>
                <CardHeader className="pt-10 pb-6 text-center">
                    <div className="w-20 h-20 bg-[hsl(var(--primary))/10] rounded-3xl flex items-center justify-center mx-auto mb-6 -rotate-3">
                        <Lock size={40} className="text-[hsl(var(--primary))] rotate-3" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight">Set New Password</CardTitle>
                    <CardDescription className="text-base font-medium mt-2">
                        Create a strong password for your account.
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--text-muted))] ml-1">New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] group-focus-within:text-[hsl(var(--primary))] transition-colors" size={20} />
                                <input 
                                    type={showPass ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    className="w-full h-14 pl-12 pr-12 rounded-2xl bg-[hsl(var(--muted))/50] border-2 border-transparent focus:border-[hsl(var(--primary))] focus:bg-white transition-all outline-none font-bold text-sm"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--primary))]"
                                >
                                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--text-muted))] ml-1">Confirm Password</label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] group-focus-within:text-[hsl(var(--primary))] transition-colors" size={20} />
                                <input 
                                    type={showPass ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-[hsl(var(--muted))/50] border-2 border-transparent focus:border-[hsl(var(--primary))] focus:bg-white transition-all outline-none font-bold text-sm"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black text-base bg-[hsl(var(--primary))] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[hsl(var(--primary))/20]"
                        >
                            {loading ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
            
            <p className="text-center mt-8 text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">
                Safe. Secure. Student-To-Student.
            </p>
        </div>
    </div>
  );
}
