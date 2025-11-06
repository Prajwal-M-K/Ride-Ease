import React, { useState, useEffect, useCallback } from 'react';
import { 
  getTechnicians, 
  addTechnician, 
  updateTechnician, 
  deleteTechnician,
  getTechnicianAssignments,
  completeMaintenanceLog
} from '../utils/api';

const Technicians = ({ user }) => {
  const [technicians, setTechnicians] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignments, setShowAssignments] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [newTechnician, setNewTechnician] = useState({ name: '', specialization: '' });

  const fetchTechnicians = useCallback(async () => {
    try {
      const data = await getTechnicians(user?.Role);
      setTechnicians(data);
      setError('');
    } catch (err) {
      setError('Failed to load technicians');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchAssignments = useCallback(async () => {
    try {
      const data = await getTechnicianAssignments(user?.Role);
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user?.Role === 'admin') {
      fetchTechnicians();
      fetchAssignments();
    }
  }, [user, fetchTechnicians, fetchAssignments]);

  const handleAddTechnician = async (e) => {
    e.preventDefault();
    try {
      await addTechnician(newTechnician.name, newTechnician.specialization, user?.Role);
      setSuccess('Technician added successfully.');
      setNewTechnician({ name: '', specialization: '' });
      setShowAddModal(false);
      fetchTechnicians();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add technician');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdateTechnician = async () => {
    try {
      await updateTechnician(
        editingTech.TechnicianID,
        {
          name: editingTech.Name,
          specialization: editingTech.Specialization,
          is_available: editingTech.IsAvailable,
        },
        user?.Role
      );
      setSuccess('Technician updated successfully.');
      setEditingTech(null);
      fetchTechnicians();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update technician');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteTechnician = async (technicianId, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteTechnician(technicianId, user?.Role);
      setSuccess('Technician deleted successfully.');
      fetchTechnicians();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete technician');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCompleteMaintenance = async (logId) => {
    if (!window.confirm('Mark this maintenance as completed?')) {
      return;
    }

    try {
      await completeMaintenanceLog(logId, user?.Role);
      setSuccess('Maintenance marked as completed.');
      fetchAssignments();
      fetchTechnicians();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete maintenance');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In-Progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (user?.Role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          Admin access required
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading technicians...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Technicians</h1>
          <p className="mt-2 text-gray-600">Manage technicians and their assignments</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAssignments(!showAssignments)}
            className="bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-md font-medium"
          >
            {showAssignments ? 'Hide Assignments' : 'View Assignments'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-md font-medium"
          >
            + Add Technician
          </button>
        </div>
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

      {showAssignments && (
        <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Assignments</h2>
          {assignments.length === 0 ? (
            <p className="text-gray-500">No active assignments</p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.AssignmentID} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{assignment.TechnicianName}</h3>
                      <p className="text-sm text-gray-600">{assignment.Specialization}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.LogStatus)}`}>
                      {assignment.LogStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Vehicle</p>
                      <p className="font-semibold text-gray-900">
                        {assignment.VehicleModel} ({assignment.RegistrationNumber})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Issue Reported</p>
                      <p className="font-semibold text-gray-900">{assignment.IssueReported}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Reported Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(assignment.ReportedDate).toLocaleDateString()}
                      </p>
                    </div>
                    {assignment.LogStatus !== 'Completed' && (
                      <div className="flex items-end">
                        <button
                          onClick={() => handleCompleteMaintenance(assignment.LogID)}
                          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Mark as Completed
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {technicians.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No technicians available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicians.map((technician) => (
            <div key={technician.TechnicianID} className="bg-white rounded-lg shadow-lg p-6">
              {editingTech?.TechnicianID === technician.TechnicianID ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editingTech.Name}
                    onChange={(e) => setEditingTech({ ...editingTech, Name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    value={editingTech.Specialization}
                    onChange={(e) => setEditingTech({ ...editingTech, Specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingTech.IsAvailable}
                      onChange={(e) => setEditingTech({ ...editingTech, IsAvailable: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Available</label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdateTechnician}
                      className="flex-1 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTech(null)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{technician.Name}</h3>
                      <p className="text-sm text-gray-600">{technician.Specialization}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      technician.IsAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {technician.IsAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Active Assignments</p>
                    <p className="text-lg font-semibold text-gray-900">{technician.ActiveAssignments}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingTech({ ...technician })}
                      className="flex-1 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium py-2 px-4 rounded-md transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTechnician(technician.TechnicianID, technician.Name)}
                      disabled={technician.ActiveAssignments > 0}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-4 rounded-md transition"
                    >
                      Delete
                    </button>
                  </div>
                  {technician.ActiveAssignments > 0 && (
                    <p className="text-xs text-gray-500 mt-2">Cannot delete: Has active assignments</p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Technician Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Technician</h3>
            <form onSubmit={handleAddTechnician}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newTechnician.name}
                  onChange={(e) => setNewTechnician({ ...newTechnician, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent-500 focus:border-accent-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input
                  type="text"
                  value={newTechnician.specialization}
                  onChange={(e) => setNewTechnician({ ...newTechnician, specialization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent-500 focus:border-accent-500"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary-700 hover:bg-primary-800 text-white font-medium py-2 px-4 rounded-md transition"
                >
                  Add Technician
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewTechnician({ name: '', specialization: '' });
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

export default Technicians;

