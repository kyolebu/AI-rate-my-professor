// components/FilterComponent.jsx
import { useState, useEffect } from 'react';
import { MenuItem, FormControl, Select, InputLabel, Box, Paper } from '@mui/material';

export default function FilterComponent({ onFilterChange }) {
    const [subjects, setSubjects] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedRating, setSelectedRating] = useState('');

    useEffect(() => {
        async function fetchFilters() {
            const response = await fetch('/api/filters');
            const data = await response.json();
            setSubjects(data.subjects);
            setRatings(data.ratings);
        }

        fetchFilters();
    }, []);

    useEffect(() => {
        onFilterChange({ subject: selectedSubject, minRating: selectedRating });
    }, [selectedSubject, selectedRating]);

    return (
        <Paper 
            elevation={3}
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1100,
                padding: 2,
                backgroundColor: 'white',
            }}
        >
            <Box display="flex" flexDirection="row" gap={2} width="100%">
                <FormControl fullWidth>
                    <InputLabel id="subject-label">Subject</InputLabel>
                    <Select
                        labelId="subject-label"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                        {subjects.map((subject) => (
                            <MenuItem key={subject} value={subject}>
                                {subject}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel id="rating-label">Rating</InputLabel>
                    <Select
                        labelId="rating-label"
                        value={selectedRating}
                        onChange={(e) => setSelectedRating(e.target.value)}
                    >
                        {ratings.map((rating) => (
                            <MenuItem key={rating} value={rating}>
                                {rating} stars
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        </Paper>
    );
}
