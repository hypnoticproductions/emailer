'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Check, AlertCircle, GitBranch, FileText, Send, Mail } from 'lucide-react';

interface Content {
  title: string;
  subject: string;
  from?: string;
  date?: string;
  edition?: string;
  rawContent: string;
  fileName: string;
  type: 'newsletter' | 'proposal';
}

interface SignalFetcherProps {
  onSignalFetched: (content: Content, newsletterId: string) => void;
}

export default function SignalFetcher({ onSignalFetched }: SignalFetcherProps) {
  const [contentType, setContentType] = useState<'newsletter' | 'proposal'>('newsletter');
  const [availableFiles, setAvailableFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [content, setContent] = useState<Content | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch available files when content type changes
  useEffect(() => {
    fetchAvailableFiles();
  }, [contentType]);

  const fetchAvailableFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch(`/api/content/list?type=${contentType}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to list files');
      }

      const files = contentType === 'newsletter' ? data.newsletters : data.proposals;
      setAvailableFiles(files);

      // Auto-select the first non-template file
      const defaultFile = files.find((f: any) => !f.name.includes('template'));
      if (defaultFile) {
        setSelectedFile(defaultFile.name);
      } else if (files.length > 0) {
        setSelectedFile(files[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchContent = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/fetch-signal?type=${contentType}&filename=${selectedFile}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch content');
      }

      setContent(data.content);
      setLastUpdate(data.lastUpdated);
      onSignalFetched(data.content, data.newsletterId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Fetch content error:', err);
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
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Content Distribution
            </h3>
            <p className="text-sm text-gray-600">Newsletters & Proposals from GitHub</p>
          </div>
        </div>
        <span className="text-xs bg-green-600 text-white px-4 py-2 rounded-full font-semibold shadow-sm">
          🟢 Connected to MANUS
        </span>
      </div>

      {/* Content Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-3">
          📁 Content Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setContentType('newsletter')}
            className={`p-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              contentType === 'newsletter'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
            }`}
          >
            <FileText className="w-5 h-5" />
            Newsletter
          </button>
          <button
            onClick={() => setContentType('proposal')}
            className={`p-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              contentType === 'proposal'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300'
            }`}
          >
            <Send className="w-5 h-5" />
            Proposal
          </button>
        </div>
      </div>

      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-3">
          📄 Select File
        </label>
        {loadingFiles ? (
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-center gap-3 text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading files...
          </div>
        ) : availableFiles.length === 0 ? (
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-yellow-700 text-sm">
            No {contentType}s found in repository
          </div>
        ) : (
          <select
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="w-full p-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            {availableFiles.map((file) => (
              <option key={file.name} value={file.name}>
                {file.name.replace('.md', '').replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Fetch Button */}
      <button
        onClick={fetchContent}
        disabled={loading || !selectedFile}
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
            Load {contentType === 'newsletter' ? 'Newsletter' : 'Proposal'}
          </>
        )}
      </button>

      {/* Status */}
      {lastUpdate && (
        <div className="flex items-center gap-3 text-green-700 bg-green-50 p-4 rounded-xl mb-6 border border-green-200">
          <Check className="w-5 h-5" />
          <span className="font-semibold">
            Content loaded: {new Date(lastUpdate).toLocaleString()}
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

      {/* Content Preview */}
      {content && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
              {contentType === 'newsletter' ? '📰 Newsletter Preview' : '📧 Proposal Preview'}
            </p>

            <div className="space-y-3">
              <div className="pb-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-1">Subject Line</p>
                <p className="text-lg font-bold text-gray-900">{content.subject}</p>
              </div>

              {content.from && (
                <div className="pb-3 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-1">From</p>
                  <p className="text-sm text-gray-800">{content.from}</p>
                </div>
              )}

              {content.date && (
                <div className="pb-3 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Date</p>
                  <p className="text-sm text-gray-800">{content.date}</p>
                </div>
              )}

              {content.edition && (
                <div className="pb-3 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Edition</p>
                  <p className="text-sm text-gray-800">{content.edition}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Content Preview</p>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                    {content.rawContent.substring(0, 500)}...
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
