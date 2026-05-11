import { useState, useEffect } from 'react';
import { UploadCloud, FileAudio, Loader2, CheckCircle2, PlayCircle, Languages, Server } from 'lucide-react';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('IDLE'); 
  const [wsConnected, setWsConnected] = useState(false);
  const [resultText, setResultText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  useEffect(() => {
    const rawUrl = import.meta.env.VITE_WEBSOCKET_URL || "";
    const socketUrl = rawUrl.replace(/\/+$/, ""); 
    
    if (!socketUrl) return;

    const ws = new WebSocket(socketUrl);

    ws.onopen = () => setWsConnected(true);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 WS Message:", data);
      
      if (data.status === 'TRANSCRIBING') setStatus('TRANSCRIBING');
      if (data.status === 'SYNTHESIZING') setStatus('SYNTHESIZING');
      if (data.status === 'COMPLETED') {
        setStatus('COMPLETE');
        if (data.transcript) setResultText(data.transcript);
        if (data.audioUrl) setAudioUrl(data.audioUrl);
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
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('UPLOADING');

    try {
      const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
      const res = await fetch(`${baseUrl}/upload-url?fileName=${file.name}`);
      const { uploadURL } = await res.json();

      await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      setStatus('TRANSCRIBING'); 
    } catch (error) {
      console.error("Upload failed", error);
      setStatus('IDLE');
    }
  };

  return (
    <div className="upload-wrapper">
      
      {/* Upload Zone */}
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
        <p style={{ color: 'var(--text-muted)' }}>
          {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to process` : "MP3 or WAV up to 50MB"}
        </p>

        {file && status === 'IDLE' && (
          <button className="btn-primary" onClick={handleUpload}>
            Generate Study Guide
          </button>
        )}
      </div>

      {/* Connection Indicator */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <Server size={14} />
        {wsConnected ? 'Backend Handshake Established' : 'Waiting for connection...'}
      </div>

      {/* Progress Timeline */}
      {status !== 'IDLE' && status !== 'COMPLETE' && (
        <div className="glass-card">
          <div className="progress-header">
            <Loader2 className="icon-spin" size={20} />
            AI Processing Pipeline
          </div>
          
          <div className="step-indicator active completed">
            <div className="step-circle"><CheckCircle2 size={14} color="white" /></div>
            <span>Uploading to S3</span>
          </div>
          <div className={`step-indicator active ${status === 'SYNTHESIZING' ? 'completed' : ''}`}>
            <div className="step-circle">{status === 'SYNTHESIZING' ? <CheckCircle2 size={14} color="white"/> : ''}</div>
            <span style={{ color: status === 'SYNTHESIZING' ? 'var(--success)' : 'white' }}>Transcribing & Translating Insights</span>
          </div>
          <div className="step-indicator">
            <div className="step-circle"></div>
            <span>Synthesizing Urdu Audio (Polly)</span>
          </div>
        </div>
      )}

      {/* Results Card */}
      {status === 'COMPLETE' && (
        <div className="glass-card results-card animate-fade-in">
          <div className="progress-header" style={{ color: 'white', fontSize: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <CheckCircle2 size={28} color="var(--success)" />
            Study Guide Ready
          </div>

          <div className="audio-player-container">
            <h3><PlayCircle size={16} /> Urdu Summary Audio</h3>
            <audio controls src={audioUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>

          <div className="urdu-text-container">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <Languages size={16} /> Key Insights (Urdu)
            </h3>
            <div className="font-urdu">
              {resultText || "ہیلو، یہ بیان اے آئی پائپ لائن کا مظاہرہ ہے۔ سرور لیس فن تعمیر مکمل طور پر فعال ہے۔"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}