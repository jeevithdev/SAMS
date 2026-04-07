# SAMS - Student Activity Management System

A centralized Student Activity Management System for higher education institutions, built for SIH Problem Statement ID 25093 (Government of Jammu & Kashmir, Department of Higher Education).

## 🚀 Features

### Three Core Modules

1. **Activity Tracking**
   - Students upload certificates, workshop participations, internships, hackathons, and club activities
   - Faculty verify/reject submissions with remarks
   - Auto-generates verified digital portfolio per student

2. **Attendance Tracking**
   - Staff mark attendance per class session for allocated subjects only
   - Auto-calculates attendance percentage
   - Flags defaulters below 75%
   - Generates reports by student, subject, department, and institution

3. **Internal Marks Management**
   - Staff enter CIA marks, assignment marks, lab marks
   - Attendance-based marks calculated automatically from attendance data
   - Consolidates all mark types per student per subject

### Four User Roles

| Role | Capabilities |
|------|-------------|
| **Student** | View dashboard, submit activities, view attendance & marks, access portfolio |
| **Staff/Faculty** | Mark attendance, enter marks, verify mentee activities, view reports |
| **HOD** | Department oversight, view defaulters, generate NAAC reports |
| **Admin** | Full system management, user/department/program/subject management |

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: JWT with role-based access control

## 📁 Project Structure

```
sams/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & constants
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth & RBAC
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Seed data
│   │   └── app.js          # Express server
│   ├── uploads/            # File uploads
│   └── .env                # Environment config
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # Auth context
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── App.jsx         # Routes
│   └── index.html
│
└── README.md
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Atlas)

### Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Seed database with test data
npm run seed

# Start server
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sams
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

## 🔐 Demo Credentials

After running `npm run seed`, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sams.edu | admin123 |
| HOD (CSE) | hod.cse@sams.edu | hod123 |
| HOD (ECE) | hod.ece@sams.edu | hod123 |
| Staff | staff1@sams.edu | staff123 |
| Staff | staff2@sams.edu | staff123 |
| Student | student1@sams.edu | student123 |
| Student | student2@sams.edu | student123 |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/dashboard/admin` - Admin dashboard stats
- `GET /api/dashboard/hod` - HOD dashboard stats
- `GET /api/dashboard/staff` - Staff dashboard stats
- `GET /api/dashboard/student` - Student dashboard stats

### Activities
- `GET /api/activities/my-activities` - Student's activities
- `POST /api/activities` - Submit activity (multipart form)
- `GET /api/activities/pending-verification` - Pending verifications (mentor)
- `PUT /api/activities/:id/verify` - Verify/reject activity
- `GET /api/activities/my-portfolio` - Student's portfolio

### Attendance
- `POST /api/attendance` - Mark attendance (staff)
- `GET /api/attendance/my` - Student's attendance
- `GET /api/attendance/subject/:subjectId` - Subject attendance report
- `GET /api/attendance/defaulters` - Defaulters list

### Marks
- `POST /api/marks` - Enter marks (staff)
- `GET /api/marks/my` - Student's marks
- `GET /api/marks/my/consolidated` - Consolidated marks
- `POST /api/marks/calculate-attendance/:subjectId` - Auto-calculate attendance marks

### Admin
- `GET/POST/PUT/DELETE /api/departments` - Department CRUD
- `GET/POST/PUT/DELETE /api/programs` - Program CRUD
- `GET/POST/PUT/DELETE /api/subjects` - Subject CRUD
- `GET/POST/PUT/DELETE /api/users` - User management
- `GET/POST/PUT/DELETE /api/allocations` - Subject allocations
- `GET/POST/PUT/DELETE /api/activity-categories` - Activity categories
- `GET/PUT /api/settings` - Institution settings

### Reports
- `GET /api/reports/student-unified/:studentId` - Unified student profile
- `GET /api/reports/naac/activities` - NAAC activity report

## 🏗️ Deployment

### Backend (Railway/Render)

1. Create new web service
2. Connect to GitHub repo
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables

### Frontend (Vercel)

1. Import project from GitHub
2. Set root directory to `frontend`
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-backend-url.com/api`

### Database (MongoDB Atlas)

1. Create free cluster
2. Get connection string
3. Update `MONGODB_URI` in backend environment

## 📋 Future Roadmap (v2)

- [ ] Blockchain certificate verification
- [ ] AI-based performance prediction
- [ ] Flutter mobile app
- [ ] National-level inter-university integration
- [ ] Email notifications
- [ ] Export to PDF/Excel
- [ ] Bulk data import

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📜 License

This project is built for SIH 2024 submission.

---

**SIH Problem Statement ID**: 25093  
**Organization**: Government of Jammu & Kashmir, Department of Higher Education
