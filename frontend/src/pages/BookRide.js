import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStations, getVehiclesAtStation, bookRide } from '../utils/api';

const BookRide = ({ user, onBookingComplete, onUserUpdate }) => {
  const [stations, setStations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [durationHours, setDurationHours] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const stationsData = await getStations();
      setStations(stationsData);
      setError('');
    } catch (err) {
      setError('Failed to load stations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStationSelect = async (stationId) => {
    const station = stations.find(s => s.StationID === stationId);
    setSelectedStation(station);
    setSelectedVehicle(null);
    setLoadingVehicles(true);
    
    try {
      const stationVehicles = await getVehiclesAtStation(stationId);
      setVehicles(stationVehicles);
    } catch (err) {
      setError('Failed to load vehicles for this station');
      console.error(err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const calculateCostNumber = () => {
    if (!selectedVehicle) return 0;
    const rate = parseFloat(selectedVehicle.RatePerHour);
    const hours = parseFloat(durationHours) || 0;
    const discount = Number.isFinite(parseFloat(user?.PlanDiscount)) ? parseFloat(user.PlanDiscount) : 0;
    return (rate * hours) * (1 - discount);
  };
  const calculateCost = () => calculateCostNumber().toFixed(2);

  const handleBook = async () => {
    if (!selectedStation || !selectedVehicle) {
      setError('Please select a station and vehicle');
      return;
    }

    if (parseFloat(user.WalletBalance) < calculateCostNumber()) {
      setError('Insufficient wallet balance');
      return;
    }

    setBooking(true);
    setError('');

    try {
      await bookRide(
        user.UserID,
        selectedVehicle.VehicleID,
        selectedStation.StationID,
        durationHours
      );
      if (onUserUpdate) {
        await onUserUpdate();
      }
      if (onBookingComplete) {
        await onBookingComplete();
      }
      navigate('/active-ride');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book ride');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Book a Ride</h1>
        <p className="mt-2 text-gray-600">Select a station and vehicle to start your journey</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Station Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Select Station</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stations.map((station) => (
              <button
                key={station.StationID}
                onClick={() => handleStationSelect(station.StationID)}
                className={`w-full text-left p-4 border-2 rounded-lg transition ${
                  selectedStation?.StationID === station.StationID
                    ? 'border-accent-500 bg-accent-50'
                    : 'border-gray-200 hover:border-accent-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900">{station.Name}</h3>
                    <p className="text-sm text-gray-600">{station.Location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Available</p>
                    <p className="text-lg font-bold text-accent-600">{station.AvailableVehicles}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. Select Vehicle</h2>
          {!selectedStation ? (
            <div className="text-center py-8 text-gray-500">
              Please select a station first
            </div>
          ) : loadingVehicles ? (
            <div className="text-center py-8 text-gray-500">
              Loading vehicles...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No vehicles available at this station
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.VehicleID}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={`w-full text-left p-4 border-2 rounded-lg transition ${
                    selectedVehicle?.VehicleID === vehicle.VehicleID
                      ? 'border-accent-500 bg-accent-50'
                      : 'border-gray-200 hover:border-accent-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900">{vehicle.Model || 'N/A'}</h3>
                      <p className="text-sm text-gray-600">{(vehicle.Manufacturer || '') + ' • ' + (vehicle.Type || '')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Rate</p>
                      <p className="text-lg font-bold text-accent-600">₹{vehicle.RatePerHour}/hr</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Summary */}
      {selectedVehicle && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Vehicle</p>
              <p className="font-semibold text-gray-900">{selectedVehicle.Model}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Station</p>
              <p className="font-semibold text-gray-900">{selectedStation?.Name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Duration (hours)</p>
              <input
                type="number"
                min="1"
                max="24"
                value={durationHours}
                onChange={(e) => setDurationHours(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent-500 focus:border-accent-500"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-accent-600">₹{calculateCost()}</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">Wallet Balance</p>
              <p className="font-semibold text-gray-900">₹{Number.isFinite(parseFloat(user.WalletBalance)) ? parseFloat(user.WalletBalance).toFixed(2) : '0.00'}</p>
            </div>
            <button
              onClick={handleBook}
              disabled={booking || parseFloat(user.WalletBalance) < calculateCostNumber()}
                className="w-full bg-primary-700 hover:bg-primary-800 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              {booking ? 'Booking...' : 'Confirm Booking'}
            </button>
            {parseFloat(user.WalletBalance) < calculateCostNumber() && (
              <p className="mt-2 text-sm text-red-600 text-center">
                Insufficient wallet balance. Please add funds.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookRide;
