import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './Dashboard.css'

const API_URL = '/api'

interface MemoListProps {
  userType: string
  userName: string
  onLogout: () => void
}

interface Memo {
  id: string
  name: string
  number: number
  created_date: string
  program_id: string
}

interface Program {
  id: string
  name: string
}

function MemoList({ userType, userName, onLogout }: MemoListProps) {
  const navigate = useNavigate()
  const { programId } = useParams<{ programId: string }>()
  const [memos, setMemos] = useState<Memo[]>([])
  const [program, setProgram] = useState<Program | null>(null)
  const [showAddMemo, setShowAddMemo] = useState(false)
  const [newMemoName, setNewMemoName] = useState('')
  const isAdmin = userType && userType.toUpperCase() === 'ADMIN'

  // Fetch memos for this program
  useEffect(() => {
    fetchProgram()
    fetchMemos()
  }, [programId])

  const fetchProgram = async () => {
    try {
      const response = await fetch(`${API_URL}/programs`)
      const data = await response.json()
      if (data.success) {
        const foundProgram = data.programs.find((p: Program) => p.id === programId)
        setProgram(foundProgram || null)
      }
    } catch (error) {
      console.error('Error fetching program:', error)
    }
  }

  const fetchMemos = async () => {
    try {
      const response = await fetch(`${API_URL}/memos/${programId}`)
      const data = await response.json()
      if (data.success) {
        setMemos(data.memos || [])
      }
    } catch (error) {
      console.error('Error fetching memos:', error)
    }
  }

  const handleAddMemo = async () => {
    if (!newMemoName.trim()) {
      alert('Please enter memo name')
      return
    }

    try {
      const response = await fetch(`${API_URL}/memos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          name: newMemoName,
          created_by: userName,
          userType: userType
        })
      })
      const data = await response.json()
      if (data.success) {
        setMemos([...memos, data.memo])
        setNewMemoName('')
        setShowAddMemo(false)
        alert(`Memo "${newMemoName}" created successfully!`)
      } else {
        alert(data.error || 'Failed to create memo')
      }
    } catch (error) {
      console.error('Error creating memo:', error)
      alert('Failed to create memo')
    }
  }

  const handleMemoClick = (memoId: string) => {
    navigate(`/program/${programId}/memo/${memoId}`)
  }

  return (
    <div className="App">
      <div className="dashboard-page-wrapper">
        {/* Header */}
        <div className="dashboard-page-header">
          <div className="title-section">
            <h1 className="dashboard-title-line1">AP POLICE - File Management System</h1>
            <h2 className="dashboard-title-line2">ANDHRA PRADESH POLICE DEPARTMENT</h2>
          </div>
        </div>

        {/* Top Controls */}
        <div className="top-controls-section">
          <div className="search-and-filters">
            <button
              onClick={() => navigate('/dashboard')}
              className="action-btn"
              style={{ background: 'linear-gradient(135deg, #666 0%, #888 100%)' }}
            >
              ← Back to Dashboard
            </button>
            {program && (
              <span style={{ 
                fontSize: '1.8rem', 
                fontWeight: '800',
                color: '#0066ff',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                padding: '0.5rem 1.5rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.15) 0%, rgba(255, 8, 68, 0.15) 100%)',
                border: '3px solid #0066ff',
                boxShadow: '0 4px 15px rgba(0, 102, 255, 0.3)',
                display: 'inline-block'
              }}>
                📁 {program.name}
              </span>
            )}
          </div>
          
          <div className="user-info-section">
            <span className="welcome-text-top">Welcome, {isAdmin ? 'Administrator' : userName}!</span>
            {isAdmin && (
              <button 
                className="action-btn add-program-btn" 
                onClick={() => setShowAddMemo(true)}
              >
                + Add Memo
              </button>
            )}
            <button 
              className="action-btn logout-btn" 
              onClick={onLogout}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Add Memo Modal */}
        {isAdmin && showAddMemo && (
          <div className="modal-overlay" onClick={() => setShowAddMemo(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Memo</h2>
              <div className="form-group">
                <label>Memo Name:</label>
                <input
                  type="text"
                  value={newMemoName}
                  onChange={(e) => setNewMemoName(e.target.value)}
                  placeholder="Enter memo name (e.g., Memo 1, Memo 2)"
                  className="form-input"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem' }}>
                <button onClick={handleAddMemo} className="login-button">
                  Create Memo
                </button>
                <button onClick={() => setShowAddMemo(false)} className="logout-button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Memos Grid */}
        <div className="programs-container">
          <div className="programs-icon-grid">
            {memos.length > 0 ? (
              memos.map((memo) => (
                <div
                  key={memo.id}
                  className="program-icon-card"
                  onClick={() => handleMemoClick(memo.id)}
                >
                  <div 
                    className="program-icon-wrapper" 
                    style={{ background: 'linear-gradient(135deg, #0066ff 0%, #00a8ff 100%)' }}
                  >
                    <span className="program-icon-number">{memo.number}</span>
                  </div>
                  <h3 className="program-icon-title">{memo.name}</h3>
                  <p className="program-icon-id">#{memo.id}</p>
                </div>
              ))
            ) : (
              <div className="no-programs-message">
                <p>No memos available. {isAdmin && 'Click "Add Memo" to create one.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemoList
