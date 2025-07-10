// File: src/App.tsx
import { useState } from 'react';
import MemberRegistration from './components/MemberRegistration';
import SendPosters from './components/SendPosters';

const App = () => {
  const [selectedAction, setSelectedAction] = useState('');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-gray-100">
      <h1 className="text-3xl font-bold text-center">Automation Project</h1>
      <div className="flex gap-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          onClick={() => setSelectedAction('register')}
        >
          New Member Registration
        </button>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
          onClick={() => setSelectedAction('send')}
        >
          Send Posters
        </button>
      </div>
      <div className="w-full max-w-2xl">
        {selectedAction === 'register' && <MemberRegistration />}
        {selectedAction === 'send' && <SendPosters />}
      </div>
    </div>
  );
};

export default App;
