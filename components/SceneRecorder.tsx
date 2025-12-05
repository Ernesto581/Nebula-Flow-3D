import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

interface SceneRecorderProps {
  active: boolean;
}

const SceneRecorder: React.FC<SceneRecorderProps> = ({ active }) => {
  const { gl } = useThree();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const canvas = gl.domElement;

    if (active) {
      // Start Recording
      console.log("Starting auto-recording...");
      chunksRef.current = [];
      
      try {
        // Capture stream at 30fps
        const stream = canvas.captureStream(30);
        
        // Determine supported mime type
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm'; // Fallback
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
           mimeType = 'video/mp4'; // Safari fallback (if supported)
        }

        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          if (chunksRef.current.length === 0) return;

          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          
          // Auto-download
          const a = document.createElement('a');
          a.href = url;
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          a.download = `nebula-flow-session-${timestamp}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log("Recording saved.");
        };

        recorder.start();
        mediaRecorderRef.current = recorder;

      } catch (err) {
        console.error("Failed to initialize MediaRecorder:", err);
      }

    } else {
      // Stop Recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        console.log("Stopping auto-recording...");
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    }

    return () => {
       // Cleanup if component unmounts while recording
       if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
         mediaRecorderRef.current.stop();
       }
    };
  }, [active, gl]);

  return null; // Invisible component
};

export default SceneRecorder;