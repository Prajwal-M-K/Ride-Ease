import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout, activeTrip }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  // Normalize wallet balance to a number for safe formatting
  const rawBalance = user && user.WalletBalance;
  const numericBalance = Number.parseFloat(rawBalance);
  const formattedBalance = Number.isFinite(numericBalance)
    ? numericBalance.toFixed(2)
    : '0.00';

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/dashboard" className="flex items-center px-2 py-2 text-xl font-bold text-primary-600">
              ⚡ RideEase
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600"
              >
                Dashboard
              </Link>
              <Link
                to="/stations"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                Stations
              </Link>
              <Link
                to="/vehicles"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                Vehicles
              </Link>
              <Link
                to="/book"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                Book Ride
              </Link>
              <Link
                to="/my-rides"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                My Rides
              </Link>
              {activeTrip && (
                <Link
                  to="/active-ride"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-red-600 hover:text-red-700 font-bold"
                >
                  🚴 Active Ride
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{user.Name}</span>
              <span className="ml-2 text-gray-500">(${formattedBalance})</span>
            </div>
            <Link
              to="/profile"
              className="text-sm font-medium text-gray-700 hover:text-primary-600"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
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
