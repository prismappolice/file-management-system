import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './UserManagement.css'

const API_URL = '/api'

interface User {
  id: number
  username: string
  password: string
  fullname: string
  userType: string
  created_by: string
  created_at: string
  last_login: string | null
}

interface UserManagementProps {
  userName: string
  onLogout: () => void
}

function UserManagement({ userName, onLogout }: UserManagementProps) {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false)
  const [viewingPasswordId, setViewingPasswordId] = useState<number | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullname: '',
    userType: ''
  })
  
  const [changePasswordData, setChangePasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [createdUserInfo, setCreatedUserInfo] = useState<{username: string, password: string} | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setMessage(`${label} copied to clipboard!`)
      setTimeout(() => setMessage(''), 2000)
    })
  }

  // Helper function to display userType consistently
  const getDisplayUserType = (userType: string) => {
    // Convert old types to new display format
    if (userType === 'admin') return 'ADMIN'
    if (userType === 'district') return 'USER'
    // Return new types as-is
    return userType.toUpperCase()
  }

  // Helper function to get CSS class for userType
  const getUserTypeBadgeClass = (userType: string) => {
    if (userType === 'admin' || userType === 'ADMIN') return 'badge-admin'
    return 'badge-user'
  }

  const [passwordHistory, setPasswordHistory] = useState<{ [userId: number]: string }>({})

  const getDisplayPassword = (user: any) => {
    const isAdmin = users.find(u => u.username === userName)?.userType?.toLowerCase() === 'admin';
    if (createdUserInfo && createdUserInfo.username === user.username) {
      return createdUserInfo.password;
    }
    if (passwordHistory[user.id]) {
      return passwordHistory[user.id];
    }
    if (isAdmin) {
      // Show the hashed password from the database for admin
      return user.password;
    }
    return 'Cannot display (hashed in database)';
  }

  const viewPassword = (userId: number) => {
    if (viewingPasswordId === userId) {
      setViewingPasswordId(null)
    } else {
      setViewingPasswordId(userId)
      // Auto-hide after 15 seconds for security
      setTimeout(() => setViewingPasswordId(null), 15000)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`)
      const data = await response.json()
      if (data.success) {
        // Sort users: Admin users first, then by ID (oldest to newest)
        const sortedUsers = data.users.sort((a: User, b: User) => {
          // Admin users come first (both 'admin' and 'ADMIN' types)
          const aIsAdmin = a.userType === 'admin' || a.userType === 'ADMIN'
          const bIsAdmin = b.userType === 'admin' || b.userType === 'ADMIN'
          
          if (aIsAdmin && !bIsAdmin) return -1
          if (bIsAdmin && !aIsAdmin) return 1
          
          // Then sort by ID (oldest to newest)
          return a.id - b.id
        })
        setUsers(sortedUsers)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to load users')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setCreatedUserInfo(null)
    setIsCreatingUser(true)

    try {
      const response = await fetch(`${API_URL}/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, createdBy: userName })
      })

      const data = await response.json()

      if (data.success) {
        setMessage('User created successfully!')
        // Store the created user info to display ONLY in current session
        setCreatedUserInfo({
          username: formData.username,
          password: formData.password
        })
        
        setFormData({ username: '', password: '', fullname: '', userType: '' })
        setShowCreateForm(false)
        fetchUsers()
      } else {
        setError(data.error || 'Failed to create user')
      }
    } catch (err) {
      console.error('Error creating user:', err)
      setError('Failed to create user')
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setMessage('User deleted successfully!')
        fetchUsers()
      } else {
        setError(data.error || 'Failed to delete user')
      }
    } catch (err) {
      console.error('Error deleting user:', err)
      setError('Failed to delete user')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    
    if (!selectedUserId) {
      setError('No user selected')
      setIsChangingPassword(false)
      return
    }
    
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setError('Passwords do not match')
      setIsChangingPassword(false)
      return
    }
    
    if (changePasswordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsChangingPassword(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/users/${selectedUserId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: changePasswordData.newPassword,
          adminUsername: userName
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update the password history with the new password (session only)
        setPasswordHistory(prev => ({
          ...prev,
          [selectedUserId]: changePasswordData.newPassword
        }))
        
        setMessage('Password changed successfully!')
        setShowChangePasswordForm(false)
        setChangePasswordData({ newPassword: '', confirmPassword: '' })
        setSelectedUserId(null)
        fetchUsers() // Refresh user list
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError(data.error || 'Failed to change password')
      }
    } catch (err) {
      console.error('Error changing password:', err)
      setError('Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const openChangePasswordForm = (userId: number) => {
    setSelectedUserId(userId)
    setShowChangePasswordForm(true)
    setError('')
    setMessage('')
  }

  return (
    <div className="App">
      <div className="dashboard-wrapper">
        <div className="dashboard-header">
          <div>
            <h1>USER MANAGEMENT</h1>
            <p className="welcome-text">Welcome, {userName}</p>
          </div>
          <div className="header-actions">
            <button 
              className="create-user-button"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? '✖ Cancel' : '➕ Create New User'}
            </button>
            <button onClick={() => navigate('/dashboard')} className="dashboard-button">
              ← Dashboard
            </button>
            <button onClick={onLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>

        <div className="user-management-container">
          {/* Admin password policy note */}
          {users.find(u => u.username === userName)?.userType?.toLowerCase() === 'admin' && (
            <div style={{
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              color: '#ad6800',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '15px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem'
            }}>
              <span role="img" aria-label="info">ℹ️</span>
              For security, passwords are only visible immediately after creation or change. If a user forgets their password, use the <b>Change Password</b> button to set a new one and share it with them. Old passwords cannot be recovered.
            </div>
          )}
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          {createdUserInfo && (
            <div className="created-user-info">
              <h3>✅ User Created Successfully!</h3>
              <div className="credentials-box">
                <p><strong>⚠️ Please save these credentials - Password will not be shown again!</strong></p>
                <div className="credential-item">
                  <div>
                    <span className="credential-label">Username:</span>
                    <span className="credential-value">{createdUserInfo.username}</span>
                  </div>
                  <button 
                    className="copy-button"
                    onClick={() => copyToClipboard(createdUserInfo.username, 'Username')}
                    title="Copy username"
                  >
                    📋 Copy
                  </button>
                </div>
                <div className="credential-item">
                  <div>
                    <span className="credential-label">Password:</span>
                    <span className="credential-value password-display">{createdUserInfo.password}</span>
                  </div>
                  <button 
                    className="copy-button"
                    onClick={() => copyToClipboard(createdUserInfo.password, 'Password')}
                    title="Copy password"
                  >
                    📋 Copy
                  </button>
                </div>
                <button 
                  className="close-info-button"
                  onClick={() => setCreatedUserInfo(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {showCreateForm && (
            <div className="create-user-form">
              <h2>Create New User</h2>
              <form onSubmit={handleCreateUser}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Username:</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="form-input"
                      required
                      placeholder="e.g., john.smith, data.officer1, district.mumbai"
                      pattern="[a-zA-Z0-9._-]+"
                      title="Username can contain letters, numbers, dots, hyphens, and underscores"
                    />
                    <small style={{ color: '#666', fontSize: '11px' }}>
                      💡 Use meaningful names: john.doe, officer.north
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Full Name:</label>
                    <input
                      type="text"
                      value={formData.fullname}
                      onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                      className="form-input"
                      required
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Password:</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="form-input"
                      required
                      placeholder="Enter password"
                      minLength={6}
                    />
                  </div>

                  <div className="form-group">
                    <label>User Type:</label>
                    <select
                      value={formData.userType}
                      onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                      className="form-input"
                      required
                    >
                      <option value="">Select User Type</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="USER">USER</option>
                    </select>
                    <small style={{ color: '#666', fontSize: '11px' }}>
                      💡 ADMIN: Full system access | USER: Limited access
                    </small>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={`submit-button ${isCreatingUser ? 'loading' : ''}`}
                  disabled={isCreatingUser}
                >
                  {isCreatingUser ? (
                    <>
                      <span className="spinner"></span>
                      Creating User...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </form>
            </div>
          )}

          {showChangePasswordForm && (
            <div className="change-password-form">
              <h3>🔑 Change Password</h3>
              {selectedUserId && (
                <div className="user-info-header" style={{
                  background: '#f5f5f5',
                  borderRadius: '20px',
                  padding: '1.2rem 1.5rem',
                  marginBottom: '1.2rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.2rem',
                  border: '1px solid #e0e0e0'
                }}>
                  <span className="user-icon" style={{ fontSize: '2.5rem', color: '#888' }}>👤</span>
                  <div className="user-details">
                    <span className="user-title" style={{ color: '#888', fontWeight: 500, fontSize: '1rem', letterSpacing: '1px' }}>CHANGING PASSWORD FOR:</span>
                    <span className="user-name" style={{ color: '#222', fontWeight: 700, fontSize: '1.4rem', textTransform: 'none' }}>
                      {users.find(user => user.id === selectedUserId)?.username || 'Unknown User'}
                    </span>
                  </div>
                </div>
              )}
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password:</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={changePasswordData.newPassword}
                    onChange={(e) => setChangePasswordData({
                      ...changePasswordData,
                      newPassword: e.target.value
                    })}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    💡 Password must be at least 6 characters long
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password:</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={changePasswordData.confirmPassword}
                    onChange={(e) => setChangePasswordData({
                      ...changePasswordData,
                      confirmPassword: e.target.value
                    })}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowChangePasswordForm(false)
                      setChangePasswordData({ newPassword: '', confirmPassword: '' })
                      setSelectedUserId(null)
                    }}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={`submit-button ${isChangingPassword ? 'loading' : ''}`}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <span className="spinner"></span>
                        Changing...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="users-list">
            <h2>All Users ({users.length})</h2>
            <div className="table-container">
              <div className="table-responsive">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Username</th>
                      <th>Full Name</th>
                      <th>Password</th>
                      <th>User Type</th>
                      <th>Created On</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user.id}>
                        <td><strong>{index + 1}</strong></td>
                        <td><strong style={{ color: '#000000' }}>{user.username}</strong></td>
                        <td>{user.fullname}</td>
                        <td>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: '#f5f5f5',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '0.5rem',
                            position: 'relative',
                            minWidth: '150px'
                          }}>
                            <span style={{ 
                              flex: 1,
                              fontFamily: viewingPasswordId === user.id ? 'monospace' : 'inherit',
                              fontSize: viewingPasswordId === user.id ? '12px' : '14px',
                              color: viewingPasswordId === user.id ? '#1976d2' : '#666',
                              fontWeight: viewingPasswordId === user.id ? 'bold' : 'normal'
                            }}>
                              {viewingPasswordId === user.id ? 
                                `🔑 ${getDisplayPassword(user)}` : 
                                '••••••••••••'
                              }
                            </span>
                            <button
                              onClick={() => viewPassword(user.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.2rem',
                                marginLeft: '0.5rem',
                                borderRadius: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '12px'
                              }}
                              title={viewingPasswordId === user.id ? "Hide" : "View (session only)"}
                            >
                              {viewingPasswordId === user.id ? '🙈' : '👁️'}
                            </button>
                          </div>
                          {viewingPasswordId === user.id && getDisplayPassword(user) === 'Cannot display (hashed in database)' && (
                            <small style={{ color: '#666', fontSize: '10px', display: 'block', marginTop: '2px' }}>
                              🔒 Password is securely hashed in database
                            </small>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${getUserTypeBadgeClass(user.userType)}`}>
                            {getDisplayUserType(user.userType)}
                          </span>
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td style={{ whiteSpace: 'nowrap', maxWidth: '180px', overflow: 'visible', textOverflow: 'unset' }}>
                          {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => openChangePasswordForm(user.id)}
                              className="btn-action btn-primary"
                              title="Change Password"
                              style={{
                                background: 'linear-gradient(135deg, #0066ff 0%, #4facfe 100%)',
                                color: 'white',
                                fontSize: '12px',
                                padding: '0.3rem 0.5rem',
                                minWidth: '24px',
                                maxWidth: '24px'
                              }}
                            >
                              🔑
                            </button>
                            {user.id !== 1 && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                className="btn-action btn-danger"
                                title="Delete User"
                                style={{
                                  fontSize: '12px',
                                  padding: '0.3rem 0.5rem',
                                  minWidth: '24px',
                                  maxWidth: '24px'
                                }}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserManagement
