import { useState } from 'react';
import { MessageInput } from '../../components/message-input';



export const ConversationPage = () => {
  const [message, setMessage] = useState('');
  
  
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    
    console.log('Sending message:', message);
    
    
    setMessage('');
  };
  
  const handleMessageChange = (newText: string) => {
    console.log("Message changed:", newText);
    setMessage(newText);
  };
  
  return (
    <div className="flex flex-col h-full">
      
      
      <div className="mt-auto pt-4">
        <MessageInput
          value={message}
          onChange={handleMessageChange}
          onSend={handleSendMessage}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
};
