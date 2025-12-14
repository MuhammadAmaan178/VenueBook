import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeConversation, setActiveConversation] = useState(null);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        let newSocket;

        if (isAuthenticated && user) {
            const token = localStorage.getItem('token');
            const userId = user.user_id || user.id;

            ("Initializing socket for user:", userId);

            newSocket = io(API_BASE_URL, {
                query: { token },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            newSocket.on('connect', () => {
                ("Socket connected:", newSocket.id);
            });

            newSocket.on('connect_error', (err) => {
                console.error("Socket connection error:", err.message);
            });

            newSocket.on('disconnect', (reason) => {
                ("Socket disconnected:", reason);
            });

            setSocket(newSocket);
        }

        return () => {
            if (newSocket) {
                ("Cleaning up socket connection");
                newSocket.disconnect();
            }
        };
    }, [isAuthenticated, user]);

    // Helper to open chat with specific conversation
    const openChat = (conversation) => {
        setActiveConversation(conversation);
        setIsChatOpen(true);
        if (socket && conversation) {
            socket.emit('join_conversation', { conversation_id: conversation.conversation_id });
        }
    };

    return (
        <SocketContext.Provider value={{
            socket,
            isChatOpen,
            setIsChatOpen,
            activeConversation,
            setActiveConversation,
            openChat
        }}>
            {children}
        </SocketContext.Provider>
    );
};
