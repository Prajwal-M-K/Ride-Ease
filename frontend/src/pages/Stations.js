import React, { useState, useEffect } from 'react';
import { getStations, addStation, deactivateStation } from '../utils/api';

const Stations = ({ user }) => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStation, setNewStation] = useState({ name: '', location: '', capacity: '' });

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
      await deactivateStation(stationId, user?.Role);
      setSuccess(`Station ${stationName} has been deactivated successfully.`);
      fetchStations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to deactivate station');
      setTimeout(() => setError(''), 3000);
    }
  };


  const handleAddStation = async (e) => {
    e.preventDefault();
    try {
      await addStation(newStation.name, newStation.location, parseInt(newStation.capacity), user?.Role);
      setSuccess('Station added successfully.');
      setNewStation({ name: '', location: '', capacity: '' });
      setShowAddModal(false);
      fetchStations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add station');
      setTimeout(() => setError(''), 3000);
    }
  };

  const isAdmin = user?.Role === 'admin';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading stations...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stations</h1>
          <p className="mt-2 text-gray-600">View and manage EV charging stations</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium"
          >
            + Add Station
          </button>
        )}
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
                {isAdmin && (
                  <button
                    onClick={() => handleDeactivate(station.StationID, station.Name)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition"
                  >
                    Deactivate Station
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Station Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Station</h3>
            <form onSubmit={handleAddStation}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newStation.name}
                  onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newStation.location}
                  onChange={(e) => setNewStation({ ...newStation, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={newStation.capacity}
                  onChange={(e) => setNewStation({ ...newStation, capacity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition"
                >
                  Add Station
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewStation({ name: '', location: '', capacity: '' });
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stations;
