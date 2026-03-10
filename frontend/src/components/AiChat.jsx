import React, { useState } from 'react';

export default function AiChat({ onSearchResults }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('chat');

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      if (mode === 'search') {
        const res = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userMessage })
        });
        const data = await res.json();
        if (data.error) {
          setMessages(prev => [...prev, { role: 'ai', content: `Error: ${data.error}` }]);
        } else {
          const resultCount = data.results?.length || 0;
          let responseText = `**${data.explanation}**\n\nFound ${resultCount} matching visualization${resultCount !== 1 ? 's' : ''}.`;
          if (data.results && data.results.length > 0) {
            responseText += '\n\n' + data.results.map(r => 
              `- **${r.insightName}** (${r.product}) - ${r.totalFields} fields, ${r.unmappedFields} unmapped`
            ).join('\n');
          }
          setMessages(prev => [...prev, { role: 'ai', content: responseText, results: data.results }]);
          if (onSearchResults && data.results) {
            onSearchResults(data.results);
          }
        }
      } else {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage })
        });
        const data = await res.json();
        if (data.error) {
          setMessages(prev => [...prev, { role: 'ai', content: `Error: ${data.error}` }]);
        } else {
          setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#18A69B] text-white rounded-full shadow-lg hover:bg-[#159085] transition-all flex items-center justify-center z-50"
        title="AI Assistant"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50">
      <div className="bg-[#18A69B] text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <span className="font-semibold text-sm">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-white/20 text-white text-xs rounded px-2 py-1 outline-none"
          >
            <option value="chat" className="text-gray-900">Chat</option>
            <option value="search" className="text-gray-900">Smart Search</option>
          </select>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            <p className="font-medium text-gray-500 mb-1">
              {mode === 'search' ? 'Ask me to find visualizations' : 'Ask me about your data'}
            </p>
            <p className="text-xs">
              {mode === 'search' 
                ? 'Try: "Show me claims visualizations with unmapped fields"'
                : 'Try: "How many fields are unmapped?" or "What products do we have?"'
              }
            </p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-[#18A69B] text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#18A69B]"></div>
                Thinking...
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'search' ? 'Search with natural language...' : 'Ask about your data...'}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#18A69B] focus:border-transparent outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-[#18A69B] text-white rounded-lg px-3 py-2 hover:bg-[#159085] disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
