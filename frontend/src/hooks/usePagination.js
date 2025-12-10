import { useState, useEffect } from 'react';

/**
 * Custom hook for managing paginated API data
 * @param {string} apiEndpoint - The API endpoint to fetch data from
 * @param {object} params - Additional query parameters (excluding page)
 * @returns {object} - { data, loading, error, currentPage, totalPages, goToPage, nextPage, prevPage }
 */
export const usePagination = (apiEndpoint, params = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Build query string with page and additional params
                const queryParams = new URLSearchParams({
                    page: currentPage,
                    ...params
                });

                const response = await fetch(`${apiEndpoint}?${queryParams}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                // Handle API response format
                setData(result);
                setTotalPages(result.total_pages || 1);

            } catch (err) {
                setError(err.message);
                console.error('Pagination fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [apiEndpoint, currentPage, JSON.stringify(params)]);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    return {
        data,
        loading,
        error,
        currentPage,
        totalPages,
        goToPage,
        nextPage,
        prevPage
    };
};
