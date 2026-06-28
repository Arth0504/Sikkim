import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, X, Send, Sparkles, Compass, AlertCircle, RefreshCw } from "lucide-react";
import API from "../services/api";

const PRESET_CHIPS = [
  { label: "Best Monasteries", text: "What are some of the best monasteries to visit in Sikkim?" },
  { label: "Tour Packages", text: "Recommend some popular travel packages." },
  { label: "Upcoming Festivals", text: "Tell me about cultural festivals in Sikkim." },
  { label: "How to Book?", text: "How can I book a tour on this website?" },
  { label: "Best Travel Season", text: "What is the best season to visit Sikkim?" },
  { label: "Permits & Tips", text: "What are the permit requirements and travel tips?" }
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Initialize chatbot with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          sender: "bot",
          text: `Tashi Delek! 🏔️ Welcome to Sikkim. I am your Monastery360 AI Assistant.

How can I help you customize your spiritual journey to Sikkim today? You can select a quick query below or type your questions directly.`
        }
      ]);
    }
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text || text.trim() === "") return;

    // Add user message
    setMessages(prev => [...prev, { sender: "user", text }]);
    setInputText("");
    setLoading(true);

    try {
      const res = await API.post("/assistant/chat", { message: text });
      setMessages(prev => [...prev, { sender: "bot", text: res.data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: "I'm having trouble connecting to the server. Please check your connection and try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Safe parsing helper for bold formatting and react-router links
  const renderMessageText = (text, sender) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let parts = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(
          <Link 
            key={match.index} 
            to={match[2]} 
            className={`font-black hover:underline inline-flex items-center gap-0.5 ${
              sender === "bot" ? "text-teal-400" : "text-white"
            }`}
            onClick={() => setIsOpen(false)}
          >
            {match[1]}
          </Link>
        );
        lastIndex = linkRegex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      const content = parts.length > 0 ? parts : [line];

      const parsedContent = content.map((part, partIdx) => {
        if (typeof part !== "string") return part;

        const boldRegex = /\*\*([^*]+)\*\*/g;
        let boldParts = [];
        let boldLastIndex = 0;
        let boldMatch;

        while ((boldMatch = boldRegex.exec(part)) !== null) {
          if (boldMatch.index > boldLastIndex) {
            boldParts.push(part.substring(boldLastIndex, boldMatch.index));
          }
          boldParts.push(
            <strong key={boldMatch.index} className={sender === "bot" ? "font-extrabold text-teal-300" : "font-black text-white"}>
              {boldMatch[1]}
            </strong>
          );
          boldLastIndex = boldRegex.lastIndex;
        }

        if (boldLastIndex < part.length) {
          boldParts.push(part.substring(boldLastIndex));
        }

        return boldParts.length > 0 ? boldParts : part;
      });

      return (
        <div key={lineIdx} className={line.trim() === "" ? "h-2" : "min-h-[14px] mb-1"}>
          {parsedContent}
        </div>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* FLOATING ACTION BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 group focus:outline-none"
          title="AI Travel Assistant"
        >
          <MessageSquare size={24} className="group-hover:rotate-6 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[550px] bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in text-white">
          
          {/* HEADER */}
          <div className="px-6 py-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/10">
                <Compass size={20} className="animate-spin-slow" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                  AI Travel Assistant <Sparkles size={12} className="text-teal-400" />
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Online • Monastery360</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors focus:outline-none"
            >
              <X size={18} />
            </button>
          </div>

          {/* CHAT LOG SCREEN */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-teal-600 text-white rounded-tr-none font-bold" 
                      : "bg-slate-950/80 border border-slate-800 text-slate-300 rounded-tl-none font-medium"
                  }`}
                >
                  {renderMessageText(msg.text, msg.sender)}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-slate-400 flex items-center gap-2">
                  <RefreshCw className="animate-spin text-teal-400" size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">AI Assistant is typing...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* PRESET CHIPS / SUGGESTIONS CONTAINER */}
          <div className="px-6 py-2 border-t border-slate-800/50 bg-slate-950/40">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-2 px-1">Common Inquiries</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {PRESET_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.text)}
                  className="px-3 py-1.5 bg-slate-950/90 border border-slate-800 hover:border-teal-500 hover:bg-slate-900 rounded-xl text-[10px] font-black tracking-wide text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* INPUT BAR */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about hotels, seasons, permit tips..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-xs outline-none transition-all placeholder:text-slate-500 text-white font-semibold"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="w-10 h-10 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer focus:outline-none"
            >
              <Send size={16} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default Chatbot;
