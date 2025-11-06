import React, { useEffect, useState } from 'react';
import { getMembershipPlans, purchaseMembership, addToWallet, getUserProfile } from '../utils/api';

const Membership = ({ user, onUserUpdate, navigateTo }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMembershipPlans();
        setPlans(data);
      } catch (e) {
        setError('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    try {
      await addToWallet(user.UserID, amount);
      const updated = await getUserProfile(user.UserID);
      onUserUpdate && onUserUpdate(updated);
      setTopupAmount('');
      setSuccess(`Added ₹${amount.toFixed(2)} to wallet`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) {
      setError(e.response?.data?.error || 'Top-up failed');
    }
  };

  const handlePurchase = async (planId, planCost) => {
    if (parseFloat(user.WalletBalance) < parseFloat(planCost)) {
      setError('Insufficient wallet balance for this plan');
      return;
    }
    setPurchasing(true);
    try {
      await purchaseMembership(user.UserID, planId);
      const updated = await getUserProfile(user.UserID);
      onUserUpdate && onUserUpdate(updated);
      setSuccess('Membership purchased successfully');
      setTimeout(() => setSuccess(''), 2500);
      if (navigateTo) navigateTo('/dashboard');
    } catch (e) {
      setError(e.response?.data?.error || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center text-gray-300">Loading membership...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Choose your Membership</h1>
        <p className="mt-2 text-gray-300">Top up your wallet and select a plan to unlock discounts.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-600 text-red-200 px-4 py-3 rounded">{error}</div>
      )}
      {success && (
        <div className="mb-4 bg-green-900/30 border border-green-600 text-green-200 px-4 py-3 rounded">{success}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Wallet</h2>
          <p className="text-gray-300 mb-2">Current Balance</p>
          <p className="text-3xl font-bold text-accent-400 mb-4">₹{Number(user.WalletBalance).toFixed(2)}</p>
          <div className="flex space-x-3">
            <input
              type="number"
              min="1"
              step="0.01"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 px-3 py-2 rounded-md border border-white/10 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-accent-500 focus:border-accent-500"
            />
            <button
              onClick={handleTopup}
              className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-md"
            >
              Top up
            </button>
          </div>
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div key={plan.PlanID} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900">{plan.PlanName}</h3>
                <span className="text-lg font-semibold text-gray-900">₹{Number(plan.Cost).toFixed(2)}</span>
              </div>
              <p className="text-gray-600 mb-2">Duration: {plan.DurationMonths} month(s)</p>
              <p className="text-gray-600 text-sm mb-4">{plan.Benefits}</p>
              <button
                onClick={() => handlePurchase(plan.PlanID, plan.Cost)}
                disabled={purchasing}
                className="w-full bg-accent-600 hover:bg-accent-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md"
              >
                {purchasing ? 'Processing...' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Membership;
