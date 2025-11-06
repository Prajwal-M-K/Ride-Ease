import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout, activeTrip }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    // Replace history entry to avoid back navigation restoring dashboard
    navigate('/login', { replace: true });
  };

  // Normalize wallet balance to a number for safe formatting
  const rawBalance = user && user.WalletBalance;
  const numericBalance = Number.parseFloat(rawBalance);
  const formattedBalance = Number.isFinite(numericBalance)
    ? numericBalance.toFixed(2)
    : '0.00';

  return (
    <nav className="bg-primary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/dashboard" className="flex items-center px-2 py-2 text-xl font-bold text-white">
              RideEase
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white hover:text-accent-400"
              >
                Dashboard
              </Link>
              <Link
                to="/stations"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white/80 hover:text-accent-400"
              >
                Stations
              </Link>
              <Link
                to="/vehicles"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white/80 hover:text-accent-400"
              >
                Vehicles
              </Link>
              <Link
                to="/book"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white/80 hover:text-accent-400"
              >
                Book Ride
              </Link>
              <Link
                to="/my-rides"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white/80 hover:text-accent-400"
              >
                My Rides
              </Link>
              {user?.Role === 'admin' && (
                <Link
                  to="/technicians"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white/80 hover:text-accent-400"
                >
                  Technicians
                </Link>
              )}
              {activeTrip && (
                <Link
                  to="/active-ride"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-red-300 hover:text-red-200 font-bold"
                >
                  🚴 Active Ride
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-white">
              <span className="font-medium">{user.Name}</span>
              <span className="ml-2 text-white/70">(₹{formattedBalance})</span>
            </div>
            <Link
              to="/profile"
              className="text-sm font-medium text-white/80 hover:text-accent-400"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
