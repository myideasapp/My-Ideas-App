
import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { ChevronRight, Github, X, Copy, Check } from 'lucide-react';
import type { Language, UserScreen } from '../../types';

interface SettingsScreenProps {
  user: User;
  handleLogout: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  setScreen: (screen: UserScreen) => void;
  t: { [key: string]: string };
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, handleLogout, lang, setLang, setScreen, t }) => {
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  const toggleGitHubModal = () => {
    setIsGitHubModalOpen(!isGitHubModalOpen);
  };

  return (
    <div>
      <div className="bg-white shadow-md p-4">
        <h1 className="text-2xl font-bold">⚙️ {t.settings}</h1>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <div className="pb-4 border-b">
            <p className="text-sm text-gray-500">Logged in as</p>
            <p className="font-semibold text-gray-800 break-words">{user.email}</p>
          </div>

          <button onClick={() => setScreen('profile')} className="w-full text-left bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex justify-between items-center transition">
            <div>
              <p className="font-bold text-gray-800">My Profile</p>
              <p className="text-sm text-gray-500">View your stats and account info</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          
          <button onClick={toggleGitHubModal} className="w-full text-left bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex justify-between items-center transition">
            <div className="flex items-center gap-3">
              <div className="bg-gray-800 text-white p-2 rounded-full">