'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, Send, Users, TrendingUp } from 'lucide-react';
import SignalFetcher from './SignalFetcher';

const SECTORS = [
  { id: 'fintech', label: 'Fintech', emoji: '💳', color: 'from-blue-400 to-blue-600' },
  { id: 'clean_energy', label: 'Clean Energy', emoji: '⚡', color: 'from-green-400 to-green-600' },
  { id: 'tech_web3', label: 'Tech/Web3', emoji: '🌐', color: 'from-purple-400 to-purple-600' },
  { id: 'tourism', label: 'Tourism', emoji: '✈️', color: 'from-pink-400 to-pink-600' },
  { id: 'agriculture', label: 'Agriculture', emoji: '🌾', color: 'from-yellow-400 to-yellow-600' },
  { id: 'music_creative', label: 'Music/Creative', emoji: '🎵', color: 'from-red-400 to-red-600' },
  { id: 'government', label: 'Government', emoji: '🏛️', color: 'from-gray-400 to-gray-600' },
  { id: 'other', label: 'Other', emoji: '📊', color: 'from-indigo-400 to-indigo-600' },
];

export default function SendForm() {
  const [signal, setSignal] = useState<any>(null);
  const [newsletterId, setNewsletterId] = useState<string>('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // When signal is fetched from GitHub
  const handleSignalFetched = (fetchedSignal: any, newsletterId: string) => {
    setSignal(fetchedSignal);
    setNewsletterId(newsletterId);
    setContent(fetchedSignal.rawContent);

    // Auto-select all sectors
    setSelectedSegments(SECTORS.map(s => s.id));

    // Set title
    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    setTitle(`${fetchedSignal.title} — ${date}`);
  };

  const toggleSegment = (segment: string) => {
    setSelectedSegments((prev) =>
      prev.includes(segment)
        ? prev.filter((s) => s !== segment)
        : [...prev, segment]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStats(null);

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsletter: { title, content },
          segments: selectedSegments,
          signal: signal || {},
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to send');
      }

      if (result.success) {
        setSuccess(true);
        setStats(result.stats);
        setTimeout(() => {
          setSuccess(false);
          setStats(null);
        }, 10000);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Send failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Signal Fetcher - Connected to GitHub */}
      <SignalFetcher onSignalFetched={handleSignalFetched} />

      {/* Main Form */}
      <form onSubmit={handleSend} className="space-y-6">
        {/* Title Input */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <label className="block text-sm font-bold mb-3 text-gray-700 uppercase tracking-wide">
            📧 Newsletter Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., WUKR WIRE INTELLIGENCE — Monday, Jan 21"
            className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg font-medium"
            required
          />
        </div>

        {/* Content Preview */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <label className="block text-sm font-bold mb-3 text-gray-700 uppercase tracking-wide">
            📝 Newsletter Content Preview
          </label>
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto">
            <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
              {content || 'Click "Fetch Latest Signal" to load content...'}
            </pre>
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Signal data will be personalized for each contact using Claude AI
          </p>
        </div>

        {/* Segment Selection */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              🎯 Select Target Segments
            </label>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
              {selectedSegments.length} Selected
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SECTORS.map((sector) => (
              <button
                key={sector.id}
                type="button"
                onClick={() => toggleSegment(sector.id)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                  selectedSegments.includes(sector.id)
                    ? `bg-gradient-to-br ${sector.color} text-white border-transparent shadow-lg`
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">{sector.emoji}</div>
                <div className="text-xs font-bold">{sector.label}</div>
                {selectedSegments.includes(sector.id) && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900">
                Estimated reach: ~{selectedSegments.length * 13} personalized emails
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && stats && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-xl font-bold text-green-900">
                  Emails Sent Successfully!
                </h3>
                <p className="text-sm text-green-700">
                  Check dashboard for real-time metrics
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="bg-white p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                <div className="text-xs text-gray-600">Sent</div>
              </div>
              <div className="bg-white p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 text-red-600 bg-red-50 p-6 rounded-2xl border-2 border-red-200">
            <AlertCircle className="w-6 h-6" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Send Button */}
        <button
          type="submit"
          disabled={loading || !content || selectedSegments.length === 0 || !signal}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:from-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Sending personalized emails...
            </>
          ) : (
            <>
              <Send className="w-6 h-6" />
              Send to {selectedSegments.length} Segments
            </>
          )}
        </button>
      </form>
    </div>
  );
}
