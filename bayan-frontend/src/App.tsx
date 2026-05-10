import FileUpload from './components/FileUpload';
import { Sparkles } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900">
      {/* Decorative Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-300/20 blur-3xl pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="w-full px-8 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            Bayan<span className="text-indigo-600 font-extrabold">.ai</span>
          </span>
        </div>
        <div className="text-sm font-medium text-slate-500 bg-white/60 px-4 py-2 rounded-full border border-slate-200 shadow-sm backdrop-blur-sm">
          Serverless Study Guide
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 pt-12 pb-24 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 drop-shadow-sm">
            Turn lectures into <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              bilingual insights.
            </span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
            Drop your lecture recording below. Our AI pipeline will extract key topics, translate them to Urdu, and synthesize a crystal-clear audio summary in real-time.
          </p>
        </div>

        <div className="w-full max-w-2xl">
          <FileUpload />
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-6 w-full text-center text-sm text-slate-400 font-medium">
        Powered by AWS Step Functions, Comprehend, Translate & Polly.
      </footer>
    </div>
  );
}

export default App;