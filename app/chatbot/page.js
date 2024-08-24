'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Box, Stack } from '@mui/material'
import { useState } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
    },
  ])
  const [message, setMessage] = useState('')

  const parseUserCriteria = (message) => {
    const criteria = {
      subject: null,
      minRating: null,
    };

    function extractValue(message, key) {
      const regex = new RegExp(`${key}:\\s*\\[(.*?)\\]`, 'i');
      const match = message.match(regex);
      return match ? match[1].trim() : null;
    }
  
    if (message.toLowerCase().includes('subject:')) {
      criteria.subject = extractValue(message, 'subject');
    }
    if (message.toLowerCase().includes('rating:')) {
      criteria.minRating = parseInt(extractValue(message, 'rating') || '0');
    }

    console.log(criteria)
  
    return criteria;
  };

  const sendMessage = async () => {
    const criteria = parseUserCriteria(message);
    
    setMessages((messages) => [
      ...messages,
      {role: 'user', content: message},
      {role: 'assistant', content: ''},
    ])
    
    setMessage('')
    const response = fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, {role: 'user', content: message, criteria}]),
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let result = ''
  
      return reader.read().then(function processText({done, value}) {
        if (done) {
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), {stream: true})
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            {...lastMessage, content: lastMessage.content + text},
          ]
        })
        return reader.read().then(processText)
      })
    })
  }
  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      backgroundColor="#1A1A1A"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        p={2}
        spacing={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? '#FFFFFF'
                    : '#FCD19C'
                }
                color="black"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <Textarea
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Try: 'Find a professor for subject: [Math], rating: [4]'"
          />
          <Button style={{ backgroundColor: "#FCD19C", color: 'black', height: '80px' }} variant="contained" onClick={sendMessage}>
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}