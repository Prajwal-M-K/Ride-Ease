import React, { useState, useEffect } from 'react';
import { getUserRides, addReview } from '../utils/api';

const MyRides = ({ user }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState({ open: false, tripId: null, trip: null });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const data = await getUserRides(user.UserID);
      setRides(data);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'Upcoming':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openReviewModal = (ride) => {
    setReviewModal({ open: true, tripId: ride.TripID, trip: ride });
    setRating(5);
    setComment('');
    setError('');
  };

  const closeReviewModal = () => {
    setReviewModal({ open: false, tripId: null, trip: null });
    setRating(5);
    setComment('');
    setError('');
  };

  const handleSubmitReview = async () => {
    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5');
      return;
    }

    setSubmittingReview(true);
    setError('');

    try {
      await addReview(reviewModal.tripId, rating, comment);
      setSuccess('Review submitted successfully!');
      closeReviewModal();
      fetchRides(); // Refresh to potentially hide review button if needed
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading your rides...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Rides</h1>
        <p className="mt-2 text-gray-600">View your complete ride history</p>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {rides.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">You haven't taken any rides yet.</p>
          <a
            href="/book"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition"
          >
            Book Your First Ride
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <div key={ride.TripID} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Trip #{ride.TripID} - {ride.VehicleType}
                  </h3>
                  <p className="text-sm text-gray-600">{ride.UserName}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ride.Status)}`}>
                  {ride.Status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Start Station</p>
                  <p className="font-semibold text-gray-900">{ride.StartStation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Station</p>
                  <p className="font-semibold text-gray-900">{ride.EndStation || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Time</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(ride.StartTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Time</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(ride.EndTime)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-2xl font-bold text-primary-600">${Number.isFinite(parseFloat(ride.Cost)) ? parseFloat(ride.Cost).toFixed(2) : '0.00'}</p>
                </div>
                {ride.Status === 'Completed' && (
                  <button
                    onClick={() => openReviewModal(ride)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                  >
                    Leave Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Review Trip #{reviewModal.tripId}
            </h3>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-3xl ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">Selected: {rating} star{rating !== 1 ? 's' : ''}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                rows="4"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                onClick={closeReviewModal}
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

export default MyRides;
