import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Trash2, Settings, Moon, Sun, Copy, Download, MessageSquare, Zap, Cpu, Clock, RefreshCw, X, Check, ChevronDown, Plus, Sidebar } from 'lucide-react';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([{ id: 1, title: 'New Chat', messages: [], timestamp: Date.now() }]);
  const [currentConversationId, setCurrentConversationId] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [copySuccess, setCopySuccess] = useState({});
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentMessages = conversations.find(c => c.id === currentConversationId)?.messages || [];

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        const data = await response.json();
        setAvailableModels(data.models || []);
        if (data.models && data.models.length > 0) {
          setSelectedModel(data.models[0].name);
        }
      } catch (err) {
        setError('Failed to connect to Ollama. Make sure it\'s running on localhost:11434');
        console.error('Error fetching models:', err);
      } finally {
        setIsModelLoading(false);
      }
    };
    fetchModels();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Focus input on conversation change
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentConversationId]);

  const pullModel = async (modelName) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: false })
      });
      if (response.ok) {
        // Refresh models list
        const modelsResponse = await fetch('http://localhost:11434/api/tags');
        const data = await modelsResponse.json();
        setAvailableModels(data.models || []);
      }
    } catch (err) {
      setError('Failed to pull model');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    const newId = Math.max(...conversations.map(c => c.id)) + 1;
    const newConversation = {
      id: newId,
      title: 'New Chat',
      messages: [],
      timestamp: Date.now()
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newId);
    setSidebarOpen(false);
  };

  const deleteConversation = (id) => {
    if (conversations.length === 1) return;
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(conversations.find(c => c.id !== id)?.id || conversations[0]?.id);
    }
  };

  const updateConversationTitle = (id, title) => {
    setConversations(prev => prev.map(c => 
      c.id === id ? { ...c, title } : c
    ));
  };

  const copyToClipboard = async (text, messageIndex) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(prev => ({ ...prev, [messageIndex]: true }));
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [messageIndex]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text');
    }
  };

  const exportChat = () => {
    const conversation = conversations.find(c => c.id === currentConversationId);
    const exportData = {
      title: conversation.title,
      model: selectedModel,
      messages: currentMessages,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${conversation.title.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !selectedModel) return;

    const userMessage = { role: 'user', content: input.trim(), timestamp: Date.now() };
    const newMessages = [...currentMessages, userMessage];
    
    // Update conversation
    setConversations(prev => prev.map(c => 
      c.id === currentConversationId 
        ? { 
            ...c, 
            messages: newMessages,
            title: c.messages.length === 0 ? input.trim().slice(0, 30) + (input.trim().length > 30 ? '...' : '') : c.title,
            timestamp: Date.now()
          }
        : c
    ));

    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: systemPrompt ? [{ role: 'system', content: systemPrompt }, ...newMessages] : newMessages,
          stream: false,
          options: {
            temperature: temperature,
            num_predict: maxTokens
          }
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.message.content,
        timestamp: Date.now()
      };

      setConversations(prev => prev.map(c => 
        c.id === currentConversationId 
          ? { ...c, messages: [...newMessages, assistantMessage] }
          : c
      ));
    } catch (err) {
      setError('Failed to get response from Ollama. Please check your connection.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCurrentChat = () => {
    setConversations(prev => prev.map(c => 
      c.id === currentConversationId 
        ? { ...c, messages: [], title: 'New Chat' }
        : c
    ));
    setError(null);
  };

  const themeClasses = darkMode 
    ? 'bg-gray-900 text-white' 
    : 'bg-gray-50 text-gray-900';

  const cardClasses = darkMode 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200';

  const inputClasses = darkMode 
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  return (
    <div className={`flex h-screen ${themeClasses} transition-colors duration-200`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-80 ${cardClasses} border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-blue-500" />
              <h1 className="text-lg font-medium">Group 4 Chatbot</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-gray-700 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* New chat button */}
          <div className="p-4">
            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto px-4">
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    currentConversationId === conversation.id
                      ? 'bg-indigo-600 text-white'
                      : `hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`
                  }`}
                  onClick={() => {
                    setCurrentConversationId(conversation.id);
                    setSidebarOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <div className="truncate text-sm">{conversation.title}</div>
                  </div>
                  {conversations.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 rounded transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Settings button */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-center space-x-2 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={`${cardClasses} border-b px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1 hover:bg-gray-700 rounded"
            >
              <Sidebar className="h-5 w-5" />
            </button>
            
            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className={`flex items-center space-x-2 ${inputClasses} px-3 py-2 rounded-lg border transition-colors`}
                disabled={isModelLoading}
              >
                <Cpu className="h-4 w-4" />
                <span className="text-sm">
                  {isModelLoading ? 'Loading...' : selectedModel || 'Select Model'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {modelDropdownOpen && (
                <div className={`absolute top-full left-0 mt-1 w-64 ${cardClasses} border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto`}>
                  {availableModels.map((model) => (
                    <button
                      key={model.name}
                      onClick={() => {
                        setSelectedModel(model.name);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors first:rounded-t-lg last:rounded-b-lg`}
                    >
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs opacity-60">
                        Size: {(model.size / 1024 / 1024 / 1024).toFixed(1)}GB
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportChat}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              title="Download chat"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={clearCurrentChat}
              className="p-2 hover:bg-red-600 rounded-lg transition-colors"
              title="Delete chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md mx-auto">
                <Bot className="h-16 w-16 mx-auto mb-4 text-indigo-500" />
                <h2 className="text-2xl font-semibold mb-2">Welcome to Group 4 Chatbot</h2>
                <p className="text-gray-500 mb-6">
                  Start a conversation with your local AI model. Choose a model from the dropdown and begin chatting.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Tell me a joke', 'Tell me how you are doing', 'How is your day going?'].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'} transition-colors text-sm`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {currentMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-indigo-600 text-white ml-3' 
                        : 'bg-gray-600 text-white mr-3'
                    }`}>
                      {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : `${cardClasses} border`
                    }`}>
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {message.content}
                        </pre>
                      </div>
                      {message.role === 'assistant' && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-600">
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(message.content, index)}
                            className="p-1 hover:bg-gray-600 rounded transition-colors"
                            title="Copy message"
                          >
                            {copySuccess[index] ? 
                              <Check className="h-3 w-3 text-green-400" /> : 
                              <Copy className="h-3 w-3" />
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className={`${cardClasses} border rounded-2xl px-4 py-3`}>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto hover:bg-red-200 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className={`${cardClasses} border-t p-4`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
                  className={`w-full ${inputClasses} rounded-lg px-4 py-3 border resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                  rows="1"
                  style={{ minHeight: '50px', maxHeight: '200px' }}
                  disabled={isLoading || !selectedModel}
                />
              </div>
              <button
                onClick={handleSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-3 rounded-lg transition-colors flex items-center justify-center"
                disabled={isLoading || !input.trim() || !selectedModel}
              >
                {isLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardClasses} rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Temperature</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">Current: {temperature}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Max Tokens</label>
                  <input
                    type="number"
                    min="1"
                    max="8192"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className={`w-full ${inputClasses} rounded-lg px-3 py-2 border`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">System Prompt</label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Enter system prompt..."
                    className={`w-full ${inputClasses} rounded-lg px-3 py-2 border resize-none`}
                    rows="3"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Streaming</label>
                  <button
                    onClick={() => setStreamingEnabled(!streamingEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      streamingEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      streamingEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;