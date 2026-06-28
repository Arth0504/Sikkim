import { useEffect, useState } from "react";
import { User, Mail, Shield, Trash2, Phone } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    API.get("/admin/users")
      .then((res) => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  const deleteUser = async (id) => {
    if (window.confirm("Delete this user permanently?")) {
      try {
        await API.delete(`/admin/users/${id}`);
        showSuccess("User Deleted Successfully");
        loadUsers();
      } catch (err) {
        showError("Delete Operation Failed");
      }
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest">Loading Users...</div>;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Registered <span className="text-teal-600">Users</span></h1>
        <p className="text-slate-500 font-medium">Manage user accounts and platform access levels.</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">User Identity</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Email Address</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200">
                        {u.profilePicture ? (
                          <img src={u.profilePicture} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={24} />
                        )}
                      </div>
                      <p className="font-bold text-slate-900 leading-tight">{u.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <span className="w-4 h-4 text-slate-300"><Mail size={16} /></span>
                        {u.email}
                      </div>
                      {u.mobileNumber && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <span className="w-4 h-4 text-slate-300"><Phone size={14} /></span>
                          <span>+91 {u.mobileNumber}</span>
                          {u.mobileVerified && (
                            <span className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Verified</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5 items-start">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        <Shield size={12} className={u.role === 'admin' ? "text-teal-500" : "text-blue-500"} />
                        {u.role}
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border ${
                        u.provider === 'google' 
                          ? 'bg-rose-50 border-rose-100 text-rose-600' 
                          : 'bg-teal-50 border-teal-100 text-teal-600'
                      }`}>
                        {u.provider || 'local'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => deleteUser(u._id)}
                      className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm inline-flex items-center justify-center"
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <User size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
