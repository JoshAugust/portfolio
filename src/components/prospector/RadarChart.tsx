import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

export interface RadarValues {
  size: number;
  revenue: number;
  recency: number;
  techFit: number;
  growth: number;
  marketFit: number;
}

interface ICPRadarChartProps {
  values: RadarValues;
}

const ICPRadarChart = ({ values }: ICPRadarChartProps) => {
  const data = [
    { subject: 'Size', value: Math.round(values.size) },
    { subject: 'Revenue', value: Math.round(values.revenue) },
    { subject: 'Recency', value: Math.round(values.recency) },
    { subject: 'Tech Fit', value: Math.round(values.techFit) },
    { subject: 'Growth', value: Math.round(values.growth) },
    { subject: 'Market Fit', value: Math.round(values.marketFit) },
  ];

  return (
    <div className="relative w-full h-[280px]">
      {/* Glow backdrop */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }}
      />
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <defs>
            <filter id="icpGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <PolarGrid
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: '#a1a1aa',
              fontSize: 11,
              fontFamily: 'DM Mono, monospace',
              fontWeight: 400,
            }}
            tickLine={false}
          />
          <Radar
            name="ICP"
            dataKey="value"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#radarFill)"
            fillOpacity={1}
            filter="url(#icpGlow)"
            dot={{
              fill: '#3B82F6',
              r: 3,
              strokeWidth: 0,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ICPRadarChart;
