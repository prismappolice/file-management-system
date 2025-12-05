import { useNavigate } from 'react-router-dom';

const Card = ({ title, description, icon, path, color }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(path)}
      className={`group cursor-pointer bg-gradient-to-br ${color} rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-8 border border-white/20`}
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-16 h-16 mb-6 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform duration-300">
        <span className="text-4xl">{icon}</span>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-white mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-blue-100 text-sm leading-relaxed">
        {description}
      </p>

      {/* Arrow Icon */}
      <div className="mt-6 flex items-center text-white font-semibold group-hover:translate-x-2 transition-transform duration-300">
        <span>View Files</span>
        <svg 
          className="w-5 h-5 ml-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M17 8l4 4m0 0l-4 4m4-4H3" 
          />
        </svg>
      </div>
    </div>
  );
};

export default Card;
