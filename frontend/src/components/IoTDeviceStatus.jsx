import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import api from '../utils/api';

const IoTDeviceStatus = ({ poolId }) => {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    fetchDevices();
  }, [poolId]);

  const fetchDevices = async () => {
    try {
      const response = await api.get(`/devices/${poolId}`);
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const getStatusBadge = (lastSeen) => {
    if (!lastSeen) return { icon: WifiOff, text: 'Offline', color: 'text-red-300 bg-red-500/10 border border-red-500/30' };
    const minutesAgo = (new Date() - new Date(lastSeen)) / 60000;
    if (minutesAgo < 5) return { icon: Wifi, text: 'Online', color: 'text-green-300 bg-green-500/10 border border-green-500/30' };
    if (minutesAgo < 30) return { icon: Wifi, text: 'Delayed', color: 'text-yellow-300 bg-yellow-500/10 border border-yellow-500/30' };
    return { icon: WifiOff, text: 'Offline', color: 'text-red-300 bg-red-500/10 border border-red-500/30' };
  };

  return (
    <div className="bg-slate-900/50 rounded-xl p-6 shadow-sm border border-purple-500/20 mb-8 text-white">
      <h3 className="text-xl font-semibold mb-6">IoT Device Status</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 text-gray-300">
              <th className="text-left py-2">Device Name</th>
              <th className="text-left py-2">Type</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => {
              const status = getStatusBadge(device.last_seen);
              return (
                <tr key={device.id} className="border-b border-slate-800">
                  <td className="py-3">{device.device_name}</td>
                  <td className="py-3 capitalize">{device.device_type}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      <status.icon className="w-3 h-3 mr-1" />
                      {status.text}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-400">
                    {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IoTDeviceStatus;
