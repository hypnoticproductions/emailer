'use client';

import { useState } from 'react';
import SendForm from './components/SendForm';
import Dashboard from './components/Dashboard';
import { Zap, BarChart3 } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'send' | 'dashboard'>('send');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  WUKR WIRE
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  Morphic Intelligence Network
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-700">
                Connected to MANUS
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-lg border border-gray-200 inline-flex">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
              activeTab === 'send'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Zap className="w-5 h-5" />
            Send Signal
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 pb-20">
        {activeTab === 'send' ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                📡 Signal Distribution
              </h2>
              <p className="text-gray-600 mt-1">
                Fetch the latest signal from MANUS and send personalized emails to
                your network
              </p>
            </div>
            <SendForm />
          </div>
        ) : (
          <Dashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Powered by{' '}
                <span className="font-bold text-gray-900">MANUS</span> •{' '}
                <a
                  href="https://github.com/hypnoticproductions/quintapoo-memory"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View Signal Source
                </a>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Claude AI Personalization</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Resend Email Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
