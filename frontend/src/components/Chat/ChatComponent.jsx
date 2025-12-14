import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, X, Send, Minimize2, MoreVertical, Check, CheckCheck, ArrowLeft, Bot } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const MessageList = React.memo(({ messages, currentUserId, isBotTheme, isAdminTheme, messagesEndRef }) => {

    // Helper: Format Time (10:45 AM)
    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Helper: Date Separators (Today, Yesterday, Date)
    const getDateLabel = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        return date.toLocaleDateString();
    };

    let lastDate = null;

    return (
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {messages.map((msg, idx) => {
                const isMe = msg.sender_id === currentUserId;
                const dateLabel = getDateLabel(msg.created_at || new Date());
                const showDate = dateLabel !== lastDate;
                lastDate = dateLabel;

                // Smart Corners Logic
                const nextMsg = messages[idx + 1];
                const prevMsg = messages[idx - 1];
                const isLastFromSender = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                // Dynamic Bubble Style
                let bubbleStyle = 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm'; // Default received
                if (isMe) {
                    if (isBotTheme) {
                        bubbleStyle = 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm';
                    } else if (isAdminTheme) {
                        bubbleStyle = 'bg-red-600 text-white rounded-2xl rounded-tr-sm';
                    } else {
                        bubbleStyle = 'bg-blue-600 text-white rounded-2xl rounded-tr-sm';
                    }
                } else {
                    // Received Message
                    if (isBotTheme) {
                        // Bot messages
                        bubbleStyle = 'bg-purple-50 text-gray-800 border border-purple-100 rounded-2xl rounded-tl-sm';
                    }
                }

                return (
                    <React.Fragment key={idx}>
                        {/* Date Separator */}
                        {showDate && (
                            <div className="flex justify-center my-4">
                                <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">
                                    {dateLabel}
                                </span>
                            </div>
                        )}

                        <div className={`flex w-full mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>

                                {/* The Bubble */}
                                <div className={`px-4 py-2 text-[15px] shadow-sm relative group ${bubbleStyle}
                                    ${!isLastFromSender && isMe ? 'rounded-br-sm' : ''}
                                    ${!isLastFromSender && !isMe ? 'rounded-bl-sm' : ''}
                                `}>
                                    {/* Markdown Rendering */}
                                    <ReactMarkdown
                                        components={{
                                            ul: ({ node, ...props }) => <ul className="list-disc ml-4 my-1" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal ml-4 my-1" {...props} />,
                                            li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
                                            strong: ({ node, ...props }) => <span className="font-bold" {...props} />,
                                            p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>

                                    {/* Time */}
                                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] 
                                        ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                        <span>{formatTime(msg.created_at || new Date())}</span>
                                        {isMe && (
                                            <CheckCheck size={12} className={msg.is_read ? "text-white" : "opacity-60"} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
});

const FloatingChat = () => {
    const {
        socket,
        isChatOpen,
        setIsChatOpen,
        activeConversation,
        setActiveConversation
    } = useSocket();
    const { user } = useAuth();

    // Local state
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    // Derived state for total unread count
    const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unread || 0), 0);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Fetch conversations on load and when socket connects
    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user, isChatOpen, socket]);

    useEffect(() => {
        if (activeConversation && socket) {
            fetchMessages(activeConversation.conversation_id);
            socket.emit('join_conversation', { conversation_id: activeConversation.conversation_id });
            // Focus input when chat opens
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [activeConversation, socket]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('new_message', (message) => {
            if (activeConversation && message.conversation_id === activeConversation.conversation_id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }
            fetchConversations(); // Always update list for unread counts / last message
        });

        return () => {
            socket.off('new_message');
        };
    }, [socket, activeConversation]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async (conversationId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/users/conversations/${conversationId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data);
            scrollToBottom();
            fetchConversations();
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const userId = user.user_id || user.id;

            const response = await axios.get(`${API_BASE_URL}/api/users/${userId}/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setConversations(response.data);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    };

    const startVenueBotChat = async () => {
        try {
            const token = localStorage.getItem('token');
            const userId = user.user_id || user.id;

            // Create or retrieve conversation with VenueBot (Admin ID 4)
            const response = await axios.post(`${API_BASE_URL}/api/users/conversations`, {
                admin_id: 4
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const conversationId = response.data.conversation_id;

            await fetchConversations();

            // Construct bot conversation object
            const botConv = {
                conversation_id: conversationId,
                name: 'VenueBot 🤖',
                conversation_type: 'customer_admin',
                admin_id: 4,
                user_id: userId,
                unread: 0
            };

            setActiveConversation(botConv);

        } catch (error) {
            console.error("Error starting VenueBot chat:", error);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim()) return;
        if (!activeConversation) return;

        const messageData = {
            conversation_id: activeConversation.conversation_id,
            content: newMessage,
            sender_id: user.user_id || user.id
        };

        socket.emit('send_message', messageData);
        setNewMessage("");

        // Optimistically append locally to reduce visual lag
        // (Wait for socket confirmation usually, but this feels faster)
        // Actually, let's wait for socket to avoid duplication since we listen to 'new_message'
    };

    // Helper: Logic for Admin Theme (Red)
    const currentUserId = user ? (user.user_id || user.id) : null;
    const isAdminTheme = activeConversation?.conversation_type === 'customer_admin' &&
        String(activeConversation.admin_id) !== String(currentUserId);

    // Helper: Logic for VenueBot Theme (Gradient Purple)
    const isBotTheme = activeConversation?.conversation_type === 'customer_admin' &&
        Number(activeConversation.admin_id) === 4;

    // Online Status Logic
    const [partnerStatus, setPartnerStatus] = useState('offline');

    useEffect(() => {
        if (!socket || !activeConversation || !user) return;
        const myUserId = String(user.user_id || user.id);
        const customerId = String(activeConversation.user_id);
        let partnerId;

        // Special case for VenueBot (4) - Always Online
        if (activeConversation.admin_id === 4) {
            setPartnerStatus('online');
            return;
        }

        if (customerId === myUserId) {
            if (activeConversation.conversation_type === 'customer_admin') {
                partnerId = activeConversation.admin_id;
            } else {
                partnerId = activeConversation.owner_user_id;
            }
        } else {
            partnerId = activeConversation.user_id;
        }

        if (partnerId) {
            socket.emit('request_status', { user_id: partnerId });
        }

        const handleStatusUpdate = (data) => {
            if (String(data.user_id) === String(partnerId)) {
                setPartnerStatus(data.status);
            }
        };

        socket.on('user_status', handleStatusUpdate);
        return () => {
            socket.off('user_status', handleStatusUpdate);
        };
    }, [socket, activeConversation, user]);

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* 1. Floating Toggle Button */}
            {!isChatOpen && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="relative group bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:scale-110 flex items-center justify-center"
                >
                    <MessageCircle size={28} strokeWidth={2.5} />
                    {totalUnread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full border-2 border-white animate-bounce-short">
                            {totalUnread > 9 ? '9+' : totalUnread}
                        </span>
                    )}
                </button>
            )}

            {/* 2. Chat Window */}
            {isChatOpen && (
                <div className="bg-white w-[360px] md:w-[400px] h-[600px] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden flex flex-col transition-all animate-in slide-in-from-bottom-10 fade-in duration-300">

                    {/* Header */}
                    <div className="bg-white/90 backdrop-blur-md p-4 flex justify-between items-center border-b border-gray-100 sticky top-0 z-10 w-full">
                        {activeConversation ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveConversation(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 mr-2 transition-colors">
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="relative">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${isBotTheme ? 'from-purple-500 to-pink-500' : (isAdminTheme ? 'from-red-500 to-orange-600' : 'from-blue-500 to-purple-600')} flex items-center justify-center text-white font-bold text-lg transition-all shadow-sm`}>
                                        {isBotTheme ? <Bot size={20} /> : activeConversation.name.charAt(0).toUpperCase()}
                                    </div>
                                    {partnerStatus === 'online' && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                    )}
                                </div>
                                <div>
                                    <h3 className={`font-bold leading-tight ${isBotTheme ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600' : (isAdminTheme ? 'text-red-600' : 'text-gray-900')}`}>
                                        {isBotTheme ? 'VenueBot 🤖' : activeConversation.name}
                                    </h3>
                                    <p className={`text-xs font-medium flex items-center gap-1 ${partnerStatus === 'online' ? 'text-green-500' : 'text-gray-400'}`}>
                                        {partnerStatus === 'online' ? (
                                            <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Active now</>
                                        ) : 'Offline'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <h3 className="font-bold text-xl text-gray-800 ml-2">Messages</h3>
                        )}

                        <div className="flex items-center gap-1">
                            {!activeConversation && <div className="w-8" />}
                            <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden bg-[#F3F4F6] relative">
                        {activeConversation ? (
                            <div className="h-full flex flex-col">
                                <MessageList
                                    messages={messages}
                                    currentUserId={currentUserId}
                                    isBotTheme={isBotTheme}
                                    isAdminTheme={isAdminTheme}
                                    messagesEndRef={messagesEndRef}
                                />
                                <div className="p-3 bg-white border-t border-gray-100">
                                    <form onSubmit={handleSendMessage} className={`flex gap-2 items-center bg-gray-100 rounded-3xl px-2 py-1 focus-within:ring-2 transition-all border border-transparent ${isAdminTheme ? 'ring-red-500/20 focus-within:border-red-500/50' : 'ring-blue-500/20 focus-within:border-blue-500/50'}`}>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder={isBotTheme ? "Ask me about venues..." : "Message..."}
                                            className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none text-gray-800 placeholder-gray-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className={`p-2 text-white rounded-full transition-all disabled:opacity-50 disabled:scale-95 shadow-md m-1 ${isBotTheme ? 'bg-gradient-to-r from-purple-600 to-pink-600' : (isAdminTheme ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700')}`}
                                        >
                                            <Send size={18} className="ml-0.5" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            /* CONVERSATION LIST */
                            <div className="h-full overflow-y-auto p-2 space-y-2">
                                {/* VENUEBOT BANNER */}
                                <div
                                    onClick={startVenueBotChat}
                                    className="flex gap-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all cursor-pointer group border border-purple-100 mb-2"
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                                            <Bot size={24} />
                                        </div>
                                        <span className="absolute -top-1 -right-1 border-2 border-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold bg-green-500">AI</span>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h4 className="font-bold text-gray-900">VenueBot 🤖</h4>
                                        </div>
                                        <p className="text-sm text-purple-600 font-medium truncate">
                                            Click here to chat with AI...
                                        </p>
                                    </div>
                                </div>

                                {conversations.map(conv => {
                                    const isConvAdminTheme = conv.conversation_type === 'customer_admin' && String(conv.admin_id) !== String(currentUserId);
                                    if (conv.admin_id === 4) return null; // Hide duplicate VenueBot from list

                                    return (
                                        <div
                                            key={conv.conversation_id}
                                            onClick={() => {
                                                setActiveConversation(conv);
                                            }}
                                            className="flex gap-4 p-3 bg-white rounded-xl hover:bg-blue-50 transition-colors cursor-pointer group border border-transparent hover:border-blue-100"
                                        >
                                            <div className="relative">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${isConvAdminTheme
                                                    ? 'bg-red-50 text-red-600 group-hover:bg-red-100 group-hover:text-red-700'
                                                    : 'bg-gray-100 text-gray-600 group-hover:bg-blue-200 group-hover:text-blue-700'
                                                    }`}>
                                                    {conv.name.charAt(0).toUpperCase()}
                                                </div>
                                                {conv.unread > 0 && (
                                                    <span className={`absolute -top-1 -right-1 border-2 border-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${isConvAdminTheme ? 'bg-red-600' : 'bg-blue-600'}`}>
                                                        {conv.unread}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <h4 className={`font-semibold truncate pr-2 ${isConvAdminTheme ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {conv.name}
                                                    </h4>
                                                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                                                        {new Date(conv.last_message_time || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className={`text-sm truncate ${conv.unread > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                                                    {conv.unread > 0 ? 'New message' : conv.last_message}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloatingChat;
