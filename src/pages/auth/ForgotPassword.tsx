import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

export function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setSubmitted(true);
        toast({ title: 'Success', description: data.message, type: 'success' });
      } else {
        toast({ title: 'Error', description: data.error, type: 'error' });
      }
    } catch (error) {
      toast({ title: 'Connection Error', description: 'Failed to reach the server.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-white to-[hsl(var(--muted))/30]">
        <div className="w-full max-w-md">
            <button 
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--primary))] font-bold text-sm mb-8 transition-colors group"
            >
                <div className="p-2 rounded-full group-hover:bg-[hsl(var(--primary))/10] transition-all">
                    <ArrowLeft size={18} />
                </div>
                Back to Login
            </button>

            <Card className="border-none shadow-2xl glass rounded-[2.5rem] overflow-hidden">
                <div className="h-2 bg-[hsl(var(--primary))] w-full"></div>
                <CardHeader className="pt-10 pb-6 text-center">
                    <div className="w-20 h-20 bg-[hsl(var(--primary))/10] rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                        <ShieldCheck size={40} className="text-[hsl(var(--primary))] -rotate-3" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight">Forgot Password?</CardTitle>
                    <CardDescription className="text-base font-medium mt-2">
                        {submitted 
                          ? "Check your console for the reset link (Mock System)."
                          : "Enter your email and we'll send you a recovery link."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-10">
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--text-muted))] ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] group-focus-within:text-[hsl(var(--primary))] transition-colors" size={20} />
                                    <input 
                                        type="email"
                                        required
                                        placeholder="yourname@domain.com"
                                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-[hsl(var(--muted))/50] border-2 border-transparent focus:border-[hsl(var(--primary))] focus:bg-white transition-all outline-none font-bold text-sm"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full h-14 rounded-2xl font-black text-base bg-[hsl(var(--primary))] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[hsl(var(--primary))/20]"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6 py-4">
                            <div className="p-4 bg-green-50 rounded-2xl border border-green-100 text-green-700 text-sm font-bold">
                                A reset link has been generated. Since this is a sample project, check the backend console logs for the link.
                            </div>
                            <Button 
                                onClick={() => navigate('/login')}
                                variant="outline"
                                className="w-full h-14 rounded-2xl font-black text-base border-2"
                            >
                                Return to Login
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <p className="text-center mt-8 text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">
                Safe. Secure. Student-To-Student.
            </p>
        </div>
    </div>
  );
}
