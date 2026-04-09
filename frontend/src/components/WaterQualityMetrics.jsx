import { Droplets, Thermometer, Eye } from 'lucide-react';

const WaterQualityMetrics = ({ data }) => {
  const metrics = [
    {
      label: 'pH Level',
      value: data.ph,
      unit: '',
      icon: Droplets,
      ideal: '7.2 - 7.6',
      status: data.ph >= 7.2 && data.ph <= 7.6 ? 'good' : data.ph >= 7.0 && data.ph <= 7.8 ? 'warning' : 'bad'
    },
    {
      label: 'Chlorine',
      value: data.chlorine_ppm,
      unit: 'ppm',
      icon: Droplets,
      ideal: '1.0 - 3.0',
      status: data.chlorine_ppm >= 1.0 && data.chlorine_ppm <= 3.0 ? 'good' : data.chlorine_ppm >= 0.5 && data.chlorine_ppm <= 4.0 ? 'warning' : 'bad'
    },
    {
      label: 'Temperature',
      value: data.temperature_c,
      unit: '°C',
      icon: Thermometer,
      ideal: '26 - 30',
      status: data.temperature_c >= 26 && data.temperature_c <= 30 ? 'good' : data.temperature_c >= 24 && data.temperature_c <= 32 ? 'warning' : 'bad'
    },
    {
      label: 'Turbidity',
      value: data.turbidity_ntu,
      unit: 'NTU',
      icon: Eye,
      ideal: '< 0.5',
      status: data.turbidity_ntu < 0.5 ? 'good' : data.turbidity_ntu < 1.0 ? 'warning' : 'bad'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-300 bg-green-500/10 border border-green-500/30';
      case 'warning': return 'text-yellow-300 bg-yellow-500/10 border border-yellow-500/30';
      default: return 'text-red-300 bg-red-500/10 border border-red-500/30';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-slate-900/50 rounded-xl p-6 shadow-sm border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <metric.icon className="w-8 h-8 text-cyan-400" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
              {metric.status === 'good' ? 'Good' : metric.status === 'warning' ? 'Check' : 'Bad'}
            </span>
          </div>
          <div className="mb-2">
            <div className="text-2xl font-bold text-white">{metric.value ?? 'No data'}</div>
            <div className="text-sm text-gray-300">{metric.label} {metric.unit}</div>
          </div>
          <div className="text-xs text-gray-400">Ideal: {metric.ideal}</div>
        </div>
      ))}
    </div>
  );
};

export default WaterQualityMetrics;
