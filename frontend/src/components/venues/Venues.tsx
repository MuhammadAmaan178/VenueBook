// src/components/venues/Venues.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer";
import SearchFilters, { FilterState } from "./SearchFilters";
import VenueGrid from "./VenueGrid";
import Pagination from "./Pagination";
import { venueService } from "../../services/api";

const ITEMS_PER_PAGE = 15;

// Define types
interface Venue {
    id: number;
    name: string;
    image: string;
    rating: number;
    price: number;
    city: string;
    type: string;
    capacity: string;
}

interface PaginationInfo {
    totalPages: number;
    totalVenues: number;
}

const Venues = () => {
    // State initialization with proper types
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filters, setFilters] = useState<FilterState>({
        city: "All Cities",
        type: "All Types",
        capacity: "All Capacity",
        range: "All Range",
    });
    const [sortBy, setSortBy] = useState<string>("popularity");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null); // Fixed: string | null
    const [pagination, setPagination] = useState<PaginationInfo>({
        totalPages: 1,
        totalVenues: 0
    });

    const [searchParams, setSearchParams] = useSearchParams();

    // Fetch venues from API
    const fetchVenues = async () => {
        try {
            setLoading(true);
            setError(null); // This works because null is allowed

            // Convert local sort to API sort
            let sort_by = "rating";
            let sort_order = "desc";

            switch (sortBy) {
                case "price-low":
                    sort_by = "price";
                    sort_order = "asc";
                    break;
                case "price-high":
                    sort_by = "price";
                    sort_order = "desc";
                    break;
                case "rating":
                    sort_by = "rating";
                    sort_order = "desc";
                    break;
                case "popularity":
                default:
                    sort_by = "rating";
                    sort_order = "desc";
            }

            const apiFilters = {
                ...filters,
                search: searchQuery,
                sort_by,
                sort_order,
                page: currentPage
            };

            const data = await venueService.getVenues(apiFilters);

            // Transform API response to match local Venue type
            const transformedVenues: Venue[] = (data.venues || []).map((venue: any) => ({
                id: venue.venue_id,
                name: venue.name,
                image: venue.image_url || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                rating: parseFloat(venue.rating) || 4.0,
                price: parseFloat(venue.base_price) || 0,
                city: venue.city,
                type: venue.type,
                capacity: venue.capacity?.toString() || "100-200"
            }));

            setVenues(transformedVenues);
            setPagination({
                totalPages: data.total_pages || 1,
                totalVenues: data.total_venues || 0
            });
        } catch (err) {
            // Type-safe error handling
            if (err instanceof Error) {
                setError(err.message); // This now works because setError accepts string
            } else {
                setError("Failed to fetch venues. Please try again.");
            }
            console.error("Error fetching venues:", err);
            setVenues([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch venues when filters, search, sort, or page changes
    useEffect(() => {
        fetchVenues();
    }, [searchQuery, filters, sortBy, currentPage]);

    useEffect(() => {
        const params: Record<string, string> = {};
        for (const [key, value] of searchParams.entries()) {
            if (value) params[key] = value;
        }
        setFilters(prev => ({ ...prev, ...params }));
    }, [searchParams]);

    // Handlers
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handleFilterChange = (newFilters: FilterState) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleSortChange = (sort: string) => {
        setSortBy(sort);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Use venues directly from API (backend handles pagination)
    const paginatedVenues = venues;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-12">
                <SearchFilters
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                />

                {loading && venues.length === 0 ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        Error: {error}
                    </div>
                ) : (
                    <>
                        <VenueGrid
                            venues={paginatedVenues}
                            totalResults={pagination.totalVenues}
                            sortBy={sortBy}
                            onSortChange={handleSortChange}
                        />

                        {pagination.totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Venues;