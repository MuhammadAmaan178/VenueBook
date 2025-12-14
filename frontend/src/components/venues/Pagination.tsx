// src/components/venues/Pagination.jsx
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
    if (totalPages <= 1) return null;

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    const baseButtonClasses = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 border";
    const defaultButtonClasses = `${baseButtonClasses} bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900`;
    const activeButtonClasses = `${baseButtonClasses} bg-blue-600 text-white border-blue-600 shadow-sm`;

    return (
        <div className="flex items-center justify-center gap-2 mt-12 flex-wrap">
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`${defaultButtonClasses} flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 min-w-[100px] justify-center`}
            >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
            </button>

            {/* First Page */}
            {startPage > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        className={defaultButtonClasses}
                    >
                        1
                    </button>
                    {startPage > 2 && (
                        <span className="px-2 text-gray-400">...</span>
                    )}
                </>
            )}

            {/* Page Numbers */}
            {pages.map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={currentPage === page ? activeButtonClasses : defaultButtonClasses}
                >
                    {page}
                </button>
            ))}

            {/* Last Page */}
            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                    )}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        className={defaultButtonClasses}
                    >
                        {totalPages}
                    </button>
                </>
            )}

            {/* Next Button */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`${defaultButtonClasses} flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 min-w-[100px] justify-center`}
            >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
};

export default Pagination;