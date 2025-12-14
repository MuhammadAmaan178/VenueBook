import React from 'react';
import { API_BASE_URL } from '../services/api';
import { usePagination } from '../hooks/usePagination';
import Pagination from './Pagination';

/**
 * Example component showing how to use pagination with venues API
 * You can adapt this pattern for any paginated data
 */
const VenueListWithPagination = () => {
    // Use the pagination hook with your API endpoint
    const {
        data,
        loading,
        error,
        currentPage,
        totalPages,
        goToPage
    } = usePagination(`${API_BASE_URL}/api/venues`, {
        sort_by: 'rating',
        sort_order: 'desc'
    });

    if (loading) {
        return (
            <div className="loading-container">
                <p>Loading venues...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p>Error loading venues: {error}</p>
            </div>
        );
    }

    return (
        <div className="venue-list-container">
            <h2>Venues</h2>

            {/* Display your data */}
            <div className="venues-grid">
                {data?.venues?.map((venue) => (
                    <div key={venue.venue_id} className="venue-card">
                        <h3>{venue.name}</h3>
                        <p>{venue.city}</p>
                        <p>Rating: {venue.rating}</p>
                        <p>Price: ${venue.base_price}</p>
                    </div>
                ))}
            </div>

            {/* Pagination component */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
            />

            {/* Optional: Show page info */}
            <div className="page-info">
                Page {currentPage} of {totalPages} ({data?.total_venues || 0} total venues)
            </div>
        </div>
    );
};

export default VenueListWithPagination;
