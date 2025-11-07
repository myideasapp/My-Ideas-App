
import React from 'react';
import type { Prompt } from '../../types';

interface PendingScreenProps {
  prompts: Prompt[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  t: { [key: string]: string };
}

const PendingScreen: React.FC<PendingScreenProps> = ({ prompts, onApprove, onReject, t }) => {
  const pending = prompts.filter(p => !p.approved);

  return (
    <div>
      <div className="bg-white shadow-md p-4 border-b">
        <h1 className="text-2xl font-bold text-yellow-600">⏳ Pending Approvals</h1>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {pending.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-6xl mb-4">🎉</p>
            <p className="text-2xl text-gray-600">All caught up! No pending prompts.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(p => (
              <div key={p.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-400">
                <div className="flex gap-4 mb-4">
                  <div className="text-5xl">{p.image}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{p.title}</h3>
                    <p className="text-gray-600">{p.desc}</p>
                    <p className="text-sm text-gray-500 mt-1">By: {p.author} | Category: {p.category}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm whitespace-pre-wrap font-mono">{p.text}</div>
                <div className="flex gap-2">
                  <button onClick={() => onApprove(p.id)} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition">✓ {t.approve}</button>
                  <button onClick={() => onReject(p.id)} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition">✗ {t.reject}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingScreen;