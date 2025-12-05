import { useParams, useNavigate } from 'react-router-dom';
import FileItem from '../components/FileItem';

const FileList = () => {
  const { category } = useParams();
  const navigate = useNavigate();

  // Dummy data for files
  const filesData = {
    'monthly-cyclone': [
      {
        id: 1,
        name: 'File 1 - Cyclone Reports 2024',
        subItems: [
          { id: 1, title: 'January Report', description: 'Monthly cyclone activity report' },
          { id: 2, title: 'February Report', description: 'Monthly cyclone activity report' },
          { id: 3, title: 'March Report', description: 'Monthly cyclone activity report' },
        ]
      },
      {
        id: 2,
        name: 'File 2 - Emergency Response',
        subItems: [
          { id: 1, title: 'Response Plan A', description: 'Emergency response procedures' },
          { id: 2, title: 'Response Plan B', description: 'Alternative response strategy' },
          { id: 3, title: 'Coordination Protocol', description: 'Inter-department coordination' },
        ]
      },
      {
        id: 3,
        name: 'File 3 - Damage Assessment',
        subItems: [
          { id: 1, title: 'Initial Assessment', description: 'Preliminary damage report' },
          { id: 2, title: 'Detailed Survey', description: 'Comprehensive damage survey' },
          { id: 3, title: 'Recovery Plan', description: 'Post-cyclone recovery strategy' },
        ]
      },
    ],
    'prime-minister': [
      {
        id: 1,
        name: 'File 1 - PM Visit Documents',
        subItems: [
          { id: 1, title: 'Schedule', description: 'Official visit schedule' },
          { id: 2, title: 'Security Arrangements', description: 'Security protocol details' },
          { id: 3, title: 'Program Itinerary', description: 'Detailed event itinerary' },
        ]
      },
      {
        id: 2,
        name: 'File 2 - Official Communications',
        subItems: [
          { id: 1, title: 'Letter 1', description: 'Official correspondence' },
          { id: 2, title: 'Letter 2', description: 'Follow-up communication' },
          { id: 3, title: 'Minutes of Meeting', description: 'Meeting documentation' },
        ]
      },
      {
        id: 3,
        name: 'File 3 - Project Approvals',
        subItems: [
          { id: 1, title: 'Project A', description: 'Infrastructure project' },
          { id: 2, title: 'Project B', description: 'Development initiative' },
          { id: 3, title: 'Project C', description: 'Welfare program' },
        ]
      },
    ],
    'dgp-desk': [
      {
        id: 1,
        name: 'File 1 - Administrative Memos',
        subItems: [
          { id: 1, title: 'Memo 001', description: 'Policy update memorandum' },
          { id: 2, title: 'Memo 002', description: 'Operational directive' },
          { id: 3, title: 'Memo 003', description: 'Administrative instruction' },
        ]
      },
      {
        id: 2,
        name: 'File 2 - Personnel Records',
        subItems: [
          { id: 1, title: 'Transfers', description: 'Transfer orders and records' },
          { id: 2, title: 'Promotions', description: 'Promotion notifications' },
          { id: 3, title: 'Performance Reviews', description: 'Annual performance evaluations' },
        ]
      },
      {
        id: 3,
        name: 'File 3 - Operational Reports',
        subItems: [
          { id: 1, title: 'Weekly Report', description: 'Weekly operational summary' },
          { id: 2, title: 'Monthly Report', description: 'Monthly activity report' },
          { id: 3, title: 'Quarterly Review', description: 'Quarterly performance review' },
        ]
      },
    ],
  };

  const files = filesData[category] || [];
  
  const getCategoryTitle = () => {
    switch (category) {
      case 'monthly-cyclone':
        return 'Monthly Cyclone';
      case 'prime-minister':
        return 'Prime Minister';
      case 'dgp-desk':
        return 'DGP Desk';
      default:
        return 'Files';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-white hover:text-blue-300 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold">Back to Dashboard</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold text-white">
              {getCategoryTitle()}
            </h1>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Files</h2>
        
        {files.length > 0 ? (
          <div className="space-y-4">
            {files.map((file) => (
              <FileItem key={file.id} file={file} />
            ))}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 text-center border border-white/20">
            <p className="text-gray-300 text-lg">No files available in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;
