import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CoPilotService } from '../../services/copilotService';
import { ChatConversation, ChatMessage } from '../../types';
import { Button } from '../../components/Button';
import {
  MessageSquare, Plus, Send, Paperclip, Copy, Bot, User, CornerDownLeft, Sparkles, X, FileText, Check
} from 'lucide-react';

export const CoPilotPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  
  // Attachments mock state
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; type: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      const list = await CoPilotService.getConversations();
      setConversations(list);
      if (list.length > 0) {
        setActiveConvId(list[0].id);
      }
    };
    loadConversations();
  }, []);

  // Sync with URL Search query params (e.g. from Dashboard insights click)
  useEffect(() => {
    const promptParam = searchParams.get('prompt');
    if (promptParam && conversations.length > 0 && activeConvId) {
      setInputText(promptParam);
      // Auto-send the prompt immediately
      handleSendPrompt(promptParam);
    }
  }, [searchParams, conversations.length, activeConvId]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isTyping, activeConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const handleCreateNewChat = async () => {
    const newChat = await CoPilotService.createConversation('New Inquiry');
    setConversations(prev => [newChat, ...prev]);
    setActiveConvId(newChat.id);
  };

  const handleSendPrompt = async (text: string) => {
    if (!text.trim() && attachedFiles.length === 0) return;
    if (!activeConvId) return;

    setInputText('');
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);
    setIsTyping(true);

    try {
      await CoPilotService.sendMessage(activeConvId, text, filesToSend);
      const refreshedConvs = await CoPilotService.getConversations();
      setConversations(refreshedConvs);
    } catch (_err) {
      console.error('Failed to send co-pilot message');
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formattedSize = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

      setAttachedFiles(prev => [...prev, {
        name: file.name,
        size: formattedSize,
        type: file.type
      }]);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-sap-card-dark rounded-xl border border-sap-border-light dark:border-sap-border-dark overflow-hidden shadow-fiori dark:shadow-fiori-dark">
      {/* Conversations Left Panel */}
      <aside className="hidden md:flex flex-col w-64 border-r border-sap-border-light dark:border-sap-border-dark bg-sap-gray-50/50 dark:bg-sap-gray-800/20">
        <div className="p-3 border-b border-sap-border-light dark:border-sap-border-dark">
          <Button
            variant="outline"
            className="w-full text-xs"
            onClick={handleCreateNewChat}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Conversation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-md text-xs font-semibold text-left transition-colors truncate ${
                activeConvId === conv.id
                  ? 'bg-sap-blue-light dark:bg-sap-blue/20 text-sap-blue dark:text-sap-blue-medium font-bold'
                  : 'text-sap-gray-600 dark:text-sap-gray-300 hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800'
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-2 text-sap-gray-400 flex-shrink-0" />
              <span className="truncate">{conv.title}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main chat window container */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-sap-card-dark">
        {/* Chat Thread Header */}
        <header className="px-4 py-3 border-b border-sap-border-light dark:border-sap-border-dark flex justify-between items-center bg-sap-gray-50/40 dark:bg-sap-gray-800/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-sap-accent/15 rounded-lg text-sap-accent">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-sap-gray-800 dark:text-white">SAP Procurement Co-pilot</h3>
              <p className="text-[9px] text-sap-gray-400">Contextual S/4HANA transactional matching</p>
            </div>
          </div>
        </header>

        {/* Chat Stream Message Bubbles */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {!activeConv || activeConv.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
              <Bot className="w-12 h-12 text-sap-accent animate-pulse" />
              <h4 className="text-sm font-bold text-sap-gray-800 dark:text-white">Start a new procurement chat inquiry</h4>
              <p className="text-xs text-sap-gray-500 leading-relaxed">
                Query vendors, analyze duplicate invoices, check pending PO requisitions, and automate workflow compliance.
              </p>
            </div>
          ) : (
            activeConv.messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3.5 max-w-3xl ${
                    isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse space-x-reverse'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white ${
                    isAssistant ? 'bg-sap-accent shadow-sm' : 'bg-sap-blue'
                  }`}>
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className="space-y-2 max-w-full">
                    <div className={`p-4 rounded-xl text-xs relative group border ${
                      isAssistant
                        ? 'bg-sap-gray-50 dark:bg-sap-gray-800/40 border-sap-border-light dark:border-sap-border-dark text-sap-gray-700 dark:text-sap-gray-300'
                        : 'bg-sap-blue-light/50 border-sap-blue/20 dark:bg-sap-blue/15 dark:border-sap-blue-medium/20 text-sap-gray-800 dark:text-white'
                    }`}>
                      <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-3">
                        {msg.content.split('\n\n').map((paragraph, pIdx) => {
                          if (paragraph.startsWith('|')) {
                            const lines = paragraph.trim().split('\n').filter(Boolean);
                            const headers = lines[0].split('|').map(s => s.trim()).filter(Boolean);
                            const rows = lines.slice(2).map(line => line.split('|').map(s => s.trim()).filter(Boolean));
                            return (
                              <div key={pIdx} className="overflow-x-auto my-3 border border-sap-border-light dark:border-sap-border-dark rounded-md bg-white dark:bg-sap-gray-900/30">
                                <table className="w-full min-w-[320px] text-xs">
                                  <thead>
                                    <tr className="bg-sap-gray-100/50 dark:bg-sap-gray-800/50 text-[10px] font-bold text-sap-gray-500">
                                      {headers.map((h, i) => <th key={i} className="px-3 py-1.5 text-left border-b border-sap-border-light dark:border-sap-border-dark">{h}</th>)}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.map((row, rIdx) => (
                                      <tr key={rIdx} className="border-b border-sap-border-light dark:border-sap-border-dark last:border-0 hover:bg-sap-gray-50/50 dark:hover:bg-sap-gray-800/20">
                                        {row.map((cell, cIdx) => (
                                          <td key={cIdx} className="px-3 py-2 text-sap-gray-700 dark:text-sap-gray-300 font-semibold">{cell}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          }
                          if (paragraph.startsWith('###')) {
                            return <h3 key={pIdx} className="text-sm font-bold text-sap-gray-800 dark:text-white mt-2 flex items-center">{paragraph.replace('###', '')}</h3>;
                          }
                          if (paragraph.startsWith('*') || paragraph.startsWith('-')) {
                            return (
                              <ul key={pIdx} className="list-disc pl-5 space-y-1 my-2">
                                {paragraph.split('\n').map((li, lIdx) => (
                                  <li key={lIdx}>{li.replace(/^[\*\-\s]+/, '')}</li>
                                ))}
                              </ul>
                            );
                          }
                          return <p key={pIdx} className="my-1 whitespace-pre-wrap">{paragraph}</p>;
                        })}
                      </div>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-sap-border-light dark:border-sap-border-dark flex flex-wrap gap-2">
                          {msg.attachments.map((file, i) => (
                            <div key={i} className="flex items-center space-x-1.5 px-2.5 py-1 bg-white dark:bg-sap-gray-800/80 rounded border border-sap-border-light dark:border-sap-border-dark text-[10px]">
                              <FileText className="w-3.5 h-3.5 text-sap-blue" />
                              <span className="font-bold max-w-[120px] truncate">{file.name}</span>
                              <span className="text-sap-gray-400">({file.size})</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {isAssistant && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopyText(msg.id, msg.content)}
                            className="p-1 rounded bg-white dark:bg-sap-gray-800 text-sap-gray-400 hover:text-sap-blue border border-sap-border-light dark:border-sap-border-dark"
                            title="Copy message contents"
                          >
                            {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-sap-status-success-text" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                    <span className={`text-[9px] text-sap-gray-400 block ${isAssistant ? 'text-left' : 'text-right'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="flex items-start space-x-3.5 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sap-accent shadow-sm text-white flex-shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-sap-gray-50 dark:bg-sap-gray-800/40 border border-sap-border-light dark:border-sap-border-dark rounded-xl px-4 py-3 text-xs flex items-center space-x-1.5 text-sap-gray-500 font-medium">
                <div className="w-1.5 h-1.5 bg-sap-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-sap-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-sap-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-1 text-[10px]">Processing S/4HANA index...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Dynamic prompt suggestions pills */}
        {!isTyping && activeConv && activeConv.messages.length > 0 && activeConv.messages[activeConv.messages.length - 1].suggestions && (
          <div className="px-4 py-2 flex flex-wrap gap-2.5 border-t border-sap-border-light dark:border-sap-border-dark bg-sap-gray-50/20">
            {activeConv.messages[activeConv.messages.length - 1].suggestions?.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSendPrompt(s)}
                className="px-3 py-1 bg-white hover:bg-sap-blue-light/50 border border-sap-border-light dark:bg-sap-gray-800 dark:hover:bg-sap-blue/20 dark:border-sap-border-dark text-[10px] rounded-full text-sap-gray-600 dark:text-sap-gray-300 font-semibold cursor-pointer transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Form Panel */}
        <footer className="p-4 border-t border-sap-border-light dark:border-sap-border-dark bg-white dark:bg-sap-card-dark">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(inputText);
            }}
            className="space-y-3.5"
          >
            {/* Display attached files preview */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center space-x-1 px-2 py-1 bg-sap-gray-50 dark:bg-sap-gray-800 rounded border text-[10px] relative">
                    <FileText className="w-3.5 h-3.5 text-sap-blue mr-1" />
                    <span className="max-w-[120px] truncate font-bold">{file.name}</span>
                    <button type="button" onClick={() => removeAttachment(idx)} className="p-0.5 text-sap-gray-400 hover:text-red-500 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask co-pilot questions on POs, invoice matches, or supplier risks..."
                disabled={!activeConvId || isTyping}
                className="fiori-input pl-3.5 pr-20 py-3"
              />
              <div className="absolute right-2 flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!activeConvId || isTyping}
                  className="p-2 text-sap-gray-400 hover:text-sap-blue hover:bg-sap-gray-100 dark:hover:bg-sap-gray-800 rounded-md transition-colors"
                  title="Attach verification invoice/file"
                >
                  <Paperclip className="w-4.5 h-4.5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileAttach}
                  className="hidden"
                  accept="application/pdf,image/*,text/plain"
                />
                <button
                  type="submit"
                  disabled={(!inputText.trim() && attachedFiles.length === 0) || !activeConvId || isTyping}
                  className="p-2 bg-sap-blue hover:bg-sap-blue-dark text-white rounded-md transition-colors disabled:opacity-40 disabled:hover:bg-sap-blue"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center text-[9px] text-sap-gray-400">
              <div className="flex items-center space-x-1">
                <CornerDownLeft className="w-3 h-3" />
                <span>Press Enter to submit inquiry</span>
              </div>
              <span>Connected to active S/4HANA registers</span>
            </div>
          </form>
        </footer>
      </div>
    </div>
  );
};
