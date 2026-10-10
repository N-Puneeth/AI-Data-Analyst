import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Navigation,
  ArrowRight,
  TrendingUp,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Automatically redirect when authenticated (fixes React state race condition on login)
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        await login(email, password);
        // Navigation is now handled by the useEffect watching isAuthenticated
      } else {
        if (password !== passwordConfirm) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await register({ name, email, password, password_confirm: passwordConfirm });
        setSuccessMsg('Account created successfully! Please sign in.');
        setIsLogin(true);
        setPassword('');
        setPasswordConfirm('');
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let errorMsg = 'Authentication failed. Please try again.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail[0]?.msg || errorMsg;
        }
      } else if (!err.response) {
        errorMsg = 'Network Error. Could not connect to the server.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex w-full font-sans selection:bg-cyan-500 selection:text-white">
      {/* Left Pane - Login/Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 relative bg-white shadow-[10px_0_40px_-15px_rgba(0,0,0,0.05)] z-10">
        <div className="absolute top-8 left-8 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-600 transition-colors">
             <ArrowRight className="w-5 h-5 rotate-180" />
             <span className="text-sm font-semibold">Back to Home</span>
          </div>
        </div>

        <div className="w-full max-w-sm mt-10">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 mb-6">
              <Navigation className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-slate-500 font-medium">
              {isLogin ? 'Enter your credentials to access your dashboard.' : 'Start analyzing your data in seconds.'}
            </p>
          </div>

          {/* Login / Sign Up Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign Up
            </button>
          </div>

          {/* Status Messages */}
          {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-xl text-center">{error}</div>}
          {successMsg && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-semibold rounded-xl text-center">{successMsg}</div>}

          {/* Auth Form */}
          <form className="space-y-5" onSubmit={handleAuthSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Name (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe" 
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 bg-slate-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700">Password</label>
                {isLogin && <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700">Forgot password?</a>}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 bg-slate-50 focus:bg-white"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3.5 rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25 flex justify-center items-center gap-2 mt-4 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? 'Access Dashboard' : 'Create Account'} 
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
          
        </div>
      </div>

      {/* Right Pane - Futuristic Dark Showcase */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 p-12 flex-col justify-center items-center relative overflow-hidden">
        {/* Decorative background blurs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>

        <div className="max-w-lg w-full relative z-10 text-white">
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            Navigate your data <br/>with absolute clarity.
          </h2>
          <p className="text-xl text-slate-400 mb-12 font-medium">
            Join elite teams piloting their decisions with autonomous AI analysis.
          </p>

          {/* Glowing Dark Mode Chart Mockup */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 w-full h-80 flex flex-col relative overflow-hidden shadow-2xl shadow-black/50">
            <div className="mb-6 z-10 flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-200">Revenue Trajectory</p>
                <p className="text-xs text-slate-400 mt-1">Q1-Q4 Predictive Modeling vs Actuals</p>
              </div>
              <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +24% YoY
              </div>
            </div>
            
            <svg className="w-full h-56 absolute bottom-0 left-0 right-0" viewBox="0 0 100 50" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity="0.4"/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity="0.5"/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0,50 L0,40 Q15,15 25,25 T45,35 T65,20 T85,25 T100,10 L100,50 Z" fill="url(#blueGlow)" />
              <path d="M0,50 L0,45 Q15,25 25,30 T45,40 T65,30 T85,35 T100,20 L100,50 Z" fill="url(#cyanGlow)" />
              <path d="M0,40 Q15,15 25,25 T45,35 T65,20 T85,25 T100,10" fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="2 2" />
              <path d="M0,45 Q15,25 25,30 T45,40 T65,30 T85,35 T100,20" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
