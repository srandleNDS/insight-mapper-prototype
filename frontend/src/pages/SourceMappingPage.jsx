import React, { useState, useEffect, useRef } from 'react';

export default function SourceMappingPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchRecords, setBatchRecords] = useState([]);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [approving, setApproving] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const res = await fetch('/api/import/source-upload/batches');
      const data = await res.json();
      setBatches(data);
    } catch (err) {
      console.error('Failed to load batches');
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import/source-upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setUploadResult(data);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadBatches();
        setSelectedBatch(data.batchId);
        loadBatchRecords(data.batchId);
      }
    } catch (err) {
      setError('Upload failed');
    }
    setUploading(false);
  };

  const loadBatchRecords = async (batchId) => {
    try {
      const res = await fetch(`/api/import/source-upload/${batchId}`);
      const data = await res.json();
      setBatchRecords(data);
    } catch (err) {
      console.error('Failed to load batch records');
    }
  };

  const handleSelectBatch = (batchId) => {
    setSelectedBatch(batchId);
    setPredictionResult(null);
    loadBatchRecords(batchId);
  };

  const handlePredict = async () => {
    if (!selectedBatch || predicting) return;
    setPredicting(true);
    setPredictionResult(null);
    setError(null);

    try {
      const res = await fetch(`/api/import/source-upload/${selectedBatch}/predict`, { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPredictionResult(data);
        loadBatchRecords(selectedBatch);
      }
    } catch (err) {
      setError('AI prediction failed. Please try again.');
    }
    setPredicting(false);
  };

  const handleApprove = async (recordId, dataPointId) => {
    setApproving(prev => ({ ...prev, [recordId]: true }));
    try {
      const res = await fetch('/api/import/source-upload/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, dataPointId })
      });
      const data = await res.json();
      if (data.success) {
        loadBatchRecords(selectedBatch);
        loadBatches();
      } else {
        setError(data.error || 'Failed to approve mapping');
      }
    } catch (err) {
      setError('Failed to approve mapping');
    }
    setApproving(prev => ({ ...prev, [recordId]: false }));
  };

  const handleReject = async (recordId) => {
    setApproving(prev => ({ ...prev, [recordId]: true }));
    try {
      const res = await fetch('/api/import/source-upload/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId })
      });
      const data = await res.json();
      if (data.success) {
        loadBatchRecords(selectedBatch);
        loadBatches();
      } else {
        setError(data.error || 'Failed to reject mapping');
      }
    } catch (err) {
      setError('Failed to reject mapping');
    }
    setApproving(prev => ({ ...prev, [recordId]: false }));
  };

  const handleApproveAll = async () => {
    const highConfidence = batchRecords.filter(r =>
      r.status === 'suggested' && r.aiSuggestedDataPointId && (r.aiConfidence === 'high' || r.aiConfidence === 'medium')
    );
    if (highConfidence.length === 0) return;

    setApproving(prev => {
      const next = { ...prev };
      highConfidence.forEach(r => { next[r.id] = true; });
      return next;
    });

    try {
      const res = await fetch('/api/import/source-upload/approve-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordIds: highConfidence.map(r => r.id) })
      });
      const data = await res.json();
      if (data.success) {
        loadBatchRecords(selectedBatch);
        loadBatches();
      }
    } catch (err) {
      console.error('Batch approve failed');
    }
    setApproving({});
  };

  const confidenceColor = (c) => {
    switch (c) {
      case 'high': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const statusColor = (s) => {
    switch (s) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'suggested': return 'bg-blue-100 text-blue-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'no_match': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const filteredRecords = filterStatus === 'all'
    ? batchRecords
    : batchRecords.filter(r => r.status === filterStatus);

  const stats = {
    total: batchRecords.length,
    pending: batchRecords.filter(r => r.status === 'pending').length,
    suggested: batchRecords.filter(r => r.status === 'suggested').length,
    approved: batchRecords.filter(r => r.status === 'approved').length,
    rejected: batchRecords.filter(r => r.status === 'rejected').length,
    noMatch: batchRecords.filter(r => r.status === 'no_match').length,
    highConf: batchRecords.filter(r => r.aiConfidence === 'high' && r.status === 'suggested').length,
    medConf: batchRecords.filter(r => r.aiConfidence === 'medium' && r.status === 'suggested').length,
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Source Mapping</h1>
        <p className="text-sm text-gray-500 mt-1">Upload source data and let AI predict mappings to product data points</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3">Upload Source Data</h3>
            <p className="text-xs text-gray-500 mb-4">CSV with columns: Source Name, Source Type, Table, Column, Data Type</p>

            <div
              onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]); }}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-[#18A69B] transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFileSelect(e.target.files[0])} />
              {file ? (
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <svg className="w-6 h-6 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <p className="text-xs text-gray-500">Drop CSV or click</p>
                </div>
              )}
            </div>

            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full mt-3 py-2 bg-[#18A69B] text-white text-sm font-bold rounded-lg hover:bg-[#159085] disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Source Data'}
              </button>
            )}

            <a
              href="/api/import/template/source-data"
              download
              className="flex items-center justify-center gap-1 w-full mt-2 py-2 text-xs text-gray-500 hover:text-[#18A69B] transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Download Template
            </a>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {uploadResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-sm text-green-700 font-medium">{uploadResult.recordsCreated} source fields uploaded</p>
              <p className="text-xs text-green-600 mt-1">Batch: {uploadResult.batchId}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3">Upload Batches</h3>
            {batches.length === 0 ? (
              <p className="text-sm text-gray-400">No uploads yet</p>
            ) : (
              <div className="space-y-2">
                {batches.map(b => (
                  <button
                    key={b.batchId}
                    onClick={() => handleSelectBatch(b.batchId)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedBatch === b.batchId
                        ? 'border-[#18A69B] bg-[#18A69B]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-gray-500">{b.batchId}</span>
                      <span className="text-xs text-gray-400">{b.total} fields</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{b.sources.join(', ')}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {b.pending > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{b.pending} pending</span>}
                      {b.suggested > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">{b.suggested} suggested</span>}
                      {b.approved > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-600">{b.approved} approved</span>}
                      {b.noMatch > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-600">{b.noMatch} no match</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <h3 className="font-bold text-blue-900 text-sm mb-2">How It Works</h3>
            <ol className="text-xs text-blue-700 space-y-1.5 list-decimal list-inside">
              <li>Upload a CSV with your source system data</li>
              <li>Click "Run AI Prediction" to analyze mappings</li>
              <li>Review AI suggestions with confidence scores</li>
              <li>Approve or reject each suggested mapping</li>
              <li>Approved mappings become source mappings in the system</li>
            </ol>
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selectedBatch ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
              </svg>
              <h3 className="font-bold text-gray-600 mb-1">No batch selected</h3>
              <p className="text-sm text-gray-400">Upload source data or select an existing batch to begin</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <h3 className="font-bold text-gray-900">Batch: {selectedBatch}</h3>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">{stats.total} total</span>
                      {stats.pending > 0 && <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-500">{stats.pending} pending</span>}
                      {stats.suggested > 0 && <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-600">{stats.suggested} to review</span>}
                      {stats.approved > 0 && <span className="px-2 py-1 rounded-full bg-green-100 text-green-600">{stats.approved} approved</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {stats.pending > 0 && (
                      <button
                        onClick={handlePredict}
                        disabled={predicting}
                        className="px-4 py-2 bg-[#18A69B] text-white text-sm font-bold rounded-lg hover:bg-[#159085] disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        {predicting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                            </svg>
                            Run AI Prediction
                          </>
                        )}
                      </button>
                    )}
                    {(stats.highConf + stats.medConf) > 0 && (
                      <button
                        onClick={handleApproveAll}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approve All High/Medium ({stats.highConf + stats.medConf})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {predicting && (
                <div className="bg-[#18A69B]/5 border border-[#18A69B]/20 rounded-xl p-6 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#18A69B] mx-auto mb-3"></div>
                  <p className="text-sm font-medium text-[#18A69B]">AI is analyzing source fields and predicting mappings...</p>
                  <p className="text-xs text-gray-500 mt-1">This may take a moment for large batches</p>
                </div>
              )}

              {predictionResult && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#18A69B]/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#18A69B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">AI Prediction Complete</h4>
                      <p className="text-xs text-gray-500">{predictionResult.matched} matched, {predictionResult.unmatched} unmatched of {predictionResult.totalProcessed} fields</p>
                    </div>
                  </div>
                  {predictionResult.summary && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-2">{predictionResult.summary}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 text-xs flex-wrap">
                {['all', 'suggested', 'approved', 'no_match', 'rejected', 'pending'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                      filterStatus === s ? 'bg-[#18A69B] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredRecords.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-sm text-gray-400">No records match the selected filter</p>
                  </div>
                ) : (
                  filteredRecords.map(record => (
                    <div key={record.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(record.status)}`}>{record.status}</span>
                            {record.aiConfidence && record.aiConfidence !== 'none' && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColor(record.aiConfidence)}`}>{record.aiConfidence} confidence</span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1 font-bold">SOURCE</p>
                              <p className="text-sm font-medium text-gray-900">{record.sourceName}</p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {record.tableName && <span className="font-mono">{record.tableName}</span>}
                                {record.columnName && <span className="font-mono">.{record.columnName}</span>}
                              </p>
                              <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                {record.sourceType && <span>Type: {record.sourceType}</span>}
                                {record.dataType && <span>Data: {record.dataType}</span>}
                              </div>
                            </div>

                            {record.aiSuggestedFieldName ? (
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                <p className="text-xs text-blue-400 mb-1 font-bold">AI SUGGESTED MATCH</p>
                                <p className="text-sm font-medium text-blue-900">{record.aiSuggestedVizName}</p>
                                <p className="text-xs text-blue-700 mt-0.5 font-mono">{record.aiSuggestedFieldName}</p>
                                {record.aiReasoning && (
                                  <p className="text-xs text-blue-600 mt-1 italic">{record.aiReasoning}</p>
                                )}
                              </div>
                            ) : (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1 font-bold">MATCH</p>
                                <p className="text-sm text-gray-400 italic">
                                  {record.status === 'pending' ? 'Run AI prediction to find matches' : 'No matching data point found'}
                                </p>
                                {record.aiReasoning && (
                                  <p className="text-xs text-gray-500 mt-1 italic">{record.aiReasoning}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {record.status === 'suggested' && record.aiSuggestedDataPointId && (
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleApprove(record.id, record.aiSuggestedDataPointId)}
                              disabled={approving[record.id]}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {approving[record.id] ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(record.id)}
                              disabled={approving[record.id]}
                              className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
