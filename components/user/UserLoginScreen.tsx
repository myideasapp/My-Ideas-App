
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../services/firebase';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M24 9.5c3.9 0 6.9 1.6 9.1 3.7l6.9-6.9C35.9 2.5 30.5 0 24 0 14.9 0 7.3 5.4 3 13.5l8.1 6.3C12.9 13.2 18.1 9.5 24 9.5z"></path>
        <path fill="#34A853" d="M46.2 25.4c0-1.7-.2-3.4-.5-5H24v9.5h12.5c-.5 3.1-2.2 5.7-4.8 7.5l7.3 5.7c4.3-4 6.7-9.9 6.7-16.7z"></path>
        <path fill="#FBBC05" d="M11.1 28.1c-.5-1.5-.8-3.1-.8-4.8s.3-3.3.8-4.8L3 13.5C1.1 17.1 0 21.4 0 26.2s1.1 9.1 3 12.7l8.1-6.3z"></path>
        <path fill="#EA4335" d="M24 48c6.5 0 12-2.1 16-5.6l-7.3-5.7c-2.1 1.4-4.8 2.3-7.7 2.3-5.9 0-11.1-3.7-12.9-8.8l-8.1 6.3C7.3 42.6 14.9 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);


const UserLoginScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      let message = 'An unknown error occurred.';
      if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please login.';
      } else if (err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else {
        message = 'Failed to authenticate. Please try again.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (err: any) {
        console.error("Google Sign-In Error:", err);
        let message = 'Failed to sign in with Google. Please try again.';
        
        switch (err.code) {
            case 'auth/popup-closed-by-user':
            case 'auth/cancelled-popup-request':
                return;
            case 'auth/popup-blocked':
                message = 'Popup blocked by browser. Please enable popups and try again.';
                break;
            case 'auth/operation-not-allowed':
                message = 'Google Sign-In is not enabled. Please check Firebase settings.';
                break;
            case 'auth/unauthorized-domain':
                 message = 'This domain is not authorized for Google Sign-In.';
                 break;
            case 'auth/account-exists-with-different-credential':
                message = 'An account already exists with this email using a different sign-in method.';
                break;
        }

        setError(message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold text-center mb-6 text-blue-600">💡 Ideas</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-2xl rounded-2xl px-8 pt-6 pb-8 mb-4"
        >
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="password"
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex flex-col gap-4">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
             <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-xs">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-center text-sm text-blue-600 hover:underline"
            >
              {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserLoginScreen;
