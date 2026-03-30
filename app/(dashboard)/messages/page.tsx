'use client';

import { useState, useEffect, useRef } from 'react';
import { conversations as convoApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Archive, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Conversation, Message } from '@/types';

export default function MessagesPage() {
  const { user } = useAuth();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConvos, setIsLoadingConvos] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    convoApi
      .getAll({ limit: 50 })
      .then((res) => setConvos(res.data.conversations || res.data))
      .catch(() => {})
      .finally(() => setIsLoadingConvos(false));
  }, []);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedId) return;
    setIsLoadingMessages(true);
    convoApi
      .getMessages(selectedId, { limit: 50 })
      .then((res) => {
        setMessages(res.data.messages || res.data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setIsLoadingMessages(false));
  }, [selectedId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId) return;
    setIsSending(true);
    try {
      const res = await convoApi.sendMessage(selectedId, newMessage.trim());
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleArchive = async (convoId: string) => {
    try {
      await convoApi.archive(convoId);
      setConvos((prev) => prev.filter((c) => c.id !== convoId));
      if (selectedId === convoId) {
        setSelectedId(null);
        setMessages([]);
      }
      toast.success('Conversation archived');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive');
    }
  };

  const getOtherParticipant = (convo: Conversation) => {
    return convo.participants?.find((p) => p.id !== user?.id) || convo.participants?.[0];
  };

  const selectedConvo = convos.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Guest conversations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Conversation list */}
        <Card className="md:col-span-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b font-medium text-sm">Conversations</div>
          <ScrollArea className="flex-1">
            {isLoadingConvos ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : convos.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                No conversations yet
              </div>
            ) : (
              <div className="space-y-0.5 p-1">
                {convos.map((convo) => {
                  const other = getOtherParticipant(convo);
                  return (
                    <button
                      key={convo.id}
                      onClick={() => setSelectedId(convo.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-md hover:bg-accent transition-colors',
                        selectedId === convo.id && 'bg-accent'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {other?.firstName} {other?.lastName}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleArchive(convo.id); }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Archive className="h-3 w-3" />
                        </button>
                      </div>
                      {convo.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {convo.lastMessage.content}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Message area */}
        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select a conversation
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-3 border-b font-medium text-sm">
                {(() => {
                  const other = selectedConvo ? getOtherParticipant(selectedConvo) : null;
                  return other ? `${other.firstName} ${other.lastName}` : 'Chat';
                })()}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {isLoadingMessages ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-2/3" />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                          <div
                            className={cn(
                              'max-w-[70%] rounded-lg px-3 py-2',
                              isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={cn(
                              'text-xs mt-1',
                              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}>
                              {format(new Date(msg.createdAt), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isSending}
                />
                <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
