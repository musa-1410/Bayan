import FileUpload from './components/FileUpload';
import { Sparkles, Mic2 } from 'lucide-react';

function App() {
  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="brand-icon">
            <Mic2 size={20} />
          </div>
          <span>Bayan<span style={{ color: 'var(--accent-primary)' }}>.ai</span></span>
        </div>
        <div className="status-badge">
          <span className="status-dot"></span>
          System Online
        </div>
      </nav>

      {/* Main Content */}
      <main className="container animate-fade-in">
        
        {/* Hero Section */}
        <div className="hero-tag">
          <Sparkles size={16} />
          Serverless Study Guide
        </div>
        
        <h1 className="hero-title">
          Turn lectures into <br/>
          <span className="text-gradient">bilingual insights.</span>
        </h1>
        
        <p className="hero-subtitle">
          Drop your lecture recording below. Our AI pipeline will extract key topics, translate them to Urdu, and synthesize a crystal-clear audio summary in real-time.
        </p>

        {/* Upload Component */}
        <FileUpload />
      </main>
    </div>
  );
}

export default App;