import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function VisualizationDetail() {
  const { id } = useParams();
  const [viz, setViz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiExplainLoading, setAiExplainLoading] = useState(false);
  const [aiLineage, setAiLineage] = useState(null);
  const [aiLineageLoading, setAiLineageLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [aiSuggestLoading, setAiSuggestLoading] = useState({});

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

  const handleExplainCalculation = async () => {
    if (!viz?.calculation || aiExplainLoading) return;
    setAiExplainLoading(true);
    try {
      const res = await fetch('/api/ai/explain-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculation: viz.calculation,
          vizName: viz.insightName,
          dataPoints: viz.dataPoints?.map(dp => ({ name: dp.name })) || []
        })
      });
      const data = await res.json();
      setAiExplanation(data.explanation || data.error);
    } catch (err) {
      setAiExplanation('Failed to generate explanation. Please try again.');
    }
    setAiExplainLoading(false);
  };

  const handleAnalyzeLineage = async () => {
    if (aiLineageLoading) return;
    setAiLineageLoading(true);
    try {
      const res = await fetch('/api/ai/analyze-lineage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId: parseInt(id) })
      });
      const data = await res.json();
      setAiLineage(data.analysis || data.error);
    } catch (err) {
      setAiLineage('Failed to analyze lineage. Please try again.');
    }
    setAiLineageLoading(false);
  };

  const handleSuggestMapping = async (fieldName) => {
    if (aiSuggestLoading[fieldName]) return;
    setAiSuggestLoading(prev => ({ ...prev, [fieldName]: true }));
    try {
      const res = await fetch('/api/ai/suggest-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName,
          vizName: viz.insightName,
          tabName: viz.tabName || ''
        })
      });
      const data = await res.json();
      setAiSuggestions(prev => ({ ...prev, [fieldName]: data }));
    } catch (err) {
      setAiSuggestions(prev => ({ ...prev, [fieldName]: { error: 'Failed to get suggestions' } }));
    }
    setAiSuggestLoading(prev => ({ ...prev, [fieldName]: false }));
  };

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

  const tabsList = [
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
          {tabsList.map(tab => (
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
        <div className="space-y-4">
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
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {viz.dataPoints?.map((dp, idx) => {
                  const mapping = dp.sourceMapping?.[0];
                  const isUnmapped = !mapping || mapping.isUnmapped;
                  const suggestion = aiSuggestions[dp.name];
                  const isSuggestLoading = aiSuggestLoading[dp.name];
                  return (
                    <React.Fragment key={idx}>
                      <tr className={isUnmapped ? 'bg-orange-50/30' : 'hover:bg-gray-50'}>
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
                        <td className="px-6 py-4">
                          {isUnmapped && (
                            <button
                              onClick={() => handleSuggestMapping(dp.name)}
                              disabled={isSuggestLoading}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors disabled:opacity-50"
                            >
                              {isSuggestLoading ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                </svg>
                              )}
                              Suggest
                            </button>
                          )}
                        </td>
                      </tr>
                      {suggestion && (
                        <tr>
                          <td colSpan="8" className="px-6 py-3 bg-purple-50/50">
                            <div className="text-sm space-y-2">
                              <p className="font-medium text-purple-800">AI Mapping Suggestions for "{dp.name}"</p>
                              {suggestion.error ? (
                                <p className="text-red-600">{suggestion.error}</p>
                              ) : (
                                <>
                                  <p className="text-gray-600 text-xs">{suggestion.analysis}</p>
                                  {suggestion.suggestions?.map((s, si) => (
                                    <div key={si} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-purple-100">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                        s.confidence === 'high' ? 'bg-green-100 text-green-700' :
                                        s.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>
                                        {s.confidence}
                                      </span>
                                      <span className="font-mono text-sm text-gray-800">{s.table}.{s.column}</span>
                                      <span className="text-xs text-gray-500">({s.data_type})</span>
                                      <span className="text-xs text-gray-500 ml-auto">{s.reasoning}</span>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'lineage' && (
        <div className="space-y-4">
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

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">AI Lineage Analysis</h3>
              <button
                onClick={handleAnalyzeLineage}
                disabled={aiLineageLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#18A69B] text-white hover:bg-[#159085] disabled:opacity-50 transition-colors"
              >
                {aiLineageLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                )}
                {aiLineageLoading ? 'Analyzing...' : 'Analyze with AI'}
              </button>
            </div>
            {aiLineage ? (
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                {aiLineage}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Click "Analyze with AI" to get an intelligent analysis of the data lineage, potential issues, and recommendations.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'calculations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Calculation Logic</h2>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
              {viz.calculation || 'No calculation defined for this visualization.'}
            </div>
          </div>

          {viz.calculation && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">AI Explanation</h3>
                <button
                  onClick={handleExplainCalculation}
                  disabled={aiExplainLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#18A69B] text-white hover:bg-[#159085] disabled:opacity-50 transition-colors"
                >
                  {aiExplainLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                  )}
                  {aiExplainLoading ? 'Explaining...' : 'Explain with AI'}
                </button>
              </div>
              {aiExplanation ? (
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap border border-blue-100">
                  {aiExplanation}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Click "Explain with AI" to get a plain-English explanation of this calculation.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
