# AP POLICE - File Management System
## Default User Credentials

### System Administrator Account
- **Username**: admin
- **Password**: admin123
- **User Type**: admin
- **Permissions**: Full system access

### Default User Account
- **Username**: user1
- **Password**: user123
- **User Type**: district
- **Permissions**: Limited access to own files only

### Security Notes
1. **Change default passwords immediately** after first login
2. **Passwords are hashed** using bcrypt in the database
3. **Never store plaintext passwords** in frontend code
4. **Session-based password display** only for newly created/changed passwords
5. **Default passwords should be changed** in production environment

### Password Policy
- Minimum 6 characters
- Must be changed by admin through User Management interface
- Passwords are never displayed after initial creation (except during current session)

### Database Security
- All passwords stored as bcrypt hashes in `files.db`
- Password verification done server-side only
- No plaintext password storage anywhere in the system