Repository containing the MySQL-based project for the course Database Management Systems (UE23CS351A).

Contains "Ride-Ease", an EV-rental system developed using a MySQL-based Flask backend, and a React-based frontend.

Developed by : Prajwal M Kashyap & P Rishikesh

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
