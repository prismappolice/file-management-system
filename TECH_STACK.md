# 🛠️ Technology Stack - File Management System

## Project: District File Flow (fms.prism-appolice.in)

---

## 🎨 Frontend Technologies

### Core Framework
- **React 18.2.0** - JavaScript library for building user interfaces
- **TypeScript 5.0.2** - Typed superset of JavaScript for type safety
- **Vite 4.4.5** - Next-generation frontend build tool and dev server

### Frontend Features
- **React Hooks** - useState, useEffect for state management
- **Single Page Application (SPA)** - Client-side routing
- **Responsive Design** - CSS-based responsive layout
- **Form Handling** - File uploads, form validation
- **Real-time Search** - Client-side filtering and search functionality

### UI/UX
- **Custom CSS** - App.css, index.css
- **Icons** - Emoji-based icons (📄, 📝, 🗑, ⬇, 🔍)
- **Responsive Tables** - Data display
- **Modal Forms** - File upload interface

---

## 🔧 Backend Technologies

### Server Framework
- **Node.js** - JavaScript runtime environment
- **Express.js 5.1.0** - Web application framework for Node.js
- **Port** - 3000 (configurable via environment variable)

### Middleware & Libraries
- **CORS 2.8.5** - Cross-Origin Resource Sharing
- **body-parser 2.2.0** - Request body parsing
- **Multer 2.0.2** - File upload handling middleware
- **Path** - File path utilities

### Backend Features
- RESTful API endpoints
- File upload handling
- File download streaming
- CRUD operations (Create, Read, Delete)
- Health check endpoint

### API Endpoints
```
GET    /api/health          - Health check
GET    /api/files           - Retrieve all files
POST   /api/upload          - Upload new file
GET    /api/download/:id    - Download file
DELETE /api/files/:id       - Delete file
```

---

## 🗄️ Database Technologies

### Database System
- **SQLite3 5.1.7** - Embedded relational database
- **Database File** - `server/files.db`
- **Busy Timeout** - 5000ms for concurrent access

### Database Schema

#### Files Table
```sql
CREATE TABLE files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fileNo TEXT NOT NULL,
  subject TEXT NOT NULL,
  department TEXT NOT NULL,
  date TEXT NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Database Features
- Auto-incrementing primary key
- Timestamp tracking (uploaded_at)
- Text-based storage for metadata
- File path storage for file system reference

---

## 📦 Build & Development Tools

### Build Tools
- **Vite** - Fast HMR (Hot Module Replacement)
- **TypeScript Compiler (tsc)** - Type checking and compilation
- **esbuild** - Used by Vite for fast bundling

### Development Dependencies
```json
{
  "@types/react": "^18.2.15",
  "@types/react-dom": "^18.2.7",
  "@vitejs/plugin-react": "^4.0.3",
  "concurrently": "^8.2.2"
}
```

### Scripts
```json
{
  "dev": "vite",                                    // Frontend dev server
  "build": "tsc && vite build",                     // Production build
  "preview": "vite preview",                        // Preview production build
  "server": "node server/server.js",                // Backend server
  "start": "concurrently \"npm run server\" \"npm run dev\""  // Both
}
```

---

## 🚀 Deployment Stack

### Production Environment
- **Operating System** - Ubuntu 20.04/22.04 LTS
- **Cloud Platform** - Google Cloud Platform (GCP)
- **Domain** - fms.prism-appolice.in

### Web Server
- **Nginx** - Reverse proxy and static file server
  - Serves built React app (static files from /dist)
  - Proxies API requests to Node.js backend
  - Handles SSL/TLS termination

### Process Manager
- **PM2** - Node.js process manager
  - Auto-restart on crashes
  - Log management
  - System startup integration
  - Memory monitoring

### SSL/TLS
- **Let's Encrypt** - Free SSL certificates
- **Certbot** - Certificate management and auto-renewal
- **HTTPS** - Secure communication

### Security
- **UFW (Uncomplicated Firewall)** - Port management
- **Nginx Security Headers** - XSS, CORS, Frame protection
- **File Upload Validation** - PDF/Word only
- **HTTPS Redirect** - HTTP to HTTPS

---

## 📁 File Storage

### Upload Storage
- **Location** - `./uploads` directory
- **File Types** - PDF (.pdf), Word (.doc, .docx)
- **Upload Handling** - Multer middleware
- **Max File Size** - 100MB (configurable in Nginx)

### File Organization
```
uploads/
  ├── [timestamp]-[original-filename].pdf
  ├── [timestamp]-[original-filename].docx
  └── ...
```

---

## 🔐 Authentication

### Current Implementation
- **Type** - Client-side credential validation
- **User Roles** - District User, Administrator
- **Storage** - Hardcoded in App.tsx (for demo)

### User Credentials
```typescript
{
  district: { username: 'district', password: 'district123' },
  admin: { username: 'admin', password: 'admin123' }
}
```

### Features by Role
- **District User** - Upload, download, delete own files
- **Administrator** - View all files, download (read-only)

---

## 🔄 Data Flow Architecture

```
┌─────────────┐
│   Browser   │
│  (React +   │
│ TypeScript) │
└──────┬──────┘
       │
       │ HTTPS (443)
       │
┌──────▼──────┐
│    Nginx    │
│  (Reverse   │
│   Proxy)    │
└──────┬──────┘
       │
       │ /api → localhost:3000
       │ /    → /dist (static)
       │
┌──────▼──────┐
│  Express.js │
│  (Node.js)  │
│   Port 3000 │
└──────┬──────┘
       │
       ├─────────┐
       │         │
┌──────▼──┐  ┌──▼──────┐
│ SQLite3 │  │ Uploads │
│   DB    │  │  /files │
└─────────┘  └─────────┘
```

---

## 📊 Technology Summary

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Frontend** | React | 18.2.0 | UI Framework |
| | TypeScript | 5.0.2 | Type Safety |
| | Vite | 4.4.5 | Build Tool |
| **Backend** | Node.js | - | Runtime |
| | Express | 5.1.0 | Web Framework |
| | Multer | 2.0.2 | File Upload |
| **Database** | SQLite3 | 5.1.7 | Data Storage |
| **Deployment** | Ubuntu | 20.04/22.04 | OS |
| | Nginx | Latest | Web Server |
| | PM2 | Latest | Process Manager |
| | Let's Encrypt | Latest | SSL/TLS |
| **Cloud** | GCP | - | Hosting |

---

## 🎯 Key Features Supported by Stack

✅ **File Upload** - Multer + Express + Filesystem  
✅ **File Download** - Express streaming + Nginx  
✅ **Search & Filter** - React state management  
✅ **Date Filtering** - Client-side filtering  
✅ **Responsive UI** - CSS + React  
✅ **RESTful API** - Express.js  
✅ **Data Persistence** - SQLite3  
✅ **Secure Hosting** - HTTPS + Nginx  
✅ **Process Monitoring** - PM2  
✅ **Auto-restart** - PM2 + Systemd  
✅ **Automated Backups** - Bash scripts + Cron  

---

## 🔮 Future Enhancement Possibilities

### Authentication
- JWT (JSON Web Tokens)
- Session management (express-session)
- Password hashing (bcrypt)
- OAuth integration

### Database
- PostgreSQL or MySQL for production
- Database migrations (Sequelize/TypeORM)
- Connection pooling

### Frontend
- React Router for multi-page navigation
- State management (Redux/Zustand)
- UI framework (Material-UI/Tailwind CSS)

### Features
- Real-time notifications (Socket.io)
- File preview (PDF.js)
- Advanced search (Elasticsearch)
- Audit logging
- Multi-file upload
- Drag & drop interface

---

**Last Updated**: November 4, 2025  
**Project**: District File Flow  
**Domain**: fms.prism-appolice.in
