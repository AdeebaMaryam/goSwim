import { getScoreLabel } from '../utils/cleanlinessScore';

const LiveStatusBadge = ({ score }) => {
  const { label, color } = getScoreLabel(score);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
      color === 'green' ? 'bg-green-100 text-green-800' :
      color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
      color === 'orange' ? 'bg-orange-100 text-orange-800' :
      'bg-red-100 text-red-800'
    }`}>
      <div className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse"></div>
      {label}
    </span>
  );
};

export default LiveStatusBadge;