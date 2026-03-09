import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export interface RemotePeer {
    socketId: string;
    userId: string;
    username: string;
    profileImageUrl: string;
    stream: MediaStream | null;
}

export const useWebRTC = (socket: Socket | null, userProfile: any) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<RemotePeer[]>([]);

    // Maps socket ID to RTCPeerConnection
    const peerConnections = useRef(new Map<string, RTCPeerConnection>());
    // Maps socket ID to the user info (so we can reconstruct the RemotePeer)
    const peerMeta = useRef(new Map<string, Omit<RemotePeer, 'stream'>>());

    // Configuration for the WebRTC connections
    const rtcConfig: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ]
    };

    // Helper to start the webcam/mic
    const startLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error('Error accessing media devices.', err);
            return null;
        }
    };

    // Helper to stop everything
    const stopLocalStream = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
        peerMeta.current.clear();
        setPeers([]);

        if (socket) socket.emit('leave-lounge');
    };

    const createPeerConnection = useCallback((targetSocketId: string, user: Omit<RemotePeer, 'stream'>, stream: MediaStream): RTCPeerConnection => {
        if (!socket) throw new Error('No socket');

        const pc = new RTCPeerConnection(rtcConfig);

        // Add our local tracks to the connection
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // When we get candidates, send them via socket
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    target: targetSocketId,
                    candidate: event.candidate
                });
            }
        };

        // When we receive a remote stream
        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            setPeers(prev => {
                const existing = prev.find(p => p.socketId === targetSocketId);
                if (existing) {
                    return prev.map(p => p.socketId === targetSocketId ? { ...p, stream: remoteStream } : p);
                } else {
                    return [...prev, { ...user, stream: remoteStream }];
                }
            });
        };

        return pc;
    }, [socket]);

    useEffect(() => {
        if (!socket || !userProfile || !localStream) return;

        console.log('Initializing WebRTC socket listeners');

        // We join the lounge with our info
        socket.emit('join-lounge', userProfile);

        // 1. Initial load of existing users
        const handleLoungeUsers = async (users: any[]) => {
            console.log('Lounge users:', users);
            for (const user of users) {
                peerMeta.current.set(user.socketId, user);
                const pc = createPeerConnection(user.socketId, user, localStream);
                peerConnections.current.set(user.socketId, pc);

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                socket.emit('offer', {
                    target: user.socketId,
                    sdp: pc.localDescription
                });
            }
        };

        // 2. Someone else joins, we just wait for their offer
        const handleUserJoined = (user: any) => {
            console.log('User joined:', user);
            peerMeta.current.set(user.socketId, user);
            // We set up the PC, but we wait for them to send the offer since they just joined
            const pc = createPeerConnection(user.socketId, user, localStream);
            peerConnections.current.set(user.socketId, pc);
        };

        // 3. Receiving an offer
        const handleOffer = async (payload: { callerId: string, sdp: RTCSessionDescriptionInit }) => {
            console.log('Received offer from', payload.callerId);
            const user = peerMeta.current.get(payload.callerId);
            if (!user) return console.warn('Offer from unknown user');

            let pc = peerConnections.current.get(payload.callerId);
            if (!pc) {
                pc = createPeerConnection(payload.callerId, user, localStream);
                peerConnections.current.set(payload.callerId, pc);
            }

            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('answer', {
                target: payload.callerId,
                sdp: pc.localDescription
            });
        };

        // 4. Receiving an answer
        const handleAnswer = async (payload: { callerId: string, sdp: RTCSessionDescriptionInit }) => {
            console.log('Received answer from', payload.callerId);
            const pc = peerConnections.current.get(payload.callerId);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            }
        };

        // 5. Receiving an ICE candidate
        const handleIceCandidate = async (payload: { callerId: string, candidate: RTCIceCandidateInit }) => {
            const pc = peerConnections.current.get(payload.callerId);
            if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            }
        };

        // 6. User leaves
        const handleUserLeft = (socketId: string) => {
            console.log('User left:', socketId);
            const pc = peerConnections.current.get(socketId);
            if (pc) {
                pc.close();
                peerConnections.current.delete(socketId);
            }
            peerMeta.current.delete(socketId);
            setPeers(prev => prev.filter(p => p.socketId !== socketId));
        };

        socket.on('lounge-users', handleLoungeUsers);
        socket.on('user-joined-lounge', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('user-left-lounge', handleUserLeft);

        return () => {
            socket.off('lounge-users', handleLoungeUsers);
            socket.off('user-joined-lounge', handleUserJoined);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIceCandidate);
            socket.off('user-left-lounge', handleUserLeft);
        };
    }, [socket, localStream, userProfile, createPeerConnection]);

    return { localStream, peers, startLocalStream, stopLocalStream };
};
