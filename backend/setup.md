# Student Dashboard Setup Guide

## Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Composer
- Web server (Apache/Nginx)

## Setup Steps

### 1. Database Setup
```bash
# Login to MySQL
mysql -u root -p

# Run the schema and mock data
mysql> source schema.sql
mysql> source mock_data.sql
```

### 2. PHP Dependencies
```bash
# Install PHP dependencies
cd backend
composer install
```

### 3. Configuration
1. Update database configuration in `config.php`:
```php
private $host = "localhost";
private $db_name = "college_management";
private $username = "your_username";
private $password = "your_password";
```

2. Update JWT secret key in `auth.php`:
```php
private $secret_key = "your_secret_key_here";
```

### 4. Test User Credentials
Use these credentials to test the system:

Student Login:
- Email: alice@college.edu
- Password: password
- Role: Student

Faculty Logins:
- Email: smith@college.edu
- Password: password
- Role: Faculty

### 5. Testing the System
1. Start your web server
2. Navigate to the login page
3. Use the test credentials above to log in
4. You should see the dashboard with mock data

### 6. API Endpoints
The following endpoints are available for testing:

Student Data:
- GET `/backend/users/student-data.php`
- Requires: JWT token in Authorization header

Courses:
- GET `/backend/courses/student-courses.php`
- Requires: JWT token in Authorization header

Activities:
- GET `/backend/users/student-activities.php`
- Requires: JWT token in Authorization header

Deadlines:
- GET `/backend/courses/deadlines.php`
- Requires: JWT token in Authorization header

Notices:
- GET `/backend/notices/student-notices.php`
- Requires: JWT token in Authorization header

### 7. Mock Data Overview
The mock data includes:
- 4 faculty members
- 3 students
- 4 courses
- Multiple activities, deadlines, and notices
- Sample course progress and grades

### 8. Troubleshooting
1. Database Connection Issues:
   - Verify database credentials in `config.php`
   - Ensure MySQL service is running
   - Check database and table existence

2. Authentication Issues:
   - Clear browser localStorage
   - Verify JWT token generation
   - Check token expiration

3. API Errors:
   - Check PHP error logs
   - Verify file permissions
   - Ensure all required files are present

### 9. Development Notes
- Mock data is available in both the database and JavaScript
- Frontend will fall back to mock data if API calls fail
- JWT tokens expire after 1 hour
- API responses are rate-limited
- All passwords in mock data are set to 'password' 