import React from 'react';
import './Pagination.css';

/**
 * Pagination component that renders page number buttons
 * @param {number} currentPage - The current active page
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback function when page is changed
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    // Don't render if there's only one page or no pages
    if (totalPages <= 1) return null;

    // Generate array of page numbers [1, 2, 3, ..., totalPages]
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="pagination-container">
            <button
                className="pagination-btn pagination-nav"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Previous
            </button>

            <div className="pagination-numbers">
                {pageNumbers.map((pageNum) => (
                    <button
                        key={pageNum}
                        className={`pagination-btn pagination-number ${currentPage === pageNum ? 'active' : ''
                            }`}
                        onClick={() => onPageChange(pageNum)}
                        disabled={currentPage === pageNum}
                    >
                        {pageNum}
                    </button>
                ))}
            </div>

            <button
                className="pagination-btn pagination-nav"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;
