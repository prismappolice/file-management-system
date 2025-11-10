import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Dashboard from './Dashboard'
import GenericProgram from './GenericProgram'
import UserManagement from './UserManagement'

const API_URL = '/api'

interface LoginPageProps {
  username: string
  password: string
  error: string
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onLogin: (e: React.FormEvent) => void
}

const LoginPage = ({ username, password, error, onUsernameChange, onPasswordChange, onLogin }: LoginPageProps) => (
  <div className="App">
    <div className="login-container">
      <div className="login-content">
        <div className="title-header">
          <h1>AP POLICE</h1>
          <div className="subtitle-with-emblems">
            <img src="/images/Appolice-Logo.png" alt="AP Police" className="header-emblem left-emblem" />
            <p className="subtitle">File Management System</p>
            <img src="/images/prism amblem.png" alt="Prism" className="header-emblem right-emblem" />
          </div>
        </div>
        <div className="login-card">
          <form onSubmit={onLogin} className="login-form" autoComplete="off">
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input id="username" type="text" value={username} onChange={(e) => onUsernameChange(e.target.value)} placeholder="Enter your username" className="form-input" autoComplete="off" required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input id="password" type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} placeholder="Enter your password" className="form-input" autoComplete="new-password" required />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="login-button">Login</button>
          </form>
        </div>
      </div>
    </div>
  </div>
)

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<'district' | 'admin'>('district')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing login session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('fileManagementUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setIsLoggedIn(true)
        setLoggedInUser(userData.fullname)
        setUserType(userData.userType)
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('fileManagementUser')
      }
    }
    setIsLoading(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (data.success && data.user) {
        const userData = {
          fullname: data.user.fullname,
          userType: data.user.userType,
          username: data.user.username
        }
        
        // Save to localStorage for persistence
        localStorage.setItem('fileManagementUser', JSON.stringify(userData))
        
        setIsLoggedIn(true)
        setLoggedInUser(data.user.fullname)
        setUserType(data.user.userType)
        // Force navigation to dashboard after login
        window.history.pushState({}, '', '/dashboard')
      } else {
        setError(data.error || 'Invalid username or password')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Login failed. Please try again.')
    }
  }

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('fileManagementUser')
    
    setIsLoggedIn(false)
    setLoggedInUser('')
    setUsername('')
    setPassword('')
    setError('')
    // Clear URL and go to root
    window.history.pushState({}, '', '/')
  }

  // Show loading screen while checking for existing session
  if (isLoading) {
    return (
      <div className="App">
        <div className="login-container">
          <div className="login-content">
            <div className="title-header">
              <h1>AP POLICE - File Management System</h1>
              <div className="subtitle-with-emblems">
                <img src="/images/Appolice-Logo.png" alt="AP Police" className="header-emblem left-emblem" />
                <p className="subtitle">Andhra Pradesh Police Department</p>
                <img src="/images/prism amblem.png" alt="Prism" className="header-emblem right-emblem" />
              </div>
            </div>
            <div className="login-card">
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ 
                  fontSize: '2rem', 
                  marginBottom: '1rem',
                  background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-purple) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  🔄
                </div>
                <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-lg)' }}>Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <LoginPage
        username={username}
        password={password}
        error={error}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onLogin={handleLogin}
      />
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard userType={userType} userName={loggedInUser} onLogout={handleLogout} />} />
        <Route path="/user-management" element={<UserManagement userName={loggedInUser} onLogout={handleLogout} />} />
        {/* Dynamic route for all program pages - GenericProgram will handle all programs */}
        <Route path="/*" element={<GenericProgram userType={userType} userName={loggedInUser} onLogout={handleLogout} />} />
      </Routes>
    </Router>
  )
}

export default App
