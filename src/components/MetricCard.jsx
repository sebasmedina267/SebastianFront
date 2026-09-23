export default function MetricCard({ label, value, tone = 'primary' }) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
