import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FiSend, FiMessageSquare, FiChevronRight, FiSun, FiMoon, FiTrash2, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import styled, { createGlobalStyle, keyframes, ThemeProvider } from 'styled-components';
import digitalBotImage from '../assets/chatbot.png';
// Theme context
import { Viewer } from 'react-3d-viewer';
const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const lightTheme = {
  primary: '#4361ee',
  primaryLight: '#4895ef',
  secondary: '#3f37c9',
  text: '#2b2d42',
  textLight: '#6c757d',
  background: '#f8f9fa',
  cardBg: '#ffffff',
  userBubble: '#4361ee',
  botBubble: '#f1f3f5',
  shadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
  border: 'rgba(0, 0, 0, 0.1)',
  danger: '#dc3545',
  success: '#28a745'
};

const darkTheme = {
  primary: '#5e72e4',
  primaryLight: '#7e95f0',
  secondary: '#4f46e5',
  text: '#f8f9fa',
  textLight: '#adb5bd',
  background: '#1a1a2e',
  cardBg: '#16213e',
  userBubble: '#5e72e4',
  botBubble: '#2d3748',
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  border: 'rgba(255, 255, 255, 0.1)',
  danger: '#e74c3c',
  success: '#2ecc71'
};

// Sample questions data
const sampleQuestions = {
  publications: "Tell me the count of total publications of the college.",
  placements2025: "How many members are placed in 2025 placements?",
  hostelFacilities: "Tell me about hostel facilities.",
  whyGmrit: "Why should I consider GMRIT for B.Tech?",
  aboutCollege: "Tell me about the college.",
  payCollegeFee: "How can I pay the college fee?",
  downloadOldQuestionPapers: "I want to download old question papers for exams.",
  semResultsLink: "Get me the link for checking semester results.",
  departmentsAvailable: "What are the departments available in  Btech GMRIT?",
  hodList: "List out the HODs of each department.",
  achievements: "Tell me some achievements of GMRIT.",
  gateRanks: "Did any students get a GATE rank from GMRIT?",
  researchProfileDrAVRamana: "Get me the research profile of Dr. A. V. Ramana.",
  researchStatsMechanical: "Tell me research profile statistics of Mechanical Engineering.",
  researchStatsCSE: "Tell me research profile statistics of CSE.",
  totalPatents: "What is the total number of patents of the college?",
  mtechCoursesCount: "what are the departments available in Gmrit of Mtech",
  MtechCSE: "Does GMRIT have M.Tech in CSE?",
  stemClub: "Get me the details of the STEM Club.",
  deansList: "List out the Deans of GMRIT.",
  iste: "Get me the details of the ISTE professional body at GMRIT.",
  stepconeEvent: "Tell me about the StepCone event.",
  infosys_2025: "Tell me how many students were placed in INFOSYS in 2025 placements.",
  collegeHierarchy: "Tell me the college hierarchical structure.",
  principal: "Get me the profile of the Principal of GMRIT.",
  studentPresident: "Who is the current Students' President?",
  holidays2025: "Get me the list of holidays for 2025.",
  it_Syllabus: "Get me the syllabus of the IT department.",
  establishedYear: "When was the college established?",
  sportsFacilities: "Does GMRIT provide any sports facilities?",
  facultyOngoingProjects: "List out faculty ongoing projects.",
  contact: "Get me the contact details of the college."
};

// Function to get random questions in pyramid format (1-2-3)
const getRandomQuestions = () => {
  const questions = Object.entries(sampleQuestions);
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  
  // Return questions in pyramid format: 1-2-3
  return [
    [shuffled[0]], // First row: 1 question
    shuffled.slice(1, 3), // Second row: 2 questions
    shuffled.slice(3, 6) // Third row: 3 questions
  ];
};

// Styled Components
const GlobalStyle = createGlobalStyle`
  :root {
    --primary: ${props => props.theme.primary};
    --primary-light: ${props => props.theme.primaryLight};
    --secondary: ${props => props.theme.secondary};
    --text: ${props => props.theme.text};
    --text-light: ${props => props.theme.textLight};
    --background: ${props => props.theme.background};
    --card-bg: ${props => props.theme.cardBg};
    --user-bubble: ${props => props.theme.userBubble};
    --bot-bubble: ${props => props.theme.botBubble};
    --shadow: ${props => props.theme.shadow};
    --border: ${props => props.theme.border};
    --danger: ${props => props.theme.danger};
    --success: ${props => props.theme.success};
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  body {
    background-color: var(--background);
    color: var(--text);
    line-height: 1.6;
    
    /* Scrollbar Styling */
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      transition: background 0.3s ease;
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.2);
    }
    
    /* Firefox scrollbar */
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
  }
`;


const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 100%;
  margin: 0;
  background: var(--background);
  position: relative;
  overflow: hidden;
  transition: background 0.3s ease;
  position: relative;
  z-index: 1;
  
  @media (min-width: 1200px) {
    max-width: 100%;
    margin: 0;
  }
`;

const BotBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  .bot-image {
    width: 50%;
    max-width: 500px;
    height: auto;
    opacity: 0.15;
    animation: float 6s ease-in-out infinite;
    filter: 
      drop-shadow(0 0 6px rgba(67, 97, 238, 0.6))
      drop-shadow(0 0 12px rgba(67, 97, 238, 0.4))
      brightness(1.2)
      contrast(1.2);
    transform: translateZ(0);
    will-change: transform;
    transition: transform 0.5s ease-in-out;
    
    &:hover {
      transform: rotateY(180deg) translateZ(0);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  @media (max-width: 768px) {
    .bot-image {
      width: 80%;
    }
  }
`;

const BotIconContainer = styled.div`
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  margin-right: 1rem;
  perspective: 1000px;
  transform-style: preserve-3d;
  cursor: grab;
  user-select: none;
  transition: transform 0.2s ease-out;
  
  &:active {
    cursor: grabbing;
    transform: scale(0.95);
  }

  &:hover .bot-3d {
    transform: scale(1.1) rotateX(${props => props.$rotateX}deg) rotateY(${props => props.$rotateY}deg);
    filter: drop-shadow(0 0 8px rgba(67, 97, 238, 0.3));
  }

  .bot-3d {
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1.5);
    will-change: transform, filter;
    transform: rotateX(${props => props.$rotateX}deg) rotateY(${props => props.$rotateY}deg);
    
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      backface-visibility: hidden;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
    }
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
  }
`;

const Header = styled.header`
  padding: 1rem 2rem;
  background: var(--card-bg);
  color: var(--text);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
  z-index: 10;
  
  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    
    button {
      background: none;
      border: none;
      color: var(--text);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 1.2rem;
      
      &:hover {
        background: var(--bot-bubble);
      }
      
      &.danger {
        color: var(--danger);
        
        &:hover {
          background: rgba(220, 53, 69, 0.1);
        }
      }
    }
  }
  
  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background: var(--background);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    transition: background 0.3s ease;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
  }
  
  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
`;

const Message = styled(motion.div)`
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  line-height: 1.5;
  position: relative;
  word-wrap: break-word;
  font-size: 0.95rem;
  box-shadow: var(--shadow);
  
  &.user {
    align-self: flex-end;
    background: var(--user-bubble);
    color: white;
    border-bottom-right-radius: 0.25rem;
  }
  
  &.bot {
    align-self: flex-start;
    background: var(--bot-bubble);
    color: var(--text);
    border-bottom-left-radius: 0.25rem;
  }
  
  a {
    color: var(--primary);
    text-decoration: underline;
    font-weight: 500;
    
    &:hover {
      color: var(--secondary);
    }
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const SuggestedQuestions = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
  
  .question-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: nowrap;
    width: 100%;
    
    /* Single row layout */
    display: flex;
    flex-wrap: nowrap;
    gap: 0.5rem;
    padding: 0.5rem 0;
    
    /* Remove specific row styling */
    
    /* Remove specific row styling */
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    .question-chip {
      font-size: 0.75rem;
      padding: 0.4rem 0.8rem;
    }
  }
`;

const QuestionChip = styled(motion.button)`
  background: rgba(67, 97, 238, 0.1);
  color: var(--text);
  border: 1px solid rgba(67, 97, 238, 0.2);
  border-radius: 18px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  transition: all 0.2s;
  text-align: left;
  line-height: 1.2;
  min-height: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  &:hover {
    background: rgba(67, 97, 238, 0.15);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  svg {
    transition: transform 0.2s;
  }
  
  &:hover svg {
    transform: translateX(2px);
  }
`;

const InputContainer = styled.form`
  display: flex;
  padding: 1rem;
  background: var(--card-bg);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  
  input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 2rem;
    font-size: 0.95rem;
    outline: none;
    transition: all 0.2s;
    
    &:focus {
      border-color: var(--primary-light);
      box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
    }
  }
  
  button {
    margin-left: 0.75rem;
    padding: 0 1.25rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 2rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    
    &:hover {
      background: var(--secondary);
    }
    
    &:disabled {
      background: var(--text-light);
      cursor: not-allowed;
    }
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bot-bubble);
  border-radius: 1rem;
  width: fit-content;
  margin-bottom: 1rem;
  
  span {
    width: 8px;
    height: 8px;
    background: var(--text-light);
    border-radius: 50%;
    display: inline-block;
    animation: bounce 1.4s infinite;
    
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
  
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
  }
`;

const ChatbotPage = () => {
  const [theme, setTheme] = useState('light');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: Date.now(),
      text: "Hello! I'm your GMRCC assistant. How can I help you today?", 
      sender: 'bot' 
    }
  ]);
  const [input, setInput] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState(getRandomQuestions());
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  useEffect(() => {
    const icon = document.getElementById("header-bot-icon");
    if (!icon) return;

    const handleMouseMove = (e) => {
      const rect = icon.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Reduced rotation sensitivity
      const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 10;
      const rotateX = ((centerY - e.clientY) / (rect.height / 2)) * 10;
      
      setRotation({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
      setRotation({ x: 0, y: 0 }); // Reset rotation when mouse leaves
    };

    icon.addEventListener('mousemove', handleMouseMove);
    icon.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      icon.removeEventListener('mousemove', handleMouseMove);
      icon.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chatContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  const clearChat = () => {
    setMessages([
      { 
        id: Date.now(),
        text: "I've cleared our conversation. What would you like to know?", 
        sender: 'bot' 
      }
    ]);
  };

  // const API_BASE_URL = 'http://localhost:5000';
  const API_BASE_URL = 'https://gmrcc.onrender.com';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Focus input on load
    inputRef.current?.focus();
  }, [messages]);

  const cleanMarkdown = (text) => {
    if (!text) return '';
    let cleaned = text.replace(/\*\*\*/g, '**');
    const textarea = document.createElement('textarea');
    textarea.innerHTML = cleaned;
    return textarea.value;
  };

  const updateSuggestedQuestions = () => {
    setSuggestedQuestions(getRandomQuestions());
  };

  const handleSuggestedQuestion = (question) => {
    setInput(question);
    // Auto-submit the question
    const fakeEvent = { preventDefault: () => {} };
    sendMessage(fakeEvent, question);
    // Update suggested questions after the message is sent
    updateSuggestedQuestions();
  };

  const sendMessage = async (e, customMessage = null) => {
    e?.preventDefault?.();
    const message = customMessage || input.trim();
    if (!message || isSending) return;
    
    // Clear input if this is a direct message (not from suggested questions)
    if (!customMessage) {
      setInput('');
    }

    // Add user message
    const userMessage = { text: message, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    // Show typing indicator
    setMessages(prev => [...prev, { text: 'typing...', sender: 'bot', typing: true }]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      setMessages(prev => {
        const updated = prev.filter(msg => !msg.typing);
        return [...updated, { 
          text: cleanMarkdown(data.response || "I'm not sure how to respond to that."), 
          sender: 'bot' 
        }];
      });
    } catch (error) {
      console.error('Failed to get bot response:', error);
      setMessages(prev => {
        const updated = prev.filter(msg => !msg.typing);
        return [...updated, { 
          text: "I'm having trouble connecting to the server. Please try again later.", 
          sender: 'bot' 
        }];
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      <ChatContainer ref={chatContainerRef} className={isFullscreen ? 'fullscreen' : ''}>
        <Header>
          <h1><BotIconContainer
    $rotateX={rotateX}
    $rotateY={rotateY}
    onMouseDown={(e) => {
      e.preventDefault();
      setIsDragging(true);
      setStartX(e.clientX - rotateY);
      setStartY(e.clientY - rotateX);
    }}
    onMouseMove={(e) => {
      if (!isDragging) return;
      e.preventDefault();
      const sensitivity = 0.5; // Reduce rotation speed
      const x = (e.clientY - startY) * sensitivity;
      const y = (e.clientX - startX) * sensitivity;
      setRotateX(x);
      setRotateY(y);
    }}
    onMouseUp={() => {
      setIsDragging(false);
      // Add a smooth transition when releasing the mouse
      document.documentElement.style.cursor = '';
    }}
    onMouseLeave={() => {
      setIsDragging(false);
      document.documentElement.style.cursor = '';
    }}
  >
    <div className="bot-3d">
      <img
        src={digitalBotImage}
        alt="Bot"
        style={{
          filter: isHovering ? 'brightness(1.1) saturate(1.2)' : 'none',
          transform: isHovering ? 'scale(1.05)' : 'scale(1)'
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      />
    </div>
  </BotIconContainer>GMRCC Assistant</h1>
          <div className="header-actions">
            <button onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? <FiMoon /> : <FiSun />}
            </button>
            <button 
              onClick={clearChat} 
              className="danger"
              title="Clear conversation"
            >
              <FiTrash2 />
            </button>
            <button 
              onClick={toggleFullscreen} 
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
          </div>
        </Header>
        

        <MessagesContainer>
          <AnimatePresence>
            {messages.map((msg, index) => (
              msg.typing ? (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TypingIndicator>
                    <span></span>
                    <span></span>
                    <span></span>
                  </TypingIndicator>
                </motion.div>
              ) : (
                <Message
                  key={index}
                  className={msg.sender}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      ),
                      p: ({ node, ...props }) => <div {...props} />,
                      ul: ({ node, ...props }) => <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }} {...props} />,
                      ol: ({ node, ...props }) => <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }} {...props} />,
                      li: ({ node, ...props }) => <li style={{ margin: '0.25rem 0' }} {...props} />,
                      code: ({ node, ...props }) => (
                        <code style={{
                          background: 'rgba(0,0,0,0.05)',
                          padding: '0.2em 0.4em',
                          borderRadius: '3px',
                          fontFamily: 'monospace',
                          fontSize: '0.9em'
                        }} {...props} />
                      ),
                      pre: ({ node, ...props }) => (
                        <pre style={{
                          background: '#f5f5f5',
                          padding: '1em',
                          borderRadius: '4px',
                          overflowX: 'auto',
                          margin: '0.5rem 0'
                        }} {...props} />
                      ),
                    }}
                    skipHtml={true}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </Message>
              )
            ))}
            <div ref={messagesEndRef} />
          </AnimatePresence>
        </MessagesContainer>

        <div style={{ position: 'relative' }}>
          <SuggestedQuestions>
            {suggestedQuestions.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="question-row">
                {row.map(([key, question]) => (
                  <QuestionChip
                    key={key}
                    className="question-chip"
                    onClick={() => handleSuggestedQuestion(question)}
                    whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {question}
                    <FiChevronRight size={16} />
                  </QuestionChip>
                ))}
              </div>
            ))}
          </SuggestedQuestions>
          
          <InputContainer onSubmit={sendMessage}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              disabled={isSending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
            />
            <button type="submit" disabled={!input.trim() || isSending}>
              <FiSend />
              <span>Send</span>
            </button>
          </InputContainer>
        </div>
   
      </ChatContainer>
    </ThemeProvider>
  );
};

export default ChatbotPage;
  
