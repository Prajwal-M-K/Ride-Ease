import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile, addToWallet } from '../utils/api';

const Profile = ({ user, onUserUpdate }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [walletAmount, setWalletAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user.UserID]);

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile(user.UserID);
      setProfile(data);
      setName(data.Name);
      setError('');
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoadingUpdate(true);
    setError('');

    try {
      await updateUserProfile(user.UserID, name, password || null);
      setSuccess('Profile updated successfully');
      setEditing(false);
      setPassword('');
      setConfirmPassword('');
      fetchProfile();
      if (onUserUpdate) {
        // Refresh user data in parent
        const updatedProfile = await getUserProfile(user.UserID);
        onUserUpdate(updatedProfile);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleAddToWallet = async () => {
    const amount = parseFloat(walletAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoadingWallet(true);
    setError('');

    try {
      await addToWallet(user.UserID, amount);
      setSuccess(`Successfully added $${amount.toFixed(2)} to wallet`);
      setWalletAmount('');
      fetchProfile();
      if (onUserUpdate) {
        const updatedProfile = await getUserProfile(user.UserID);
        onUserUpdate(updatedProfile);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add funds');
    } finally {
      setLoadingWallet(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">Manage your account settings</p>
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

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Account Information</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={profile?.Email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password (optional)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {password && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}
            <div className="flex space-x-3">
              <button
                onClick={handleUpdateProfile}
                disabled={loadingUpdate}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
              >
                {loadingUpdate ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(profile?.Name || '');
                  setPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-gray-900">{profile?.Name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{profile?.Email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Member Since</label>
              <p className="mt-1 text-gray-900">
                {profile?.JoinDate ? new Date(profile.JoinDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Wallet Balance</h2>
        <div className="mb-4">
          <p className="text-3xl font-bold text-primary-600">
            ${Number.isFinite(parseFloat(profile?.WalletBalance)) ? parseFloat(profile.WalletBalance).toFixed(2) : '0.00'}
          </p>
        </div>
        <div className="flex space-x-3">
          <input
            type="number"
            min="1"
            step="0.01"
            value={walletAmount}
            onChange={(e) => setWalletAmount(e.target.value)}
            placeholder="Enter amount"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={handleAddToWallet}
            disabled={loadingWallet || !walletAmount}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium"
          >
            {loadingWallet ? 'Adding...' : 'Add Funds'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
