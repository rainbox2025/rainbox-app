// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from 'firebase/messaging';
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBUUioDQa-KzKodVIlSb3q-s5VvT80Pbik",
  authDomain: "rainbox-87352.firebaseapp.com",
  projectId: "rainbox-87352",
  storageBucket: "rainbox-87352.firebasestorage.app",
  messagingSenderId: "574320183763",
  appId: "1:574320183763:web:b8b48bb59ce2d103708726",
  measurementId: "G-69CV9C2REJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
// const analytics = getAnalytics(app);

export const generateToken = async () => {
  const permission = await Notification.requestPermission();
  console.log(permission)    

  if(permission === 'granted') {
    const token = await getToken(messaging, {
      vapidKey: "BHvwTOIzWh7pzf36EeZ_zItRksuzkGFVp2ILPGwesc9PW6DjgHuJjtUNvWbeayE16OKP1DLMKkVZHbw88cRUhn0"
    })
    console.log(token)
  }
  
}