// File: src/components/SendPosters.tsx
import  { useState } from 'react';

const SendPosters = () => {
  const [designation, setDesignation] = useState('Health insurance advisor');
  const [template, setTemplate] = useState<File | null>(null);

  const handleSubmit = async () => {
    const data = new FormData();
    if (template) data.append('template', template);
    data.append('designation', designation);

    const res = await fetch('http://localhost:3000/send-posters', {
      method: 'POST',
      body: data,
    });

    alert(await res.text());
  };

  return (
    <div className="bg-white shadow p-6 rounded">
      <h2 className="text-xl font-bold mb-4">Send Posters</h2>
      <input type="file" accept=".jpg,.jpeg" className="w-full p-2 border mb-2" onChange={e => setTemplate(e.target.files?.[0] || null)} />
      <select value={designation} className="w-full p-2 border mb-4" onChange={e => setDesignation(e.target.value)}>
        <option>Health insurance advisor</option>
        <option>Wealth Manager</option>
      </select>
      <button onClick={handleSubmit} className="bg-green-500 text-white px-4 py-2 rounded">Send</button>
    </div>
  );
};

export default SendPosters;
