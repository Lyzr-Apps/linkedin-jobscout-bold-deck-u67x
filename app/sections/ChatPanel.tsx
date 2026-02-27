'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { FiSend, FiX } from 'react-icons/fi'
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatPanelProps {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  isSending: boolean
  isResultsMode: boolean
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-xs mt-2 mb-0.5">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-sm mt-2 mb-0.5">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-sm mt-2 mb-1">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-3 list-disc text-xs">
              {formatInlineChat(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-3 list-decimal text-xs">
              {formatInlineChat(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-0.5" />
        return (
          <p key={i} className="text-xs">
            {formatInlineChat(line)}
          </p>
        )
      })}
    </div>
  )
}

function formatInlineChat(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

export default function ChatPanel({
  isOpen,
  setIsOpen,
  messages,
  onSendMessage,
  isSending,
  isResultsMode,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const safeMessages = Array.isArray(messages) ? messages : []

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [safeMessages.length])

  const handleSend = () => {
    if (inputValue.trim() && !isSending) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 h-10 w-10 p-0 border-border bg-card shadow-lg"
      >
        <HiOutlineChatBubbleLeftRight className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Card className="border-border bg-card h-full flex flex-col">
      <CardHeader className="py-2.5 px-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium flex items-center gap-1.5">
            <HiOutlineChatBubbleLeftRight className="h-3.5 w-3.5" />
            Follow-up Chat
          </CardTitle>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-accent transition-colors"
          >
            <FiX className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>
      <Separator className="bg-border" />
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {safeMessages.length === 0 && (
          <div className="text-center py-8">
            <HiOutlineChatBubbleLeftRight className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-xs text-muted-foreground">
              {isResultsMode
                ? 'Ask follow-up questions about your job matches'
                : 'Chat will be available after your first search'}
            </p>
          </div>
        )}
        {safeMessages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              'space-y-1',
              msg.role === 'user' ? 'text-right' : 'text-left'
            )}
          >
            <div
              className={cn(
                'inline-block max-w-[90%] px-3 py-2 text-left',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent text-accent-foreground'
              )}
            >
              {msg.role === 'assistant'
                ? renderMarkdown(msg.content)
                : <p className="text-xs">{msg.content}</p>}
            </div>
            <p className="text-[9px] text-muted-foreground px-1">{msg.timestamp}</p>
          </div>
        ))}
        {isSending && (
          <div className="text-left">
            <div className="inline-block bg-accent px-3 py-2">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 bg-muted-foreground animate-pulse" />
                <div className="h-1.5 w-1.5 bg-muted-foreground animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="h-1.5 w-1.5 bg-muted-foreground animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
      </div>
      <Separator className="bg-border" />
      <div className="p-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isResultsMode ? 'Ask about matches...' : 'Run a search first...'}
            disabled={!isResultsMode || isSending}
            className="h-8 text-xs bg-background border-border"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending || !isResultsMode}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <FiSend className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
