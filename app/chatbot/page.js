'use client';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import FilterComponent from '../components/FilterComponent';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
    },
  ]);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ role: '', minRating: '' });
  const [searchCompany, setSearchCompany] = useState('');

  // Function to handle sending company name for scraping
  const handleSearchCompany = async () => {
    if (!searchCompany) {
      alert('Please enter a company name');
      return;
    }

    try {
      const response = await fetch('/api/search-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: searchCompany }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages((messages) => [
          ...messages,
          { role: 'user', content: `Searching for reviews of ${searchCompany}` },
          { role: 'assistant', content: 'Scraping data...' },
        ]);
        setSearchCompany('');
      } else {
        setMessages((messages) => [
          ...messages,
          { role: 'assistant', content: `Error: ${data.error}` },
        ]);
      }
    } catch (error) {
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: `Error: ${error.message}` },
      ]);
    }
  };

  const sendMessage = async () => {
    const criteria = { ...filters };
    
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);
    
    setMessage('');
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, { role: 'user', content: message, criteria }]),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';

    const processText = async ({ done, value }) => {
      if (done) {
        return result;
      }
      const text = decoder.decode(value || new Uint8Array(), { stream: true });
      setMessages((messages) => {
        let lastMessage = messages[messages.length - 1];
        let otherMessages = messages.slice(0, messages.length - 1);
        return [
          ...otherMessages,
          { ...lastMessage, content: lastMessage.content + text },
        ];
      });
      result += text;
      return reader.read().then(processText);
    };

    await reader.read().then(processText);
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="row"
      alignItems="flex-start"
      sx={{
        pt: { xs: '120px', sm: '80px' }, // Add top padding to accommodate the fixed filter
      }}
    >
      <Box
        width="300px"
        height="100vh"
        display="flex"
        flexDirection="column"
        p={2}
        borderRight="1px solid black"
      >
        <Typography variant="h6" mb={2}>
          Retrieve company data
        </Typography>
        <TextField
          label="Search Company"
          value={searchCompany}
          onChange={(e) => setSearchCompany(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button 
          style={{ backgroundColor: "#FF4433" }} 
          variant="contained" 
          onClick={handleSearchCompany}
        >
          Search Company
        </Button>
        <FilterComponent onFilterChange={(filters) => setFilters(filters)} />
      </Box>
      <Stack
        direction={'column'}
        width="calc(100% - 300px)"
        height="100vh"
        borderLeft="1px solid black"
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
                    ? '#2E2E2E'
                    : '#FF4433'
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            helperText="Ask about company reviews or filter by company and rating"
          />
          <Button 
            style={{ backgroundColor: "#FF4433" }} 
            variant="contained" 
            onClick={sendMessage}
          >
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
