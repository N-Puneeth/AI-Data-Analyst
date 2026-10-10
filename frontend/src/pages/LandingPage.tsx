import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Navigation,
  Sparkles, 
  BarChart3, 
  Search, 
  Cpu, 
  Database,
  ArrowRight,
  Send,
  Compass,
  Radar,
  TrendingUp
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-cyan-500 selection:text-white">
      
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between bg-slate-50/90 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-200/50">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-md">
            <Navigation className="w-5 h-5" strokeWidth={3} />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">DataPilot<span className="text-blue-600">.ai</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 font-semibold text-slate-600 text-sm">
          <a href="#" className="hover:text-blue-600 transition-colors">Platform</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Solutions</a>
        </div>

        <button 
          onClick={() => navigate('/auth')}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
        >
          Sign In
        </button>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-4 pt-24 pb-20 text-center flex flex-col items-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-8 uppercase tracking-widest border border-blue-200">
            <Sparkles className="w-3 h-3" /> Introducing DataPilot
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Pilot your data to <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">insights</span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-600 mb-10 max-w-3xl leading-relaxed font-medium">
            Upload your datasets and let our AI co-pilot autonomously clean, analyze, and generate actionable visual intelligence.
          </p>
          
          <button 
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-10 py-4 rounded-full font-bold text-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-xl shadow-blue-500/30 transform hover:-translate-y-1 mb-12 flex items-center gap-3"
          >
            Launch DataPilot <ArrowRight className="w-6 h-6" />
          </button>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl">
            <span className="flex items-center gap-2 border border-slate-200 rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 bg-white shadow-sm hover:border-blue-300 transition-colors cursor-default"><BarChart3 className="w-4 h-4 text-blue-500"/> Instant Visualizations</span>
            <span className="flex items-center gap-2 border border-slate-200 rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 bg-white shadow-sm hover:border-blue-300 transition-colors cursor-default"><Cpu className="w-4 h-4 text-blue-500"/> Predictive ML Modeling</span>
            <span className="flex items-center gap-2 border border-slate-200 rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 bg-white shadow-sm hover:border-blue-300 transition-colors cursor-default"><Database className="w-4 h-4 text-blue-500"/> Multi-format Support</span>
            <span className="flex items-center gap-2 border border-slate-200 rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 bg-white shadow-sm hover:border-blue-300 transition-colors cursor-default"><Search className="w-4 h-4 text-cyan-500"/> Auto Data Cleansing</span>
          </div>
        </section>

        {/* Features Tab Section */}
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b-2 border-slate-200 mb-10">
            <div className="pb-6 cursor-pointer group">
              <Compass className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-4 transition-colors" />
              <h3 className="text-2xl font-extrabold text-slate-400 group-hover:text-slate-900 mb-2 transition-colors">Visual Navigation</h3>
              <p className="text-slate-600 text-sm mb-4 font-medium">Automatically map your datasets into highly interactive, publication-ready charts.</p>
            </div>
            <div className="pb-6 cursor-pointer group">
              <Radar className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-4 transition-colors" />
              <h3 className="text-2xl font-extrabold text-slate-400 group-hover:text-slate-900 mb-2 transition-colors">AI Radar</h3>
              <p className="text-slate-500 text-sm font-medium">Chat directly with your data to pinpoint anomalies and uncover hidden actionable insights.</p>
            </div>
            <div className="pb-6 cursor-pointer group">
              <TrendingUp className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-4 transition-colors" />
              <h3 className="text-2xl font-extrabold text-slate-400 group-hover:text-slate-900 mb-2 transition-colors">Flightpath Analysis</h3>
              <p className="text-slate-500 text-sm font-medium">Run complex statistical models and generate predictive forecasts for future trajectories.</p>
            </div>
          </div>

          {/* Large Graph Mockup Area */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/5 border border-slate-200 p-8 w-full min-h-[450px] flex flex-col relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/50"></div>
             <div className="mb-8 z-10">
                <p className="text-lg font-extrabold text-slate-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600"/> Global User Acquisition Funnel</p>
                <p className="text-sm text-slate-500 font-medium">Q3 2026 performance mapping across top performing geographic sectors.</p>
              </div>
              <svg className="w-full h-80 absolute bottom-0 left-0 right-0 px-8 transition-transform duration-1000 group-hover:scale-105 origin-bottom" viewBox="0 0 100 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8"/>
                  </linearGradient>
                </defs>
                <path d="M0,50 L0,35 Q10,15 20,25 T40,40 T60,20 T80,30 T100,10 L100,50 Z" fill="#bae6fd" opacity="0.5" />
                <path d="M0,50 L0,40 Q10,25 20,30 T40,45 T60,30 T80,35 T100,15 L100,50 Z" fill="url(#areaGradient)" />
                <path d="M0,40 Q10,25 20,30 T40,45 T60,30 T80,35 T100,15" fill="none" stroke="#1d4ed8" strokeWidth="1.5" />
              </svg>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-6xl mx-auto px-4 py-24">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Flight Manual</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Four simple steps to transform raw spreadsheets into enterprise-grade intelligence using the DataPilot AI engine.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Steps List */}
            <div className="space-y-12">
              <div className="flex gap-6 relative">
                <div className="absolute top-10 left-5 w-0.5 h-16 bg-slate-200"></div>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-lg border-2 border-white shadow-sm z-10">1</div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Establish Connection</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">Securely upload your CSV, Excel, or connect directly to your database. <Database className="inline w-4 h-4 ml-1 text-slate-400"/></p>
                </div>
              </div>
              <div className="flex gap-6 relative">
                <div className="absolute top-10 left-5 w-0.5 h-16 bg-slate-200"></div>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-lg border-2 border-white shadow-sm z-10">2</div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Query the Co-pilot</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">Ask natural language questions about your data, or utilize auto-generated radar suggestions.</p>
                </div>
              </div>
              <div className="flex gap-6 relative">
                <div className="absolute top-10 left-5 w-0.5 h-16 bg-slate-200"></div>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-lg border-2 border-white shadow-sm z-10">3</div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Extract Intelligence</h4>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">DataPilot runs sophisticated statistical algorithms in the background to provide accurate, verified insights.</p>
                  <div className="flex gap-3">
                     <span className="px-3 py-1 bg-slate-100 rounded text-slate-600 text-xs font-bold font-mono">Python</span>
                     <span className="px-3 py-1 bg-slate-100 rounded text-slate-600 text-xs font-bold font-mono">Pandas</span>
                     <span className="px-3 py-1 bg-slate-100 rounded text-slate-600 text-xs font-bold font-mono">Scikit-Learn</span>
                  </div>
                </div>
              </div>
               <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg border-2 border-white shadow-sm z-10">4</div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Deploy Findings</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">Export beautiful interactive dashboards, PDF reports, or share secure access links with your team.</p>
                </div>
              </div>
            </div>

            {/* Mock Chat UI */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl shadow-slate-200/50">
              {/* User message */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-sm font-medium text-slate-700 flex-grow border border-slate-200">
                  "Analyze our Q3 server infrastructure costs. Which region is driving the variance?"
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                  <Send className="w-4 h-4 ml-0.5" />
                </div>
              </div>

              {/* DataPilot Response */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold shadow-md">
                  <Navigation className="w-5 h-5" strokeWidth={3} />
                </div>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 w-full">
                  <h5 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" /> Infrastructure Cost Variance by Region
                  </h5>
                  
                  {/* Static Bar Chart Mockup */}
                  <div className="w-full space-y-3 mb-5">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>us-east-1 (N. Virginia)</span><span>$45,230</span></div>
                      <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{width: '85%'}}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>eu-west-1 (Ireland)</span><span>$28,100</span></div>
                      <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-cyan-500 h-2 rounded-full" style={{width: '55%'}}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>ap-southeast-1 (Singapore)</span><span>$12,450</span></div>
                      <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-slate-400 h-2 rounded-full" style={{width: '25%'}}></div></div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-700 leading-relaxed font-medium bg-white p-3 border border-slate-200 rounded-lg">
                    The analysis indicates that <span className="font-bold text-blue-600">us-east-1</span> is the primary driver of cost variance, accounting for 52% of the total infrastructure spend this quarter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
