import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Stations from './pages/Stations';
import Vehicles from './pages/Vehicles';
import BookRide from './pages/BookRide';
import MyRides from './pages/MyRides';
import ActiveRide from './pages/ActiveRide';
import Profile from './pages/Profile';
import { getUserProfile } from './utils/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    // Check for active trips when user is logged in
    if (user) {
      checkActiveTrip();
    }
  }, [user]);

  const checkActiveTrip = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${user.UserID}/rides`);
      const trips = await response.json();
      const ongoing = trips.find(trip => trip.Status === 'Ongoing');
      if (ongoing) {
        setActiveTrip(ongoing);
      } else {
        setActiveTrip(null);
      }
    } catch (error) {
      console.error('Error checking active trip:', error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTrip(null);
    localStorage.removeItem('user');
  };

  const handleRideEnded = async () => {
    setActiveTrip(null);
    await refreshUserData();
  };

  const handleBookingComplete = async () => {
    await checkActiveTrip();
  };

  const handleUserUpdate = async (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUserData = async () => {
    if (!user) return;
    try {
      const updatedUser = await getUserProfile(user.UserID);
      handleUserUpdate(updatedUser);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Navbar user={user} onLogout={handleLogout} activeTrip={activeTrip} />}
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" /> : <Register />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} onUserUpdate={refreshUserData} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/stations" 
            element={user ? <Stations user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/vehicles" 
            element={user ? <Vehicles user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/book" 
            element={user ? <BookRide user={user} onBookingComplete={handleBookingComplete} onUserUpdate={refreshUserData} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/my-rides" 
            element={user ? <MyRides user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/active-ride" 
            element={user && activeTrip ? <ActiveRide trip={activeTrip} user={user} onRideEnded={handleRideEnded} onUserUpdate={refreshUserData} /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/profile" 
            element={user ? <Profile user={user} onUserUpdate={handleUserUpdate} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
