import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router";
import { LogOutIcon, Users, MessageSquare, Group, Image, Trash2, Edit2, X } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminPage() {
  const { authUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser || authUser.role !== 'admin') {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [ov, us] = await Promise.all([
          axiosInstance.get('/api/admin/overview'),
          axiosInstance.get('/api/admin/users')
        ]);
        setOverview(ov.data);
        setUsers(us.data);
      } catch {}
      setLoading(false);
    })();
  }, [authUser, navigate]);

  const setBan = async (id, banned) => {
    try {
      await axiosInstance.patch(`/api/admin/users/${id}`, { isBanned: banned });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isBanned: banned } : u));
    } catch {}
  };

  if (!authUser) {
    // Redirect to admin login
    navigate('/admin/login');
    return null;
  }

  if (authUser.role !== 'admin') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-base-300">
        <div className="bg-base-100 p-8 rounded-xl border shadow-xl space-y-4">
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-base-content/60">You don't have admin privileges to access this page.</p>
          <button className="btn" onClick={() => navigate('/')}>
            Back to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-6 bg-base-300">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-base-content/60 mt-1">Logged in as: {authUser?.email}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={()=>navigate('/')}>Back to App</button>
            <button className="btn btn-error gap-2" onClick={()=>{ logout(); navigate('/admin/login'); }}>
              <LogOutIcon className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card title="Users" value={overview.users} />
            <Card title="Groups" value={overview.groups} />
            <Card title="Messages" value={overview.messages} />
            <Card title="Active Statuses" value={overview.activeStatuses} />
          </div>
        )}

        <div className="bg-base-100 rounded-xl border p-4">
          <div className="text-lg font-medium mb-2">Users</div>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td className="flex items-center gap-2"><img src={u.profilePic || '/avatar.png'} alt="" className="w-6 h-6 rounded-full" /> {u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.isBanned ? 'Banned' : 'Active'}</td>
                    <td className="text-right">
                      {u.isBanned ? (
                        <button className="btn btn-xs" onClick={()=>setBan(u._id, false)}>Unban</button>
                      ) : (
                        <button className="btn btn-xs btn-error" onClick={()=>setBan(u._id, true)}>Ban</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-base-100 rounded-xl border p-4">
      <div className="text-sm text-base-content/60">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
