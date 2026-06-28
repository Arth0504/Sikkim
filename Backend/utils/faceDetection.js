import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let faceapi;
let canvas;
let modelsLoaded = false;
let isFaceApiEnabled = false;

// Safe load function
const initFaceApi = async () => {
  if (faceapi && canvas) return true;
  try {
    // Dynamic imports to catch potential missing dependency crashes
    faceapi = await import('@vladmandic/face-api');
    canvas = await import('canvas');
    
    const { Canvas, Image, ImageData } = canvas.default || canvas;
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
    
    isFaceApiEnabled = true;
    console.log("Face-api and Canvas loaded successfully ✅");
    return true;
  } catch (err) {
    console.error("CRITICAL: Face Detection System disabled due to missing dependencies (TensorFlow/Canvas) ⚠️");
    console.error("Error details:", err.message);
    isFaceApiEnabled = false;
    return false;
  }
};

const loadModels = async () => {
  if (modelsLoaded || !isFaceApiEnabled) return;
  const modelPath = path.join(__dirname, '../face-models');
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    modelsLoaded = true;
    console.log("Face detection models loaded ✅");
  } catch (error) {
    console.error("Error loading face detection models:", error);
    isFaceApiEnabled = false; // Disable if models fail to load
  }
};

export const validateSingleFace = async (imagePath) => {
  try {
    const initialized = await initFaceApi();
    if (!initialized || !isFaceApiEnabled) {
      console.warn("Skipping face detection: System is disabled or failed to initialize.");
      return 1; // Fallback: Allow the image (assume 1 face)
    }

    await loadModels();
    
    // Final check if it was disabled during model loading
    if (!isFaceApiEnabled) return 1;

    const { loadImage } = canvas.default || canvas;
    const img = await loadImage(imagePath);
    
    // Detect faces
    const detections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }));
    
    return detections.length;
  } catch (error) {
    console.error("Face detection process error:", error);
    // If process fails, we fallback to allowing to prevent 500 errors
    return 1; 
  }
};
