import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, Search, Send } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/useStore';

const MessagesPage = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const targetPoolId = searchParams.get('poolId');
  const targetUserId = searchParams.get('userId');

  const fetchInbox = async () => {
    try {
      const response = await api.get('/chat/inbox');
      setConversations(response.data);
      if (response.data.length > 0) {
        const targetConversation = response.data.find(
          (conversation) => conversation.pool_id === targetPoolId && conversation.other_user_id === targetUserId
        );
        if (targetConversation) {
          setActiveConversation(targetConversation);
        } else if (!activeConversation) {
          setActiveConversation(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading inbox:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchThread = async (conversation) => {
    if (!conversation) return;
    try {
      const response = await api.get(`/chat/${conversation.pool_id}/${conversation.other_user_id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading thread:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchInbox();
    const intervalId = window.setInterval(fetchInbox, 10000);
    return () => window.clearInterval(intervalId);
  }, [user, targetPoolId, targetUserId]);

  useEffect(() => {
    if (!activeConversation) return;
    fetchThread(activeConversation);
    const intervalId = window.setInterval(() => fetchThread(activeConversation), 5000);
    return () => window.clearInterval(intervalId);
  }, [activeConversation?.pool_id, activeConversation?.other_user_id]);

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) =>
      [conversation.other_user_name, conversation.other_user_email, conversation.pool_name, conversation.last_message]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [conversations, searchTerm]);

  const getCounterpartyLabel = () => (user?.role === 'owner' ? 'User' : 'Owner');

  const getSenderLabel = (item) => {
    if (!activeConversation) return 'You';
    return String(item.sender_id) === String(activeConversation.other_user_id) ? getCounterpartyLabel() : 'You';
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!message.trim() || !activeConversation) return;

    try {
      const response = await api.post('/chat/', {
        pool_id: activeConversation.pool_id,
        receiver_id: activeConversation.other_user_id,
        message,
      });
      setMessages((current) => [...current, response.data]);
      setMessage('');
      fetchInbox();
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to send message');
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Log in to view messages.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-4">
          <div className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <MessageCircle className="h-5 w-5 text-cyan-400" />
            Messages
          </div>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-purple-500/20 bg-slate-950/80 px-3 py-2">
            <Search className="h-4 w-4 text-cyan-300" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search profiles or messages"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
            />
          </div>
          {loading ? (
            <div className="text-gray-300">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-gray-400">No conversations yet.</div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <button
                  key={`${conversation.pool_id}-${conversation.other_user_id}`}
                  type="button"
                  onClick={() => setActiveConversation(conversation)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                    activeConversation?.pool_id === conversation.pool_id && activeConversation?.other_user_id === conversation.other_user_id
                      ? 'border-cyan-400/50 bg-cyan-500/10'
                      : 'border-purple-500/10 bg-slate-800/40 hover:border-purple-500/30'
                  }`}
                >
                  <div className="text-sm font-semibold text-white">{conversation.other_user_name}</div>
                  <div className="text-xs text-gray-400">{conversation.other_user_email}</div>
                  <div className="text-xs text-cyan-300">{conversation.pool_name}</div>
                  <div className="mt-1 truncate text-xs text-gray-400">
                    {(conversation.last_sender_id === user?.id ? 'You' : getCounterpartyLabel())}: {conversation.last_message}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-6">
          {!activeConversation ? (
            <div className="flex h-full items-center justify-center text-gray-400">Select a conversation to view messages.</div>
          ) : (
            <>
              <div className="mb-4 border-b border-purple-500/10 pb-4">
                <div className="text-xl font-semibold text-white">{activeConversation.other_user_name}</div>
                <div className="text-sm text-gray-400">{activeConversation.other_user_email}</div>
                <div className="text-sm text-cyan-300">{activeConversation.pool_name}</div>
              </div>

              <div className="mb-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-400">No messages yet.</p>
                ) : (
                  messages.map((item) => {
                    const isMine = activeConversation
                      ? String(item.sender_id) !== String(activeConversation.other_user_id)
                      : String(item.sender_id) === String(user.id);
                    return (
                      <div key={item.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-4 py-2 ${isMine ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-gray-100'}`}>
                          <div className="mb-1 text-xs font-semibold opacity-80">{getSenderLabel(item)}</div>
                          <div>{item.message}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="flex-1 rounded-lg border border-purple-500/30 bg-slate-950 px-4 py-2 text-white outline-none focus:border-cyan-400"
                  placeholder="Type a message"
                />
                <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 text-white">
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
