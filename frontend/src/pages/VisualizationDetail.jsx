import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function VisualizationDetail() {
  const { id } = useParams();
  const [viz, setViz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchVisualization = async () => {
      try {
        const res = await fetch(`/api/insight/${id}`);
        if (!res.ok) {
          throw new Error('Visualization not found');
        }
        const data = await res.json();
        setViz(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching visualization:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchVisualization();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#18A69B]"></div>
      </div>
    );
  }

  if (error || !viz) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">{error || 'Visualization not found'}</p>
        <Link to="/explorer" className="text-[#18A69B] hover:underline mt-2 inline-block">Back to Explorer</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'fields', label: 'Fields' },
    { id: 'lineage', label: 'Lineage' },
    { id: 'calculations', label: 'Calculations' }
  ];

  const fieldCount = viz.dataPoints?.length || 0;
  const mappedCount = viz.dataPoints?.filter(dp => dp.sourceMapping?.some(m => !m.isUnmapped)).length || 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/explorer" className="hover:text-[#18A69B]">Explorer</Link>
        <span>/</span>
        <span className="text-gray-900">{viz.insightName}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{viz.insightName}</h1>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#18A69B]/10 text-[#18A69B]">
            BASE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Copy Link
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-[#18A69B] text-[#18A69B]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Overview</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tab Name</p>
                <p className="mt-1 text-gray-900 font-medium">{viz.productsUsedIn?.[0] || 'General'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Filter Context</p>
                <p className="mt-1 text-gray-900 font-medium">Base (No Filter)</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Calculation</p>
              <p className="mt-1 text-gray-700 italic">"{viz.calculation || 'No calculation defined'}"</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{fieldCount}</p>
                <p className="text-xs text-gray-500 mt-1">Total Fields</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#18A69B]">{mappedCount}</p>
                <p className="text-xs text-gray-500 mt-1">Mapped Fields</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Products</h2>
            <div className="flex flex-wrap gap-2">
              {viz.productsUsedIn?.map((p, i) => (
                <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[#18A69B]/10 text-[#18A69B] border border-[#18A69B]/20">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fields' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Field Name</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Enterprise Table</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Enterprise Field</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">DD Table</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">DD Field</th>
                <th className="text-center px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {viz.dataPoints?.map((dp, idx) => {
                const mapping = dp.sourceMapping?.[0];
                const isUnmapped = !mapping || mapping.isUnmapped;
                return (
                  <tr key={idx} className={isUnmapped ? 'bg-orange-50/30' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 font-medium text-gray-900">{dp.name}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{mapping?.table || '—'}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{mapping?.field || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{mapping?.dataType || '—'}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{mapping?.sourceSystem || '—'}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{mapping?.sourceName || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      {isUnmapped ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                          Unmapped
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                          Mapped
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'lineage' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Data Lineage</h2>
          <div className="flex items-center justify-center gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center min-w-[140px]">
              <p className="text-xs text-blue-600 font-medium uppercase">Source</p>
              <p className="text-sm font-bold text-blue-900 mt-1">PMS / EHR</p>
            </div>
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center min-w-[140px]">
              <p className="text-xs text-purple-600 font-medium uppercase">Data Dictionary</p>
              <p className="text-sm font-bold text-purple-900 mt-1">DD Tables</p>
            </div>
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
            <div className="bg-[#18A69B]/10 border border-[#18A69B]/30 rounded-lg p-4 text-center min-w-[140px]">
              <p className="text-xs text-[#18A69B] font-medium uppercase">Enterprise</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{viz.insightName}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calculations' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Calculation Logic</h2>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
            {viz.calculation || 'No calculation defined for this visualization.'}
          </div>
        </div>
      )}
    </div>
  );
}
