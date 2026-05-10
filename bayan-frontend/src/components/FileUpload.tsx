import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle2, Loader2, FileAudio, AlertCircle, Music4, ArrowRight } from 'lucide-react';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lectureId, setLectureId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('IDLE');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<{ data: string } | null>(null);

  // Fixed WebSocket Connection Logic
  useEffect(() => {
    // 1. Get the URL and strip any accidental trailing slashes
    const rawUrl = import.meta.env.VITE_WEBSOCKET_URL || "";
    const socketUrl = rawUrl.replace(/\/+$/, ""); 
    
    if (!socketUrl) {
      console.error("WebSocket URL is missing! Check your .env file.");
      return;
    }

    console.log("⚡ Attempting connection to:", socketUrl);

    const ws = new WebSocket(socketUrl);

    ws.onopen = () => {
      console.log("✅ Bayan AI: WebSocket Connected Successfully");
    };

    ws.onmessage = (event) => {
      console.log("📩 Message received:", event.data);
      setLastMessage({ data: event.data });
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket Error Details:", error);
    };

    ws.onclose = (e) => {
      console.log("🔌 WebSocket Closed. Code:", e.code, "Reason:", e.reason);
    };
    
    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, []);

  // Process WebSocket Messages
  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const payload = JSON.parse(lastMessage.data);
        if (payload.type === 'PROGRESS_UPDATE' && payload.data) {
          const updatedLectureId = payload.data.lectureId?.S;
          const updatedStatus = payload.data.status?.S;
          const finalAudioUrl = payload.data.audioUrl?.S;

          if (updatedLectureId === lectureId) {
            setStatus(updatedStatus || 'PROCESSING');
            if (finalAudioUrl) setAudioUrl(finalAudioUrl);
          }
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message", e);
      }
    }
  }, [lastMessage, lectureId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'audio/mpeg') {
        alert('Please select an MP3 file to ensure compatibility.');
        return;
      }
      setFile(selectedFile);
      setStatus('IDLE');
      setAudioUrl(null);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setStatus('REQUESTING_TICKET');

    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/upload-url`);
      const { uploadUrl, lectureId: newLectureId } = data;
      setLectureId(newLectureId);

      setStatus('UPLOADING_TO_S3');
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': 'audio/mpeg' },
      });

      setStatus('PIPELINE_STARTED');
      setUploading(false);
    } catch (error) {
      console.error('Upload failed:', error);
      setStatus('FAILED');
      setUploading(false);
    }
  }, [file]);

  // Helper to format status text nicely
  const getDisplayStatus = (rawStatus: string) => {
    const map: Record<string, string> = {
      'REQUESTING_TICKET': 'Securing upload token...',
      'UPLOADING_TO_S3': 'Uploading directly to AWS S3...',
      'PIPELINE_STARTED': 'Initializing AI Pipeline...',
      'PROCESSING': 'Transcribing & Translating...',
      'COMPLETED': 'Study Guide Ready',
      'FAILED': 'Pipeline Error'
    };
    return map[rawStatus] || rawStatus.replace(/_/g, ' ');
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 transition-all duration-500 hover:shadow-2xl">
      
      {/* The S3 Dropzone */}
      <div className="relative group">
        <div className={`w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-300 ${
          file ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/30'
        }`}>
          
          <div className={`p-4 rounded-full mb-4 transition-colors duration-300 ${
            file ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'
          }`}>
            {file ? <Music4 className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
          </div>
          
          <p className="text-slate-700 font-semibold mb-1 text-lg">
            {file ? file.name : "Select Lecture Audio"}
          </p>
          <p className="text-slate-500 text-sm mb-6 text-center">
            {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "MP3 files up to 100MB are supported."}
          </p>
          
          <input 
            type="file" 
            accept="audio/mpeg" 
            onChange={handleFileChange}
            disabled={uploading || status === 'PIPELINE_STARTED' || status === 'PROCESSING'}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          
          {!file && (
            <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-full shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors pointer-events-none">
              Browse Files
            </button>
          )}
        </div>
      </div>

      {/* The Upload Action Button */}
      {file && status === 'IDLE' && (
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleUpload}
            className="group flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
          >
            Generate Study Guide
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* The Real-Time Progress Bar */}
      {status !== 'IDLE' && status !== 'COMPLETED' && status !== 'FAILED' && (
        <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white rounded-full shadow-sm animate-pulse">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
                System Status
              </h3>
              <p className="text-indigo-600 font-medium">
                {getDisplayStatus(status)}
              </p>
            </div>
          </div>
          {/* Faux Progress Bar for visual feedback */}
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-5 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full animate-[shimmer_2s_infinite] w-full origin-left" />
          </div>
        </div>
      )}

      {/* Failure State */}
      {status === 'FAILED' && (
        <div className="mt-8 p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center text-red-700">
          <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0" />
          <p className="font-medium">The pipeline encountered an error. Please check your AWS Step Functions console.</p>
        </div>
      )}

      {/* Final Result: The Urdu Audio Player */}
      {status === 'COMPLETED' && audioUrl && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg mr-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Urdu Summary Generated</h3>
                  <p className="text-sm text-slate-500">Your bilingual study guide is ready to listen.</p>
                </div>
              </div>
            </div>
            
            <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
              <audio controls className="w-full outline-none" autoPlay>
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
            
            <div className="mt-6 flex items-start text-sm text-emerald-700 bg-emerald-50 p-4 rounded-xl">
              <FileAudio className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>
                A notification has also been sent to your registered email via Amazon SNS with a permanent link to this guide.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}