import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Calendar } from 'lucide-react';

// --- Reusable Custom Dropdown ---
export const CustomDropdown = ({ icon, label, value, options, onChange, displayValue }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getDisplayLabel = () => {
        if (displayValue) return displayValue(value);
        if (!value || value === `All ${label}s`) return `All ${label}`;
        // Handle object options vs string options
        if (options.length > 0 && typeof options[0] === 'object') {
            const selected = options.find(opt => opt.value === value);
            return selected ? selected.label : value;
        }
        return value;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2 ml-1">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">{icon}</span>
                {label}
            </label>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-14 bg-white/80 backdrop-blur-sm border text-left px-5 rounded-2xl flex items-center justify-between transition-all duration-300 group ${isOpen
                    ? "border-blue-500 ring-4 ring-blue-100 shadow-lg bg-white"
                    : "border-gray-200 hover:border-blue-400 hover:shadow-md hover:bg-white"
                    }`}
            >
                <span className="font-semibold truncate text-gray-900">{getDisplayLabel()}</span>
                <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-all duration-300 group-hover:text-blue-500 ${isOpen ? "transform rotate-180 text-blue-600" : ""
                        }`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    <div className="p-2 space-y-1">
                        {options.map((option) => {
                            const optValue = typeof option === 'object' ? option.value : option;
                            const optLabel = typeof option === 'object' ? option.label : option;
                            const isSelected = value === optValue;

                            return (
                                <button
                                    key={optValue}
                                    onClick={() => {
                                        onChange(optValue);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${isSelected
                                        ? "bg-blue-50 text-blue-700 shadow-sm"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1"
                                        }`}
                                >
                                    <span>{optLabel}</span>
                                    {isSelected && (
                                        <Check className="h-4 w-4 text-blue-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Enhanced Date Range Filter ---
export const DateRangeFilter = ({ startDate, endDate, onDateChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const [tempStart, setTempStart] = useState(startDate || '');
    const [tempEnd, setTempEnd] = useState(endDate || '');
    const [preset, setPreset] = useState('custom');

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setTempStart(startDate || '');
        setTempEnd(endDate || '');
        if (!startDate && !endDate) setPreset('all');
    }, [startDate, endDate]);

    const presets = [
        { label: 'All Time', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'Last 7 Days', value: 'last7' },
        { label: 'Last 30 Days', value: 'last30' },
        { label: 'This Month', value: 'thisMonth' },
        { label: 'Last Month', value: 'lastMonth' },
    ];

    const applyPreset = (presetValue) => {
        setPreset(presetValue);
        const today = new Date();
        let start = '';
        let end = '';

        const formatDate = (date) => date.toISOString().split('T')[0];

        switch (presetValue) {
            case 'today':
                start = end = formatDate(today);
                break;
            case 'yesterday':
                const yest = new Date(today);
                yest.setDate(yest.getDate() - 1);
                start = end = formatDate(yest);
                break;
            case 'last7':
                end = formatDate(today);
                const last7 = new Date(today);
                last7.setDate(last7.getDate() - 6);
                start = formatDate(last7);
                break;
            case 'last30':
                end = formatDate(today);
                const last30 = new Date(today);
                last30.setDate(last30.getDate() - 29);
                start = formatDate(last30);
                break;
            case 'thisMonth':
                start = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
                end = formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
                break;
            case 'lastMonth':
                start = formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1));
                end = formatDate(new Date(today.getFullYear(), today.getMonth(), 0));
                break;
            case 'all':
            default:
                start = '';
                end = '';
                break;
        }

        setTempStart(start);
        setTempEnd(end);
        onDateChange(start, end);
        setIsOpen(false);
    };

    const handleManualApply = () => {
        setPreset('custom');
        onDateChange(tempStart, tempEnd);
        setIsOpen(false);
    };

    const getDisplayText = () => {
        if (startDate && endDate) {
            if (startDate === endDate) return new Date(startDate).toLocaleDateString();
            return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
        }
        if (startDate) return `From ${new Date(startDate).toLocaleDateString()}`;
        if (endDate) return `Until ${new Date(endDate).toLocaleDateString()}`;
        return 'All Time';
    };

    return (
        <div className="relative col-span-1 md:col-span-2" ref={containerRef}>
            <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2 ml-1">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Calendar className="w-5 h-5" /></span>
                Date Range
            </label>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-14 bg-white/80 backdrop-blur-sm border text-left px-5 rounded-2xl flex items-center justify-between transition-all duration-300 group ${isOpen
                    ? "border-blue-500 ring-4 ring-blue-100 shadow-lg bg-white"
                    : "border-gray-200 hover:border-blue-400 hover:shadow-md hover:bg-white"
                    }`}
            >
                <div className="flex flex-col justify-center">
                    <span className="font-semibold truncate text-gray-900">{getDisplayText()}</span>
                    {preset !== 'custom' && preset !== 'all' && (
                        <span className="text-xs text-blue-600 font-medium">{presets.find(p => p.value === preset)?.label}</span>
                    )}
                </div>
                <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-all duration-300 group-hover:text-blue-500 ${isOpen ? "transform rotate-180 text-blue-600" : ""
                        }`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col md:flex-row">
                        {/* Presets Sidebar */}
                        <div className="w-full md:w-40 bg-gray-50/80 p-2 border-b md:border-b-0 md:border-r border-gray-100 grid grid-cols-2 md:grid-cols-1 gap-1">
                            {presets.map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => applyPreset(p.value)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${preset === p.value
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Inputs */}
                        <div className="p-4 flex-1">
                            <h4 className="text-sm font-bold text-gray-900 mb-3">Custom Range</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={tempStart}
                                        onChange={(e) => setTempStart(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">End Date</label>
                                    <input
                                        type="date"
                                        value={tempEnd}
                                        onChange={(e) => setTempEnd(e.target.value)}
                                        min={tempStart}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="pt-2 flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleManualApply}
                                        className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                                    >
                                        Apply Range
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
