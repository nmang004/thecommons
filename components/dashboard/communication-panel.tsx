'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Send,
  Mail,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  FileText,
  MessageSquare,
  X,
  Reply
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  manuscript_id: string
  sender_id: string
  recipient_id: string
  message: string
  message_type: 'general' | 'request' | 'decision' | 'revision' | 'system'
  parent_message_id?: string
  is_read: boolean
  created_at: string
  updated_at: string
  sender_name: string
  sender_role: string
  recipient_name: string
  recipient_role: string
}

interface CommunicationPanelProps {
  manuscript: {
    id: string
    title: string
    author_id: string
    profiles?: {
      full_name: string
      email: string
    }
  }
  currentUser: {
    id: string
    full_name: string
    role: string
  }
  onClose?: () => void
  initialThreadId?: string
}

const MESSAGE_TYPES = {
  general: {
    label: 'General',
    color: 'bg-gray-100 text-gray-800',
    icon: MessageSquare
  },
  request: {
    label: 'Request',
    color: 'bg-blue-100 text-blue-800',
    icon: FileText
  },
  decision: {
    label: 'Decision',
    color: 'bg-purple-100 text-purple-800',
    icon: CheckCheck
  },
  revision: {
    label: 'Revision',
    color: 'bg-orange-100 text-orange-800',
    icon: AlertCircle
  },
  system: {
    label: 'System',
    color: 'bg-green-100 text-green-800',
    icon: Check
  }
}

export function CommunicationPanel({ 
  manuscript, 
  currentUser, 
  onClose
}: CommunicationPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [messageType, setMessageType] = useState<keyof typeof MESSAGE_TYPES>('general')
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load messages for this manuscript
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/manuscripts/${manuscript.id}/messages`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
          
          // Mark unread messages as read
          const unreadMessages = data.messages?.filter(
            (m: Message) => !m.is_read && m.recipient_id === currentUser.id
          ) || []
          
          if (unreadMessages.length > 0) {
            await markMessagesAsRead(unreadMessages.map((m: Message) => m.id))
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [manuscript.id, currentUser.id])

  // Auto-scroll on messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus textarea when replying
  useEffect(() => {
    if (replyToMessage && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyToMessage])

  const markMessagesAsRead = async (messageIds: string[]) => {
    try {
      await fetch('/api/manuscripts/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds })
      })
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg.id) 
            ? { ...msg, is_read: true }
            : msg
        )
      )
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const recipientId = currentUser.role === 'author' 
        ? manuscript.author_id // If author, send to assigned editor (would need to fetch)
        : manuscript.author_id // If editor, send to author

      const messageData = {
        manuscript_id: manuscript.id,
        recipient_id: recipientId,
        message: newMessage.trim(),
        message_type: messageType,
        parent_message_id: replyToMessage?.id
      }

      const response = await fetch('/api/manuscripts/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        setReplyToMessage(null)
        setMessageType('general')
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Could show error toast here
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 7 * 24) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  const getMessageTypeConfig = (type: string) => {
    return MESSAGE_TYPES[type as keyof typeof MESSAGE_TYPES] || MESSAGE_TYPES.general
  }

  // Group messages into threads
  const messageThreads = messages.reduce((threads, message) => {
    const rootId = message.parent_message_id || message.id
    if (!threads[rootId]) {
      threads[rootId] = []
    }
    threads[rootId].push(message)
    return threads
  }, {} as Record<string, Message[]>)

  // Sort threads by latest message
  const sortedThreads = Object.values(messageThreads).sort((a, b) => {
    const aLatest = Math.max(...a.map(m => new Date(m.created_at).getTime()))
    const bLatest = Math.max(...b.map(m => new Date(m.created_at).getTime()))
    return bLatest - aLatest
  })

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-heading font-semibold text-gray-900">
              Communication
            </h3>
            <p className="text-sm text-gray-600 line-clamp-1">
              {manuscript.title}
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-6">
          {sortedThreads.length > 0 ? (
            sortedThreads.map((thread) => {
              const rootMessage = thread.find(m => !m.parent_message_id) || thread[0]
              const replies = thread.filter(m => m.parent_message_id)
              
              return (
                <div key={rootMessage.id} className="space-y-3">
                  {/* Root Message */}
                  <div className="flex space-x-3">
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback>
                        {rootMessage.sender_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {rootMessage.sender_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {rootMessage.sender_role}
                        </Badge>
                        <Badge className={cn('text-xs', getMessageTypeConfig(rootMessage.message_type).color)}>
                          {getMessageTypeConfig(rootMessage.message_type).label}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(rootMessage.created_at)}
                        </span>
                        {!rootMessage.is_read && rootMessage.recipient_id === currentUser.id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="bg-white border rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {rootMessage.message}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setReplyToMessage(rootMessage)}
                          className="text-xs"
                        >
                          <Reply className="w-3 h-3 mr-1" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div className="ml-11 space-y-3 border-l-2 border-gray-100 pl-4">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex space-x-3">
                          <Avatar className="w-6 h-6 mt-1">
                            <AvatarFallback className="text-xs">
                              {reply.sender_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-gray-900">
                                {reply.sender_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatMessageTime(reply.created_at)}
                              </span>
                              {!reply.is_read && reply.recipient_id === currentUser.id && (
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <div className="bg-gray-50 border rounded-lg p-2">
                              <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                {reply.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h4>
              <p className="text-gray-600 text-sm">
                Start a conversation about this manuscript.
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply Context */}
      {replyToMessage && (
        <div className="px-4 py-3 bg-gray-50 border-t border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Reply className="w-4 h-4" />
              <span>Replying to {replyToMessage.sender_name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyToMessage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {replyToMessage.message}
          </p>
        </div>
      )}

      {/* Message Compose */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2 mb-3">
          <select
            value={messageType}
            onChange={(e) => setMessageType(e.target.value as keyof typeof MESSAGE_TYPES)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            {Object.entries(MESSAGE_TYPES).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex space-x-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Write a ${MESSAGE_TYPES[messageType].label.toLowerCase()} message...`}
            rows={3}
            className="flex-1 resize-none text-sm"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            size="sm"
            className="self-end"
          >
            {sending ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Press Ctrl/Cmd + Enter to send quickly
        </p>
      </div>
    </Card>
  )
}