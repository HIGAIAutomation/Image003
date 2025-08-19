import { useState } from 'react';
import { Spin, message } from 'antd';
import { AiOutlineCloudUpload } from 'react-icons/ai';

const SendPosters = () => {
  const [designation, setDesignation] = useState<string>('');
  const [template, setTemplate] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!template || !designation) {
      message.warning('⚠️ Please select both a template and a designation.');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('template', template);
      data.append('designation', designation === 'Both'
        ? ['Health insurance advisor', 'Wealth Manager'].join(',')
        : designation);

      const res = await fetch('http://localhost:3001/send-posters', {
        method: 'POST',
        body: data,
      });

      const result = await res.text();
      if (res.ok) {
        message.success(result);
        setTemplate(null);
        setDesignation('');
      } else {
        message.error(result || 'Failed to send posters.');
      }
    } catch (error) {
      console.error('Error sending posters:', error);
      message.error('Something went wrong while sending posters.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Send Posters
        </h2>

        <div className="space-y-5">
          <label className="flex items-center gap-2 text-blue-600 font-medium cursor-pointer">
            <AiOutlineCloudUpload className="text-xl" />
            Upload Template
            <input
              type="file"
              accept=".jpg,.jpeg"
              onChange={(e) => setTemplate(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          {template && (
            <span className="text-sm text-gray-500 truncate">
              {template.name}
            </span>
          )}

          <select
            value={designation}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            onChange={(e) => setDesignation(e.target.value)}
          >
            <option value="">Select Designation</option>
            <option value="Health insurance advisor">Health insurance advisor</option>
            <option value="Wealth Manager">Wealth Manager</option>
            <option value="Both">Both</option>
          </select>

          <div className="flex justify-center pt-4">
            {loading ? (
              <Spin />
            ) : (
              <button
                onClick={handleSubmit}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition"
                disabled={loading}
              >
                Send Posters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendPosters;
