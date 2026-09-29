import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  Info,
  CheckCircle2,
  Sparkles,
  Sun,
  User,
  AlertCircle,
} from 'lucide-react';
import type { AvailableSlot, SalonConfig, Service, Staff } from '../../types';

interface BookingCalendarProps {
  config: SalonConfig | null;
  service: Service | undefined;
  staff: Staff | undefined;
  selectedStaffId: string;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  availableSlots: AvailableSlot[];
  loadingSlots: boolean;
  selectedSlot: AvailableSlot | null;
  onSelectSlot: (slot: AvailableSlot) => void;
  slotNotice?: string;
  errorMessage?: string;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  config,
  service,
  staff,
  selectedStaffId,
  selectedDate,
  onSelectDate,
  availableSlots,
  loadingSlots,
  selectedSlot,
  onSelectSlot,
  slotNotice,
  errorMessage,
}) => {
  // Current month view state (defaults to month of selectedDate or current date)
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selectedDate) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  // Time of day filter
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekDayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Navigate months
  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (prev >= minMonth) {
      setViewDate(prev);
    }
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const isPrevMonthDisabled = useMemo(() => {
    const currentViewMonth = new Date(year, month, 1);
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentViewMonth <= minMonth;
  }, [year, month, today]);

  // Calendar cells calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Monday is 0 in UK calendar: (dayOfWeek + 6) % 7
    const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isToday: boolean;
      isSelected: boolean;
      isOpen: boolean;
      isClosure: boolean;
      closureReason?: string;
      hoursInfo?: string;
    }> = [];

    // Empty cells for previous month padding
    for (let i = 0; i < startingDayIndex; i++) {
      days.push({
        dateStr: '',
        dayNumber: 0,
        isCurrentMonth: false,
        isPast: true,
        isToday: false,
        isSelected: false,
        isOpen: false,
        isClosure: false,
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;

      const isPast = dateObj < today;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;

      // Day of week in standard JS (0=Sun, 1=Mon, ..., 6=Sat)
      const dow = dateObj.getDay();

      // Check salon hours from config
      const hourConfig = config?.hours?.find((h) => h.day_of_week === dow);
      const isConfigOpen = hourConfig ? Boolean(hourConfig.is_open) : (dow >= 2 && dow <= 6); // default Tue-Sat

      // Check salon closures
      const closure = config?.closures?.find((c) => c.date === dateStr);
      const isClosure = Boolean(closure);
      const closureReason = closure?.reason;

      const isOpen = !isPast && isConfigOpen && !isClosure;

      let hoursInfo = '';
      if (hourConfig && hourConfig.is_open) {
        hoursInfo = `${hourConfig.open_time} - ${hourConfig.close_time}`;
      }

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isPast,
        isToday,
        isSelected,
        isOpen,
        isClosure,
        closureReason,
        hoursInfo,
      });
    }

    return days;
  }, [year, month, today, todayStr, selectedDate, config]);

  // Selected date info
  const selectedDateInfo = useMemo(() => {
    if (!selectedDate) return null;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dow = dateObj.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dow];

    const hourConfig = config?.hours?.find((h) => h.day_of_week === dow);
    const closure = config?.closures?.find((c) => c.date === selectedDate);

    const formattedFull = dateObj.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return {
      formattedFull,
      dayName,
      hourConfig,
      closure,
      isOpen: hourConfig?.is_open && !closure,
    };
  }, [selectedDate, config]);

  // Filter slots by morning / afternoon / evening
  const filteredSlots = useMemo(() => {
    if (!availableSlots) return [];
    if (timeFilter === 'all') return availableSlots;

    return availableSlots.filter((slot) => {
      const [hourStr] = slot.timeStr.split(':');
      const hour = parseInt(hourStr, 10);
      if (timeFilter === 'morning') return hour < 12;
      if (timeFilter === 'afternoon') return hour >= 12 && hour < 17;
      if (timeFilter === 'evening') return hour >= 17;
      return true;
    });
  }, [availableSlots, timeFilter]);

  // Quick Date Jump helpers
  const handleQuickJump = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const dStr = `${y}-${m}-${d}`;
    setViewDate(new Date(y, target.getMonth(), 1));
    onSelectDate(dStr);
  };

  const handleJumpToNextOpenSaturday = () => {
    const target = new Date();
    const currentDow = target.getDay();
    const daysUntilSaturday = (6 - currentDow + 7) % 7 || 7;
    target.setDate(target.getDate() + daysUntilSaturday);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const dStr = `${y}-${m}-${d}`;
    setViewDate(new Date(y, target.getMonth(), 1));
    onSelectDate(dStr);
  };

  return (
    <div className="space-y-6">
      {/* Service & Stylist Summary Header */}
      <div className="bg-[#181818] border border-[#2B2925] p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#24211D] border border-[#3E382E] flex items-center justify-center text-[#BFA57D]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[#8C8273] block text-[10px] uppercase font-semibold">Treatment</span>
            <strong className="text-[#F5F1EA] text-sm font-serif-heading">
              {service?.name || 'Selected Service'}
            </strong>{' '}
            <span className="text-[#A69B8D] font-mono">
              ({service?.duration_minutes}m + {service?.buffer_minutes || 15}m buffer)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:border-l sm:border-[#262626] sm:pl-4">
          <div className="w-8 h-8 rounded-full bg-[#24211D] border border-[#3E382E] overflow-hidden flex items-center justify-center text-[#BFA57D] shrink-0">
            {staff?.image_url ? (
              <img src={staff.image_url} alt={staff.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-[#8C8273] block text-[10px] uppercase font-semibold">Stylist</span>
            <strong className="text-[#F5F1EA] text-sm font-serif-heading">
              {selectedStaffId === 'any' ? 'Any Qualified Stylist' : staff?.name || 'Stylist'}
            </strong>
          </div>
        </div>
      </div>

      {/* Quick Date Jumper Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[#8C8273] text-[11px] whitespace-nowrap">Quick Jump:</span>
        <button
          type="button"
          onClick={() => handleQuickJump(0)}
          className="px-2.5 py-1 bg-[#1E1E1E] hover:bg-[#282828] border border-[#2F2F2F] text-[#D9D1C5] rounded-xs transition-colors whitespace-nowrap"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => handleQuickJump(1)}
          className="px-2.5 py-1 bg-[#1E1E1E] hover:bg-[#282828] border border-[#2F2F2F] text-[#D9D1C5] rounded-xs transition-colors whitespace-nowrap"
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={handleJumpToNextOpenSaturday}
          className="px-2.5 py-1 bg-[#1E1E1E] hover:bg-[#282828] border border-[#2F2F2F] text-[#D9D1C5] rounded-xs transition-colors whitespace-nowrap flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-[#BFA57D]" />
          <span>Next Saturday</span>
        </button>
      </div>

      {/* Main Grid: Calendar on Left, Time Slots on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Month Calendar (7 cols on lg) */}
        <div className="lg:col-span-7 bg-[#181818] border border-[#2B2925] rounded-sm p-5 space-y-4">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <h3 className="font-serif-heading text-xl text-[#F5F1EA] flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#BFA57D]" />
              <span>
                {monthNames[month]} {year}
              </span>
            </h3>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={isPrevMonthDisabled}
                className="p-1.5 rounded-sm border border-[#3A3A3A] bg-[#222] text-[#D9D1C5] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-sm border border-[#3A3A3A] bg-[#222] text-[#D9D1C5] hover:text-white transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDayHeaders.map((head, idx) => (
              <div
                key={head}
                className={`py-1 text-[11px] font-semibold uppercase tracking-wider ${
                  idx >= 5 ? 'text-[#BFA57D]' : 'text-[#8C8273]'
                }`}
              >
                {head}
              </div>
            ))}
          </div>

          {/* Calendar Month Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, idx) => {
              if (!day.isCurrentMonth) {
                return <div key={`empty-${idx}`} className="h-11 sm:h-12" />;
              }

              const isClickable = !day.isPast;

              let cellStyle = 'bg-[#141414] text-[#8C8273] border-[#222] cursor-not-allowed opacity-40';

              if (day.isSelected) {
                cellStyle =
                  'bg-[#9B8058] text-[#141414] font-bold border-[#BFA57D] shadow-md scale-[1.03] z-10';
              } else if (day.isPast) {
                cellStyle = 'bg-[#141414] text-[#444] border-transparent cursor-not-allowed opacity-40';
              } else if (day.isClosure) {
                cellStyle =
                  'bg-[#1C1717] text-[#A36E6E] border-red-950/50 hover:border-red-800 cursor-pointer';
              } else if (!day.isOpen) {
                cellStyle =
                  'bg-[#161616] text-[#736B60] border-transparent hover:border-[#333] cursor-pointer';
              } else {
                // Open, available future day
                cellStyle =
                  'bg-[#1C1B19] text-[#F5F1EA] border-[#2E2B26] hover:border-[#9B8058] hover:bg-[#25221D] cursor-pointer';
              }

              return (
                <button
                  type="button"
                  key={day.dateStr}
                  disabled={day.isPast}
                  onClick={() => isClickable && onSelectDate(day.dateStr)}
                  className={`h-11 sm:h-12 rounded-sm border p-1 flex flex-col items-center justify-between text-xs transition-all relative ${cellStyle}`}
                >
                  <span className="font-mono-numbers text-xs">{day.dayNumber}</span>

                  {/* Day mini label */}
                  {day.isClosure ? (
                    <span className="text-[9px] font-sans leading-none text-red-400 truncate max-w-full">
                      Closed
                    </span>
                  ) : !day.isOpen && !day.isPast ? (
                    <span className="text-[9px] font-sans leading-none text-[#736B60]">Off</span>
                  ) : day.isToday ? (
                    <span
                      className={`text-[9px] font-sans leading-none ${
                        day.isSelected ? 'text-[#141414] font-bold' : 'text-[#BFA57D]'
                      }`}
                    >
                      Today
                    </span>
                  ) : day.isOpen ? (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        day.isSelected ? 'bg-[#141414]' : 'bg-[#BFA57D]'
                      }`}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="pt-3 border-t border-[#262626] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8C8273]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#BFA57D]" />
              <span>Open & Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#736B60]" />
              <span>Salon Closed (Sun/Mon)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>Holiday Closure</span>
            </div>
          </div>
        </div>

        {/* Right Column: Time Slots for Selected Date (5 cols on lg) */}
        <div className="lg:col-span-5 bg-[#181818] border border-[#2B2925] rounded-sm p-5 space-y-4">
          <div className="border-b border-[#262626] pb-3">
            <span className="text-[10px] text-[#BFA57D] uppercase font-semibold tracking-wider block">
              Selected Date
            </span>
            <h4 className="font-serif-heading text-lg text-[#F5F1EA]">
              {selectedDateInfo?.formattedFull || selectedDate}
            </h4>

            {selectedDateInfo?.hourConfig && selectedDateInfo.hourConfig.is_open ? (
              <div className="flex items-center gap-1.5 text-xs text-[#A69B8D] mt-1">
                <Clock className="w-3.5 h-3.5 text-[#BFA57D]" />
                <span>
                  Operating Hours: {selectedDateInfo.hourConfig.open_time} –{' '}
                  {selectedDateInfo.hourConfig.close_time}
                </span>
                {selectedDateInfo.dayName === 'Thursday' && (
                  <span className="text-[10px] bg-[#24211D] border border-[#3E382E] text-[#BFA57D] px-1 py-0.2 rounded-xs ml-1">
                    Late Night
                  </span>
                )}
              </div>
            ) : selectedDateInfo?.closure ? (
              <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Special Closure: {selectedDateInfo.closure.reason}</span>
              </div>
            ) : (
              <div className="text-xs text-[#8C8273] mt-1">
                Salon is closed on {selectedDateInfo?.dayName || 'this day'}.
                {config?.hours?.some((h) => h.is_open) && (
                  <span className="block mt-0.5 text-[11px] text-[#A69B8D]">
                    Open days:{' '}
                    {config.hours
                      .filter((h) => h.is_open)
                      .map((h) => h.day_name)
                      .join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Time of Day Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {(
              [
                { id: 'all', label: 'All Slots' },
                { id: 'morning', label: 'Morning' },
                { id: 'afternoon', label: 'Afternoon' },
                { id: 'evening', label: 'Evening' },
              ] as const
            ).map((filter) => (
              <button
                type="button"
                key={filter.id}
                onClick={() => setTimeFilter(filter.id)}
                className={`px-2.5 py-1 text-xs rounded-xs transition-colors whitespace-nowrap ${
                  timeFilter === filter.id
                    ? 'bg-[#9B8058] text-[#141414] font-bold'
                    : 'bg-[#141414] text-[#8C8273] hover:text-[#D9D1C5]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Time Slots Area */}
          <div className="min-h-[220px]">
            {loadingSlots ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-[#9B8058] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#8C8273]">
                  Computing live slot availability from salon schedules...
                </p>
              </div>
            ) : slotNotice ? (
              <div className="p-4 bg-[#141414] border border-[#2B2925] rounded-sm text-center space-y-2 my-4">
                <Info className="w-5 h-5 text-[#BFA57D] mx-auto" />
                <p className="text-xs text-[#D9D1C5] font-medium">{slotNotice}</p>
                <p className="text-[11px] text-[#8C8273]">
                  Please pick another date on the calendar, or call 01527 577000.
                </p>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="p-5 bg-[#141414] border border-[#2B2925] rounded-sm text-center space-y-2 my-4">
                <p className="text-xs text-[#D9D1C5]">
                  {availableSlots.length > 0
                    ? `No ${timeFilter} slots available. Try switching filter to "All Slots".`
                    : 'No available appointment slots found for this date.'}
                </p>
                <p className="text-[11px] text-[#8C8273]">
                  Slots may be fully booked or restricted by the 2-hour minimum booking lead time.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#8C8273] pb-1">
                  <span>Available Appointments ({filteredSlots.length})</span>
                  <span>15 min cadence</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                  {filteredSlots.map((slot) => {
                    const isSelected = selectedSlot?.timeStr === slot.timeStr;
                    const primaryStaff = slot.availableStaff?.[0];

                    return (
                      <button
                        type="button"
                        key={slot.timeStr}
                        onClick={() => onSelectSlot(slot)}
                        className={`p-2 rounded-sm text-xs font-mono-numbers text-center border transition-all ${
                          isSelected
                            ? 'bg-[#9B8058] text-[#141414] font-bold border-[#9B8058] shadow-md scale-[1.02]'
                            : 'bg-[#141414] text-[#F5F1EA] border-[#2A2A2A] hover:border-[#9B8058] hover:bg-[#201D1A]'
                        }`}
                      >
                        <div className="text-sm font-semibold">{slot.timeStr}</div>
                        {selectedStaffId === 'any' && primaryStaff && (
                          <div
                            className={`text-[9px] font-sans truncate ${
                              isSelected ? 'text-[#141414]/80' : 'text-[#8C8273]'
                            }`}
                          >
                            {primaryStaff.name.split(' ')[0]}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selected Slot Confirmation Alert */}
          {selectedSlot && (
            <div className="bg-[#1C1A17] border border-[#9B8058] p-3.5 rounded-sm flex items-center justify-between text-xs text-[#D9D1C5] animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#9B8058] shrink-0" />
                <div>
                  <span className="font-semibold text-white">
                    {selectedSlot.timeStr} on {selectedDate}
                  </span>
                  <span className="block text-[11px] text-[#8C8273]">
                    Slot held for 10 minutes for your reservation.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
