// MessageContext.tsx

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import MessageHeader from "../models/messageHeader";

interface MessageContextType {
    messages: MessageHeader[];
    setMessages: Dispatch<SetStateAction<MessageHeader[]>>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

interface MessageProviderProps {
    children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
    const [messages, setMessages] = useState<MessageHeader[]>([]);

    return (
        <MessageContext.Provider value={{ messages, setMessages }}>
            {children}
        </MessageContext.Provider>
    );
};

export const useMessages = (): MessageContextType => {
    const context = useContext(MessageContext);
    if (context === undefined) {
        throw new Error('useMessages must be used within a MessageProvider');
    }
    return context;
};
