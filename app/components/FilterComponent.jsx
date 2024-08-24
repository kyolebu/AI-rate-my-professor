// components/FilterComponent.jsx
import { useState, useEffect } from 'react';
import { MenuItem, FormControl, Select, InputLabel, Box, Paper } from '@mui/material';

export default function FilterComponent({ onFilterChange }) {
    const [companies, setCompanies] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedRating, setSelectedRating] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchFilters() {
            try {
                const response = await fetch('/api/filters');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data.companies && Array.isArray(data.companies)) {
                    setCompanies(data.companies);
                } else {
                    setError('No companies data available');
                }
                if (data.ratings && Array.isArray(data.ratings)) {
                    setRatings(data.ratings);
                } else {
                    setError('No ratings data available');
                }
            } catch (e) {
                console.error('Error fetching filters:', e);
                setError('Failed to load filters. Please try again later.');
            }
        }

        fetchFilters();
    }, []);

    useEffect(() => {
        onFilterChange({ company: selectedCompany, minRating: selectedRating });
    }, [selectedCompany, selectedRating]);

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
                    <InputLabel id="company-label">Company</InputLabel>
                    <Select
                        labelId="company-label"
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
                        {companies.map((company) => (
                            <MenuItem key={company} value={company}>
                                {company}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel id="rating-label">Minimum Rating</InputLabel>
                    <Select
                        labelId="rating-label"
                        value={selectedRating}
                        onChange={(e) => setSelectedRating(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
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