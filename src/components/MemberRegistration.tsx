// File: src/components/MemberRegistration.tsx
import  { useState } from 'react';

const MemberRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    designation: 'Health insurance advisor',
    photo: null,
  });

  const handleChange = (e: any) => {
    const { name, value, files } = e.target;
    if (name === 'photo') {
      setFormData({ ...formData, photo: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async () => {
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value as string | Blob));

    const res = await fetch('http://localhost:3000/register', {
      method: 'POST',
      body: data,
    });

    alert(await res.text());
  };

  return (
    <div className="bg-white shadow p-6 rounded">
      <h2 className="text-xl font-bold mb-4">New Member Registration</h2>
      <div className="space-y-4">
        <input name="name" type="text" placeholder="Name" className="w-full p-2 border" onChange={handleChange} />
        <input name="phone" type="text" placeholder="Phone Number" className="w-full p-2 border" onChange={handleChange} />
        <select name="designation" className="w-full p-2 border" onChange={handleChange}>
          <option>Health insurance advisor</option>
          <option>Wealth Manager</option>
        </select>
        <input name="email" type="email" placeholder="Email" className="w-full p-2 border" onChange={handleChange} />

        <input name="photo" type="file" accept=".jpg,.jpeg" className="w-full p-2 border" onChange={handleChange} />
        <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">Upload</button>
      </div>
    </div>
  );
};

export default MemberRegistration;
