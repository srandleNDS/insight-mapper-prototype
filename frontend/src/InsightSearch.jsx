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

  // Table for ALL insights view (homepage)
  const renderFullTable = (rows) => (
    <div className="overflow-x-auto bg-white border rounded shadow p-4">
      <table className="w-full text-sm border border-gray-300">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="border px-3 py-2">Insight</th>
            <th className="border px-3 py-2">Calculation</th>
            <th className="border px-3 py-2">Used In Products</th>
            <th className="border px-3 py-2">Data Point</th>
            <th className="border px-3 py-2">Source</th>
            <th className="border px-3 py-2">System</th>
            <th className="border px-3 py-2">Table</th>
            <th className="border px-3 py-2">Field</th>
            <th className="border px-3 py-2">Data Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="even:bg-gray-50">
              <td className="border px-3 py-2">{row.insightName}</td>
              <td className="border px-3 py-2">{row.calculation}</td>
              <td className="border px-3 py-2">{row.productsUsedIn?.join(', ')}</td>
              <td className="border px-3 py-2">{row.dataPoint}</td>
              <td className="border px-3 py-2">{row.sourceName}</td>
              <td className="border px-3 py-2">{row.sourceSystem}</td>
              <td className="border px-3 py-2">{row.table}</td>
              <td className="border px-3 py-2">{row.field}</td>
              <td className="border px-3 py-2">{row.dataType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Table for filtered insight view
  const renderFilteredTable = (rows) => (
    <div className="overflow-x-auto bg-white border rounded shadow p-4">
      <h3 className="text-lg font-semibold mb-3 text-indigo-700">Data Source Mappings</h3>
      <table className="w-full text-sm border border-gray-300">
        <thead className="bg-indigo-50 text-left">
          <tr>
            <th className="border px-3 py-2">Data Point</th>
            <th className="border px-3 py-2">Source System</th>
            <th className="border px-3 py-2">Database/Collection</th>
            <th className="border px-3 py-2">Table</th>
            <th className="border px-3 py-2">Source Field</th>
            <th className="border px-3 py-2">Data Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="even:bg-gray-50 hover:bg-indigo-50 transition-colors">
              <td className="border px-3 py-2 font-medium">{row.dataPoint}</td>
              <td className="border px-3 py-2">{row.sourceSystem}</td>
              <td className="border px-3 py-2">{row.sourceName}</td>
              <td className="border px-3 py-2 font-mono text-xs">{row.table}</td>
              <td className="border px-3 py-2 text-indigo-600 font-mono font-bold">{row.field}</td>
              <td className="border px-3 py-2"><span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs uppercase font-semibold">{row.dataType}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-900">Insight Data Mapper</h1>
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Mapping Source Resources to Visualizations
        </div>
      </div>

      {/* Dropdown filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex gap-4 items-center">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Data Visualization</label>
          <select
            className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          >
            <option value="">-- All Visualizations --</option>
            {insightOptions.map((insight, idx) => (
              <option key={idx} value={insight}>{insight}</option>
            ))}
          </select>
        </div>

        <button
          onClick={filterByInsight}
          className="mt-6 bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 active:transform active:scale-95 transition-all shadow-md"
        >
          View Mapping
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">❌ {error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtered Insight Summary + Table */}
      {filteredInsight && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl shadow-lg p-6 mb-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{filteredInsight.insightName}</h2>
                <div className="flex gap-2 mb-4">
                  {filteredInsight.productsUsedIn.map((p, i) => (
                    <span key={i} className="bg-white/20 px-2 py-0.5 rounded text-xs backdrop-blur-sm">{p}</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase tracking-wider opacity-75">Logic Reference</span>
                <p className="font-mono text-sm bg-black/10 p-2 rounded mt-1">{filteredInsight.calculation}</p>
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
                dataType: m.dataType
              }))
            )
          )}
        </div>
      )}

      {/* Show full insight list only if NOT filtered */}
      {!query && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Complete Mapping Inventory</h2>
          {renderFullTable(allData)}
        </div>
      )}
    </div>
  );
}
