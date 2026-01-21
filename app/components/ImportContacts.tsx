'use client';

import { useState } from 'react';
import { Upload, Check, AlertCircle, Users, Database } from 'lucide-react';

export default function ImportContacts() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const importContacts = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/import-contacts?source=both', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Import error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8 rounded-2xl border-2 border-green-200 shadow-lg mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-600 rounded-xl shadow-md">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Import Network Contacts
            </h3>
            <p className="text-sm text-gray-600">Load contacts from GitHub CSV files</p>
          </div>
        </div>
      </div>

      {/* Import Button */}
      <button
        onClick={importContacts}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? (
          <>
            <Upload className="w-5 h-5 animate-bounce" />
            Importing contacts...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Import from GitHub CSV
          </>
        )}
      </button>

      {/* Info Box */}
      {!result && !error && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-sm text-blue-800">
          <p className="font-semibold mb-2">📋 What will be imported:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>network_phase1_contacts.csv</li>
            <li>WUKR_WIRE_MASTER_NETWORK.csv</li>
          </ul>
          <p className="mt-3 text-xs text-blue-600">
            Contacts will be mapped to sectors: fintech, clean_energy, tech_web3, tourism, agriculture, music_creative, government, other
          </p>
        </div>
      )}

      {/* Success */}
      {result && result.success && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-green-700 bg-green-50 p-4 rounded-xl border border-green-200">
            <Check className="w-5 h-5" />
            <div>
              <p className="font-semibold">{result.message}</p>
              <p className="text-sm">
                Imported: <span className="font-bold">{result.stats.totalImported}</span> contacts
                {result.stats.totalSkipped > 0 && (
                  <> • Skipped: {result.stats.totalSkipped}</>
                )}
              </p>
            </div>
          </div>

          {/* Sample Contacts */}
          {result.sample && result.sample.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                📋 Sample Imported Contacts
              </p>
              <div className="space-y-2">
                {result.sample.map((contact: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100 text-sm"
                  >
                    <div className="font-bold text-gray-900">{contact.company}</div>
                    <div className="text-xs text-gray-600">
                      {contact.email} • {contact.sector}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <p className="text-sm font-bold text-yellow-800 mb-2">
                ⚠️ Some contacts had errors:
              </p>
              <div className="space-y-1">
                {result.errors.map((err: string, idx: number) => (
                  <p key={idx} className="text-xs text-yellow-700">
                    • {err}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}
    </div>
  );
}
