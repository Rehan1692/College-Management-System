# College Management System - Setup Guide

## Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Web server (Apache/Nginx)
- Composer (optional, for PHP dependencies)

## 1. Set Up Local Development Environment

### Option 1: Using XAMPP (Recommended for beginners)
1. Download and install [XAMPP](https://www.apachefriends.org/download.html)
2. Start Apache and MySQL services from the XAMPP Control Panel
3. Verify installation by opening http://localhost in your browser

### Option 2: Using separate installations
1. Install PHP: Download from [php.net](https://www.php.net/downloads.php)
2. Install MySQL: Download from [mysql.com](https://dev.mysql.com/downloads/installer/)
3. Install a web server (Apache or Nginx)
4. Configure PHP to work with your web server

## 2. Database Setup

1. Open phpMyAdmin (http://localhost/phpmyadmin if using XAMPP)
2. Create a new database named `college_management`
3. Import the database schema:
   - Select the `college_management` database
   - Click on "Import" tab
   - Choose the file `backend/database/schema.sql`
   - Click "Go" to import the schema

## 3. Configure Environment Variables

1. Copy the `.env.example` file to create a new `.env` file:
   ```
   cp backend/.env.example backend/.env
   ```

2. Edit the `.env` file with your database credentials:
   ```
   DB_HOST=localhost
   DB_NAME=college_management
   DB_USER=root
   DB_PASS=your_password_if_any
   
   JWT_SECRET=generate_a_secure_random_string
   JWT_EXPIRY=3600
   
   APP_URL=http://localhost
   ```

## 4. Set Up the Project Files

1. Place the entire project folder in your web server's document root:
   - For XAMPP: `C:\xampp\htdocs\` (Windows) or `/Applications/XAMPP/htdocs/` (Mac)
   - For Apache: `/var/www/html/` (Linux)

2. Ensure proper file permissions:
   - On Linux/Mac: `chmod -R 755 .` and `chmod -R 777 uploads/`
   - On Windows with XAMPP: This is usually not required

## 5. Test the System

1. Open your browser and navigate to:
   ```
   http://localhost/college-management/
   ```

2. You should see the login page. Use the default admin credentials:
   - Email: admin@college.edu
   - Password: password

## 6. API Testing

To test the API endpoints:

1. Use a tool like [Postman](https://www.postman.com/downloads/)
2. Try the login endpoint:
   ```
   POST http://localhost/college-management/api/auth/login
   Content-Type: application/json
   
   {
     "email": "admin@college.edu",
     "password": "password"
   }
   ```
3. You should receive a token in the response

## 7. Troubleshooting

### Database Connection Issues
- Verify database credentials in `.env` file
- Ensure MySQL service is running
- Check if the database and tables exist

### API Errors
- Check PHP error logs (in XAMPP: `C:\xampp\php\logs\` or `/Applications/XAMPP/logs/`)
- Verify file permissions
- Ensure all required files are present

### Login Issues
- Clear browser localStorage
- Verify the user exists in the database
- Check if the password is correctly hashed

## 8. Next Development Steps

After setting up the basic system, you can:

1. Complete the frontend dashboards
2. Implement additional API endpoints
3. Add more features like file uploads, notifications, etc.
4. Enhance security with CSRF protection, rate limiting, etc.
5. Add unit and integration tests

## 9. Default Users

The system comes with a default admin user:
- Email: admin@college.edu
- Password: password

You can use this account to create additional users. 