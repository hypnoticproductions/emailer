'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Mail,
  MailOpen,
  MousePointerClick,
  TrendingUp,
  Calendar,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

interface DashboardStats {
  contacts: {
    total: number;
    bySector: Array<{ sector: string; _count: { sector: number } }>;
  };
  emails: {
    total: number;
    byStatus: Array<{ status: string; _count: { status: number } }>;
    bySector: Array<{ sector: string; _count: { sector: number } }>;
  };
  engagement: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalReplied: number;
    openRate: number;
    clickRate: number;
  };
  recentNewsletters: Array<{
    id: string;
    title: string;
    createdAt: string;
    sentAt: string | null;
    _count: {
      emailsSent: number;
    };
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard data');
      }

      setStats(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-200">
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">📊 Dashboard</h2>
          <p className="text-gray-600 mt-1">Real-time engagement metrics</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Contacts */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-sm font-semibold opacity-90">CONTACTS</span>
          </div>
          <div className="text-4xl font-bold mb-1">{stats.contacts.total}</div>
          <div className="text-sm opacity-80">Total in database</div>
        </div>

        {/* Emails Sent */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <Mail className="w-8 h-8 opacity-80" />
            <span className="text-sm font-semibold opacity-90">SENT</span>
          </div>
          <div className="text-4xl font-bold mb-1">{stats.engagement.totalSent}</div>
          <div className="text-sm opacity-80">Emails delivered</div>
        </div>

        {/* Open Rate */}
        <div className="bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <MailOpen className="w-8 h-8 opacity-80" />
            <span className="text-sm font-semibold opacity-90">OPENS</span>
          </div>
          <div className="text-4xl font-bold mb-1">{stats.engagement.openRate}%</div>
          <div className="text-sm opacity-80">
            {stats.engagement.totalOpened} opened
          </div>
        </div>

        {/* Click Rate */}
        <div className="bg-gradient-to-br from-pink-500 to-pink-700 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <MousePointerClick className="w-8 h-8 opacity-80" />
            <span className="text-sm font-semibold opacity-90">CLICKS</span>
          </div>
          <div className="text-4xl font-bold mb-1">{stats.engagement.clickRate}%</div>
          <div className="text-sm opacity-80">
            {stats.engagement.totalClicked} clicked
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacts by Sector */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Contacts by Sector</h3>
          </div>
          <div className="space-y-3">
            {stats.contacts.bySector.map((item) => (
              <div key={item.sector} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                      {item.sector.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {item._count.sector}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(item._count.sector / stats.contacts.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emails by Status */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900">Email Status</h3>
          </div>
          <div className="space-y-3">
            {stats.emails.byStatus.map((item) => {
              const colors: Record<string, string> = {
                sent: 'from-green-500 to-green-600',
                delivered: 'from-blue-500 to-blue-600',
                pending: 'from-yellow-500 to-yellow-600',
                failed: 'from-red-500 to-red-600',
              };

              return (
                <div key={item.status} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700 capitalize">
                        {item.status}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {item._count.status}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${colors[item.status] || 'from-gray-500 to-gray-600'} h-2 rounded-full transition-all duration-500`}
                        style={{
                          width: `${(item._count.status / stats.emails.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Newsletters */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-bold text-gray-900">Recent Newsletters</h3>
        </div>

        {stats.recentNewsletters.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No newsletters sent yet. Create your first one above!
          </p>
        ) : (
          <div className="space-y-3">
            {stats.recentNewsletters.map((newsletter) => (
              <div
                key={newsletter.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {newsletter.title}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(newsletter.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {newsletter._count.emailsSent} emails
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      newsletter.sentAt
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {newsletter.sentAt ? 'Sent' : 'Draft'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
