import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const AvailabilityCalendar = ({ availability = [], onChange }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    // Helper to get days in month
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Helper to get day of week for first day (0=Sun, 6=Sat)
    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const formatDate = (year, month, day) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    // Slots definitions
    const TIME_SLOTS = [
        { id: 'morning', label: 'Morning' },
        { id: 'evening', label: 'Evening' },
        { id: 'full_day', label: 'Full Day' }
    ];

    const getSlotsForDate = (dateStr) => {
        return availability.find(a => a.date === dateStr)?.slots || [];
    };

    const handleDateClick = (day) => {
        const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(dateStr);
    };

    const toggleSlot = (slotId) => {
        if (!selectedDate) return;

        const currentSlots = getSlotsForDate(selectedDate);
        let newSlots;

        if (currentSlots.includes(slotId)) {
            newSlots = currentSlots.filter(s => s !== slotId);
        } else {
            newSlots = [...currentSlots, slotId];
        }

        // Update parent state
        // Remove existing entry for this date
        const otherEntries = availability.filter(a => a.date !== selectedDate);

        if (newSlots.length > 0) {
            onChange([...otherEntries, { date: selectedDate, slots: newSlots }]);
        } else {
            onChange(otherEntries);
        }
    };

    // Generate calendar grid
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const days = [];

    // Empty cells for padding
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/50 border border-gray-100/50" />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
        const slots = getSlotsForDate(dateStr);
        const isActive = selectedDate === dateStr;
        const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

        days.push(
            <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`h-24 border border-gray-100 p-2 cursor-pointer transition-all relative group hover:border-blue-200
                    ${isActive ? 'ring-2 ring-blue-500 bg-blue-50 z-10' : 'bg-white'}
                    ${isToday ? 'bg-blue-50/30 font-semibold' : ''}
                `}
            >
                <span className={`text-sm ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</span>

                {/* Slot Indicators */}
                <div className="mt-2 flex flex-wrap gap-1">
                    {slots.map(slot => (
                        <span key={slot} className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize truncate w-full text-center
                            ${slot === 'morning' ? 'bg-orange-100 text-orange-700' :
                                slot === 'evening' ? 'bg-indigo-100 text-indigo-700' :
                                    'bg-green-100 text-green-700'}
                        `}>
                            {slot.replace('_', ' ')}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-4 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900 text-lg">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="flex gap-2">
                    <button type="button" onClick={prevMonth} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all shadow-sm">
                        <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <button type="button" onClick={nextMonth} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all shadow-sm">
                        <ChevronRight size={20} className="text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 border-b border-gray-100 text-center py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wide">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="grid grid-cols-7">
                {days}
            </div>

            {/* Slot Selection Popover (Integrated below for simplicity) */}
            {selectedDate && (
                <div className="p-4 bg-blue-50/50 border-t border-blue-100 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-900">Availability for {selectedDate}</h4>
                        <button type="button" onClick={() => setSelectedDate(null)} className="text-xs text-blue-600 hover:underline">Done</button>
                    </div>
                    <div className="flex gap-3">
                        {TIME_SLOTS.map(slot => {
                            const isSelected = getSlotsForDate(selectedDate).includes(slot.id);
                            return (
                                <button
                                    key={slot.id}
                                    type="button"
                                    onClick={() => toggleSlot(slot.id)}
                                    className={`flex-1 py-2 px-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${isSelected
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                                        }`}
                                >
                                    {isSelected && <Check size={14} strokeWidth={3} />}
                                    {slot.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailabilityCalendar;
