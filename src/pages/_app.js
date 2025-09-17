import '../App.css';
import { useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQl0acjqwoxVlOo5rScCTKVd52cmBdRDU",
  authDomain: "my-optimal-route-planner.firebaseapp.com",
  projectId: "my-optimal-route-planner",
  storageBucket: "my-optimal-route-planner.firebasestorage.app",
  messagingSenderId: "332462735623",
  appId: "1:332462735623:web:6ec1ed87b554b98ccd45a2",
  measurementId: "G-CDL7GFBFF2"
};

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    // Initialize Analytics (only on client side)
    if (typeof window !== 'undefined') {
      getAnalytics(app);
    }
  }, []);

  return <Component {...pageProps} />;
}
