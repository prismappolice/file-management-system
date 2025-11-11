import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './Dashboard.css'

const API_URL = '/api'

interface GenericProgramProps {
  userType: string  // Changed to accept any userType string
  userName: string
  onLogout: () => void
}

interface FileData {
  id: number
  fileNo: string
  subject: string
  department: string
  date: string
  filename: string
  created_by?: string
  uploaded_at: string
}

interface Program {
  id: string
  name: string
  icon: string
  path: string
  color: string
  created_date?: string
}

function GenericProgram({ userType, userName, onLogout }: GenericProgramProps) {
  const navigate = useNavigate()
  const location = useLocation()

  console.log('GenericProgram loaded:', { userType, userName, pathname: location.pathname })

  // Helper function to determine user permissions (case-insensitive check)
  const isAdmin = userType && userType.toUpperCase() === 'ADMIN'
  
  const [programDetails, setProgramDetails] = useState<Program | null>(null)
  const [isLoadingProgram, setIsLoadingProgram] = useState(true)
  const [programNotFound, setProgramNotFound] = useState(false)
  
  // Get program ID from programDetails once it's loaded
  const programId = programDetails?.id || ''
  
  console.log('GenericProgram - pathname:', location.pathname, 'programId:', programId, 'isAdmin:', isAdmin)
  const [files, setFiles] = useState<FileData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [fileNo, setFileNo] = useState('')
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState('')
  const [department, setDepartment] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<FileData | null>(null)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Fetch program details from server - only run once per pathname
  useEffect(() => {
    const fetchProgramDetails = async () => {
      // Don't refetch if we already have program details for this path
      if (programDetails && programDetails.path === location.pathname) {
        console.log('Program details already loaded for:', location.pathname)
        return
      }

      setIsLoadingProgram(true)
      setProgramNotFound(false)
      try {
        console.log('Fetching program details for path:', location.pathname)
        const response = await fetch(`${API_URL}/programs`)
        const data = await response.json()
        console.log('Programs response:', data)
        if (data.success) {
          const program = data.programs.find((p: Program) => p.path === location.pathname)
          console.log('Found program:', program)
          if (program) {
            setProgramDetails(program)
          } else {
            console.warn('Program not found for path:', location.pathname)
            console.warn('Available programs:', data.programs.map((p: Program) => ({ id: p.id, path: p.path })))
            setProgramNotFound(true)
            // Program not found, redirect to dashboard after showing message
            setTimeout(() => navigate('/dashboard'), 2000)
          }
        } else {
          console.error('Failed to fetch programs:', data)
          setProgramNotFound(true)
          setTimeout(() => navigate('/dashboard'), 2000)
        }
      } catch (err) {
        console.error('Error fetching program details:', err)
        setProgramNotFound(true)
        setTimeout(() => navigate('/dashboard'), 2000)
      } finally {
        setIsLoadingProgram(false)
      }
    }
    fetchProgramDetails()
  }, [location.pathname])

  const filteredFiles = files.filter((file) => {
    const query = (searchQuery || '').toLowerCase()
    const matchesText = 
      (file.fileNo?.toLowerCase() || '').includes(query) ||
      (file.subject?.toLowerCase() || '').includes(query) ||
      (file.department?.toLowerCase() || '').includes(query) ||
      (file.filename?.toLowerCase() || '').includes(query)
    
    const matchesDate = !searchDate || file.date === searchDate
    
    return matchesText && matchesDate
  })

  const fetchFiles = async () => {
    if (!programId) {
      console.log('Skipping fetchFiles - programId not yet available')
      return
    }
    
    try {
      console.log('Fetching files for program:', programId, 'userType:', userType, 'userName:', userName)
      const response = await fetch(`${API_URL}/files?program=${programId}&userType=${userType}&userName=${userName}`)
      const data = await response.json()
      console.log('Files response:', data)
      if (data.success) {
        setFiles(data.files)
        console.log('Files loaded:', data.files.length)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  useEffect(() => {
    if (programId) {
      console.log('Fetching files effect triggered for programId:', programId)
      fetchFiles()
    }
  }, [programId, userType, userName])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Accept all file types - no restrictions
      setSelectedFile(file)
      setUploadError('')
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !fileNo || !subject || !department || !date) {
      setUploadError('Please fill all fields and select a file')
      return
    }

    // Check for duplicate file name before uploading
    const duplicate = files.some(f => f.filename === selectedFile.name)
    if (duplicate) {
      alert(`A file named "${selectedFile.name}" has already been uploaded. Please choose a different file or rename your file.`)
      setUploadError(`File "${selectedFile.name}" already exists.`)
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('fileNo', fileNo)
      formData.append('subject', subject)
      formData.append('date', date)
      formData.append('department', department)
      formData.append('program', programId)
      formData.append('createdBy', userName)

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setUploadSuccess(data.message)
        setFileNo('')
        setSubject('')
        setDate('')
        setDepartment('')
        setSelectedFile(null)
        const fileInput = document.getElementById('fileInput') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        fetchFiles()
        setTimeout(() => setUploadSuccess(''), 3000)
      } else {
        setUploadError(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleView = async (fileId: number) => {
    try {
      // Just open the file directly - let the browser handle the file type
      const viewUrl = `${API_URL}/serve/${fileId}`
      const newWindow = window.open(viewUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes,location=yes,menubar=yes,toolbar=yes')
      
      if (!newWindow) {
        alert('Please allow popups for this site to view files, or manually open: ' + viewUrl)
      }
    } catch (error) {
      console.error('View error:', error)
      alert('Failed to view file: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleDownload = async (fileId: number, filename: string) => {
    try {
      const response = await fetch(`${API_URL}/download/${fileId}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download file')
    }
  }

  const confirmDelete = (file: FileData, event: React.MouseEvent) => {
    event.stopPropagation()
    
    // Check if user has permission to delete - only file owner can delete
    if (file.created_by !== userName) {
      alert('You can only delete files uploaded by you!')
      return
    }
    
    setFileToDelete(file)
    setShowDeleteConfirm(true)
  }

  const handleDeleteFile = async () => {
    if (!fileToDelete) return

    try {
      const response = await fetch(`${API_URL}/files/${fileToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userName, userType })
      })

      const data = await response.json()

      if (data.success) {
        setFiles(files.filter(f => f.id !== fileToDelete.id))
        setShowDeleteConfirm(false)
        setFileToDelete(null)
        alert(`File "${fileToDelete.filename}" deleted successfully!`)
      } else {
        alert(data.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file')
    }
  }

  // Debug logging
  console.log('GenericProgram render state:', { 
    isLoadingProgram, 
    hasProgramDetails: !!programDetails,
    programId,
    programNotFound 
  })

  // Show loading while fetching program details
  if (isLoadingProgram || !programDetails) {
    return (
      <div className="App">
        <div className="dashboard-wrapper">
          <div className="dashboard-header">
            <h1>{programNotFound ? '⚠️ Program Not Found' : '⏳ Loading Program...'}</h1>
            <p style={{ color: programNotFound ? '#dc3545' : '#666', marginTop: '1rem', fontSize: '1.1rem' }}>
              {programNotFound 
                ? 'The requested program could not be found. Redirecting to dashboard...' 
                : 'Fetching program details, please wait...'}
            </p>
            <p style={{ color: '#999', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Debug: isLoadingProgram={String(isLoadingProgram)}, programDetails={programDetails ? 'loaded' : 'null'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      <div className="dashboard-wrapper">
        <div className="dashboard-header">
          <div>
            <h1>{programDetails.name.toUpperCase()}</h1>
            {programDetails.created_date && (
              <p className="program-creation-date">
                Created on: {new Date(programDetails.created_date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric'
                })}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => navigate('/dashboard')} className="back-button">
              ← Dashboard
            </button>
            <button onClick={onLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>

        <div className="content-area">
          {/* Admin info section - explaining admin role */}
          {isAdmin && (
            <div className="admin-info-section" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '10px',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>👁️ Administrator View Mode</h2>
              <p style={{ margin: 0, fontSize: '1rem' }}>
                You are viewing all files uploaded by users. Admins can view and download files but cannot upload or delete them.
              </p>
            </div>
          )}

          {/* Upload section - shown to regular users only, admins are view-only */}
          {!isAdmin && (
            <div className="upload-section">
              <h2>Upload New File</h2>
              
              <form onSubmit={handleFileUpload} className="upload-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fileNo">File No/C No:</label>
                  <input
                    id="fileNo"
                    type="text"
                    value={fileNo}
                    onChange={(e) => setFileNo(e.target.value)}
                    placeholder="Enter file number or C number"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject:</label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Select Date:</label>
                  <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input date-input"
                    max={new Date().toISOString().split('T')[0]}
                    required
                    title="Select the date for this file"
                  />
                  <small className="date-helper">Select the date associated with this file (max: today)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department:</label>
                  <input
                    id="department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter department"
                    className="form-input"
                    required
                  />
                </div>
              </div>

                <div className="form-group">
                  <label htmlFor="fileInput">File (All formats supported):</label>
                  <input
                    id="fileInput"
                    type="file"
                    onChange={handleFileSelect}
                    className="file-input"
                    required
                  />
                  {selectedFile && (
                    <p className="file-selected">Selected: {selectedFile.name}</p>
                  )}
                </div>

                {uploadSuccess && <div className="success-message">{uploadSuccess}</div>}
                {uploadError && <div className="error-message">{uploadError}</div>}

                <button 
                  type="submit" 
                  className="upload-button" 
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
              </form>
            </div>
          )}

          <div className="files-section">
            <h2>All Uploaded Files</h2>
            
            <div className="search-filters">
              <input
                type="text"
                placeholder="🔍 Search by file number, file name, subject, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <div className="date-filter-container">
                <label htmlFor="date-filter" className="date-filter-label">Filter by Date:</label>
                <input
                  id="date-filter"
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="date-filter enhanced-date-filter"
                  title="Filter files by date"
                />
                {searchDate && (
                  <button 
                    onClick={() => setSearchDate('')}
                    className="clear-date-btn"
                    title="Clear date filter"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {filteredFiles.length > 0 ? (
              <div className="files-table-container">
                <table className="files-table">
                  <thead>
                    <tr>
                      <th>S.NO</th>
                      <th>FILE NO / C NO</th>
                      <th>SUBJECT</th>
                      <th>DATE</th>
                      <th>DEPARTMENT</th>
                      <th>FILE NAME</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file, index) => (
                      <tr key={file.id}>
                        <td>{index + 1}</td>
                        <td>{file.fileNo}</td>
                        <td>{file.subject}</td>
                        <td>{new Date(file.date).toLocaleDateString()}</td>
                        <td>{file.department}</td>
                        <td>
                          <button
                            onClick={() => handleView(file.id)}
                            className="file-link-button"
                            title="Click to view file"
                          >
                            {file.filename.endsWith('.pdf') ? '📄' : '📝'} {file.filename}
                          </button>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleDownload(file.id, file.filename)}
                              className="download-button"
                              title="Download file"
                            >
                              ⬇ Download
                            </button>
                            {/* Only file owner can delete their own files */}
                            {file.created_by === userName && (
                              <button
                                onClick={(e) => confirmDelete(file, e)}
                                className="delete-button"
                                title="Delete file"
                              >
                                🗑 Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-files">No files uploaded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && fileToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Delete</h2>
            <div className="modal-body">
              <p>Are you sure you want to delete this file?</p>
              <div className="file-delete-details">
                <p><strong>File Name:</strong> {fileToDelete.filename}</p>
                <p><strong>File No:</strong> {fileToDelete.fileNo}</p>
                <p><strong>Subject:</strong> {fileToDelete.subject}</p>
                <p><strong>Department:</strong> {fileToDelete.department}</p>
                <p><strong>Date:</strong> {new Date(fileToDelete.date).toLocaleDateString()}</p>
                <p><strong>Uploaded By:</strong> {fileToDelete.created_by || 'Unknown'}</p>
              </div>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteFile}
                className="confirm-delete-button"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GenericProgram
