import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './Dashboard.css'
import './responsive-mobile.css'

const API_URL = '/api'

interface MemoFilesProps {
  userType: string
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

interface Memo {
  id: string
  name: string
  icon: string
  program_id: string
}

interface Program {
  id: string
  name: string
}

function MemoFiles({ userType, userName, onLogout }: MemoFilesProps) {
  const navigate = useNavigate()
  const { programId, memoId } = useParams<{ programId: string; memoId: string }>()

  const isAdmin = userType && userType.toUpperCase() === 'ADMIN'
  
  const [memo, setMemo] = useState<Memo | null>(null)
  const [program, setProgram] = useState<Program | null>(null)
  const [files, setFiles] = useState<FileData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Form fields
  const [fileNo, setFileNo] = useState('')
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState('')
  const [department, setDepartment] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [uploadError, setUploadError] = useState('')
  
  // Search/filter
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDate, setSearchDate] = useState('')
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<FileData | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    fetchMemoDetails()
    fetchFiles()
  }, [programId, memoId])

  const fetchMemoDetails = async () => {
    if (!programId || !memoId) return
    
    try {
      // Fetch program details
      const programRes = await fetch(`${API_URL}/programs`)
      const programData = await programRes.json()
      if (programData.success) {
        const foundProgram = programData.programs.find((p: Program) => p.id === programId)
        setProgram(foundProgram || null)
      }

      // Fetch memo details
      const memoRes = await fetch(`${API_URL}/memos/${programId}`)
      const memoData = await memoRes.json()
      if (memoData.success) {
        const foundMemo = memoData.memos.find((m: Memo) => m.id === memoId)
        setMemo(foundMemo || null)
      }
    } catch (error) {
      console.error('Error fetching details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFiles = async () => {
    if (!memoId) return
    
    try {
      const response = await fetch(`${API_URL}/files?memo_id=${memoId}&userType=${userType}&userName=${userName}`)
      const data = await response.json()
      if (data.success) {
        setFiles(data.files)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  const filteredFiles = files.filter((file) => {
    const query = searchQuery.toLowerCase()
    const matchesText = 
      file.fileNo?.toLowerCase().includes(query) ||
      file.subject?.toLowerCase().includes(query) ||
      file.department?.toLowerCase().includes(query) ||
      file.filename?.toLowerCase().includes(query)
    
    const matchesDate = !searchDate || file.date === searchDate
    
    return matchesText && matchesDate
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile || !fileNo || !subject || !department || !date) {
      setUploadError('Please fill all fields and select a file')
      return
    }

    // Check for duplicate file name
    const duplicate = files.some(f => f.filename === selectedFile.name)
    if (duplicate) {
      alert(`A file named "${selectedFile.name}" has already been uploaded. Please choose a different file or rename your file.`)
      setUploadError(`File "${selectedFile.name}" already exists.`)
      return
    }

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('fileNo', fileNo)
      formData.append('subject', subject)
      formData.append('date', date)
      formData.append('department', department)
      formData.append('program', programId || '')
      formData.append('memo_id', memoId || '')
      formData.append('createdBy', userName)

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setUploadSuccess('File uploaded successfully!')
        // Reset form
        setFileNo('')
        setSubject('')
        setDate('')
        setDepartment('')
        setSelectedFile(null)
        const fileInput = document.getElementById('fileInput') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        
        // Refresh files list
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
      const viewUrl = `${API_URL}/serve/${fileId}`
      const newWindow = window.open(viewUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')
      
      if (!newWindow) {
        alert('Please allow popups for this site to view files')
      }
    } catch (error) {
      console.error('View error:', error)
      alert('Failed to view file')
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

  if (isLoading || !memo || !program) {
    return (
      <div className="App">
        <div className="dashboard-wrapper">
          <div className="dashboard-header">
            <h1>⏳ Loading...</h1>
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
            <h1>{memo.name.toUpperCase()}</h1>
            <p className="program-creation-date" style={{ color: '#666', marginTop: '0.5rem', fontSize: '1.2rem' }}>
              <span style={{ 
                fontWeight: '800',
                fontSize: '1.5rem',
                color: '#0066ff',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                padding: '0.4rem 1.2rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.15) 0%, rgba(255, 8, 68, 0.15) 100%)',
                border: '3px solid #0066ff',
                boxShadow: '0 4px 12px rgba(0, 102, 255, 0.3)',
                display: 'inline-block'
              }}>
                📁 {program.name}
              </span>
              <span style={{ fontSize: '1.3rem', fontWeight: '600', margin: '0 0.8rem', color: '#333' }}>→</span>
              <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#333' }}>{memo.name}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => navigate(`/program/${programId}/memos`)} 
              className="back-button"
            >
              ← Back to Memos
            </button>
            <button onClick={() => navigate('/dashboard')} className="back-button">
              🏠 Dashboard
            </button>
            <button onClick={onLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>

        <div className="content-area">
          {/* Admin view-only mode */}
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

          {/* Upload Form - Only for regular users */}
          {!isAdmin && (
            <div className="upload-section">
              <h2>📝 Upload File to {memo.name}</h2>
              
              <form onSubmit={handleSubmit} className="upload-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fileNo">File No/C No: *</label>
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
                    <label htmlFor="subject">Subject: *</label>
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
                    <label htmlFor="date">Date: *</label>
                    <input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="form-input date-input"
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="department">Department: *</label>
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
                  <label htmlFor="fileInput">Select File: *</label>
                  <input
                    id="fileInput"
                    type="file"
                    onChange={handleFileSelect}
                    className="file-input"
                    required
                  />
                  {selectedFile && (
                    <p className="file-selected">✓ Selected: {selectedFile.name}</p>
                  )}
                </div>

                {uploadSuccess && <div className="success-message">✓ {uploadSuccess}</div>}
                {uploadError && <div className="error-message">✗ {uploadError}</div>}

                <button 
                  type="submit" 
                  className="upload-button" 
                  disabled={isUploading}
                  style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}
                >
                  {isUploading ? '⏳ Uploading...' : '📤 Submit File'}
                </button>
              </form>
            </div>
          )}

          {/* Files List Section */}
          <div className="files-section">
            <h2>📂 Uploaded Files ({filteredFiles.length})</h2>
            
            <div className="search-filters">
              <input
                type="text"
                placeholder="🔍 Search by file number, subject, department, or filename..."
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
                        <td>{new Date(file.date).toLocaleDateString('en-GB')}</td>
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
              <p className="no-files">No files uploaded yet. Be the first to upload!</p>
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
              </div>
              <p className="warning-text">⚠️ This action cannot be undone.</p>
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

export default MemoFiles
