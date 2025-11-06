import React, { useEffect, useState, useCallback } from 'react';
import { getLogs } from '../utils/api';

const Logs = ({ user }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [limit, setLimit] = useState(100);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLogs(user?.Role, { table: tableFilter || null, limit });
      setLogs(data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [user, tableFilter, limit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  if (user?.Role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          Admin access required
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-gray-600">View recent system changes</p>
        </div>
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Filter by table (e.g., Trips)"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="number"
            min="1"
            max="500"
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Math.min(500, parseInt(e.target.value) || 100)))}
            className="w-24 px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={loadLogs}
            className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-md font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-gray-500">No logs available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RecordID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ChangedBy</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.LogID}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{new Date(log.ChangeTimestamp).toLocaleString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{log.TableName}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{log.OperationType}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{log.RecordID ?? '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{log.ChangedBy ?? '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700 max-w-3xl break-words">{log.ChangeDescription}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;


