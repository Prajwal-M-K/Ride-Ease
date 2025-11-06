import axios from 'axios';

const API_BASE_URL = '/api';

// Let axios set headers per method automatically. Setting Content-Type for GET
// can cause Flask to try parsing an empty JSON body and return 400.
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Auth APIs
export const register = async (name, email, password) => {
  const response = await api.post('/register', { name, email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/login', { email, password });
  return response.data;
};

// Stations APIs
export const getStations = async () => {
  const response = await api.get('/stations');
  return response.data;
};

export const addStation = async (name, location, capacity, userRole) => {
  const response = await api.post('/stations', {
    name,
    location,
    capacity,
    user_role: userRole,
  });
  return response.data;
};


export const deactivateStation = async (stationId, userRole) => {
  const response = await api.put(`/stations/${stationId}/deactivate`, {
    user_role: userRole,
  });
  return response.data;
};

export const getVehiclesAtStation = async (stationId) => {
  const response = await api.get(`/stations/${stationId}/vehicles`);
  return response.data;
};

// Vehicles APIs
export const getVehicles = async () => {
  const response = await api.get('/vehicles');
  return response.data;
};

export const addVehicle = async (type, model, manufacturer, ratePerHour, registrationNumber, stationId, userRole) => {
  const response = await api.post('/vehicles', {
    type,
    model,
    manufacturer,
    rate_per_hour: ratePerHour,
    registration_number: registrationNumber,
    station_id: stationId,
    user_role: userRole,
  });
  return response.data;
};


export const decommissionVehicle = async (vehicleId, userRole) => {
  const response = await api.put(`/vehicles/${vehicleId}/decommission`, {
    user_role: userRole,
  });
  return response.data;
};

export const reportVehicleIssue = async (vehicleId, issueReported, userId, userRole) => {
  const response = await api.post(`/vehicles/${vehicleId}/report`, {
    IssueReported: issueReported,
    user_id: userId,
    user_role: userRole,
  });
  return response.data;
};

// Booking APIs
export const bookRide = async (userId, vehicleId, startStationId, durationHours) => {
  const response = await api.post('/book', {
    user_id: userId,
    vehicle_id: vehicleId,
    start_station_id: startStationId,
    duration_hours: durationHours,
  });
  return response.data;
};

export const endRide = async (tripId, endStationId) => {
  const response = await api.post('/endride', {
    trip_id: tripId,
    end_station_id: endStationId,
  });
  return response.data;
};

export const cancelTrip = async (tripId) => {
  const response = await api.post(`/trip/${tripId}/cancel`);
  return response.data;
};

// User History API
export const getUserRides = async (userId, status = null) => {
  const url = status 
    ? `/user/${userId}/rides?status=${status}`
    : `/user/${userId}/rides`;
  const response = await api.get(url);
  return response.data;
};

// User Profile APIs
export const getUserProfile = async (userId) => {
  const response = await api.get(`/user/${userId}/profile`);
  return response.data;
};

export const updateUserProfile = async (userId, name = null, password = null) => {
  const data = {};
  if (name) data.name = name;
  if (password) data.password = password;
  const response = await api.put(`/user/${userId}/profile`, data);
  return response.data;
};

// Wallet APIs
export const addToWallet = async (userId, amount) => {
  const response = await api.post(`/user/${userId}/wallet/add`, { amount });
  return response.data;
};

// Review APIs
export const addReview = async (tripId, rating, comment = '') => {
  const response = await api.post(`/trip/${tripId}/review`, {
    rating,
    comment,
  });
  return response.data;
};

// Membership APIs
export const getMembershipPlans = async () => {
  const response = await api.get('/membership/plans');
  return response.data;
};

export const purchaseMembership = async (userId, planId) => {
  const response = await api.post('/membership/purchase', {
    user_id: userId,
    plan_id: planId,
  });
  return response.data;
};

// Technician APIs (Admin only)
export const getTechnicians = async (userRole) => {
  const response = await api.get('/technicians', {
    params: { user_role: userRole }
  });
  return response.data;
};

export const addTechnician = async (name, specialization, userRole) => {
  const response = await api.post('/technicians', {
    name,
    specialization,
    user_role: userRole,
  });
  return response.data;
};

export const updateTechnician = async (technicianId, updates, userRole) => {
  const response = await api.put(`/technicians/${technicianId}`, {
    ...updates,
    user_role: userRole,
  });
  return response.data;
};

export const deleteTechnician = async (technicianId, userRole) => {
  const response = await api.delete(`/technicians/${technicianId}`, {
    data: { user_role: userRole }
  });
  return response.data;
};

export const getTechnicianAssignments = async (userRole) => {
  const response = await api.get('/technicians/assignments', {
    params: { user_role: userRole }
  });
  return response.data;
};

export const completeMaintenanceLog = async (logId, userRole) => {
  const response = await api.put(`/maintenance-logs/${logId}/complete`, {
    user_role: userRole,
  });
  return response.data;
};

export default api;
