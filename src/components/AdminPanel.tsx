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
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    const checkExpiration = setInterval(() => {
      const authData = localStorage.getItem('adminAuth');
      if (authData) {
        const { loginTime, expiresIn } = JSON.parse(authData);
        if (Date.now() - loginTime > expiresIn) handleLogout();
      }
    }, 60000);
    return () => clearInterval(checkExpiration);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin-login');
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      setUsers(users.filter(user => user.id !== id));
    } catch (error) {
      setError('Failed to delete user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`http://localhost:3001/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          phone: editingUser.phone,
          designation: editingUser.designation,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Update failed');

      setUsers(users.map(u => u.id === editingUser.id ? data.user : u));
      setEditingUser(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingUser) return;
    setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Loading users...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 mt-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{editingUser ? 'Edit User' : 'Admin Panel'}</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 border border-red-400 px-4 py-2 rounded mb-4 relative">
            {error}
            <button
              onClick={() => setError(null)}
              className="absolute top-0 right-0 px-4 py-2 text-xl"
            >
              &times;
            </button>
          </div>
        )}

        {editingUser && (
          <form onSubmit={handleUpdate} className="bg-white shadow p-6 rounded-xl mb-6">
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                name="name"
                value={editingUser.name}
                onChange={handleEditChange}
                className="p-2 border rounded"
                placeholder="Name"
                required
              />
              <input
                type="email"
                name="email"
                value={editingUser.email}
                onChange={handleEditChange}
                className="p-2 border rounded"
                placeholder="Email"
                required
              />
              <input
                type="tel"
                name="phone"
                value={editingUser.phone}
                onChange={handleEditChange}
                className="p-2 border rounded"
                placeholder="Phone"
                required
              />
              <select
                name="designation"
                value={editingUser.designation}
                onChange={handleEditChange}
                className="p-2 border rounded"
              >
                <option value="Health insurance advisor">Health Insurance Advisor</option>
                <option value="Wealth Manager">Wealth Manager</option>
              </select>

              <div className="flex gap-2 justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save
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

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {users.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No users found.</div>
          ) : (
            users.map(user => (
              <div
                key={user.id}
                className="bg-white shadow rounded-xl p-4 flex items-center gap-4"
              >
                {user.photoUrl && (
                  <img
                    src={`http://localhost:3001${user.photoUrl}`}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover border"
                  />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-lg">{user.name}</div>
                  <div className="text-gray-500">{user.email}</div>
                  <div className="text-gray-500">{user.phone}</div>
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
