import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';

const DashboardNew = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const categories = [
    {
      id: 'monthly-cyclone',
      title: 'Monthly Cyclone',
      description: 'Access and manage monthly cyclone reports and data',
      icon: '🌪️',
      path: '/files/monthly-cyclone',
      color: 'from-blue-600 to-purple-600'
    },
    {
      id: 'prime-minister',
      title: 'Prime Minister',
      description: 'Prime Minister related files and documents',
      icon: '🏛️',
      path: '/files/prime-minister',
      color: 'from-green-600 to-teal-600'
    },
    {
      id: 'dgp-desk',
      title: 'DGP Desk',
      description: 'DGP desk memos and administrative files',
      icon: '📋',
      path: '/files/dgp-desk',
      color: 'from-pink-600 to-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                AP POLICE - File Management System
              </h1>
              <p className="text-blue-300">
                ANDHRA PRADESH POLICE DEPARTMENT
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-300">Welcome,</p>
                <p className="text-white font-semibold">{userName}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200 transform hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Select Category</h2>
        
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card
              key={category.id}
              title={category.title}
              description={category.description}
              icon={category.icon}
              path={category.path}
              color={category.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardNew;
