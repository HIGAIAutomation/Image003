import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Home</h2>
        <div className="flex flex-col gap-4">
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition"
            onClick={() => navigate('/send-poster')}
          >
            Send Poster
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
            onClick={() => navigate('/register')}
          >
            Register Member
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;