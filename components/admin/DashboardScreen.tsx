
import React from 'react';
import type { Prompt, AdminScreen } from '../../types';

interface DashboardScreenProps {
  prompts: Prompt[];
  setScreen: (screen: AdminScreen) => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, colorClass }) => (
  <div className="bg-white rounded-lg shadow p-4 transform hover:scale-105 transition-transform duration-300">
    <p className="text-sm text-gray-600">{title}</p>
    <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

interface NavCardProps {
  title: string;
  icon: string;
  description: string;
  gradient: string;
  onClick: () => void;
}

const NavCard: React.FC<NavCardProps> = ({ title, icon, description, gradient, onClick }) => (
  <button onClick={onClick} className={`${gradient} text-white rounded-lg p-8 hover:shadow-2xl font-bold text-left transform hover:-translate-y-1 transition-all duration-300 flex flex-col h-full`}>
    <div className="text-4xl mb-2">{icon}</div>
    <p className="text-xl flex-grow">{title}</p>
    <p className="text-sm opacity-80">{description}</p>
  </button>
);

const DashboardScreen: React.FC<DashboardScreenProps> = ({ prompts, setScreen }) => {
  const avgRating = (prompts.reduce((acc, p) => acc + p.rating, 0) / (prompts.length || 1)).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Prompts" value={prompts.length} colorClass="text-gray-800" />
        <StatCard title="Approved" value={prompts.filter(p => p.approved).length} colorClass="text-green-600" />
        <StatCard title="Avg Rating" value={avgRating} colorClass="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NavCard title="Manage Prompts" icon="📖" description={`${prompts.length} total items`} gradient="bg-gradient-to-br from-green-400 to-emerald-500" onClick={() => setScreen('approved')} />
        <NavCard title="Analytics" icon="📊" description="View charts & stats" gradient="bg-gradient-to-br from-blue-400 to-indigo-500" onClick={() => setScreen('analytics')} />
        <NavCard title="Add New Prompt" icon="✍️" description="Create & auto-approve" gradient="bg-gradient-to-br from-purple-400 to-pink-500" onClick={() => setScreen('add')} />
      </div>
    </div>
  );
};

export default DashboardScreen;
