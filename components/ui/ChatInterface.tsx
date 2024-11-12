'use client'

import { useState, useEffect, useRef } from "react";
import { chipOptions } from "@/data/chipOptions";
import styles from './ChatInterface.module.css';
import Modal from './ImageModal';

// Move this outside of the component
const getRandomChips = () => {
  const randomChips = chipOptions.slice().sort(() => 0.5 - Math.random()).slice(0, 2);
  return [...randomChips, "CDP @Devcon"];
};

const INITIAL_MESSAGE = { text: "Hello! What would you like to mint today?", sender: "bot" as const, id: 0 };

export default function ChatInterface() {
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot'; id: number; image?: string }[]>([INITIAL_MESSAGE]);
  const [showPromptChips, setShowPromptChips] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Use useState to store the random chips
  const [randomChips, setRandomChips] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [selectedChipIndex, setSelectedChipIndex] = useState<number | null>(null);

  // Use useEffect to set the random chips on the client side
  useEffect(() => {
    setRandomChips(getRandomChips());
  }, []);

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      const { scrollHeight, clientHeight } = chatMessagesRef.current;
      chatMessagesRef.current.scrollTop = scrollHeight - clientHeight;
    }
  };

  useEffect(scrollToBottom, [messages]);


  const sendMessage = (text: string) => {
    const newMessage = { text, sender: 'user' as const, id: Date.now() };
    setMessages(prev => [...prev, newMessage]);
    setShowPromptChips(false);

    // Bot response with image
    setTimeout(() => {
      const index = chipOptions.indexOf(text) + 1; // Adding 1 because array is 0-indexed but image names start from 1
      setSelectedChipIndex(index);
      const imagePath = `/images/${index}.png`;
      const botMessageId = Date.now();
      const botMessage = {
        text: `Creating the magic`,
        sender: 'bot' as const,
        id: botMessageId,
        image: imagePath
      };
      setMessages(prev => [...prev, botMessage]);

      // Set timer to update text and open modal
      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === botMessageId ? { ...msg, text: "Created magic!" } : msg
        ));
        setModalImage(imagePath);
        setModalOpen(true);
      }, 2000);
    }, 500);
  };

  const handleChipClick = (chipText: string) => {
    sendMessage(chipText);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    // Reset the chat to its initial state
    setMessages([INITIAL_MESSAGE]);
    setShowPromptChips(true);
    setRandomChips(getRandomChips());
    setSelectedChipIndex(null);
  };

  return (
    <>
      <div className="chat-container">
        <div className="chat-messages" ref={chatMessagesRef}>
          {messages.map((message) => (
            <div key={message.id} className={`flex flex-col ${message.sender === 'user' ? 'items-start' : 'items-end'} mb-4 animate-message`}>
              <span className="text-xs text-gray-500 mb-1">
                {message.sender === 'user' ? 'User' : 'Instamint'}
              </span>
              <div className={`rounded-lg p-3 max-w-xs ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'
                }`}>
                {message.text}
                {message.sender === 'bot' && message.text === 'Creating the magic' && (
                  <span className={styles.animateEllipsis}></span>
                )}
              </div>
            </div>
          ))}
          {showPromptChips && (
            <div className="flex justify-center space-x-2 mt-4">
              {randomChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={handleModalClose}
        title="Your mint is ready!"
        tokenId={selectedChipIndex?.toString() || ''}
        imageSrc={modalImage}
      />
    </>
  );
}