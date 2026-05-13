import { useState, useEffect } from 'react';
import { UploadCloud, FileAudio, Loader2, CheckCircle2, PlayCircle, Languages, Server, Download } from 'lucide-react';

export default function FileUpload() {
  // ✅ ALL HOOKS MUST BE INSIDE THIS FUNCTION BODY
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('IDLE'); 
  const [wsConnected, setWsConnected] = useState(false);
  const [resultText, setResultText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [textUrl, setTextUrl] = useState(''); // New state for the .txt file

  useEffect(() => {
    const socketUrl = "wss://8mj3qplu08.execute-api.us-east-1.amazonaws.com/prod";
    const ws = new WebSocket(socketUrl);

    ws.onopen = () => setWsConnected(true);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 WS Message Received:", data);
      
      if (data.status === 'TRANSCRIBING') setStatus('TRANSCRIBING');
      if (data.status === 'SYNTHESIZING') setStatus('SYNTHESIZING');
      
      if (data.status === 'COMPLETED') {
        setStatus('COMPLETE');
        if (data.urdu_text) setResultText(data.urdu_text);
        else if (data.transcript) setResultText(data.transcript);
        
        if (data.audioUrl) setAudioUrl(data.audioUrl);
        if (data.textUrl) setTextUrl(data.textUrl); // Catch the download link from backend
      }
    };

    ws.onclose = () => setWsConnected(false);
    return () => { if (ws.readyState === 1) ws.close(); };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('IDLE');
      setResultText('');
      setTextUrl('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('UPLOADING');

    try {
      const rawBaseUrl = "https://f71p0fqsuh.execute-api.us-east-1.amazonaws.com/Prod"; 
      const baseUrl = rawBaseUrl.replace(/\/+$/, "");
      const targetApi = `${baseUrl}/upload-url?fileName=${file.name}`;

      const res = await fetch(targetApi);
      const data = await res.json();

      const finalS3Link = data.uploadURL || data.uploadUrl;

      await fetch(finalS3Link, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      setStatus('TRANSCRIBING'); 
    } catch (error) {
      console.error("❌ Upload failed:", error);
      setStatus('IDLE');
    }
  };

  return (
    <div className="upload-wrapper">
      <div className={`upload-zone ${file ? 'has-file' : ''}`}>
        <input 
          type="file" 
          accept="audio/mp3, audio/wav, audio/mpeg" 
          onChange={handleFileChange} 
          className="file-input"
          disabled={status !== 'IDLE'}
        />
        <div className="icon-container">
          {file ? <FileAudio size={40} /> : <UploadCloud size={40} />}
        </div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          {file ? file.name : "Select Lecture Audio"}
        </h3>
        {file && status === 'IDLE' && (
          <button className="btn-primary" onClick={handleUpload}>
            Generate Study Guide
          </button>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <Server size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
        {wsConnected ? 'Backend Connected' : 'Connecting to Cloud...'}
      </div>

      {status !== 'IDLE' && status !== 'COMPLETE' && (
        <div className="glass-card">
          <div className="progress-header">
            <Loader2 className="icon-spin" size={20} />
            Processing Audio...
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Groq is transcribing and Llama 3 is preparing your notes.
          </p>
        </div>
      )}

      {status === 'COMPLETE' && (
        <div className="glass-card results-card animate-fade-in">
          <div className="progress-header">
            <CheckCircle2 size={24} color="var(--success)" />
            Transcription Complete
          </div>

          <div className="urdu-text-container">
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              <Languages size={16} /> Insights
            </h3>
            <div className="font-urdu">
              {resultText}
            </div>
          </div>

          {/* THE DOWNLOAD BUTTON */}
          {textUrl && (
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <a 
                href={textUrl} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '50px',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Download size={18} />
                Download Transcript (.txt)
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}