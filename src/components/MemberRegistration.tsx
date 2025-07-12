import React, { useState } from 'react';
import { Spin, message } from 'antd';
import { AiOutlineCloudUpload } from 'react-icons/ai';

const MemberRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    designation: [] as string[],
    photo: null as File | null,
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = e.target as any;

    if (name === 'photo') {
      setFormData({ ...formData, photo: files[0] });
    } else if (name === 'designation') {
      if (value === 'Both') {
        setFormData({
          ...formData,
          designation: ['Health insurance advisor', 'Wealth Manager'],
        });
      } else {
        setFormData({ ...formData, designation: [value] });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.photo) {
        message.warning('⚠️ Please select a photo.');
        return;
      }

      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('phone', formData.phone.trim());
      data.append('email', formData.email.trim());
      data.append('designation', formData.designation.join(','));
      data.append('photo', formData.photo);

      const res = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        body: data,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to register member');
      }

      message.success('Registration successful!');
      setFormData({
        name: '',
        phone: '',
        email: '',
        designation: [],
        photo: null,
      });
    } catch (err) {
      console.error('Registration error:', err);
      message.error(err instanceof Error ? err.message : '❌ Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-1">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Register New Member
        </h2>

        <div className="space-y-5">
          <input
            name="name"
            type="text"
            value={formData.name}
            placeholder="Full Name"
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="phone"
            type="text"
            value={formData.phone}
            placeholder="Phone Number"
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="email"
            type="email"
            value={formData.email}
            placeholder="Email"
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            name="designation"
            value={
              formData.designation.length === 2
                ? 'Both'
                : formData.designation[0] || ''
            }
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Designation</option>
            <option value="Health insurance advisor">
              Health insurance advisor
            </option>
            <option value="Wealth Manager">Wealth Manager</option>
            <option value="Both">Both</option>
          </select>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-blue-600 font-medium">
              <AiOutlineCloudUpload className="text-xl" />
              Upload Photo
              <input
                name="photo"
                type="file"
                accept=".jpg,.jpeg"
                onChange={handleInputChange}
                className="hidden"
              />
            </label>
            {formData.photo && (
              <span className="text-sm text-gray-500 truncate">
                {formData.photo.name}
              </span>
            )}
          </div>

          <div className="flex justify-center mt-6">
            {loading ? (
              <Spin />
            ) : (
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Submit Registration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberRegistration;
