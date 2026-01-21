'use client';

import { useState } from 'react';
import { RefreshCw, Check, AlertCircle, GitBranch, Clock, User } from 'lucide-react';

interface Signal {
  title: string;
  date: string;
  signals: Array<{
    id: string;
    title: string;
    source: string;
    signal: string;
    tradeAngle: string;
    morphicFit: string;
  }>;
  rawContent: string;
}

interface SignalFetcherProps {
  onSignalFetched: (signal: Signal, newsletterId: string) => void;
}

export default function SignalFetcher({ onSignalFetched }: SignalFetcherProps) {
  const [loading, setLoading] = useState(false);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commits, setCommits] = useState<any[]>([]);

  const fetchSignal = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch signal
      const signalRes = await fetch('/api/fetch-signal');
      const signalData = await signalRes.json();

      if (!signalRes.ok) {
        throw new Error(signalData.error || 'Failed to fetch signal');
      }

      setSignal(signalData.signal);
      setLastUpdate(signalData.lastUpdated);
      onSignalFetched(signalData.signal, signalData.newsletterId);

      // Fetch status (commit history)
      const statusRes = await fetch('/api/signal-status');
      const statusData = await statusRes.json();
      setCommits(statusData.commits || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Fetch signal error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-2xl border-2 border-blue-200 shadow-lg mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl shadow-md">
            <GitBranch className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Morphic Trade Signal
            </h3>
            <p className="text-sm text-gray-600">Live from MANUS (Quintapoo)</p>
          </div>
        </div>
        <span className="text-xs bg-blue-600 text-white px-4 py-2 rounded-full font-semibold shadow-sm">
          🔴 LIVE
        </span>
      </div>

      {/* Fetch Button */}
      <button
        onClick={fetchSignal}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Fetching from GitHub...
          </>
        ) : (
          <>
            <RefreshCw className="w-5 h-5" />
            Fetch Latest Signal
          </>
        )}
      </button>

      {/* Status */}
      {lastUpdate && (
        <div className="flex items-center gap-3 text-green-700 bg-green-50 p-4 rounded-xl mb-6 border border-green-200">
          <Check className="w-5 h-5" />
          <span className="font-semibold">
            Signal updated: {new Date(lastUpdate).toLocaleString()}
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl mb-6 border border-red-200">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Signal Preview */}
      {signal && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              📊 Signals in This Update
            </p>
            <div className="grid grid-cols-1 gap-3">
              {signal.signals.map((s, idx) => (
                <div
                  key={s.id}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">{s.title}</h4>
                      <p className="text-xs text-gray-600">{s.source}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Commit History */}
      {commits.length > 0 && (
        <div className="mt-6 pt-6 border-t-2 border-blue-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
            📝 Recent Updates from GitHub
          </p>
          <div className="space-y-3">
            {commits.map((commit, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                    <code className="text-xs font-mono text-blue-600 font-bold">
                      {commit.sha}
                    </code>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      {commit.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {commit.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(commit.date).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
