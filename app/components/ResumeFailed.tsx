'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, AlertTriangle, Check, Mail } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface Newsletter {
  id: string;
  title: string;
  created_at: string;
  sent_at: string | null;
  metadata: any;
}

export default function ResumeFailed() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setNewsletters(data || []);
    } catch (error) {
      console.error('Error fetching newsletters:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleResendFailed = async (newsletterId: string, title: string) => {
    if (!confirm(`Resend to failed recipients for "${title}"?`)) return;

    setSending(newsletterId);
    setMessage(null);

    try {
      const res = await fetch('/api/send-failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletterId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend');
      }

      showMessage(
        'success',
        `Successfully sent to ${data.sent} recipients. ${data.failed} failed.`
      );
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to resend emails');
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-8 rounded-2xl border-2 border-orange-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-orange-600 rounded-xl shadow-md">
          <RotateCcw className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Resume Failed Sends</h3>
          <p className="text-sm text-gray-600">Resend to contacts who didn't receive emails</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* Newsletters List */}
      <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
        {loading || newsletters.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-semibold">No newsletters found</p>
            <p className="text-sm mt-1">Send a newsletter first to use this feature</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {newsletters.map((newsletter) => (
              <div
                key={newsletter.id}
                className="flex items-center justify-between p-4 hover:bg-orange-50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{newsletter.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                    <span>
                      {new Date(newsletter.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {newsletter.sent_at && (
                      <span className="text-green-600 font-semibold">• Sent</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleResendFailed(newsletter.id, newsletter.title)}
                  disabled={sending === newsletter.id}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw
                    className={`w-4 h-4 ${sending === newsletter.id ? 'animate-spin' : ''}`}
                  />
                  {sending === newsletter.id ? 'Sending...' : 'Resume Send'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-white rounded-xl border border-orange-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Identifies contacts who never received the email or had failures</li>
              <li>Sends personalized emails only to those contacts</li>
              <li>Respects Resend rate limits (600ms between sends)</li>
              <li>Click "Sync Status" first to get accurate delivery data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
