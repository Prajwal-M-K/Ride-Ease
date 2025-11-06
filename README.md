# EV Rental System - Full Stack Application

A complete Electric Vehicle (EV) Rental System with React frontend and Flask backend. Users can register, browse EV stations and vehicles, book rides, manage active trips, and leave reviews.

## Project Structure

```
Project/
├── app.py                 # Flask backend API server
├── DDL.sql               # Database schema definitions
├── DML.sql               # Database views, procedures, and data
├── LOGS.sql              # Audit Logs table and triggers (run after DDL/DML)
├── Injection_Data.sql    # Additional seed data (optional)
├── frontend/             # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/   # Reusable components (Navbar)
│   │   ├── pages/        # Page components (Login, Dashboard, etc.)  
│   │   ├── utils/        # API utility functions
│   │   ├── App.js        # Main app component with routing
│   │   └── index.js      # Entry point
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Features

### User Features
- ✅ **User Registration & Login**: Secure authentication with password hashing
- ✅ **Dashboard**: Overview of stations, vehicles, rides, and wallet balance
- ✅ **Profile Management**: View and update profile information, change password
- ✅ **Wallet Recharge**: Add funds to wallet balance
- ✅ **Book Rides**: Select stations and vehicles, specify duration, and book rides
- ✅ **Active Ride Management**: View active trip details, end rides, or cancel trips (with refund)
- ✅ **Ride History**: View complete history of all past trips
- ✅ **Reviews**: Submit ratings and comments for completed trips

### Admin/Management Features
- ✅ **Station Management**: View all stations and deactivate them
- ✅ **Vehicle Management**:
  - View all vehicles with status (available, in-use, under-maintenance, decommissioned)
  - Decommission vehicles
  - Report vehicle issues (automatically assigns technicians)
  - View Audit Logs (admin-only) at `/logs`

---

## User Lifecycle & Journey

### 1. **Account Creation & First Login**
   - **Register**: New users visit the registration page (`/register`)
     - Enter name, email, and password
     - Account is created with $0.00 wallet balance
   - **Login**: Users log in with email and password (`/login`)
     - Session is saved in browser localStorage
     - Redirected to Dashboard after successful login

### 2. **Initial Setup & Exploration**
   - **Dashboard** (`/dashboard`): First view after login
     - See overview: Total stations, available vehicles, total rides, wallet balance
     - Quick links to "Book a Ride" and "My Rides"
     - Link to Profile page for wallet recharge
   - **Browse Stations** (`/stations`): Explore available EV charging stations
     - View station locations, capacity, and available vehicle counts
     - Admins can deactivate stations
   - **Browse Vehicles** (`/vehicles`): Explore the EV fleet
     - See vehicle types, models, manufacturers, rates
     - View vehicle status (available, in-use, under-maintenance)
     - Admins can decommission vehicles or report issues

### 3. **Wallet Management**
   - **Profile Page** (`/profile`): Manage account and wallet
     - View account information (name, email, join date)
     - Edit name and password
     - **Recharge Wallet**: Add funds by entering an amount
     - Wallet balance updates in real-time across the app

### 4. **Booking a Ride**
   - **Book Ride Page** (`/book`):
     - **Step 1**: Select a station from the list
     - **Step 2**: Choose a vehicle from available vehicles at that station
     - **Step 3**: Set duration (1-24 hours)
     - System calculates total cost (Rate × Duration)
     - Checks wallet balance (must have sufficient funds)
     - Click "Confirm Booking" to create the trip
   - **After Booking**:
     - Wallet balance is deducted automatically
     - Trip status is "Ongoing"
     - User is redirected to Active Ride page
     - Active Ride link appears in navigation bar

### 5. **Managing Active Rides**
   - **Active Ride Page** (`/active-ride`):
     - View trip details: Vehicle, start station, start time, expected end time, cost
     - **End Ride**:
       - Select end station from dropdown
       - Click "End Ride" button
       - Trip status changes to "Completed"
       - Vehicle becomes available at end station
       - Redirected to My Rides page
   - **Cancel Trip**:
     - Click "Cancel Trip" button (refund confirmation dialog)
     - Trip is cancelled, full refund is credited to wallet
     - Vehicle returns to start station
     - Trip status: "Cancelled"
     - Redirected to My Rides page

### 6. **Viewing Ride History**
   - **My Rides Page** (`/my-rides`):
     - See all past trips (Ongoing, Completed, Cancelled)
     - Trip details: Vehicle, stations, times, cost, status
     - **Leave Review** (for Completed trips):
       - Click "Leave Review" button
       - Modal opens with star rating (1-5) and comment field
       - Submit review to record feedback

### 7. **Account Management**
   - **Profile Page** (`/profile`):
     - Edit name and/or password
     - Recharge wallet anytime
     - View member since date
     - All changes persist across sessions

### 8. **Logout**
   - Click "Logout" in navigation bar
   - Session is cleared
   - Redirected to login page

---

## Complete Setup Instructions

### Prerequisites

Before you begin, ensure you have the following installed:

1. **Python 3.7+** with pip
2. **Node.js 14+** and npm (check with `node --version` and `npm --version`)
3. **MySQL Server 8.0+** (running and accessible)
4. **Git** (optional, for cloning)

### Step 1: Database Setup

1. **Start MySQL Server**:
   ```bash
   # On Windows (if installed as service, it should auto-start)
   # On macOS: brew services start mysql
   # On Linux: sudo systemctl start mysql
   ```

2. **Create and Set Up Database**:
   - Open MySQL command line or MySQL Workbench
   - Execute `DDL.sql` to create the database schema:
     ```sql
     source DDL.sql;
     -- OR in MySQL Workbench: File > Open SQL Script > Select DDL.sql > Execute
     ```
   - Execute `DML.sql` to create views, stored procedures, and initial data:
     ```sql
     source DML.sql;
     -- OR in MySQL Workbench: File > Open SQL Script > Select DML.sql > Execute
     ```
   - Execute `LOGS.sql` to create the Logs table and triggers (run after DDL/DML):
     ```sql
     source LOGS.sql;
     ```

3. **Verify Database Setup**:
   ```sql
   USE ev_rental_db;
   SHOW TABLES;  -- Should show: Users, Stations, Vehicles, Trips, Payments, MaintenanceLogs, Reviews
   SHOW PROCEDURES;  -- Should show stored procedures
   SHOW VIEWS;  -- Should show views
   ```

### Step 2: Backend Setup

1. **Navigate to Project Directory**:
   ```bash
   cd "path/to/Project"
   ```

2. **Install Python Dependencies**:
   ```bash
   pip install flask mysql-connector-python
   ```
   Or create a virtual environment (recommended):
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   
   pip install flask mysql-connector-python
   ```

3. **Configure Database Connection**:
   - Open `app.py` in a text editor
   - Update the `create_db_connection()` function with your MySQL credentials:
     ```python
     connection = mysql.connector.connect(
         host="localhost",
         user="root",  # Change to your MySQL username
         password="your_password",  # Change to your MySQL password
         database="ev_rental_db"
     )
     ```

4. **Test Backend Connection**:
   ```bash
   python app.py
   ```
   You should see:
   ```
    * Running on http://127.0.0.1:5000
    * Debug mode: on
   ```
   - Press `Ctrl+C` to stop the server
   - If you see connection errors, verify MySQL is running and credentials are correct

### Step 3: Frontend Setup

1. **Navigate to Frontend Directory**:
   ```bash
   cd frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
   This will install:
   - React and React DOM
   - React Router DOM
   - Axios
   - Tailwind CSS and dependencies

3. **Verify Configuration**:
   - Check `package.json` has a proxy setting: `"proxy": "http://localhost:5000"`
   - This allows the frontend to make API calls to the backend

### Step 4: Running the Application

#### Terminal 1: Start Backend Server

```bash
# From project root directory
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

**Keep this terminal open** - the backend must be running for the app to work.

#### Terminal 2: Start Frontend Server

```bash
# From project root directory
cd frontend
npm start
```

The React development server will:
- Start on `http://localhost:3000`
- Automatically open your default browser
- Hot-reload when you make code changes

### Step 5: First Use

1. **Register a New Account**:
   - Open `http://localhost:3000` (should open automatically)
   - Click "Register" or go to `/register`
   - Fill in name, email, and password
   - Click "Register"
   - You'll be redirected to the login page

2. **Login**:
   - Enter your email and password
   - Click "Login"
   - You'll be redirected to the Dashboard

3. **Add Wallet Funds**:
   - Click "Profile" in the navigation bar
   - Scroll to "Wallet Balance" section
   - Enter an amount (e.g., 100.00)
   - Click "Add Funds"
   - Your wallet balance updates

4. **Book Your First Ride**:
   - Click "Book a Ride" in the navigation or Dashboard
   - Select a station
   - Select a vehicle from that station
   - Choose duration (hours)
   - Confirm booking (wallet balance must be sufficient)

---

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user

### Stations
- `GET /api/stations` - Get all active stations with vehicle counts
- `GET /api/stations/<id>/vehicles` - Get available vehicles at a specific station
- `PUT /api/stations/<id>/deactivate` - Deactivate a station

### Vehicles
- `GET /api/vehicles` - Get all non-decommissioned vehicles
- `PUT /api/vehicles/<id>/decommission` - Decommission a vehicle
- `POST /api/vehicles/<id>/report` - Report a vehicle issue

### Booking & Trips
- `POST /api/book` - Book a ride
- `POST /api/endride` - End an active ride
- `POST /api/trip/<id>/cancel` - Cancel an ongoing trip (with refund)
- `POST /api/trip/<id>/review` - Add a review for a completed trip

### User
- `GET /api/user/<id>/profile` - Get user profile
- `PUT /api/user/<id>/profile` - Update user profile (name, password)
- `GET /api/user/<id>/rides` - Get user's ride history (optional `?status=Ongoing|Completed|Cancelled`)
- `POST /api/user/<id>/wallet/add` - Add funds to wallet

### Admin
- `GET /api/logs` - Fetch recent audit logs (admin-only). Query params: `user_role=admin`, optional `table`, `limit` (default 100, max 500)

---

## Troubleshooting

### Backend Issues

**Connection Error**:
```
mysql.connector.errors.InterfaceError: 2003: Can't connect to MySQL server
```
- **Solution**: Verify MySQL server is running
- Check credentials in `app.py` match your MySQL setup
- Test connection manually: `mysql -u root -p`

**Database Not Found**:
```
mysql.connector.errors.ProgrammingError: 1049: Unknown database 'ev_rental_db'
```
- **Solution**: Execute `DDL.sql` to create the database

**Table/View/Procedure Not Found**:
```
mysql.connector.errors.ProgrammingError: 1146: Table 'ev_rental_db.Stations' doesn't exist
```
- **Solution**: Ensure both `DDL.sql` and `DML.sql` have been executed

### Frontend Issues

**Cannot Connect to Backend (CORS/Proxy Error)**:
- Ensure backend is running on port 5000
- Check `package.json` has `"proxy": "http://localhost:5000"`
- Restart the frontend server after changing proxy settings

**npm install fails**:
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Try `npm cache clean --force` if issues persist

**Port Already in Use**:
- **Port 3000**: Stop other React apps or change port: `set PORT=3001 && npm start` (Windows) or `PORT=3001 npm start` (macOS/Linux)
- **Port 5000**: Stop other Flask apps or change in `app.py`: `app.run(debug=True, port=5001)`

**Page Not Loading / Blank Screen**:
- Open browser console (F12) to check for errors
- Verify backend is running and accessible at `http://localhost:5000`
- Check that all API endpoints return expected JSON responses

### Database Issues

**Views Not Found**:
- Re-execute the view creation statements from `DML.sql`

**Stored Procedures Not Found**:
- Re-execute stored procedure definitions from `DML.sql`
- Ensure `DELIMITER` statements are properly handled in your MySQL client

---

## Technology Stack

- **Backend**: Flask (Python), MySQL Connector
- **Frontend**: React 18, React Router 6, Axios
- **Styling**: Tailwind CSS
- **Database**: MySQL 8.0+
- **Authentication**: SHA-256 password hashing
 - **Auditing**: MySQL triggers writing to central `Logs` table, admin UI

---

## Notes & Recent Updates

### ✅ Implemented Features (Previously Gaps)

1. **✅ Wallet Recharge**: Full implementation with UI in Profile page
2. **✅ Trip Cancellation**: Users can cancel ongoing trips with full refund
3. **✅ Reviews System**: Users can submit ratings and comments for completed trips
4. **✅ User Profile Management**: View and update name, password, and wallet
5. **✅ Station-Specific Vehicles**: Booking flow now loads vehicles per station
6. **✅ Real-time Wallet Updates**: Balance refreshes after all transactions
7. **✅ Audit Logging**: Triggers for Trips, Payments, Vehicles (status & station moves), Stations, Users (wallet, plan, name), Technicians, TechnicianAssignments, Reviews, with an admin Logs page

### Architecture Decisions

- **Local Storage**: User sessions persist in browser localStorage (for demo purposes)
- **Wallet Validation**: All bookings check wallet balance before processing
- **Active Trip Tracking**: App automatically detects and displays ongoing trips
- **Refund System**: Cancelled trips automatically refund to wallet

---

## License

This project is for educational purposes (DBMS Course Project).

---

## Quick Reference

### Start Everything
```bash
# Terminal 1: Backend
python app.py

# Terminal 2: Frontend  
cd frontend && npm start
```

### Default URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### Test User Flow
1. Register → Login → Dashboard
2. Profile → Add Funds (e.g., $100)
3. Book Ride → Select Station → Select Vehicle → Book
4. Active Ride → End Ride (or Cancel)
5. My Rides → Leave Review (if completed)

---

**Happy EV Renting! 🚗⚡**
