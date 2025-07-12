import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  photoUrl?: string;
};

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();

    const interval = setInterval(() => {
      const authData = localStorage.getItem('adminAuth');
      if (authData) {
        const { loginTime, expiresIn } = JSON.parse(authData);
        if (Date.now() - loginTime > expiresIn) handleLogout();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin-login');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      await fetch(`http://localhost:3001/api/users/${id}`, {
        method: 'DELETE',
      });
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingUser) return;
    setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`http://localhost:3001/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Update failed');

      setUsers(users.map(u => u.id === editingUser.id ? data.user : u));
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSearch = () => {
    const foundUser = users.find(u => u.email === searchEmail.trim());
    if (foundUser) {
      handleEdit(foundUser);
    } else {
      setError('User not found with this email');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 px-4 py-2 mb-4 rounded">
            {error}
            <button onClick={() => setError(null)} className="float-right font-bold">&times;</button>
          </div>
        )}

        {/* Search User by Email */}
        <div className="mb-6 flex gap-4">
          <input
            type="email"
            placeholder="Enter email to search"
            value={searchEmail}
            onChange={e => setSearchEmail(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        {/* Edit User Form */}
        {editingUser && (
          <form onSubmit={handleUpdate} className="bg-white shadow p-6 rounded mb-6">
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                name="name"
                value={editingUser.name}
                onChange={handleEditChange}
                placeholder="Name"
                className="p-2 border rounded"
                required
              />
              <input
                type="email"
                name="email"
                value={editingUser.email}
                className="p-2 border rounded bg-gray-100 cursor-not-allowed"
                disabled
              />
              <input
                type="tel"
                name="phone"
                value={editingUser.phone}
                onChange={handleEditChange}
                placeholder="Phone"
                className="p-2 border rounded"
                required
              />
              <select
                name="designation"
                value={editingUser.designation}
                onChange={handleEditChange}
                className="p-2 border rounded"
                required
              >
                <option value="Health insurance advisor">Health Insurance Advisor</option>
                <option value="Wealth Manager">Wealth Manager</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* User List */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {loading ? (
            <div className="text-center text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-500">No users found.</div>
          ) : (
            users.map(user => (
              <div
                key={user.id}
                className="bg-white shadow rounded p-4 flex items-center gap-4"
              >
                {user.photoUrl && (
                  <img
                    src={`http://localhost:3001/${user.photoUrl}`}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover border"
                  />
                )}
                <div className="flex-1">
                  <div className="font-bold text-lg">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-sm text-gray-500">{user.phone}</div>
                  <div className="text-sm text-blue-700">{user.designation}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
