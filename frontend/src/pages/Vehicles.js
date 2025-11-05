import React, { useState, useEffect } from 'react';
import { getVehicles, decommissionVehicle, reportVehicleIssue } from '../utils/api';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportModal, setReportModal] = useState({ open: false, vehicleId: null, vehicleName: '' });
  const [issueDescription, setIssueDescription] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
      setError('');
    } catch (err) {
      setError('Failed to load vehicles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecommission = async (vehicleId, vehicleName) => {
    if (!window.confirm(`Are you sure you want to decommission ${vehicleName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await decommissionVehicle(vehicleId);
      setSuccess(`Vehicle ${vehicleName} has been decommissioned successfully.`);
      fetchVehicles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to decommission vehicle');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openReportModal = (vehicleId, vehicleName) => {
    setReportModal({ open: true, vehicleId, vehicleName });
    setIssueDescription('');
  };

  const closeReportModal = () => {
    setReportModal({ open: false, vehicleId: null, vehicleName: '' });
    setIssueDescription('');
  };

  const handleReportIssue = async () => {
    if (!issueDescription.trim()) {
      setError('Please describe the issue');
      return;
    }

    try {
      await reportVehicleIssue(reportModal.vehicleId, issueDescription);
      setSuccess(`Issue reported for ${reportModal.vehicleName}. A technician has been assigned.`);
      closeReportModal();
      fetchVehicles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to report issue');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in-use':
        return 'bg-blue-100 text-blue-800';
      case 'under-maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading vehicles...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
        <p className="mt-2 text-gray-600">View and manage EV fleet</p>
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

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No vehicles available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.VehicleID} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{vehicle.Model}</h3>
                    <p className="text-sm text-gray-600">{vehicle.Manufacturer} • {vehicle.Type}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.Status)}`}>
                    {vehicle.Status}
                  </span>
                </div>
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Rate per hour:</span>
                    <span className="text-sm font-semibold text-gray-900">${vehicle.RatePerHour}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Current Station:</span>
                    <span className="text-sm font-semibold text-gray-900">{vehicle.CurrentStationName || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {vehicle.Status === 'available' && (
                    <>
                      <button
                        onClick={() => handleDecommission(vehicle.VehicleID, vehicle.Model)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-md transition"
                      >
                        Decommission
                      </button>
                      <button
                        onClick={() => openReportModal(vehicle.VehicleID, vehicle.Model)}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2 px-4 rounded-md transition"
                      >
                        Report Issue
                      </button>
                    </>
                  )}
                  {vehicle.Status === 'under-maintenance' && (
                    <button
                      onClick={() => openReportModal(vehicle.VehicleID, vehicle.Model)}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2 px-4 rounded-md transition"
                    >
                      Update Issue
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Issue Modal */}
      {reportModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Report Issue - {reportModal.vehicleName}
            </h3>
            <textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Describe the issue with this vehicle..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 mb-4"
              rows="4"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleReportIssue}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition"
              >
                Report Issue
              </button>
              <button
                onClick={closeReportModal}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
