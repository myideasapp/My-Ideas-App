
import React from 'react';
import type { Prompt } from '../../types';

interface ApprovedScreenProps {
  prompts: Prompt[];
  onDelete: (prompt: Prompt) => void;
}

const ApprovedScreen: React.FC<ApprovedScreenProps> = ({ prompts, onDelete }) => {
  return (
    <div>
       <div className="bg-white shadow-md p-4 border-b">
        <h1 className="text-2xl font-bold text-purple-600">📖 Manage Prompts</h1>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {prompts.length === 0 ? (
          <p className="text-center text-xl text-gray-600 py-10">No prompts have been submitted yet.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Author</th>
                  <th className="p-4 font-semibold">Rating</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prompts.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4 font-medium">{p.title}</td>
                    <td className="p-4">{p.author}</td>
                    <td className="p-4">⭐ {p.rating.toFixed(1)}</td>
                    <td className="p-4 text-right">
                       <div className="flex gap-2 justify-end">
                        <button onClick={() => onDelete(p)} className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-semibold hover:bg-red-200">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovedScreen;
