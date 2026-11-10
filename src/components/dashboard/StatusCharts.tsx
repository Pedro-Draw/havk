import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import Card from '../ui/Card';

interface Slice {
  name: string;
  value: number;
  color: string;
}

export default function StatusCharts({ statusData }: { statusData: Slice[] }) {
  const tooltip = {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    color: 'var(--text)',
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Distribuição" description="Demandas por status">
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={56} outerRadius={92} paddingAngle={3} dataKey="value">
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={tooltip} />
              <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Progresso" description="Quantidade em cada status">
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} width={28} />
              <RechartsTooltip contentStyle={tooltip} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
