import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, getMembershipPlans, purchaseMembership, addToWallet, login } from '../utils/api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Account, 2: Plan & Topup
  const navigate = useNavigate();

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await getMembershipPlans();
        setPlans(data);
      } catch (e) {
        console.error('Failed to load plans:', e);
      }
    };
    loadPlans();
  }, []);

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStep(2); // Move to plan selection
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      const topup = parseFloat(topupAmount);
      if (!topupAmount || topup <= 0) {
        setError('Please enter a valid top-up amount');
        setLoading(false);
        return;
      }

      if (!selectedPlanId) {
        setError('Please select a membership plan');
        setLoading(false);
        return;
      }

      // Get the selected plan cost
      const selectedPlan = plans.find(p => p.PlanID === parseInt(selectedPlanId));
      if (!selectedPlan) {
        setError('Invalid plan selected');
        setLoading(false);
        return;
      }

      if (topup < selectedPlan.Cost) {
        setError(`Top-up amount must be at least ₹${selectedPlan.Cost} to purchase the selected plan`);
        setLoading(false);
        return;
      }

      // 1. Register the user
      await register(name, email, password);

      // 2. Login to get user details
      const loginResponse = await login(email, password);
      const newUser = loginResponse.user;

      // 3. Add funds to wallet
      await addToWallet(newUser.UserID, topup);

      // 4. Purchase membership plan
      await purchaseMembership(newUser.UserID, selectedPlanId);

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              ⚡ Create Account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Step 1: Account Details
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAccountSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
              >
                Next: Select Plan
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-accent-600 hover:text-accent-500"
              >
                Already have an account? Sign in here
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ⚡ Select Plan & Add Funds
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Step 2: Choose your membership plan and initial wallet balance
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleCompleteRegistration}>
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
              Registration successful! Redirecting to login...
            </div>
          )}

          {/* Wallet Top-up */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label htmlFor="topup" className="block text-sm font-medium text-gray-700 mb-2">
              Initial Wallet Top-up (₹)
            </label>
            <input
              id="topup"
              name="topup"
              type="number"
              min="1"
              step="0.01"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter amount (e.g., 500)"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Add funds to your wallet. Must be at least the cost of your selected plan.
            </p>
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Membership Plan
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.PlanID}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPlanId === plan.PlanID.toString()
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setSelectedPlanId(plan.PlanID.toString())}
                >
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="radio"
                      id={`plan-${plan.PlanID}`}
                      name="plan"
                      value={plan.PlanID}
                      checked={selectedPlanId === plan.PlanID.toString()}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <h3 className="text-lg font-bold text-gray-900">{plan.PlanName}</h3>
                    <span className="text-lg font-semibold text-gray-900">₹{Number(plan.Cost).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Duration: {plan.DurationMonths} month(s)
                  </p>
                  <p className="text-xs text-gray-500">{plan.Benefits}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading || success}
              className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-accent-600 hover:text-accent-500"
            >
              Already have an account? Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
