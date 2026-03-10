import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye, FileBadge, LogOut, X } from 'lucide-react';
import { format } from 'date-fns';
import { VerifiedBadge, TIER_OPTIONS } from '../components/ui/VerifiedBadge';
import { api } from '../utils/api';

interface UserStats {
    postsCount: number;
    nglCount: number;
    commentsCount: number;
    repliesCount: number;
}

interface IUser {
    _id: string;
    username: string;
    displayName: string;
    admissionNumber: string;
    classSection?: string;
    profileImageUrl?: string;
    verificationImageUrl?: string;
    verificationTier: number;
    createdAt: string;
    stats: UserStats;
}

export const AdminDashboard = () => {
    const [users, setUsers] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await api('/api/admin/users/stats');
            setUsers(data);
        } catch (err: any) {
            if (err.message.includes('401')) {
                navigate('/admin/login');
                return;
            }
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you absolutely sure you want to delete this user? This cannot be undone.')) return;

        try {
            await api(`/api/admin/users/${id}`, { method: 'DELETE' });
            setUsers(users.filter(u => u._id !== id));
        } catch (err: any) {
            alert(err.message || 'Failed to delete user');
        }
    };

    const handleSetTier = async (id: string, tier: number) => {
        try {
            const data = await api(`/api/admin/users/${id}/verify`, {
                method: 'PATCH',
                body: JSON.stringify({ tier })
            });
            setUsers(users.map(u => u._id === id ? { ...u, verificationTier: data.verificationTier } : u));
        } catch (err: any) {
            alert(err.message || 'Failed to update verification tier');
        }
    };

    const handleLogout = async () => {
        try {
            await api('/api/admin/logout', { method: 'POST' });
            navigate('/admin/login');
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading Admin Dashboard...</div>;

    const totalPosts = users.reduce((sum, u) => sum + u.stats.postsCount, 0);
    const totalNGL = users.reduce((sum, u) => sum + u.stats.nglCount, 0);
    const totalComments = users.reduce((sum, u) => sum + u.stats.commentsCount, 0);
    const totalReplies = users.reduce((sum, u) => sum + u.stats.repliesCount, 0);

    return (
        <div className="min-h-screen bg-bg-dark p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-secondary flex items-center gap-3">
                            <FileBadge className="text-accent-1" />
                            ADMIN DASHBOARD
                        </h1>
                        <p className="text-white/60 mt-1">Manage users, stats, and verification tiers</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-red-400 px-4 py-2 rounded-xl transition-colors shrink-0"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>

                {/* Platform Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'Total Users', value: users.length, color: 'text-secondary' },
                        { label: 'Total Posts', value: totalPosts, color: 'text-accent-1' },
                        { label: 'NGL Posts', value: totalNGL, color: 'text-purple-400' },
                        { label: 'Comments', value: totalComments, color: 'text-blue-400' },
                        { label: 'Replies', value: totalReplies, color: 'text-emerald-400' },
                    ].map((stat) => (
                        <div key={stat.label} className="glassmorphism rounded-xl p-4 border border-white/5 text-center">
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {error && <div className="bg-red-500/20 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

                <div className="glassmorphism rounded-2xl overflow-hidden border border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-white/80">
                            <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 font-medium">User</th>
                                    <th className="px-4 py-3 font-medium">Adm No.</th>
                                    <th className="px-4 py-3 font-medium">Class</th>
                                    <th className="px-4 py-3 font-medium text-center">Posts</th>
                                    <th className="px-4 py-3 font-medium text-center">NGL</th>
                                    <th className="px-4 py-3 font-medium text-center">Comments</th>
                                    <th className="px-4 py-3 font-medium text-center">Replies</th>
                                    <th className="px-4 py-3 font-medium">Joined</th>
                                    <th className="px-4 py-3 font-medium">Tick</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-8 text-center text-white/40">
                                            No users registered yet.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-white flex items-center gap-1 text-sm">
                                                    {user.displayName}
                                                    <VerifiedBadge tier={user.verificationTier} size={14} />
                                                </div>
                                                <div className="text-xs text-white/40">@{user.username}</div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-accent-2">
                                                {user.admissionNumber}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-white/60">
                                                {user.classSection || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm font-bold text-accent-1">
                                                {user.stats.postsCount}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm font-bold text-purple-400">
                                                {user.stats.nglCount}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm font-bold text-blue-400">
                                                {user.stats.commentsCount}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm font-bold text-emerald-400">
                                                {user.stats.repliesCount}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-white/50">
                                                {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={user.verificationTier}
                                                    onChange={(e) => handleSetTier(user._id, parseInt(e.target.value))}
                                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-secondary"
                                                    style={{ minWidth: 90 }}
                                                >
                                                    {TIER_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value} style={{ background: '#1a1a2e', color: opt.color !== 'transparent' ? opt.color : '#fff' }}>
                                                            {opt.value === 0 ? 'None' : `${opt.value}. ${opt.label}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {user.verificationImageUrl && (
                                                        <button
                                                            onClick={() => setSelectedImage(user.verificationImageUrl!)}
                                                            className="p-2 text-white/60 hover:text-accent-2 hover:bg-white/5 rounded-lg transition-colors"
                                                            title="View Verification"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="p-2 text-white/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Verification Image Modal */}
                {selectedImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                        <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white bg-white/10 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <img
                                src={selectedImage.startsWith('http') ? selectedImage : `${import.meta.env.VITE_API_URL || ''}${selectedImage}`}
                                alt="Verification Proof"
                                className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
                            />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

