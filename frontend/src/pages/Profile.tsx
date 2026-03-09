import { useState, useEffect } from 'react';
import type React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { Loader2, Grid as GridIcon, Bookmark, X, Upload, Edit3, ClipboardList, Award } from 'lucide-react';
import { type Post } from '../components/post/PostCard';
import { YearbookCard } from '../components/profile/YearbookCard';
import { YearbookSignModal } from '../components/profile/YearbookSignModal';

interface UserProfile {
    _id: string;
    username: string;
    email?: string;
    displayName: string;
    bio?: string;
    classSection?: string;
    profileImageUrl?: string;
    babyPictureUrl?: string; // Add baby picture to UI model
    stats?: {
        postCount: number;
        nglCount: number;
    };
    slamBook?: {
        nickname?: string;
        favoriteMemory?: string;
        biggestRegret?: string;
        crushName?: string;
        dreamJob?: string;
    };
    achievements?: {
        badgeId: string;
        name: string;
        icon: string;
    }[];
}

export const Profile: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [yearbook, setYearbook] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'posts' | 'yearbook' | 'saved'>('posts');

    const [isYearbookSignOpen, setIsYearbookSignOpen] = useState(false);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editProfileImage, setEditProfileImage] = useState<File | null>(null);
    const [editProfileImagePreview, setEditProfileImagePreview] = useState<string>('');
    const [editBabyImage, setEditBabyImage] = useState<File | null>(null);
    const [editBabyImagePreview, setEditBabyImagePreview] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const [isSlamBookOpen, setIsSlamBookOpen] = useState(false);
    const [editSlamBook, setEditSlamBook] = useState({
        nickname: '',
        favoriteMemory: '',
        biggestRegret: '',
        crushName: '',
        dreamJob: ''
    });
    const [isSavingSlamBook, setIsSavingSlamBook] = useState(false);

    const targetUsername = username === 'me' ? currentUser?.username : username;
    const isOwnProfile = targetUsername === currentUser?.username;

    useEffect(() => {
        if (authLoading) return;
        if (!targetUsername) {
            if (!currentUser) navigate('/login');
            return;
        }
        fetchProfileAndPosts();
        fetchYearbook();
    }, [targetUsername, authLoading, currentUser, navigate]);

    const fetchProfileAndPosts = async () => {
        setLoading(true);
        setError('');
        try {
            const profileRes = await fetch(`/api/users/${targetUsername}`);
            if (!profileRes.ok) throw new Error('Failed to load profile');
            const profileData = await profileRes.json();
            setProfile(profileData);
            setEditUsername(profileData.username);
            setEditEmail(profileData.email || '');
            setEditProfileImagePreview(profileData.profileImageUrl || '');
            setEditBabyImagePreview(profileData.babyPictureUrl || '');
            if (profileData.slamBook) setEditSlamBook(profileData.slamBook);

            const postsRes = await fetch(`/api/posts/user/${profileData._id}`);
            if (postsRes.ok) {
                const postsData = await postsRes.json();
                setPosts(postsData.map((p: any) => ({
                    ...p,
                    author: p.authorId,
                    likesCount: p.likesCount || 0,
                    commentsCount: p.commentsCount || 0
                })));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchYearbook = async () => {
        try {
            const res = await fetch(`/api/yearbook/${targetUsername}`);
            if (res.ok) {
                const data = await res.json();
                setYearbook(data);
            }
        } catch {
            console.error('Failed to load yearbook');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setSaveError('');
        try {
            const formData = new FormData();
            formData.append('username', editUsername);
            formData.append('email', editEmail);
    if (editProfileImage) {
        formData.append('profileImage', editProfileImage);
    }

    // Save profile changes
    const res = await fetch('/api/users/profile', {
        method: 'PUT',
        body: formData
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update profile');
    }

    let updatedUser = await res.json();

    // Save baby picture if provided
    if (editBabyImage) {
        const babyFormData = new FormData();
        babyFormData.append('babyPicture', editBabyImage);
        const babyRes = await fetch('/api/trivia/upload-baby-pic', {
            method: 'POST',
            body: babyFormData
        });
        if (!babyRes.ok) {
            const data = await babyRes.json();
            throw new Error(data.message || 'Failed to upload baby picture');
        }
        const babyData = await babyRes.json();
        updatedUser = babyData.user;
    }

    setProfile(prev => prev ? { ...prev, username: updatedUser.username, email: updatedUser.email, profileImageUrl: updatedUser.profileImageUrl, babyPictureUrl: updatedUser.babyPictureUrl } : null);
    setIsSettingsOpen(false);

    if (updatedUser.username !== targetUsername) {
        navigate(`/u/${updatedUser.username}`);
    } else {
        window.location.reload();
    }
} catch (err: any) {
    setSaveError(err.message);
} finally {
    setIsSaving(false);
}
};

const handleSaveSlamBook = async () => {
    setIsSavingSlamBook(true);
    try {
        const res = await fetch('/api/users/slambook', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editSlamBook)
        });
        if (!res.ok) throw new Error('Failed to update slam book');
        const data = await res.json();
        setProfile(prev => prev ? { ...prev, slamBook: data } : null);
        setIsSlamBookOpen(false);
    } catch (err: any) {
        alert(err.message);
    } finally {
        setIsSavingSlamBook(false);
    }
};

if (loading) {
    return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-secondary" size={32} /></div>;
}

if (error || !profile) {
    return <div className="text-center mt-20 text-error font-bold">{error || 'Profile not found'}</div>;
}

return (
    <div className="w-full max-w-2xl mx-auto min-h-screen pb-20 pt-4 px-4 bg-bg-dark">
        <div className="flex flex-col items-center mb-8 mt-4">
            <div className="w-24 h-24 rounded-full bg-accent-1 overflow-hidden border-4 border-bg-dark shadow-xl mb-4">
                {profile.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-white text-3xl font-black">
                        {profile.displayName.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <h1 className="text-2xl font-black text-white">{profile.displayName}</h1>
            <p className="text-white/60 font-medium mb-2">@{profile.username} {profile.classSection ? `• ${profile.classSection}` : ''}</p>

            {profile.bio && <p className="text-white/80 text-center max-w-md mt-2">{profile.bio}</p>}

            <div className="flex gap-8 mt-6">
                <div className="text-center">
                    <span className="block font-black text-xl text-white">{profile.stats?.postCount ?? posts.length}</span>
                    <span className="text-xs text-white/60 uppercase tracking-widest font-bold">Posts</span>
                </div>
                <div className="text-center">
                    <span className="block font-black text-xl text-white">{profile.stats?.nglCount ?? 0}</span>
                    <span className="text-xs text-white/60 uppercase tracking-widest font-bold">NGLs</span>
                </div>
            </div>

            {/* Trophy Cabinet (Achievements) */}
            {profile.achievements && profile.achievements.length > 0 && (
                <div className="w-full mt-8 bg-black/30 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Award size={18} className="text-yellow-400" />
                        <h3 className="text-sm font-black text-white/90 uppercase tracking-widest">Trophy Cabinet</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {profile.achievements.map((badge) => (
                            <div key={badge.badgeId} className="group relative flex flex-col items-center justify-center p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors w-20 h-20 shadow-lg" title={badge.name}>
                                <span className="text-3xl filter hover:brightness-125 transition-all group-hover:scale-110">{badge.icon}</span>
                                <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider text-center mt-2 leading-tight line-clamp-2">{badge.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isOwnProfile ? (
                <div className="flex gap-3 mt-6">
                    <Button variant="secondary" onClick={() => setIsSettingsOpen(true)}>Edit Profile</Button>
                    <Button variant="ghost" className="border border-secondary/50 text-secondary" onClick={() => setIsSlamBookOpen(true)}>Edit Slam Book</Button>
                    <Button variant="ghost" className="border border-white/20" onClick={handleLogout}>Logout</Button>
                </div>
            ) : (
                <div className="flex gap-3 mt-6">
                    <Button
                        variant="primary"
                        className="flex items-center gap-2 group shadow-lg shadow-secondary/10"
                        onClick={() => setIsYearbookSignOpen(true)}
                    >
                        <Edit3 size={18} className="group-hover:rotate-12 transition-transform" /> Sign Yearbook
                    </Button>
                    <Button
                        variant="ghost"
                        className="border border-secondary/50 text-secondary"
                        onClick={() => navigate('/secret-crush')}
                    >
                        Send Love
                    </Button>
                </div>
            )}
        </div>

        {profile.slamBook && Object.values(profile.slamBook).some(val => val && val.trim().length > 0) && (
            <div className="mb-8 w-full">
                <h2 className="text-secondary font-black uppercase tracking-widest text-center mb-4 text-sm flex items-center justify-center gap-2">
                    <span className="w-8 h-[1px] bg-secondary/30"></span>
                    Digital Slam Book
                    <span className="w-8 h-[1px] bg-secondary/30"></span>
                </h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {profile.slamBook.nickname && (
                        <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                            <span className="block text-white/40 text-xs font-bold uppercase mb-1">Nickname</span>
                            <span className="text-white font-medium">{profile.slamBook.nickname}</span>
                        </div>
                    )}
                    {profile.slamBook.dreamJob && (
                        <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                            <span className="block text-white/40 text-xs font-bold uppercase mb-1">Dream Job</span>
                            <span className="text-white font-medium">{profile.slamBook.dreamJob}</span>
                        </div>
                    )}
                    {profile.slamBook.crushName && (
                        <div className="bg-black/30 border border-white/10 rounded-xl p-3 col-span-2 text-center">
                            <span className="block text-error/60 text-xs font-bold uppercase mb-1">Crush</span>
                            <span className="text-error font-bold">{profile.slamBook.crushName}</span>
                        </div>
                    )}
                    {profile.slamBook.favoriteMemory && (
                        <div className="bg-black/30 border border-white/10 rounded-xl p-3 col-span-2">
                            <span className="block text-white/40 text-xs font-bold uppercase mb-1">Favorite Memory</span>
                            <span className="text-white font-medium">{profile.slamBook.favoriteMemory}</span>
                        </div>
                    )}
                    {profile.slamBook.biggestRegret && (
                        <div className="bg-black/30 border border-white/10 rounded-xl p-3 col-span-2">
                            <span className="block text-white/40 text-xs font-bold uppercase mb-1">Biggest Regret</span>
                            <span className="text-white font-medium">{profile.slamBook.biggestRegret}</span>
                        </div>
                    )}
                </div>
            </div>
        )}
        {/* Grid Tabs */}
        <div className="flex border-t border-white/10 mb-1">
            <div
                className={`flex-1 py-3 text-center border-t-2 transition-all font-bold flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'posts' ? 'border-secondary text-white' : 'border-transparent text-white/50 hover:text-white'}`}
                onClick={() => setActiveTab('posts')}
            >
                <GridIcon size={18} /> Posts
            </div>
            <div
                className={`flex-1 py-3 text-center border-t-2 transition-all font-bold flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'yearbook' ? 'border-secondary text-white' : 'border-transparent text-white/50 hover:text-white'}`}
                onClick={() => setActiveTab('yearbook')}
            >
                <ClipboardList size={18} /> Yearbook
            </div>
            {isOwnProfile && (
                <div
                    className={`flex-1 py-3 text-center border-t-2 transition-all font-bold flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'saved' ? 'border-secondary text-white' : 'border-transparent text-white/50 hover:text-white'}`}
                    onClick={() => setActiveTab('saved')}
                >
                    <Bookmark size={18} /> Saved
                </div>
            )}
        </div>

        {/* Display Logic */}
        {activeTab === 'posts' && (
            <>
                <div className="grid grid-cols-3 gap-1">
                    {posts.map(post => (
                        <div
                            key={post._id}
                            className="aspect-square bg-white/5 cursor-pointer relative group overflow-hidden"
                            onClick={() => navigate(`/post/${post._id}`)}
                        >
                            {post.mediaUrl && (
                                post.mediaType === 'video' ? (
                                    <video src={post.mediaUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <img src={post.mediaUrl} alt="post" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                )
                            )}
                            {!post.mediaUrl && post.caption && (
                                <div className="p-2 w-full h-full flex flex-col items-center justify-center bg-primary text-center">
                                    <p className="text-xs text-secondary font-medium line-clamp-3">{post.caption}</p>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            </div>
                        </div>
                    ))}
                </div>
                {posts.length === 0 && (
                    <div className="text-center py-12 text-white/50 font-medium">
                        No posts from them yet. Aag lagana baaki hai.
                    </div>
                )}
            </>
        )}

        {activeTab === 'yearbook' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                {yearbook.map((entry: any) => (
                    <YearbookCard
                        key={entry._id}
                        author={entry.authorId}
                        message={entry.message}
                        color={entry.color}
                        createdAt={entry.createdAt}
                    />
                ))}
                {yearbook.length === 0 && (
                    <div className="col-span-full text-center py-12 text-white/50 font-medium bg-white/5 rounded-2xl border border-dashed border-white/10">
                        Wall is empty! Be the first to sign their digital yearbook.
                    </div>
                )}
            </div>
        )}

        {isSettingsOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-bg-card w-full max-w-md rounded-2xl p-6 relative border border-white/10 shadow-2xl">
                    <button
                        className="absolute top-4 right-4 text-white/50 hover:text-white"
                        onClick={() => setIsSettingsOpen(false)}
                    >
                        <X size={24} />
                    </button>

                    <h2 className="text-xl text-white font-bold mb-6">Account Settings</h2>

                    {saveError && (
                        <div className="bg-error/20 text-error p-3 rounded-xl mb-4 text-sm font-medium">
                            {saveError}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-around items-start mb-2">
                            {/* Profile Picture Upload */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent-1 overflow-hidden border-2 border-white/10 relative group">
                                    {editProfileImagePreview ? (
                                        <img src={editProfileImagePreview} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white">
                                            {profile.displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <label className="absolute inset-0 bg-black/50 cursor-pointer flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload size={20} className="text-white mb-1" />
                                        <span className="text-[10px] text-white font-bold">PROFILE</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setEditProfileImage(e.target.files[0]);
                                                    setEditProfileImagePreview(URL.createObjectURL(e.target.files[0]));
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <span className="text-xs text-white/60 font-medium">Profile Pic</span>
                            </div>

                            {/* Baby Picture Upload */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-secondary/20 overflow-hidden border-2 border-secondary/50 relative group shadow-lg shadow-secondary/10">
                                    {editBabyImagePreview ? (
                                        <img src={editBabyImagePreview} alt="baby preview" className="w-full h-full object-cover filter sepia-[.3]" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-secondary/50 bg-secondary/5">
                                            <span className="text-2xl mb-1">👶</span>
                                            <span className="text-[10px] font-bold text-center leading-tight">Add<br />Baby Pic</span>
                                        </div>
                                    )}
                                    <label className="absolute inset-0 bg-secondary/80 cursor-pointer flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload size={20} className="text-primary mb-1" />
                                        <span className="text-[10px] text-primary font-black">UPLOAD</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setEditBabyImage(e.target.files[0]);
                                                    setEditBabyImagePreview(URL.createObjectURL(e.target.files[0]));
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <span className="text-xs text-secondary font-bold">Baby Trivia 🎲</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Username</label>
                            <input
                                type="text"
                                className="w-full bg-black/20 text-white rounded-xl px-4 py-3 border border-white/10 focus:border-secondary focus:outline-none"
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Email Address</label>
                            <input
                                type="email"
                                className="w-full bg-black/20 text-white rounded-xl px-4 py-3 border border-white/10 focus:border-secondary focus:outline-none"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                            />
                        </div>

                        <Button
                            variant="primary"
                            className="w-full mt-4"
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {isSlamBookOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-bg-card w-full max-w-md rounded-2xl p-6 relative border border-secondary/30 shadow-[0_0_30px_rgba(255,200,87,0.15)] flex flex-col max-h-[90vh]">
                    <button
                        className="absolute top-4 right-4 text-white/50 hover:text-white z-10"
                        onClick={() => setIsSlamBookOpen(false)}
                    >
                        <X size={24} />
                    </button>

                    <h2 className="text-xl text-secondary font-black mb-6 uppercase tracking-widest text-center">Digital Slam Book</h2>

                    <div className="flex flex-col gap-4 overflow-y-auto pb-4 custom-scrollbar pr-2">
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Your Nickname</label>
                            <input
                                type="text"
                                placeholder="What do friends call you?"
                                className="w-full bg-black/20 text-white rounded-xl px-4 py-3 border border-white/10 focus:border-secondary focus:outline-none"
                                value={editSlamBook.nickname}
                                onChange={(e) => setEditSlamBook({ ...editSlamBook, nickname: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Dream Job</label>
                            <input
                                type="text"
                                placeholder="CEO, Artist, Batman?"
                                className="w-full bg-black/20 text-white rounded-xl px-4 py-3 border border-white/10 focus:border-secondary focus:outline-none"
                                value={editSlamBook.dreamJob}
                                onChange={(e) => setEditSlamBook({ ...editSlamBook, dreamJob: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-error/80 mb-2 uppercase">Secret Crush Name 🤫</label>
                            <input
                                type="text"
                                placeholder="Spill the tea..."
                                className="w-full bg-error/10 text-error rounded-xl px-4 py-3 border border-error/30 focus:border-error focus:outline-none placeholder:text-error/30"
                                value={editSlamBook.crushName}
                                onChange={(e) => setEditSlamBook({ ...editSlamBook, crushName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Favorite Memory</label>
                            <textarea
                                className="w-full bg-black/20 text-white rounded-xl px-4 py-3 border border-white/10 focus:border-secondary focus:outline-none h-24 resize-none"
                                placeholder="That one trip to..."
                                value={editSlamBook.favoriteMemory}
                                onChange={(e) => setEditSlamBook({ ...editSlamBook, favoriteMemory: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Biggest Regret</label>
                            <textarea
                                className="w-full bg-black/20 text-white rounded-xl px-4 py-3 border border-white/10 focus:border-secondary focus:outline-none h-24 resize-none"
                                placeholder="I shouldn't have..."
                                value={editSlamBook.biggestRegret}
                                onChange={(e) => setEditSlamBook({ ...editSlamBook, biggestRegret: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full mt-4 flex-shrink-0"
                        onClick={handleSaveSlamBook}
                        disabled={isSavingSlamBook}
                    >
                        {isSavingSlamBook ? <Loader2 className="animate-spin mx-auto" /> : 'Save Slam Book'}
                    </Button>
                </div>
            </div>
        )}
        {/* Modal Components */}
        {isYearbookSignOpen && (
            <YearbookSignModal
                targetUsername={targetUsername || ''}
                onClose={() => setIsYearbookSignOpen(false)}
                onSuccess={(newEntry) => {
                    setYearbook(prev => [newEntry, ...prev]);
                    setActiveTab('yearbook');
                }}
            />
        )}
    </div>
);
};
