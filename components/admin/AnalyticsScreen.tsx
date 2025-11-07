
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Prompt } from '../../types';

interface AnalyticsScreenProps {
  prompts: Prompt[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ prompts }) => {
  const approvedPrompts = prompts.filter(p => p.approved);

  const promptsPerCategory = approvedPrompts.reduce((acc, prompt) => {
    acc[prompt.category] = (acc[prompt.category] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const categoryChartData = Object.entries(promptsPerCategory).map(([name, value]) => ({ name, count: value }));

  const ratingData = [
    { name: '5 Stars', count: approvedPrompts.filter(p => p.rating >= 4.5).length },
    { name: '4 Stars', count: approvedPrompts.filter(p => p.rating >= 4 && p.rating < 4.5).length },
    { name: '3 Stars', count: approvedPrompts.filter(p => p.rating >= 3 && p.rating < 4).length },
    { name: '< 3 Stars', count: approvedPrompts.filter(p => p.rating < 3).length },
  ].filter(d => d.count > 0);

  return (
    <div>
      <div className="bg-white shadow-md p-4 border-b">
        <h1 className="text-2xl font-bold text-blue-600">📊 Analytics</h1>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold mb-4">Prompts per Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold mb-4">Rating Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={ratingData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="count">
                {ratingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsScreen;
