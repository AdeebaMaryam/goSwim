import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

const TrendChart = ({ poolId }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, [poolId]);

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/readings/${poolId}/history?hours=24`);
      // Transform data for chart
      const chartData = response.data.map(reading => ({
        time: new Date(reading.time).toLocaleTimeString(),
        pH: reading.ph,
        Chlorine: reading.chlorine_ppm,
        Temperature: reading.temperature_c,
        Turbidity: reading.turbidity_ntu
      }));
      setData(chartData);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  return (
    <div className="bg-slate-900/50 rounded-xl p-6 shadow-sm border border-purple-500/20 mb-8">
      <h3 className="text-xl font-semibold mb-6 text-white">24-Hour Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" stroke="#cbd5e1" />
          <YAxis stroke="#cbd5e1" />
          <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(168, 85, 247, 0.35)', color: '#f8fafc' }} />
          <Legend />
          <Line type="monotone" dataKey="pH" stroke="#0F6E56" strokeWidth={2} />
          <Line type="monotone" dataKey="Chlorine" stroke="#1D9E75" strokeWidth={2} />
          <Line type="monotone" dataKey="Temperature" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="Turbidity" stroke="#82ca9d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
