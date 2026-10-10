import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { Navigation, ArrowLeft, User, Mail, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });
    
    try {
      const updatedUser = await authApi.updateProfile({ name });
      setUser(updatedUser);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      setPasswordLoading(false);
      return;
    }

    try {
      await authApi.changePassword({ 
        current_password: currentPassword, 
        new_password: newPassword,
        new_password_confirm: confirmPassword
      });
      setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0B1120] text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-50">
      {/* Sidebar Area - Just for matching layout */}
      <div className="w-64 bg-[#080C17] border-r border-slate-800/80 flex flex-col z-20 shadow-xl shrink-0">
        <div className="p-5 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Navigation className="w-4 h-4 text-white" strokeWidth={2.5}/>
          </div>
          <span className="font-extrabold tracking-tight text-slate-100 text-lg">DataPilot <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">AI</span></span>
        </div>
        
        <div className="px-4 py-4 mt-4">
           <button 
             onClick={() => navigate('/dashboard')} 
             className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl transition-all font-medium border border-slate-700/50"
           >
             <ArrowLeft className="w-4 h-4" /> Back to Dashboard
           </button>
        </div>
      </div>

      {/* Main Settings Area */}
      <div className="flex-1 overflow-y-auto relative bg-[#0F172A] p-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full filter blur-[120px] pointer-events-none"></div>

        <div className="max-w-2xl mx-auto z-10 relative">
          <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-slate-400 mb-10">Manage your profile and security preferences.</p>

          <div className="space-y-8">
            {/* Profile Section */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" /> Profile Information
              </h2>

              {profileMessage.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${profileMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                  {profileMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input 
                      type="email" 
                      value={email}
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-700/50 bg-slate-900/50 text-slate-500 outline-none cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Email addresses cannot be changed currently.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                      <User className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-900/80 text-slate-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    type="submit"
                    disabled={profileLoading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-md shadow-blue-900/20 disabled:opacity-70 flex items-center gap-2"
                  >
                    {profileLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    Save Profile
                  </button>
                </div>
              </form>
            </div>

            {/* Password Section */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" /> Security
              </h2>

              {passwordMessage.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${passwordMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                  {passwordMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  {passwordMessage.text}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-900/80 text-slate-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-900/80 text-slate-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-900/80 text-slate-200 outline-none transition-all"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    type="submit"
                    disabled={passwordLoading}
                    className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all shadow-md disabled:opacity-70 flex items-center gap-2 border border-slate-600"
                  >
                    {passwordLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
            
            <div className="text-center">
              <p className="text-slate-500 text-xs">
                Account created on {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
