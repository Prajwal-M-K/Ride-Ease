import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import Technicians from './pages/Technicians';
import Membership from './pages/Membership';
import { getUserProfile } from './utils/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  // Session guard: increment this on logout to invalidate in-flight updates
  const sessionRef = useRef(0);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const checkActiveTrip = useCallback(async () => {
    if (!user) return;
    const mySession = sessionRef.current;
    const currentUserId = user.UserID;
    try {
      const response = await fetch(`/api/user/${currentUserId}/rides`);
      const trips = await response.json();
      if (sessionRef.current !== mySession || !user || user.UserID !== currentUserId) return; // user changed/logout
      const ongoing = trips.find(trip => trip.Status === 'Ongoing');
      setActiveTrip(ongoing || null);
    } catch (error) {
      console.error('Error checking active trip:', error);
    }
  }, [user]);

  useEffect(() => {
    // Check for active trips when user is logged in
    if (user) {
      checkActiveTrip();
    }
  }, [user, checkActiveTrip]);

  // Validate saved user on startup; clear if not found (handles DB reset)
  useEffect(() => {
    const validateSavedUser = async () => {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) return;
      const parsed = JSON.parse(savedUser);
      try {
        const res = await fetch(`/api/user/${parsed.UserID}/profile`);
        if (!res.ok) {
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (e) {
        // Backend down; keep state but will be corrected once backend is up
      }
    };
    validateSavedUser();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    // Invalidate any in-flight async updates
    sessionRef.current += 1;
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
    // Ignore updates if logged out or if the update refers to a different user
    if (!user) return;
    if (updatedUser && updatedUser.UserID !== user.UserID) return;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUserData = async () => {
    if (!user) return;
    const mySession = sessionRef.current;
    const currentUserId = user.UserID;
    try {
      const updatedUser = await getUserProfile(currentUserId);
      // Only apply if still same session and same user
      if (sessionRef.current === mySession && user && user.UserID === currentUserId) {
        handleUserUpdate(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-primary-900">
        {user && <Navbar user={user} onLogout={handleLogout} activeTrip={activeTrip} />}
        {/** Route gating: if logged in but has no membership plan, redirect most routes to /membership */}
        {/** Determine if user must complete membership */}
        {/** Note: allow Profile and Membership routes even when membership is pending */}
        <Routes>
          {(() => { /* helper scope for readability */ })()}
          {/** convenience flag used in route elements */}
          {/** Using a variable inside elements is simpler */}
          {/** We keep it inline to avoid refactor of each route's dependency array */}
          
          <Route 
            path="/login" 
            element={user ? <Navigate to={(!user.PlanID ? "/membership" : "/dashboard")} /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to={(!user.PlanID ? "/membership" : "/dashboard")} /> : <Register />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? (!user.PlanID ? <Navigate to="/membership" /> : <Dashboard user={user} onUserUpdate={refreshUserData} />) : <Navigate to="/login" />} 
          />
          <Route 
            path="/stations" 
            element={user ? (!user.PlanID ? <Navigate to="/membership" /> : <Stations user={user} />) : <Navigate to="/login" />} 
          />
          <Route 
            path="/vehicles" 
            element={user ? (!user.PlanID ? <Navigate to="/membership" /> : <Vehicles user={user} />) : <Navigate to="/login" />} 
          />
          <Route 
            path="/book" 
            element={user ? (!user.PlanID ? <Navigate to="/membership" /> : <BookRide user={user} onBookingComplete={handleBookingComplete} onUserUpdate={refreshUserData} />) : <Navigate to="/login" />} 
          />
          <Route 
            path="/my-rides" 
            element={user ? (!user.PlanID ? <Navigate to="/membership" /> : <MyRides user={user} />) : <Navigate to="/login" />} 
          />
          <Route 
            path="/active-ride" 
            element={user && activeTrip ? (!user.PlanID ? <Navigate to="/membership" /> : <ActiveRide trip={activeTrip} user={user} onRideEnded={handleRideEnded} onUserUpdate={refreshUserData} />) : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/profile" 
            element={user ? <Profile user={user} onUserUpdate={handleUserUpdate} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/membership" 
            element={user ? <Membership user={user} onUserUpdate={handleUserUpdate} navigateTo={(to)=>window.location.assign(to)} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/technicians" 
            element={user ? (!user.PlanID ? <Navigate to="/membership" /> : <Technicians user={user} />) : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={user ? <Navigate to={(!user.PlanID ? "/membership" : "/dashboard")} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
