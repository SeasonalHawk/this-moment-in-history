'use client';

import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

interface CalendarPickerProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

export default function CalendarPicker({ selectedDate, onDateSelect }: CalendarPickerProps) {
  return (
    <div className="flex justify-center">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        toDate={new Date()}
        classNames={{
          root: 'bg-stone-900 p-4 rounded-xl border border-stone-700 shadow-lg',
          months: 'flex flex-col',
          month_caption: 'text-amber-400 font-semibold text-lg mb-2 text-center',
          nav: 'flex items-center justify-between mb-2',
          button_previous: 'text-amber-400 hover:text-amber-300 p-1 rounded hover:bg-stone-800 transition-colors',
          button_next: 'text-amber-400 hover:text-amber-300 p-1 rounded hover:bg-stone-800 transition-colors',
          weekdays: 'flex',
          weekday: 'text-stone-500 text-sm font-medium w-10 text-center',
          week: 'flex',
          day: 'w-10 h-10 text-center text-sm',
          day_button: 'w-full h-full rounded-lg text-stone-300 hover:bg-amber-900/40 hover:text-amber-300 transition-colors cursor-pointer',
          selected: 'bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500',
          today: 'font-bold text-amber-400',
          outside: 'text-stone-700',
          disabled: 'text-stone-700 cursor-not-allowed hover:bg-transparent',
        }}
      />
    </div>
  );
}
