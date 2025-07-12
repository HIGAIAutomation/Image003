import { useNavigate } from 'react-router-dom';

const NewPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">New Page</h2>
        <div className="flex flex-col gap-4">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
            onClick={() => alert('Button 1 clicked!')}
          >
            Button 1
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition"
            onClick={() => navigate('/')}
          >
            Go to Send Posters
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPage;