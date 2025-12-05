import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const API_URL = '/api'

interface DashboardProps {
  userType: string  // Changed from 'admin' | 'district' to string to accept any userType
  userName: string
  onLogout: () => void
}

interface Program {
  id: string
  name: string
  icon: string
  path: string
  color: string
  created_by?: string
  created_date?: string
}

function Dashboard({ userType, userName, onLogout }: DashboardProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddProgram, setShowAddProgram] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null)
  const [newProgramName, setNewProgramName] = useState('')
  const [newProgramSerialNo, setNewProgramSerialNo] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [newProgramDate, setNewProgramDate] = useState(new Date().toISOString().split('T')[0])
  const [newProgramColor, setNewProgramColor] = useState('#ff0844')
  
  // Function to get auto color based on serial number
  const getAutoColor = (serialNo: string) => {
    const colors = [
      '#0a54ff', // Blue
      '#e24069', // Pink
      '#ff0844', // Red
      '#00c853', // Green
      '#ff6f00', // Orange
      '#9c27b0', // Purple
      '#00bcd4', // Cyan
      '#ffeb3b', // Yellow
      '#795548', // Brown
      '#607d8b', // Blue Grey
    ]
    const index = parseInt(serialNo) - 1
    return colors[index % colors.length] || '#0a54ff'
  }
  
  // Debug: Log userType on component mount
  useEffect(() => {
    console.log('Dashboard loaded - UserType:', userType, 'UserName:', userName)
    console.log('Is Admin:', userType?.toUpperCase() === 'ADMIN')
  }, [userType, userName])
  
  // State variables
  const [dateFilter, setDateFilter] = useState('')
  
  // Helper function to check if user is admin (case-insensitive check)
  const isAdmin = userType && userType.toUpperCase() === 'ADMIN'

  // Load programs from database or localStorage as fallback
  const getInitialPrograms = (): Program[] => {
    // We'll fetch from API in useEffect
    return []
  }

  const [programs, setPrograms] = useState<Program[]>(getInitialPrograms)

  // Function to fetch programs from server
  const fetchPrograms = async () => {
    try {
      console.log('Fetching programs from API...')
      const response = await fetch(`${API_URL}/programs`)
      console.log('Programs API response status:', response.status)
      const data = await response.json()
      console.log('Programs API response data:', data)
      if (data.success) {
        console.log('Setting programs:', data.programs)
        // Sort programs by creation date (oldest first)
        const sortedPrograms = data.programs.sort((a: Program, b: Program) => {
          const dateA = new Date(a.created_date || '').getTime()
          const dateB = new Date(b.created_date || '').getTime()
          return dateA - dateB
        })
        setPrograms(sortedPrograms)
      } else {
        console.error('Failed to fetch programs:', data)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      // Fallback to localStorage if server fails
      const savedPrograms = localStorage.getItem('programs')
      if (savedPrograms) {
        setPrograms(JSON.parse(savedPrograms))
      }
    }
  }

  // Fetch programs on component mount
  useEffect(() => {
    fetchPrograms()
  }, [])

  const handleAddProgram = () => {
    if (!newProgramName.trim()) {
      alert('Please enter program name')
      return
    }

    const currentDate = newProgramDate || new Date().toISOString().split('T')[0]
    const newId = newProgramName.toLowerCase().replace(/\s+/g, '-')
    const autoColor = getAutoColor(newProgramSerialNo || '1')
    const newProgram = {
      id: newId,
      name: newProgramName,
      icon: newProgramSerialNo || '',
      path: `/${newId}`,
      color: `linear-gradient(135deg, ${autoColor} 0%, ${autoColor}88 100%)`,
      created_date: currentDate,
      createdBy: userName,
      userType: userType
    }

    console.log('Creating program with data:', newProgram)
    console.log('Current userType:', userType)

    // Save to server
    fetch(`${API_URL}/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProgram)
    })
    .then(res => {
      console.log('Response status:', res.status)
      return res.json()
    })
    .then(data => {
      console.log('Program creation response:', data)
      if (data.success) {
        // Refetch all programs from database to maintain correct order
        fetchPrograms()
        setShowAddProgram(false)
        setNewProgramName('')
        setNewProgramSerialNo('')
        setNewProgramDate(new Date().toISOString().split('T')[0])
        setNewProgramColor('#ff0844')
        alert(`Program "${newProgramName}" added successfully!`)
      } else {
        console.error('Program creation failed:', data.error)
        const errorMsg = data.error || 'Failed to add program'
        alert(`Error: ${errorMsg}\n\nDebug Info:\n- UserType: ${userType}\n- UserName: ${userName}\n- Program: ${newProgramName}`)
      }
    })
    .catch(error => {
      console.error('Error adding program:', error)
      alert(`Network Error: ${error.message}\n\nPlease check if the server is running.`)
    })
  }

  const handleOpenAddProgram = () => {
    // Reset form fields and set today's date
    setNewProgramName('')
    setNewProgramSerialNo('')
    setNewProgramDate(new Date().toISOString().split('T')[0])
    setNewProgramColor('#ff0844')
    setShowAddProgram(true)
  }

  const handleDeleteProgram = () => {
    if (!programToDelete) return

    // Delete from server
    fetch(`${API_URL}/programs/${programToDelete.id}?userType=${userType}`, {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Refetch all programs from database to maintain correct order and serial numbers
        fetchPrograms()
        setShowDeleteConfirm(false)
        setProgramToDelete(null)
        alert(`Program "${programToDelete.name}" deleted successfully!`)
      } else {
        alert(data.error || 'Failed to delete program')
      }
    })
    .catch(error => {
      console.error('Error deleting program:', error)
      alert('Failed to delete program')
    })
  }

  const confirmDelete = (program: Program, event: React.MouseEvent) => {
    event.stopPropagation()
    setProgramToDelete(program)
    setShowDeleteConfirm(true)
  }

  // Enhanced filtering and sorting logic
  const filteredPrograms = programs
    .filter(program => {
      const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           program.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDate = !dateFilter || program.created_date?.includes(dateFilter)
      return matchesSearch && matchesDate
    })

  const handleProgramClick = (programId: string) => {
    navigate(`/program/${programId}/memos`)
  }

  return (
    <div className="App">
      <div className="dashboard-page-wrapper">
        <div className="dashboard-page-header">
          <div className="title-section">
            <h1 className="dashboard-title-line1">AP POLICE - File Management System</h1>
            <h2 className="dashboard-title-line2">ANDHRA PRADESH POLICE DEPARTMENT</h2>
          </div>

          {/* Top Controls Section */}
          <div className="top-controls-section">
          <div className="user-info-section">
            <span className="welcome-text-top">Welcome, {isAdmin ? 'Administrator' : userName}!</span>
            {isAdmin && (
              <>
                <button 
                  className="action-btn user-management-btn" 
                  onClick={() => navigate('/user-management')}
                  title="Manage Users"
                >
                  👥 User Management
                </button>
                <button 
                  className="action-btn add-program-btn" 
                  onClick={handleOpenAddProgram}
                  title="Add New Program"
                >
                  + Add Program
                </button>
                <button 
                  className={`action-btn ${editMode ? 'delete-mode-btn' : 'edit-mode-btn'}`}
                  onClick={() => setEditMode(!editMode)}
                  title={editMode ? "Exit Delete Mode" : "Enable Delete Mode"}
                >
                  {editMode ? '✓ Done' : '🗑️ Delete Mode'}
                </button>
              </>
            )}
            <button 
              className="action-btn logout-btn" 
              onClick={onLogout}
              title="Logout"
            >
              🚪 Logout
            </button>
          </div>
        </div>
        </div>

        {/* Add Program Modal - Admin Only */}
        {isAdmin && showAddProgram && (
          <div className="modal-overlay" onClick={() => setShowAddProgram(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Program</h2>
              <div className="form-group">
                <label>Program Name:</label>
                <input
                  type="text"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  placeholder="Enter program name"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Serial Number:</label>
                <input
                  type="text"
                  value={newProgramSerialNo}
                  onChange={(e) => setNewProgramSerialNo(e.target.value)}
                  placeholder="Enter serial number (e.g., 001, 002)"
                  className="form-input"
                  maxLength={10}
                />
                <small>Enter a unique serial number for the program</small>
              </div>
              <div className="form-group">
                <label>Creation Date:</label>
                <input
                  type="date"
                  value={newProgramDate}
                  onChange={(e) => setNewProgramDate(e.target.value)}
                  className="form-input"
                />
                <small>Date when the program was created</small>
              </div>
              <div className="form-group">
                <label>Color:</label>
                <input
                  type="color"
                  value={newProgramColor}
                  onChange={(e) => setNewProgramColor(e.target.value)}
                  className="form-input"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem' }}>
                <button onClick={handleAddProgram} className="login-button">
                  Add Program
                </button>
                <button onClick={() => setShowAddProgram(false)} className="logout-button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal - Admin Only */}
        {isAdmin && showDeleteConfirm && programToDelete && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Delete Program</h2>
              <p>Are you sure you want to delete "{programToDelete.name}"?</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem' }}>
                <button onClick={handleDeleteProgram} className="logout-button">
                  Yes
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="login-button">
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters Section */}
        <div className="search-and-filters">
          <input
            type="text"
            placeholder="🔍 Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="program-search-input"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="date-filter-input"
            title="Filter by creation date"
            placeholder="dd/mm/yyyy"
          />
        </div>

        <div className="programs-container">
          {/* Icon Grid View */}
          <div className="programs-icon-grid">
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((program, index) => {
                  // Dynamic serial number based on position (1, 2, 3...)
                  const serialNumber = index + 1
                  // Dynamic color based on serial number
                  const dynamicColor = getAutoColor(serialNumber.toString())
                  
                  return (
                    <div
                      key={program.id}
                      className="program-icon-card"
                      onClick={() => handleProgramClick(program.id)}
                    >
                      <div className="program-icon-wrapper" style={{ 
                        background: `linear-gradient(135deg, ${dynamicColor} 0%, ${dynamicColor}88 100%)`
                      }}>
                        <span className="program-icon-number">{serialNumber}</span>
                      </div>
                      <h3 className="program-icon-title">{program.name}</h3>
                      {isAdmin && editMode && (
                        <button
                          className="icon-delete-btn"
                          onClick={(e) => confirmDelete(program, e)}
                          title="Delete Program"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="no-programs-message">
                  <p>{programs.length === 0 ? 'No programs available' : `No programs found matching "${searchQuery}"`}</p>
                </div>
              )}
            </div>
          </div>

        <div className="project-footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>AP POLICE - File Management System</h4>
              <p>Secure document management and workflow automation for Andhra Pradesh Police Department</p>
            </div>
            <div className="footer-section">
              <h4>Features</h4>
              <ul>
                <li>Dynamic Program Management</li>
                <li>Secure File Upload & Storage</li>
                <li>Role-based Access Control</li>
                <li>Real-time File Operations</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>System Info</h4>
              <p>Version: 2.0</p>
              <p>Built with React, Node.js & SQLite</p>
              <p>&copy; 2025 AP Police Department - File Management System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
