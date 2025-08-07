import { Message } from '../page';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isUser ? 'order-1' : 'order-2'}`}>
        {!isUser && (
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-sm font-bold">🤖</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Shopping Assistant</span>
          </div>
        )}
        
        <div
          className={`rounded-lg px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white ml-auto'
              : 'bg-white text-gray-900 border'
          }`}
        >
          <div className={`text-sm ${isUser ? 'text-white' : 'text-gray-900'}`}>
            {message.content.split('\n').map((line, index) => (
              <div key={index}>
                {line}
                {index < message.content.split('\n').length - 1 && <br />}
              </div>
            ))}
          </div>
          
          <div className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {isUser && (
          <div className="flex items-center justify-end mt-2">
            <span className="text-sm font-medium text-gray-700 mr-2">You</span>
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">👤</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}