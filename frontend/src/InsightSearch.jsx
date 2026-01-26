import React, { useState, useEffect } from 'react';

export default function InsightSearch() {
  const [query, setQuery] = useState('');
  const [insightOptions, setInsightOptions] = useState([]);
  const [allData, setAllData] = useState([]);
  const [filteredInsight, setFilteredInsight] = useState(null);
  const [error, setError] = useState(null);

  // Load dropdown + all insight data
  useEffect(() => {
    fetch('/api/insights')
      .then(res => res.json())
      .then(data => setInsightOptions(data.map(i => i.insightName)));

    fetch('/api/insight/all')
      .then(res => res.json())
      .then(setAllData)
      .catch(err => console.error("Failed to fetch all data:", err));
  }, []);

  // Handle dropdown filter
  const filterByInsight = async () => {
    if (!query) {
      setFilteredInsight(null);
      return;
    }

    try {
      const res = await fetch(`/api/insight/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Insight not found");
      const data = await res.json();
      setFilteredInsight(data);
      setError(null);
    } catch (err) {
      setFilteredInsight(null);
      setError(err.message);
    }
  };

  const handleReset = () => {
    setQuery('');
    setFilteredInsight(null);
    setError(null);
  };

  // Table for ALL insights view (homepage)
  const renderFullTable = (rows) => {
    const unmappedCount = rows.filter(r => r.isUnmapped).length;
    
    return (
      <div className="space-y-6">
        <div className="flex gap-6">
          <div className="bg-white border border-gray-100 rounded-xl p-6 flex-1 shadow-sm border-l-4 border-l-[#18A69B]">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Total Inventory</span>
            <p className="text-3xl font-black text-gray-800 mt-1">{rows.length}</p>
          </div>
          <div className={`bg-white border border-gray-100 rounded-xl p-6 flex-1 shadow-sm border-l-4 ${unmappedCount > 0 ? 'border-l-orange-400' : 'border-l-[#18A69B]'}`}>
            <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Unmapped Points</span>
            <p className={`text-3xl font-black mt-1 ${unmappedCount > 0 ? 'text-orange-500' : 'text-[#18A69B]'}`}>{unmappedCount}</p>
          </div>
        </div>

        <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f7f7] text-gray-600 text-left border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold">Insight</th>
                <th className="px-4 py-3 font-semibold">Calculation</th>
                <th className="px-4 py-3 font-semibold">Products</th>
                <th className="px-4 py-3 font-semibold">Data Point</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">System</th>
                <th className="px-4 py-3 font-semibold">Table</th>
                <th className="px-4 py-3 font-semibold">Field</th>
                <th className="px-4 py-3 font-semibold text-center">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row, idx) => (
                <tr key={idx} className={`${row.isUnmapped ? 'bg-orange-50/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.insightName}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={row.calculation}>{row.calculation}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.productsUsedIn?.map((p, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#f7f7f7] text-gray-600 rounded text-[10px] border border-gray-100">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${row.isUnmapped ? 'text-orange-600 font-bold' : 'text-gray-700'}`}>{row.dataPoint}</td>
                  <td className={`px-4 py-3 ${row.isUnmapped ? 'italic text-gray-400' : 'text-gray-600'}`}>
                    {row.isUnmapped ? (
                      <span className="flex items-center gap-1"><span className="text-orange-400">⚠️</span> Unmapped</span>
                    ) : row.sourceName}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{row.sourceSystem}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-gray-400">{row.table}</td>
                  <td className="px-4 py-3 font-mono text-[#18A69B] font-medium">{row.field}</td>
                  <td className="px-4 py-3 text-center">
                    {row.dataType && (
                      <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded text-[9px] border border-gray-100 uppercase font-bold">{row.dataType}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Table for filtered insight view
  const renderFilteredTable = (rows) => (
    <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 bg-[#f7f7f7]/50 flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Data Source Mapping Details</h3>
        <span className="text-[10px] bg-[#18A69B]/10 text-[#18A69B] px-2 py-1 rounded font-bold uppercase">{rows.length} Points Linked</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-[#f7f7f7] text-gray-500 text-left border-b border-gray-100">
          <tr>
            <th className="px-6 py-3 font-semibold">Data Point</th>
            <th className="px-6 py-3 font-semibold">Source System</th>
            <th className="px-6 py-3 font-semibold">Collection</th>
            <th className="px-6 py-3 font-semibold">Table</th>
            <th className="px-6 py-3 font-semibold">Source Field</th>
            <th className="px-6 py-3 font-semibold text-center">Type</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, idx) => (
            <tr key={idx} className={`${row.isUnmapped ? 'bg-orange-50/30' : 'hover:bg-gray-50/50'} transition-colors`}>
              <td className={`px-6 py-4 font-semibold ${row.isUnmapped ? 'text-orange-600' : 'text-gray-800'}`}>{row.dataPoint}</td>
              <td className="px-6 py-4 text-gray-600">{row.sourceSystem}</td>
              <td className={`px-6 py-4 ${row.isUnmapped ? 'italic text-gray-400' : 'text-gray-700'}`}>
                {row.isUnmapped ? '⚠️ Unmapped' : row.sourceName}
              </td>
              <td className="px-6 py-4 font-mono text-xs text-gray-400">{row.table}</td>
              <td className={`px-6 py-4 font-mono ${row.isUnmapped ? 'text-gray-300' : 'text-[#18A69B] font-bold'}`}>
                {row.field || '---'}
              </td>
              <td className="px-6 py-4 text-center">
                {row.dataType && (
                  <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${row.isUnmapped ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-[#18A69B]/5 text-[#18A69B] border-[#18A69B]/10'}`}>
                    {row.dataType}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f7f7] py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              Insight<span className="text-[#18A69B]">Mapper</span>
            </h1>
            <p className="text-gray-500 font-medium">Enterprise Data Visualization Mapping Engine</p>
          </div>
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-[#18A69B] transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Reset Dashboard
          </button>
        </div>

        {/* Filter Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Target Visualization</label>
            <div className="relative">
              <select
                className="appearance-none bg-[#f7f7f7] border-0 rounded-xl px-5 py-4 w-full text-gray-700 font-medium focus:ring-2 focus:ring-[#18A69B] transition-all outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              >
                <option value="">Search all visualizations...</option>
                {insightOptions.map((insight, idx) => (
                  <option key={idx} value={insight}>{insight}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <button
            onClick={filterByInsight}
            className="w-full md:w-auto bg-[#18A69B] text-white px-10 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-[#18A69B]/30 active:scale-95 transition-all"
          >
            Analyze Mapping
          </button>
        </div>

        {error && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
            <p className="text-sm text-orange-700 font-medium flex items-center gap-2">
              <span>⚠️</span> {error}
            </p>
          </div>
        )}

        {/* Filtered Insight Summary + Table */}
        {filteredInsight && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#18A69B] animate-pulse"></span>
                    <h2 className="text-3xl font-black text-gray-800">{filteredInsight.insightName}</h2>
                  </div>
                  <div className="flex gap-2">
                    {filteredInsight.productsUsedIn.map((p, i) => (
                      <span key={i} className="bg-[#18A69B]/5 text-[#18A69B] border border-[#18A69B]/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{p}</span>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-gray-50">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processing Logic</span>
                    <p className="mt-2 text-gray-600 text-sm leading-relaxed italic">"{filteredInsight.calculation}"</p>
                  </div>
                </div>
              </div>
            </div>

            {renderFilteredTable(
              filteredInsight.dataPoints.flatMap(dp =>
                (Array.isArray(dp.sourceMapping) ? dp.sourceMapping : []).map(m => ({
                  dataPoint: dp.name,
                  sourceName: m.sourceName,
                  sourceSystem: m.sourceSystem,
                  table: m.table,
                  field: m.field,
                  dataType: m.dataType,
                  isUnmapped: m.isUnmapped
                }))
              )
            )}
          </div>
        )}

        {/* Show full insight list only if NOT filtered */}
        {!query && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-[#18A69B] rounded-full"></div>
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Full Resource Inventory</h2>
            </div>
            {renderFullTable(allData)}
          </div>
        )}
      </div>
    </div>
  );
}
