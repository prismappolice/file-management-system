import { useState } from 'react';

const FileItem = ({ file }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* File Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* File Icon */}
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <span className="text-2xl">📄</span>
          </div>
          
          {/* File Info */}
          <div>
            <h3 className="text-lg font-semibold text-white">{file.name}</h3>
            <p className="text-sm text-gray-300">{file.subItems?.length || 0} items</p>
          </div>
        </div>

        {/* Expand Icon */}
        <svg
          className={`w-6 h-6 text-white transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Sub Items */}
      {isExpanded && (
        <div className="border-t border-white/20 bg-white/5">
          <div className="p-6 space-y-3">
            {file.subItems && file.subItems.length > 0 ? (
              file.subItems.map((subItem) => (
                <div
                  key={subItem.id}
                  className="flex items-center gap-3 p-4 bg-white/10 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-md text-white font-bold">
                    {subItem.id}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{subItem.title}</p>
                    <p className="text-sm text-gray-400">{subItem.description}</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition">
                    View
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No sub-items available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileItem;
