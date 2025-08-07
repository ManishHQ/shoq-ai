import { useState, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [quickQuestions, setQuickQuestions] = useState([
    "Show me all products",
    "What electronics do you have?",
    "Show me affordable items",
    "I'm looking for headphones",
    "What's in the home category?",
  ]);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('http://localhost:8000/chat/suggestions');
      const data = await response.json();
      
      if (data.status === 'success' && data.data.suggestions) {
        setQuickQuestions(data.data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Keep default suggestions on error
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickQuestion = (question: string) => {
    if (!disabled) {
      onSendMessage(question);
    }
  };

  return (
    <div className="bg-white border-t">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Quick Questions */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                disabled={disabled}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                }`}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="flex items-end space-x-4">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about products, search our catalog, or get shopping help..."
                disabled={disabled}
                rows={1}
                className={`w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
                style={{ 
                  minHeight: '48px',
                  maxHeight: '120px'
                }}
              />
              
              {/* Character limit indicator */}
              <div className="absolute bottom-2 right-12 text-xs text-gray-400">
                {message.length}/500
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={disabled || !message.trim() || message.length > 500}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              disabled || !message.trim() || message.length > 500
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {disabled ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending
              </div>
            ) : (
              <div className="flex items-center">
                Send
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            )}
          </button>
        </form>

        {/* Help text */}
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line. You can ask about products, categories, prices, or get help shopping.
        </div>
      </div>
    </div>
  );
}