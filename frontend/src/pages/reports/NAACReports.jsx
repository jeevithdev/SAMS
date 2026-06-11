import { useState } from 'react';
import { reportsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { DocumentArrowDownIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

export default function NAACReports() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    { id: 'activities', name: 'Student Activities Report', desc: 'All verified activities with student details' },
    { id: 'attendance', name: 'Attendance Summary', desc: 'Department-wise attendance statistics' },
    { id: 'marks', name: 'Academic Performance', desc: 'Consolidated marks and grade distribution' },
    { id: 'defaulters', name: 'Attendance Defaulters', desc: 'Students below 75% attendance' },
    { id: 'comprehensive', name: 'NAAC Comprehensive', desc: 'Complete report for NAAC/AICTE submission' },
  ];

  const downloadReport = async (type) => {
    setLoading(true);
    try {
      const { data } = await reportsAPI.generate({
        type,
        ...dateRange,
        format: 'csv'
      });
      
      // Convert to CSV and download
      if (data.data && Array.isArray(data.data)) {
        const rows = data.data;
        if (rows.length === 0) {
          toast.error('No data available for this report');
          return;
        }
        const headers = Object.keys(rows[0]);
        const csv = [
          headers.join(','),
          ...rows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${type} report downloaded`);
      } else {
        toast.success('Report generated');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary-100 rounded-xl">
          <BuildingOffice2Icon className="h-8 w-8 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NAAC / AICTE Reports</h1>
          <p className="text-sm text-gray-600">Generate accreditation-ready reports</p>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Period</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => (
          <div key={report.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">{report.desc}</p>
            <button
              onClick={() => downloadReport(report.id)}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              {loading ? 'Generating...' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
        <h3 className="font-semibold text-primary-700 mb-2">Report Format</h3>
        <ul className="text-sm text-primary-600 space-y-1">
          <li>• All reports are generated in CSV format for easy import into Excel</li>
          <li>• Data is filtered based on the selected date range</li>
          <li>• Comprehensive report includes all modules: Activities, Attendance, and Marks</li>
          <li>• Reports follow NAAC/AICTE data requirements format</li>
        </ul>
      </div>
    </div>
  );
}
