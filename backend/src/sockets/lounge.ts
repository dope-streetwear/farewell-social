import { Server, Socket } from 'socket.io';

export interface LoungeUser {
    userId: string;
    socketId: string;
    username: string;
    profileImageUrl: string;
}

const usersInLounge = new Map<string, LoungeUser>();

export const handleLoungeSockets = (io: Server, socket: Socket) => {
    socket.on('join-lounge', (userProfile: any) => {
        const newUser: LoungeUser = {
            userId: userProfile._id,
            socketId: socket.id,
            username: userProfile.username,
            profileImageUrl: userProfile.profileImageUrl
        };

        usersInLounge.set(socket.id, newUser);

        // Let everyone else know someone joined
        socket.broadcast.emit('user-joined-lounge', newUser);

        // Send the existing users to the newly joined user
        const others = Array.from(usersInLounge.values()).filter(u => u.socketId !== socket.id);
        socket.emit('lounge-users', others);
    });

    // WebRTC Signaling
    socket.on('offer', (payload) => {
        io.to(payload.target).emit('offer', {
            callerId: socket.id,
            sdp: payload.sdp
        });
    });

    socket.on('answer', (payload) => {
        io.to(payload.target).emit('answer', {
            callerId: socket.id,
            sdp: payload.sdp
        });
    });

    socket.on('ice-candidate', (payload) => {
        io.to(payload.target).emit('ice-candidate', {
            callerId: socket.id,
            candidate: payload.candidate
        });
    });

    // --- MINI GAMES STATE ---

    // Game 1: Never Have I Ever (NHIE)
    socket.on('nhie-start', () => {
        io.emit('nhie-start', { host: socket.id });
    });

    socket.on('nhie-next-prompt', (prompt: string) => {
        io.emit('nhie-prompt', prompt);
    });

    socket.on('nhie-vote', (choice: 'have' | 'havent') => {
        const user = usersInLounge.get(socket.id);
        if (user) {
            io.emit('nhie-vote-update', { socketId: socket.id, choice });
        }
    });

    socket.on('nhie-end', () => {
        io.emit('nhie-end');
    });

    // Game 2: Would You Rather (WYR)
    socket.on('wyr-start', () => {
        io.emit('wyr-start', { host: socket.id });
    });

    socket.on('wyr-next-prompt', (options: { optionA: string, optionB: string }) => {
        io.emit('wyr-prompt', options);
    });

    socket.on('wyr-vote', (choice: 'A' | 'B') => {
        const user = usersInLounge.get(socket.id);
        if (user) {
            io.emit('wyr-vote-update', { socketId: socket.id, choice });
        }
    });

    socket.on('wyr-end', () => {
        io.emit('wyr-end');
    });

    // Game 3: Tic-Tac-Toe (TTT)
    socket.on('ttt-start', () => {
        io.emit('ttt-start', { host: socket.id });
    });

    socket.on('ttt-state-update', (gameState: any) => {
        // Front-end handles game logic securely enough for this MVP, 
        // we just broadcast the state to everyone else
        socket.broadcast.emit('ttt-state-sync', gameState);
    });

    socket.on('ttt-end', () => {
        io.emit('ttt-end');
    });

    // Whiteboard (Vello Ka Adda)
    socket.on('whiteboard-draw', (drawData: any) => {
        // Broadcast drawing coordinates to everyone else in the lounge
        socket.broadcast.emit('whiteboard-draw-sync', drawData);
    });

    socket.on('whiteboard-clear', () => {
        io.emit('whiteboard-clear-sync');
    });

    const leaveLounge = () => {
        if (usersInLounge.has(socket.id)) {
            usersInLounge.delete(socket.id);
            socket.broadcast.emit('user-left-lounge', socket.id);
        }
    };

    socket.on('leave-lounge', leaveLounge);
    socket.on('disconnect', leaveLounge);
};
