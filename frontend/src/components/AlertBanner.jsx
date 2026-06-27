import { useEffect, useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import api from '../utils/api';

const AlertBanner = ({ poolId }) => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!poolId) return;
      try {
        const response = await api.get(`/reading/${poolId}/alerts`);
        setAlerts(response.data);
      } catch (error) {
        setAlerts([{
          id: 'alerts-unavailable',
          message: 'Unable to load pool alerts from the backend',
          severity: 'warning'
        }]);
      }
    };

    fetchAlerts();
  }, [poolId]);

  const getAlertStyle = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div key={alert.id} className={`p-4 rounded-lg border ${getAlertStyle(alert.severity)}`}>
          <div className="flex items-center">
            {getAlertIcon(alert.severity)}
            <span className="ml-3">{alert.message}</span>
            <button className="ml-auto" onClick={() => setAlerts(alerts.filter((item) => item.id !== alert.id))}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertBanner;
