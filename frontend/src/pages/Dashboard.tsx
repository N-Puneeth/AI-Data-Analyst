import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sessionsApi, agentApi } from '../services/api';
import type { AnalysisSession, ConversationMessage } from '../types';
import { 
  Upload, Navigation, FileText, CheckCircle2, 
  Send, Plus, AlertTriangle, Terminal, BarChart2, Download, LogOut, MessageSquare, Settings
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => { 
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [activeSession?.messages]);

  const loadSessions = async () => {
    try {
      const data = await sessionsApi.list();
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        setCurrentSessionId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load sessions', error);
    }
  };

  const createNewChat = async () => {
    try {
      const newSession = await sessionsApi.create('New Analysis');
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
    } catch (error) {
      console.error('Failed to create session', error);
    }
  };

  const addLocalMessage = (sessionId: string, message: ConversationMessage) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s));
  };

  const updateLocalMessage = (sessionId: string, messageId: string, updates: Partial<ConversationMessage>) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? {
      ...s,
      messages: s.messages.map(m => m.id === messageId ? { ...m, ...updates } : m)
    } : s));
  };

  // --- NEW MARKDOWN EXPORT FUNCTION ---
  const exportToMarkdown = () => {
    if (!activeSession || activeSession.messages.length === 0) return;

    let markdownContent = `# DataPilot Analysis Report\n`;
    markdownContent += `**Dataset:** ${activeSession.title}\n`;
    markdownContent += `**Generated on:** ${new Date().toLocaleString()}\n\n---\n\n`;

    activeSession.messages.forEach(msg => {
      if (msg.role === 'user') {
        markdownContent += `### 👤 You asked:\n${msg.content}\n\n`;
      } else if (msg.role === 'ai' && msg.content) {
        markdownContent += `### 🤖 AI Analysis:\n${msg.content}\n\n`;
        if (msg.generated_code) {
          markdownContent += `**Generated Python Code:**\n\`\`\`python\n${msg.generated_code}\n\`\`\`\n\n`;
        }
      } else if (msg.role === 'error') {
        markdownContent += `### ⚠️ Error:\n${msg.content}\n\n`;
      }
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(activeSession.title || 'report').replace(/\s+/g, '_')}_Report.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPDF = useReactToPrint({
    contentRef: reportRef,
    documentTitle: 'DataPilot_Analysis_Report',
    onAfterPrint: () => alert('PDF export completed!'),
  });

  const downloadImage = (base64String: string, index: number) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64String}`;
    link.download = `Chart_${index + 1}.png`;
    link.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    setIsUploading(true);
    let targetSessionId = currentSessionId;
    
    if (!targetSessionId || activeSession?.messages.length! > 0) {
      try {
        const newSession = await sessionsApi.create(uploadedFile.name.replace('.csv', '').replace('.xlsx', ''));
        setSessions([newSession, ...sessions]);
        targetSessionId = newSession.id;
        setCurrentSessionId(targetSessionId);
      } catch (error) {
         console.error(error);
         setIsUploading(false);
         return;
      }
    }

    setIsProcessing(true);

    const initId = Date.now().toString();
    addLocalMessage(targetSessionId!, { id: initId, role: 'user', content: `Analyze the dataset: ${uploadedFile.name}`, created_at: new Date().toISOString() });

    const aiId = (Date.now() + 1).toString();
    addLocalMessage(targetSessionId!, { id: aiId, role: 'ai', content: '', execution_status: JSON.stringify(['Initializing secure workspace...', 'Writing Python script...', 'Analyzing data...']), created_at: new Date().toISOString() });
    
    try {
      const response = await agentApi.analyze('Generate a comprehensive analytical report covering Dataset overview, Key findings, and Missing data. Print it clearly and plot relevant charts.', targetSessionId!, uploadedFile);
      
      const codeLines = response.ai_code_written ? response.ai_code_written.split('\n').length : 0;
      updateLocalMessage(targetSessionId!, aiId, {
        content: response.insights || '', 
        generated_code: response.ai_code_written,
        images: response.images,
        execution_status: JSON.stringify([`DataPilot Engine connected`, `Analysis generated (${codeLines} lines)`, `Execution finished`, `Ready for queries`])
      });
      // Optionally reload sessions to sync state
      loadSessions();
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || "Execution failed.";
      updateLocalMessage(targetSessionId!, aiId, { role: 'error', content: `Error: ${errMsg}`, execution_status: undefined });
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentSessionId) return;

    const userText = input;
    setInput('');
    addLocalMessage(currentSessionId, { id: Date.now().toString(), role: 'user', content: userText, created_at: new Date().toISOString() });
    setIsProcessing(true);

    const aiId = (Date.now() + 1).toString();
    addLocalMessage(currentSessionId, { id: aiId, role: 'ai', content: '', execution_status: JSON.stringify(['Writing custom logic...', 'Running in secure environment...']), created_at: new Date().toISOString() });

    try {
      const response = await agentApi.analyze(userText, currentSessionId);
      const codeLines = response.ai_code_written ? response.ai_code_written.split('\n').length : 0;

      updateLocalMessage(currentSessionId, aiId, {
        content: response.insights || '',
        generated_code: response.ai_code_written,
        images: response.images,
        execution_status: JSON.stringify([`Code successfully generated (${codeLines} lines)`, `Task completed`])
      });
      loadSessions();
    } catch (error: any) {
      updateLocalMessage(currentSessionId, aiId, { role: 'error', content: `Error: ${error.message}`, execution_status: undefined });
    } finally {
      setIsProcessing(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'DP';
    return name.substring(0, 2).toUpperCase();
  };

  const parseStatus = (statusStr?: string) => {
    if (!statusStr) return [];
    try {
      return JSON.parse(statusStr);
    } catch (e) {
      return [];
    }
  };

  return (
    <div className="flex h-screen bg-[#0B1120] text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-50">
      
      {/* CHATGPT-STYLE SIDEBAR (Added .no-print) */}
      <div className="no-print w-64 bg-[#080C17] border-r border-slate-800/80 flex flex-col z-20 shadow-xl">
        <div className="p-5 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Navigation className="w-4 h-4 text-white" strokeWidth={2.5}/>
          </div>
          <span className="font-extrabold tracking-tight text-slate-100 text-lg">DataPilot <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">AI</span></span>
        </div>
        
        <div className="px-4 py-2">
           <button 
             onClick={createNewChat} 
             className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-semibold shadow-md shadow-blue-900/20"
           >
             <Plus className="w-4 h-4" /> New Chat
           </button>
        </div>
        
        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest pl-1">Recent</div>
          {sessions.map((session) => (
            <div 
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm ${
                currentSessionId === session.id 
                  ? 'bg-slate-800/80 text-cyan-50 font-medium border border-slate-700/50' 
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
              }`}
            >
              <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="truncate">{session.title || 'New Analysis'}</span>
            </div>
          ))}
        </div>
        
        {/* Modern Log Out Profile Area */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate('/settings')} className="flex items-center gap-3 px-2 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors w-full">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>
            <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-800/50">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs text-slate-300 border border-slate-700">{getInitials(user?.name)}</div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-300 truncate w-24">{user?.name || user?.email}</span>
                  </div>
               </div>
               <button onClick={logout} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group" title="Log out">
                  <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#0F172A]" ref={reportRef}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full filter blur-[120px] pointer-events-none"></div>

        {/* --- EXPORT BUTTONS --- */}
        <div className="absolute top-4 right-6 z-20 flex gap-3 no-print">
            {activeSession && activeSession.messages.length > 0 && (
                <>
                  <button 
                    onClick={exportToMarkdown} 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-all border border-slate-700/50 shadow-sm"
                  >
                      <FileText className="w-4 h-4 text-cyan-400" /> Markdown
                  </button>
                  <button 
                    onClick={exportPDF} 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white transition-all shadow-md shadow-blue-900/20"
                  >
                    <Download className="w-4 h-4" /> PDF
                  </button>
                </>
            )}
        </div>

        {!activeSession || activeSession.messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
             <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shadow-xl shadow-black/40">
                <BarChart2 className="w-10 h-10 text-cyan-400" />
             </div>
             <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Welcome to DataPilot</h2>
             <p className="text-slate-400 mb-10 max-w-md text-center text-base">Upload a spreadsheet, and our AI agent will autonomously write and execute code to uncover insights.</p>
             <label className={`bg-white text-slate-900 hover:bg-slate-100 px-8 py-3.5 rounded-xl font-bold cursor-pointer transition-all shadow-lg hover:-translate-y-0.5 flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isUploading ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div> : <Upload className="w-5 h-5" />}
                {isUploading ? 'Uploading...' : 'Upload Dataset'}
                <input type="file" accept=".csv, .xlsx" className="sr-only" onChange={handleFileUpload} disabled={isUploading} />
             </label>
             <p className="mt-4 text-xs text-slate-500 font-medium">Supports .CSV and .XLSX files</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth z-10">
              <div className="max-w-4xl mx-auto space-y-10">
                {activeSession.messages.map((msg) => {
                  const statusList = parseStatus(msg.execution_status);
                  return (
                    <div key={msg.id} className="flex gap-5">
                      <div className="flex-shrink-0 mt-1">
                        {msg.role === 'user' ? (
                          <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-sm font-bold text-slate-300 shadow-md">U</div>
                        ) : msg.role === 'ai' ? (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Terminal className="w-5 h-5 text-white" strokeWidth={2.5}/>
                          </div>
                        ) : null}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {msg.role === 'user' && (
                          <div className="text-slate-200 font-semibold text-[15px] leading-relaxed mt-2">{msg.content}</div>
                        )}

                        {msg.role === 'error' && (
                           <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-start gap-3 mt-1 shadow-sm">
                              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              <div className="font-medium text-sm leading-relaxed">{msg.content}</div>
                           </div>
                        )}

                        {msg.role === 'ai' && (
                          <div className="bg-transparent mt-1">
                            {statusList.length > 0 && (
                              <div className="mb-6 space-y-2.5 font-mono text-xs">
                                {statusList.map((step: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2.5 text-slate-400">
                                    {step.includes('finished') || step.includes('connected') || step.includes('completed') ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                                    )}
                                    {step}
                                  </div>
                                ))}
                              </div>
                            )}

                            {msg.generated_code && (
                              <div className="mb-6 bg-[#0B1120] rounded-xl border border-slate-800 overflow-hidden shadow-xl shadow-black/20">
                                <div className="bg-slate-900/60 px-4 py-2.5 text-xs font-mono text-slate-400 flex justify-between items-center border-b border-slate-800">
                                  <span className="flex items-center gap-2"><Terminal className="w-4 h-4 text-cyan-500"/> analysis.py</span>
                                </div>
                                <pre className="p-5 text-[12px] leading-relaxed text-cyan-300 font-mono overflow-x-auto">
                                  {msg.generated_code}
                                </pre>
                              </div>
                            )}
                            
                            {msg.content && (
                              <div className="mb-6 text-[15px] text-slate-200 p-6 bg-slate-800/20 border border-slate-700/50 rounded-xl shadow-sm">
                                <h3 className="text-xs font-bold text-cyan-500/80 mb-4 uppercase tracking-widest">Output</h3>
                                <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</pre>
                              </div>
                            )}

                            {msg.images && msg.images.length > 0 && (
                              <div className="space-y-4">
                                <h3 className="text-xs font-bold text-emerald-500/80 uppercase tracking-widest flex items-center gap-2">
                                  <BarChart2 className="w-4 h-4" /> Visualizations
                                </h3>
                                {msg.images.map((base64String, idx) => (
                                  <div key={idx} className="group relative bg-white p-2 rounded-xl border border-slate-700 shadow-xl inline-block w-full max-w-2xl">
                                    <img 
                                      src={`data:image/png;base64,${base64String}`} 
                                      alt={`Chart ${idx}`} 
                                      className="w-full h-auto rounded-lg"
                                    />
                                    <button 
                                      onClick={() => downloadImage(base64String, idx)}
                                      className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg backdrop-blur-sm"
                                      title="Download PNG"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input Box (Added .no-print) */}
            <div className="no-print p-5 bg-transparent z-20 pb-8">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-end bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl overflow-hidden focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all shadow-2xl">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                  placeholder="Ask a question about the dataset..."
                  className="w-full max-h-40 bg-transparent text-slate-100 placeholder-slate-400 p-5 outline-none resize-none font-medium"
                  rows={1}
                  disabled={isProcessing}
                />
                <div className="p-3">
                  <button 
                    type="submit" 
                    disabled={!input.trim() || isProcessing}
                    className="p-3 bg-white text-slate-900 rounded-xl hover:bg-slate-200 disabled:bg-slate-700 disabled:text-slate-500 transition-all shadow-lg"
                  >
                    {isProcessing ? <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}