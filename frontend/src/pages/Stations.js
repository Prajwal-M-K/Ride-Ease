import React, { useState, useEffect } from 'react';
import { getStations, deactivateStation } from '../utils/api';

const Stations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const data = await getStations();
      setStations(data);
      setError('');
    } catch (err) {
      setError('Failed to load stations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (stationId, stationName) => {
    if (!window.confirm(`Are you sure you want to deactivate ${stationName}? All vehicles will be moved out.`)) {
      return;
    }

    try {
      await deactivateStation(stationId);
      setSuccess(`Station ${stationName} has been deactivated successfully.`);
      fetchStations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to deactivate station');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading stations...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Stations</h1>
        <p className="mt-2 text-gray-600">View and manage EV charging stations</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {stations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No stations available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station) => (
            <div key={station.StationID} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{station.Name}</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-gray-600 mb-4">📍 {station.Location}</p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Capacity</p>
                    <p className="text-lg font-semibold text-gray-900">{station.Capacity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Available Vehicles</p>
                    <p className="text-lg font-semibold text-primary-600">{station.AvailableVehicles}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeactivate(station.StationID, station.Name)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition"
                >
                  Deactivate Station
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Stations;
