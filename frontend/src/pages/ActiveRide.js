import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStations, endRide, cancelTrip } from '../utils/api';

const ActiveRide = ({ trip, user, onRideEnded, onUserUpdate }) => {
  const [stations, setStations] = useState([]);
  const [selectedEndStation, setSelectedEndStation] = useState(null);
  const [ending, setEnding] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const data = await getStations();
      setStations(data);
    } catch (err) {
      setError('Failed to load stations');
      console.error(err);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const handleEndRide = async () => {
    if (!selectedEndStation) {
      setError('Please select an end station');
      return;
    }

    if (!window.confirm(`End ride at ${selectedEndStation.Name}?`)) {
      return;
    }

    setEnding(true);
    setError('');

    try {
      await endRide(trip.TripID, selectedEndStation.StationID);
      if (onUserUpdate) {
        await onUserUpdate();
      }
      if (onRideEnded) {
        onRideEnded();
      }
      navigate('/my-rides');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end ride');
    } finally {
      setEnding(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!window.confirm('Are you sure you want to cancel this trip? You will receive a full refund.')) {
      return;
    }

    setCancelling(true);
    setError('');

    try {
      await cancelTrip(trip.TripID);
      if (onUserUpdate) {
        await onUserUpdate();
      }
      if (onRideEnded) {
        onRideEnded();
      }
      navigate('/my-rides');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel trip');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-lg shadow-lg p-8 mb-6">
        <h1 className="text-3xl font-bold mb-2">🚴 Active Ride</h1>
        <p className="text-gray-300">Your ride is currently in progress</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Trip Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Vehicle</p>
            <p className="font-semibold text-gray-900">{trip.VehicleType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Start Station</p>
            <p className="font-semibold text-gray-900">{trip.StartStation}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Start Time</p>
            <p className="font-semibold text-gray-900">{formatDateTime(trip.StartTime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Expected End Time</p>
            <p className="font-semibold text-gray-900">{formatDateTime(trip.EndTime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cost</p>
            <p className="font-semibold text-accent-600">₹{Number.isFinite(parseFloat(trip.Cost)) ? parseFloat(trip.Cost).toFixed(2) : '0.00'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              {trip.Status}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">End Ride</h2>
        <p className="text-gray-600 mb-4">Select the station where you're ending your ride:</p>
        
        <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
          {stations.map((station) => (
            <button
              key={station.StationID}
              onClick={() => setSelectedEndStation(station)}
              className={`w-full text-left p-4 border-2 rounded-lg transition ${
                selectedEndStation?.StationID === station.StationID
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
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="text-lg font-bold text-accent-600">{station.Capacity}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleEndRide}
            disabled={ending || !selectedEndStation}
            className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            {ending ? 'Ending Ride...' : 'End Ride'}
          </button>
          <button
            onClick={handleCancelTrip}
            disabled={cancelling}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Trip'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveRide;
