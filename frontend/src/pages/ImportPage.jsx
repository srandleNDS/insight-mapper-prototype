import React, { useState, useRef } from 'react';

export default function ImportPage() {
  const [importType, setImportType] = useState('product');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTypeChange = (type) => {
    setImportType(type);
    resetState();
  };

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setPreviewing(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', importType);

    try {
      const res = await fetch('/api/import/preview', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setPreview(null);
      } else {
        setPreview(data);
      }
    } catch (err) {
      setError('Failed to preview file');
    }
    setPreviewing(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleImport = async () => {
    if (!file || importing) return;
    setImporting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    const endpoint = importType === 'product' ? '/api/import/product' : '/api/import/source';

    try {
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Import failed. Please try again.');
    }
    setImporting(false);
  };

  const productColumns = [
    { name: 'Product', desc: 'Product name (required)', required: true },
    { name: 'Tab Name', desc: 'Dashboard tab category (required)', required: true },
    { name: 'Data Visualization', desc: 'Name of the visualization (required)', required: true },
    { name: 'Data Viz Calculation', desc: 'SQL or formula' },
    { name: 'Enterprise Data Dictionary Table', desc: 'Enterprise DD table name' },
    { name: 'Enterprise Data Dictionary Field', desc: 'Enterprise DD field name (or "Data Point")' },
    { name: 'Enterprise DD Data Type', desc: 'Data type (e.g. varchar, int)' },
    { name: 'Data Point Calculation', desc: 'Field-level calculation' },
    { name: 'Data Dictionary Table', desc: 'DD table name' },
    { name: 'Data Dictionary Field', desc: 'DD field name' },
    { name: 'Source Type', desc: 'Source type (e.g. PMS, EHR)' },
    { name: 'Source Data Collection', desc: 'Source system name' },
    { name: 'Source Table', desc: 'Source table name' },
    { name: 'Source Column Name', desc: 'Source column name' },
    { name: 'Source Data Type', desc: 'Source data type' },
  ];

  const sourceColumns = [
    { name: 'Product', desc: 'Product name to match (required)', required: true },
    { name: 'Tab Name', desc: 'Tab category (required)', required: true },
    { name: 'Data Visualization', desc: 'Visualization to map to (required)', required: true },
    { name: 'Source Type', desc: 'Type of source (required)', required: true },
    { name: 'Source Data Collection', desc: 'Source system name (required)', required: true },
    { name: 'Source Table', desc: 'Source table name (required)', required: true },
    { name: 'Source Column Name', desc: 'Source column name' },
    { name: 'Source Data Type', desc: 'Source data type' },
    { name: 'Data Dictionary Table', desc: 'DD table' },
    { name: 'Data Dictionary Field', desc: 'DD field' },
    { name: 'DD Data Type', desc: 'DD data type' },
  ];

  const columns = importType === 'product' ? productColumns : sourceColumns;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Import</h1>
        <p className="text-sm text-gray-500 mt-1">Upload CSV files to add product data or source mappings</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleTypeChange('product')}
          className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
            importType === 'product'
              ? 'border-[#18A69B] bg-[#18A69B]/5'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              importType === 'product' ? 'bg-[#18A69B]/10 text-[#18A69B]' : 'bg-gray-100 text-gray-400'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <div>
              <h3 className={`font-bold ${importType === 'product' ? 'text-[#18A69B]' : 'text-gray-700'}`}>Product Data</h3>
              <p className="text-xs text-gray-500">Add visualizations and data points</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleTypeChange('source')}
          className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
            importType === 'source'
              ? 'border-[#18A69B] bg-[#18A69B]/5'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              importType === 'source' ? 'bg-[#18A69B]/10 text-[#18A69B]' : 'bg-gray-100 text-gray-400'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
              </svg>
            </div>
            <div>
              <h3 className={`font-bold ${importType === 'source' ? 'text-[#18A69B]' : 'text-gray-700'}`}>Source Mappings</h3>
              <p className="text-xs text-gray-500">Map data points to source systems</p>
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-[#18A69B] transition-colors"
          >
            {previewing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#18A69B]"></div>
                <p className="text-sm text-gray-500">Analyzing file...</p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#18A69B]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#18A69B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={resetState} className="text-sm text-red-500 hover:underline">
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Drop your CSV file here</p>
                  <p className="text-xs text-gray-500 mt-1">or click to browse</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Select File
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {preview && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">File Preview</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">{preview.totalRows} rows</span>
                  <span className="text-gray-500">{preview.visualizations} visualizations</span>
                  <span className="text-gray-500">{preview.products.join(', ')}</span>
                </div>
              </div>

              {preview.missingColumns.length > 0 && (
                <div className="px-6 py-3 bg-orange-50 border-b border-orange-100">
                  <p className="text-sm text-orange-700">
                    <span className="font-bold">Missing columns:</span> {preview.missingColumns.join(', ')}
                  </p>
                </div>
              )}

              {preview.valid && (
                <div className="px-6 py-3 bg-green-50 border-b border-green-100">
                  <p className="text-sm text-green-700 font-medium">All required columns found. Ready to import.</p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500 font-bold">#</th>
                      {preview.columns.map(col => (
                        <th key={col} className={`px-3 py-2 text-left font-bold whitespace-nowrap ${
                          preview.missingColumns.includes(col) ? 'text-orange-600' :
                          preview.expectedColumns.includes(col) ? 'text-[#18A69B]' : 'text-gray-500'
                        }`}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                        {preview.columns.map(col => (
                          <td key={col} className="px-3 py-2 text-gray-700 max-w-[200px] truncate">{row[col] || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.totalRows > 10 && (
                <div className="px-6 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
                  Showing first 10 of {preview.totalRows} rows
                </div>
              )}
            </div>
          )}

          {preview && preview.valid && !result && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full py-3 bg-[#18A69B] text-white font-bold rounded-xl hover:bg-[#159085] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                  Import {preview.totalRows} Rows
                </>
              )}
            </button>
          )}

          {result && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Import Complete</h3>
                  <p className="text-sm text-gray-500">Processed {result.totalRows} rows</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {importType === 'product' ? (
                  <>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-[#18A69B]">{result.insightsCreated}</p>
                      <p className="text-xs text-gray-500">Visualizations Created</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-blue-600">{result.insightsUpdated}</p>
                      <p className="text-xs text-gray-500">Visualizations Updated</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-purple-600">{result.dataPointsCreated}</p>
                      <p className="text-xs text-gray-500">Data Points Created</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-indigo-600">{result.sourceMappingsCreated || 0}</p>
                      <p className="text-xs text-gray-500">Source Mappings</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-[#18A69B]">{result.mappingsCreated}</p>
                      <p className="text-xs text-gray-500">Mappings Created</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-gray-400">{result.skipped}</p>
                      <p className="text-xs text-gray-500">Duplicates Skipped</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-orange-500">{result.errors?.length || 0}</p>
                      <p className="text-xs text-gray-500">Errors</p>
                    </div>
                  </>
                )}
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm font-bold text-orange-700 mb-2">Issues ({result.errors.length})</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-orange-600">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={resetState}
                className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Import Another File
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3">Expected Columns</h3>
            <div className="space-y-2">
              {columns.map(col => (
                <div key={col.name} className="flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${col.required ? 'bg-[#18A69B]' : 'bg-gray-300'}`}></span>
                  <div>
                    <p className={`text-sm ${col.required ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>{col.name}</p>
                    <p className="text-xs text-gray-500">{col.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <a
            href={`/api/import/template/${importType}`}
            download
            className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Download Template CSV
          </a>

          <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
            <h3 className="font-bold text-blue-900 mb-2 text-sm">
              {importType === 'product' ? 'Product Data Import' : 'Source Mapping Import'}
            </h3>
            {importType === 'product' ? (
              <ul className="text-xs text-blue-700 space-y-1.5">
                <li>Creates new visualizations and data points</li>
                <li>Existing visualizations are updated, not duplicated</li>
                <li>Each row represents one data point within a visualization</li>
                <li>Product and Tab Name group visualizations together</li>
              </ul>
            ) : (
              <ul className="text-xs text-blue-700 space-y-1.5">
                <li>Maps existing data points to source database tables</li>
                <li>Visualizations and data points must already exist</li>
                <li>First import product data, then add source mappings</li>
                <li>Duplicate mappings are automatically skipped</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
