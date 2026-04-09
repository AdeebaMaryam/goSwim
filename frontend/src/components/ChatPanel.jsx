import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/useStore';

const ChatPanel = ({ poolId, ownerId, otherUserId, title = 'Chat' }) => {
  const { user } = useAuthStore();
  const receiverId = otherUserId || ownerId;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const getCounterpartyLabel = () => (user?.role === 'owner' ? 'User' : 'Owner');

  useEffect(() => {
    const fetchMessages = async () => {
      if (!open || !poolId || !receiverId || !user) return;
      try {
        const response = await api.get(`/chat/${poolId}/${receiverId}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error loading chat:', error);
      }
    };

    fetchMessages();
    if (!open || !poolId || !receiverId || !user) return undefined;
    const intervalId = window.setInterval(fetchMessages, 5000);
    return () => window.clearInterval(intervalId);
  }, [open, poolId, receiverId, user]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!message.trim() || !receiverId) return;

    try {
      const response = await api.post('/chat/', {
        pool_id: poolId,
        receiver_id: receiverId,
        message
      });
      setMessages((items) => [...items, response.data]);
      setMessage('');
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to send message');
    }
  };

  if (!user) {
    return (
      <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-6 text-gray-300">
        Log in to chat with the pool owner.
      </div>
    );
  }

  if (!receiverId) {
    return (
      <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-6 text-gray-300">
        Chat is unavailable because the pool owner account is missing.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-white font-semibold"
      >
        <span className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-cyan-400" />
          {title}
        </span>
        <span className="text-cyan-300">{open ? 'Hide' : 'Open'}</span>
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          <div className="flex justify-end">
            <Link
              to={`/messages?poolId=${poolId}&userId=${receiverId}`}
              className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
            >
              Open Inbox
            </Link>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-sm">No messages yet.</p>
            ) : (
              messages.map((item) => {
                const isMine = String(item.sender_id) !== String(receiverId);
                return (
                  <div key={item.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${isMine ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-gray-100'}`}>
                      <div className="mb-1 text-xs font-semibold opacity-80">{isMine ? 'You' : getCounterpartyLabel()}</div>
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
              className="flex-1 bg-slate-950 border border-purple-500/30 text-white rounded-lg px-4 py-2 outline-none focus:border-cyan-400"
              placeholder="Type a message"
            />
            <button className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg px-4 py-2 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
