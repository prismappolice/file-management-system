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
  
  // Helper functions to determine user permissions
  const isAdmin = userType === 'admin'
  const isDistrictUser = !isAdmin  // Any non-admin user is treated as district user
  
  // Get program ID from URL path
  const programId = location.pathname.substring(1) // removes leading '/'
  
  const [programDetails, setProgramDetails] = useState<Program | null>(null)
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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Fetch program details from server
  useEffect(() => {
    const fetchProgramDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/programs`)
        const data = await response.json()
        if (data.success) {
          const program = data.programs.find((p: Program) => p.path === location.pathname)
          if (program) {
            setProgramDetails(program)
          } else {
            // Program not found, redirect to dashboard
            navigate('/dashboard')
          }
        }
      } catch (err) {
        console.error('Error fetching program details:', err)
        // Fallback to default
        setProgramDetails({
          id: programId,
          name: programId.charAt(0).toUpperCase() + programId.slice(1),
          icon: programId.charAt(0).toUpperCase(),
          path: location.pathname,
          color: '#ff0844'
        })
      }
    }
    fetchProgramDetails()
  }, [programId, location.pathname, navigate])

  const filteredFiles = files.filter((file) => {
    const matchesText = 
      file.fileNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.filename.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesDate = !searchDate || file.date === searchDate
    
    return matchesText && matchesDate
  })

  const fetchFiles = async () => {
    try {
      const response = await fetch(`${API_URL}/files?program=${programId}&userType=${userType}&userName=${userName}`)
      const data = await response.json()
      if (data.success) {
        setFiles(data.files)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [programId])

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

  const handleDelete = async (fileId: number, createdBy: string) => {
    // Check if user has permission to delete
    if (!isAdmin && createdBy !== userName) {
      alert('You can only delete files uploaded by you!')
      return
    }

    if (!window.confirm('Are you sure you want to delete this file?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userName, userType })
      })

      const data = await response.json()

      if (data.success) {
        alert('File deleted successfully')
        fetchFiles()
      } else {
        alert(data.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file')
    }
  }

  // Show loading while fetching program details
  if (!programDetails) {
    return (
      <div className="App">
        <div className="dashboard-wrapper">
          <div className="dashboard-header">
            <h1>Loading...</h1>
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
          {isDistrictUser && (
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
                            <button 
                              onClick={() => handleDelete(file.id, file.created_by || 'Unknown')}
                              className="delete-button"
                              title="Delete file"
                            >
                              🗑 Delete
                            </button>
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
    </div>
  )
}

export default GenericProgram
