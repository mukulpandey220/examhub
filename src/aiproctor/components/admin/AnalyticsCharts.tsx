import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface AnalyticsChartsProps {
  eventTypeDistribution: Record<string, number>;
  reviewStatusDistribution: Record<string, number>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  eventTypeDistribution,
  reviewStatusDistribution,
}) => {
  const barData = Object.entries(eventTypeDistribution).map(([name, count]) => ({
    name: name.replace(/_/g, ' '),
    count,
  }));

  const pieData = Object.entries(reviewStatusDistribution).map(([status, value]) => ({
    name: status.replace(/_/g, ' '),
    value,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Event Type Distribution Chart */}
      <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Behavioral & Technical Flag Breakdown
        </h3>
        <p className="text-xs text-slate-500 mb-4">Total detected signals across active and archived sessions</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
              <XAxis
                dataKey="name"
                angle={-25}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Review Status Doughnut Chart */}
      <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Human Invigilator Review Status
        </h3>
        <p className="text-xs text-slate-500 mb-4">Disposition of flagged behavioral events</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

