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
  const [newProgramDate, setNewProgramDate] = useState(new Date().toISOString().split('T')[0])
  const [newProgramColor, setNewProgramColor] = useState('#ff0844')
  
  // Table view state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [sortField, setSortField] = useState<'name' | 'created_date' | 'id'>('created_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [dateFilter, setDateFilter] = useState('')
  
  // Helper function to check if user is admin (case-insensitive check)
  const isAdmin = userType && userType.toUpperCase() === 'ADMIN'
  const isDistrictUser = !isAdmin  // Any non-admin user is treated as district user

  // Helper function to generate icon element
  const generateIcon = (name: string, serialNo?: string) => {
    if (serialNo && serialNo.trim()) {
      return serialNo
    }
    // If no serial number provided, use first letter
    return name.charAt(0).toUpperCase()
  }

  // Load programs from database or localStorage as fallback
  const getInitialPrograms = (): Program[] => {
    // We'll fetch from API in useEffect
    return []
  }

  const [programs, setPrograms] = useState<Program[]>(getInitialPrograms)

  // Fetch programs from server
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch(`${API_URL}/programs`)
        const data = await response.json()
        if (data.success) {
          setPrograms(data.programs)
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
    fetchPrograms()
  }, [])

  const handleAddProgram = () => {
    if (!newProgramName.trim()) {
      alert('Please enter program name')
      return
    }

    const currentDate = newProgramDate || new Date().toISOString().split('T')[0]
    const newId = newProgramName.toLowerCase().replace(/\s+/g, '-')
    const newProgram = {
      id: newId,
      name: newProgramName,
      icon: newProgramSerialNo || '',
      path: `/${newId}`,
      color: `linear-gradient(135deg, ${newProgramColor} 0%, ${newProgramColor}88 100%)`,
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
    .then(res => res.json())
    .then(data => {
      console.log('Program creation response:', data)
      if (data.success) {
        // Use the program data returned from server to ensure consistency
        const addedProgram = data.program || newProgram
        setPrograms([...programs, addedProgram])
        setShowAddProgram(false)
        setNewProgramName('')
        setNewProgramSerialNo('')
        setNewProgramDate(new Date().toISOString().split('T')[0])
        setNewProgramColor('#ff0844')
        alert(`Program "${newProgramName}" added successfully!`)
      } else {
        console.error('Program creation failed:', data.error)
        alert(data.error || 'Failed to add program')
      }
    })
    .catch(error => {
      console.error('Error adding program:', error)
      alert('Failed to add program')
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
        setPrograms(programs.filter(p => p.id !== programToDelete.id))
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
    .sort((a, b) => {
      const aValue = a[sortField] || ''
      const bValue = b[sortField] || ''
      const comparison = aValue.localeCompare(bValue)
      return sortDirection === 'asc' ? comparison : -comparison
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPrograms = filteredPrograms.slice(startIndex, endIndex)

  const handleSort = (field: 'name' | 'created_date' | 'id') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleProgramClick = (path: string) => {
    navigate(path)
  }

  return (
    <div className="App">
      <div className="dashboard-page-wrapper">
        <div className="dashboard-page-header">
          <div className="title-section">
            <h1 className="dashboard-title-line1">AP POLICE - File Management System</h1>
            <h2 className="dashboard-title-line2">ANDHRA PRADESH POLICE DEPARTMENT</h2>
          </div>
        </div>

        {/* Welcome Message */}
        {isAdmin && (
          <div className="welcome-section">
            <div className="welcome-message">
              <span className="welcome-icon">👋</span>
              <span className="welcome-text">Welcome to Admin Dashboard</span>
              <span className="admin-badge">Administrator</span>
            </div>
          </div>
        )}
        
        {isDistrictUser && (
          <div className="welcome-section">
            <div className="welcome-message">
              <span className="welcome-icon">👋</span>
              <span className="welcome-text">Welcome to User Dashboard</span>
              <span className="user-badge">{userType}</span>
            </div>
          </div>
        )}

        {/* Add Program Modal */}
        {showAddProgram && (
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && programToDelete && (
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

        <div className="programs-container">
          <div className="programs-table-container">
            <div className="table-controls">
              <div className="left-controls">
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
                />
                {isAdmin && (
                  <div className="admin-actions">
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
                      className="action-btn logout-btn" 
                      onClick={onLogout}
                      title="Logout"
                    >
                      Logout
                    </button>
                  </div>
                )}
                {isDistrictUser && (
                  <div className="user-actions">
                    <div className="user-welcome">
                      <span className="user-greeting">Welcome, {userName}!</span>
                    </div>
                    <button 
                      className="action-btn logout-btn" 
                      onClick={onLogout}
                      title="Logout"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
              <div className="right-controls">
                <div className="items-per-page">
                  <label>Items per page:</label>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="page-size-select"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="table-wrapper">
              <table className="programs-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')} className="sortable">
                      S.No {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('name')} className="sortable">
                      Program Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('created_date')} className="sortable">
                      Created Date {sortField === 'created_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPrograms.length > 0 ? (
                    currentPrograms.map((program) => (
                      <tr key={program.id} className="program-row">
                        <td className="serial-cell">
                          <span className="program-serial">{program.icon || generateIcon(program.name)}</span>
                        </td>
                        <td className="name-cell">
                          <div className="program-info">
                            <span className="program-title">{program.name}</span>
                            <span className="program-id">#{program.id}</span>
                          </div>
                        </td>
                        <td className="date-cell">
                          {program.created_date ? 
                            new Date(program.created_date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric'
                            }) 
                            : 'N/A'
                          }
                        </td>
                        <td className="actions-cell">
                          <button 
                            className="table-action-btn open-btn"
                            onClick={() => handleProgramClick(program.path)}
                            title="Open Program"
                          >
                            📂 Open
                          </button>
                          {isAdmin && (
                            <button 
                              className="table-action-btn delete-btn"
                              onClick={(e) => confirmDelete(program, e)}
                              title="Delete Program"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="no-data">
                        {programs.length === 0 ? 'No programs available' : `No programs found matching "${searchQuery}"`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  ⏮️ First
                </button>
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ◀️ Previous
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                    if (pageNum <= totalPages) {
                      return (
                        <button
                          key={pageNum}
                          className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      )
                    }
                    return null
                  })}
                </div>
                
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next ▶️
                </button>
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last ⏭️
                </button>
              </div>
            )}
            
            {/* Pagination Info at Bottom */}
            <div className="bottom-pagination-info">
              <div className="pagination-info">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredPrograms.length)} of {filteredPrograms.length} programs
              </div>
            </div>
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
