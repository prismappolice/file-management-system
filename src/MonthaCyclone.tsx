import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

interface FileEntry {
  id: number
  fileNo: string
  subject: string
  date: string
  department: string
  filename: string
  created_by?: string
  uploaded_at?: string
}

interface MonthaCycloneProps {
  userType: string  // Changed to accept any userType string
  userName: string
  onLogout: () => void
}

const API_URL = '/api'

function MonthaCyclone({ userType, userName, onLogout }: MonthaCycloneProps) {
  const navigate = useNavigate()
  
  // Helper functions to determine user permissions
  const isAdmin = userType === 'admin'
  const isDistrictUser = !isAdmin  // Any non-admin user is treated as district user
  
  const [files, setFiles] = useState<FileEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [fileNo, setFileNo] = useState('')
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState('')
  const [department, setDepartment] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Filter files based on search query and date
  const filteredFiles = files.filter(file => {
    const matchesText =
      file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.fileNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = searchDate ? file.date === searchDate : true;
    return matchesText && matchesDate;
  });

  // Fetch files from backend
  const fetchFiles = async () => {
    try {
      console.log('=== FETCHING MONTHA FILES ===')
      console.log('Fetching from:', `${API_URL}/files?program=montha&userType=${userType}&userName=${userName}`)
      const response = await fetch(`${API_URL}/files?program=montha&userType=${userType}&userName=${userName}`)
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      console.log('Files received:', data.files?.length || 0)
      if (data.success) {
        setFiles(data.files)
        console.log('Files set in state:', data.files.length)
      } else {
        console.error('Success is false:', data)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  // Fetch files on component mount
  useEffect(() => {
    fetchFiles()
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const fileType = file.type
      if (fileType === 'application/pdf' || 
          fileType === 'application/msword' || 
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setSelectedFile(file)
        setUploadError('')
      } else {
        setUploadError('Please select only PDF or Word documents')
        setSelectedFile(null)
      }
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError('')
    setUploadSuccess('')

    if (!fileNo || !subject || !date || !department || !selectedFile) {
      setUploadError('Please fill all fields and select a file')
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
      formData.append('program', 'montha')
      formData.append('createdBy', userName)

      console.log('=== MONTHA UPLOAD ===')
      console.log('Uploading to:', `${API_URL}/upload`)
      console.log('Program:', 'montha')
      console.log('FormData entries:')
      for (let pair of formData.entries()) {
        console.log(pair[0], ':', pair[1])
      }

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      console.log('Upload response:', data)

      if (data.success) {
        setUploadSuccess(data.message)
        
        // Reset form
        setFileNo('')
        setSubject('')
        setDate('')
        setDepartment('')
        setSelectedFile(null)
        
        // Reset file input
        const fileInput = document.getElementById('fileInput') as HTMLInputElement
        if (fileInput) fileInput.value = ''

        // Refresh files list
        console.log('Calling fetchFiles after upload...')
        fetchFiles()

        // Clear success message after 3 seconds
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
      // Open the enhanced file viewer in new tab
      const viewUrl = `${API_URL}/view/${fileId}`
      console.log('Opening view URL:', viewUrl) // Debug log
      
      // Create a temporary link element to force navigation
      const link = document.createElement('a')
      link.href = viewUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      
      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('View error:', error)
      alert('Failed to view file: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleDownload = async (fileId: number, filename: string) => {
    try {
      const response = await fetch(`${API_URL}/download/${fileId}`)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download file')
    }
  }

  const handleDelete = async (id: number, createdBy: string) => {
    // Check if user has permission to delete
    if (userType !== 'admin' && createdBy !== userName) {
      alert('You can only delete files uploaded by you!')
      return
    }

    if (!window.confirm('Are you sure you want to delete this file?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/files/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userName, userType })
      })

      const data = await response.json()

      if (data.success) {
        fetchFiles()
      } else {
        alert(data.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file')
    }
  }

  return (
    <div className="App">
      <div className="dashboard-wrapper">
        <div className="dashboard-header">
          <div>
            <h1>MONTHA CYCLONE</h1>
            <p className="welcome-text">Welcome, {userName}</p>
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
                  <label htmlFor="date">Date:</label>
                  <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input"
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department:</label>
                  <input
                    id="department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter department name"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fileInput">File (PDF/Word):</label>
                  <input
                    id="fileInput"
                    type="file"
                    onChange={handleFileSelect}
                    className="form-input file-input"
                    accept=".pdf,.doc,.docx"
                    required
                  />
                </div>
              </div>

              {uploadError && <div className="error-message">{uploadError}</div>}
              {uploadSuccess && <div className="success-message">{uploadSuccess}</div>}
              {selectedFile && <div className="file-selected">Selected: {selectedFile.name}</div>}

              <button type="submit" className="upload-button" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload File'}
              </button>
            </form>
          </div>
        )}

        <div className="files-section">
          <h2>{isAdmin ? 'All Uploaded Files' : 'Your Uploaded Files'}</h2>
          
          <div className="search-container" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Search by file number, file name, subject, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              style={{ flex: 1 }}
            />
            <input
              type="date"
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
              className="search-input"
              style={{ maxWidth: '200px' }}
              placeholder="Search by date"
            />
          </div>

          {filteredFiles.length === 0 ? (
            <p className="no-files">{searchQuery ? 'No files found matching your search.' : 'No files uploaded yet.'}</p>
          ) : (
            <div className="table-container">
              <table className="files-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>File No / C.No</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Department</th>
                    <th>File Name</th>
                    <th>Actions</th>
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
                      <td className="action-buttons">
                        <button
                          onClick={() => handleDownload(file.id, file.filename)}
                          className="download-button"
                          title="Download file"
                        >
                          ⬇ Download
                        </button>
                        <button
                          onClick={() => handleDelete(file.id, userName)}
                          className="delete-button"
                          title="Delete file"
                        >
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>


      </div>
    </div>
  )
}

export default MonthaCyclone
