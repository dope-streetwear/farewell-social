import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { TopNav } from './components/navigation/TopNav';
import { BottomNav } from './components/navigation/BottomNav';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Feed } from './pages/Feed';
import { CreatePost } from './pages/CreatePost';
import { Profile } from './pages/Profile';
import { SavedPosts } from './pages/SavedPosts';
import { NglFeed } from './pages/NglFeed';
import { CreateNglPost } from './pages/CreateNglPost';
import { PostDetail } from './pages/PostDetail';
import { VibeCheck } from './pages/VibeCheck';
import { AdminAuth } from './pages/AdminAuth';
import { AdminDashboard } from './pages/AdminDashboard';
import { Lounge } from './pages/Lounge';
import { Notifications } from './pages/Notifications';
import { Stories } from './pages/Stories';
import { Wrapped } from './pages/Wrapped';
import { SecretCrush } from './pages/SecretCrush';
import BabyTrivia from './pages/BabyTrivia';
import ConfessionRoulette from './pages/ConfessionRoulette';
import FarewellLetters from './pages/FarewellLetters';
import Playlist from './pages/Playlist';
import Awards from './pages/Awards';
import { NotificationSplash } from './components/notifications/NotificationSplash';

function App() {
    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
            <AuthProvider>
                <SocketProvider>
                    <Router>
                        <div className="flex flex-col min-h-screen">
                            <NotificationSplash />
                            <TopNav />
                            <main className="flex-1 w-full bg-bg-dark pt-0 md:pt-16 pb-16 md:pb-0">
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/signup" element={<Signup />} />
                                    <Route path="/feed" element={<Feed />} />
                                    <Route path="/create" element={<CreatePost />} />
                                    <Route path="/post/:id" element={<PostDetail />} />
                                    <Route path="/u/:username" element={<Profile />} />
                                    <Route path="/saved" element={<SavedPosts />} />
                                    <Route path="/ngl" element={<NglFeed />} />
                                    <Route path="/vibes" element={<VibeCheck />} />
                                    <Route path="/ngl/create" element={<CreateNglPost />} />
                                    <Route path="/admin/login" element={<AdminAuth />} />
                                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                                    <Route path="/lounge" element={<Lounge />} />
                                    <Route path="/notifications" element={<Notifications />} />
                                    <Route path="/stories" element={<Stories />} />
                                    <Route path="/wrapped" element={<Wrapped />} />
                                    <Route path="/secret-crush" element={<SecretCrush />} />
                                    <Route path="/trivia" element={<BabyTrivia />} />
                                    <Route path="/confessions" element={<ConfessionRoulette />} />
                                    <Route path="/letters" element={<FarewellLetters />} />
                                    <Route path="/playlist" element={<Playlist />} />
                                    <Route path="/awards" element={<Awards />} />
                                </Routes>
                            </main>
                            <BottomNav />
                        </div>
                    </Router>
                </SocketProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
