import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { ADMIN_UIDS, CATEGORIES } from '../../constants';
import { Sparkles, X } from 'lucide-react';
import { generatePrompt } from '../../services/geminiService';

import DashboardScreen from './DashboardScreen';
import ApprovedScreen from './ApprovedScreen';
import AnalyticsScreen from './AnalyticsScreen';
import type { Prompt, Language, AdminScreen } from '../../types';

interface ConfirmationModalProps {
  prompt: Prompt | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ prompt, onConfirm, onCancel }) => {
  if (!prompt) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative" style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}>
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Confirm Deletion</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete the prompt: <span className="font-semibold">"{prompt.title}"</span>? This action cannot be undone.
        </p>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors">
            Delete
          </button>
        </div>
      </div>
       <style>{`@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

// Logout Confirmation Modal
const LogoutConfirmationModal: React.FC<{ onConfirm: () => void; onCancel: () => void; }> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative" style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Confirm Logout</h2>
        <p className="text-gray-600 mb-6">Are you sure you want to log out from the Admin Panel?</p>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};


interface AddPromptAdminScreenProps {
  onAddPrompt: (newPrompt: Omit<Prompt, 'id' | 'rating' | 'approved' | 'author' | 'authorId'>) => void;
  t: { [key: string]: string };
}

const AddPromptAdminScreen: React.FC<AddPromptAdminScreenProps> = ({ onAddPrompt, t }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [text, setText] = useState('');
  const [image, setImage] = useState('💡');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !category || !text) {
      alert('Please fill all fields');
      return;
    }
    onAddPrompt({ title, desc, category, text, image });
  };

  const handleGenerate = async () => {
    if (!category) {
      alert('Please select a category first.');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generatePrompt(category);
      if (result.title) setTitle(result.title);
      if (result.desc) setDesc(result.desc);
      if (result.text) setText(result.text);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <div className="bg-white shadow-md p-4 border-b">
        <h1 className="text-2xl font-bold text-purple-600">✍️ Add New Prompt</h1>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <div>
            <label htmlFor="admin-title" className="font-semibold text-sm text-gray-700">Title</label>
            <input id="admin-title" type="text" placeholder="e.g., React Weather App" value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required />
          </div>
          <div>
            <label htmlFor="admin-desc" className="font-semibold text-sm text-gray-700">Short Description</label>
            <textarea id="admin-desc" placeholder="e.g., A simple app to display weather." value={desc} onChange={e => setDesc(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" rows={2} required></textarea>
          </div>
          <div className="flex gap-4">
            <div className="flex-grow">
              <label htmlFor="admin-category" className="font-semibold text-sm text-gray-700">Category</label>
              <select id="admin-category" value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
               <label htmlFor="admin-image" className="font-semibold text-sm text-gray-700">Icon</label>
               <input id="admin-image" type="text" value={image} onChange={e => setImage(e.target.value)} className="w-20 text-center mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" maxLength={2} />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="admin-text" className="font-semibold text-sm text-gray-700">Prompt Text</label>
              <button type="button" onClick={handleGenerate} disabled={isGenerating} className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold hover:bg-purple-200 disabled:opacity-50 disabled:cursor-wait">
                <Sparkles size={14} />
                {isGenerating ? t.generating : t.generate_with_ai}
              </button>
            </div>
            <textarea id="admin-text" placeholder="The full text of your prompt..." value={text} onChange={e => setText(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" rows={6} required></textarea>
          </div>
          <button type="submit" disabled={isGenerating} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors disabled:bg-gray-400">
            {t.submit}
          </button>
        </form>
      </div>
    </div>
  );
};


interface AdminAppProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: { [key: string]: string };
}

const AdminApp: React.FC<AdminAppProps> = ({ lang, setLang, t }) => {
  const [screen, setScreen] = useState<AdminScreen>('dashboard');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !ADMIN_UIDS.includes(user.uid)) return;
    
    const q = query(collection(db, 'prompts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const promptsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Prompt));
      setPrompts(promptsData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRequestDelete = (prompt: Prompt) => {
    setPromptToDelete(prompt);
  };
  
  const handleConfirmDelete = async () => {
    if (!promptToDelete) return;
    try {
        const promptRef = doc(db, 'prompts', promptToDelete.id);
        await deleteDoc(promptRef);
    } catch (error) {
        console.error("Error deleting prompt:", error);
        alert("Failed to delete prompt.");
    } finally {
        setPromptToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setPromptToDelete(null);
  };
  
  const handleAdminAddPrompt = async (newPrompt: Omit<Prompt, 'id' | 'rating' | 'approved' | 'author' | 'authorId'>) => {
    if (!user) {
      alert("Authentication error.");
      return;
    }
    try {
      await addDoc(collection(db, 'prompts'), {
        ...newPrompt,
        rating: 0,
        approved: true, // Automatically approved
        author: user.email || 'Admin',
        authorId: user.uid,
        createdAt: serverTimestamp(),
      });
      alert('Prompt added successfully!');
      setScreen('dashboard'); // Go back to dashboard after adding
    } catch (error) {
      console.error("Error adding prompt from admin: ", error);
      alert('Failed to add prompt. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };
  
  const handleConfirmLogout = async () => {
    await signOut(auth);
    setIsLogoutModalOpen(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Admin Panel...</div>;
  }
  
  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return <DashboardScreen prompts={prompts} setScreen={setScreen} />;
      case 'approved':
        return <ApprovedScreen prompts={prompts} onDelete={handleRequestDelete} />;
      case 'analytics':
        return <AnalyticsScreen prompts={prompts} />;
      case 'add':
        return <AddPromptAdminScreen onAddPrompt={handleAdminAddPrompt} t={t} />;
      default:
        return <DashboardScreen prompts={prompts} setScreen={setScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
       <ConfirmationModal
        prompt={promptToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      {isLogoutModalOpen && <LogoutConfirmationModal onConfirm={handleConfirmLogout} onCancel={() => setIsLogoutModalOpen(false)} />}

      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🔐 {t.admin}</h1>
          <div className="flex gap-2 items-center">
            {screen !== 'dashboard' && (
                <button onClick={() => setScreen('dashboard')} className="px-3 py-1 bg-white/20 text-white rounded-md font-bold text-sm hover:bg-white/30 transition">Dashboard</button>
            )}
            <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className="px-2 py-1 rounded text-gray-800 font-bold bg-white/90">
              <option value="en">EN</option>
              <option value="hi">HI</option>
            </select>
            <button onClick={handleLogout} className="px-3 py-1 bg-red-700 text-white rounded-md font-bold text-sm hover:bg-red-800 transition">Logout</button>
          </div>
        </div>
      </div>
      <main>
        {renderScreen()}
      </main>
    </div>
  );
};

export default AdminApp;