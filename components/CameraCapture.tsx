import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraIcon } from './icons';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      let errorMessage = "Could not access the camera. Please ensure you are using a secure (https) connection.";
       if (err instanceof DOMException) {
          // The user's error "Permission dismissed" corresponds to this case.
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
              errorMessage = "Camera permission was denied or dismissed. To use this feature, please allow camera access in your browser's site settings. You may need to reload the page after changing permissions.";
          } else if (err.name === "NotFoundError") {
              errorMessage = "No camera was found on your device. Please ensure a camera is connected and enabled.";
          } else if (err.name === "NotReadableError") {
              errorMessage = "The camera is currently in use by another application or there was a hardware error.";
          }
      }
      setError(errorMessage);
    }
  }, []);
  
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl.split(',')[1]); // Send base64 data
        stopCamera();
      }
    }
  };

  if (error) {
    return (
      <div className="text-center p-4 bg-red-900/20 text-red-300 rounded-lg">
        <h3 className="font-bold">Camera Error</h3>
        <p>{error}</p>
         <button onClick={onClose} className="mt-4 bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full bg-black rounded-lg overflow-hidden relative">
          <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
          <canvas ref={canvasRef} className="hidden" />
      </div>
      <button
        onClick={handleCapture}
        className="mt-4 flex items-center bg-primary hover:bg-primary-focus text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
      >
        <CameraIcon className="w-6 h-6 mr-2" />
        Capture Photo
      </button>
    </div>
  );
};

export default CameraCapture;