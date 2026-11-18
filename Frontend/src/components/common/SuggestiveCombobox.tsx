import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, X } from 'lucide-react';

export interface SuggestiveComboboxProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  hint?: string;
  error?: string;
  id?: string;
  name?: string;
}

export const SuggestiveCombobox: React.FC<SuggestiveComboboxProps> = ({
  label,
  value,
  onChange,
  suggestions,
  placeholder = 'Select or type custom...',
  required = false,
  disabled = false,
  className = '',
  hint,
  error,
  id,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clean and unique suggestions list, case-insensitive deduplication
  const uniqueSuggestions = Array.from(
    new Set(
      suggestions
        .map(s => s?.trim())
        .filter((s): s is string => Boolean(s && s.length > 0))
    )
  );

  // Filter based on input value
  const query = value.trim().toLowerCase();
  const filteredSuggestions = uniqueSuggestions.filter(item =>
    item.toLowerCase().includes(query)
  );

  // Check if current value exactly matches an existing suggestion
  const hasExactMatch = uniqueSuggestions.some(
    item => item.toLowerCase() === query
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        const totalItems = filteredSuggestions.length + (!hasExactMatch && query ? 1 : 0);
        setHighlightedIndex(prev => (prev + 1 < totalItems ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const totalItems = filteredSuggestions.length + (!hasExactMatch && query ? 1 : 0);
        setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : totalItems - 1));
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0) {
        e.preventDefault();
        if (highlightedIndex < filteredSuggestions.length) {
          handleSelect(filteredSuggestions[highlightedIndex]);
        } else if (!hasExactMatch && query) {
          // Highlighted custom item
          handleSelect(value.trim());
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label 
          htmlFor={id} 
          className="font-semibold text-slate-700 block mb-1 text-xs"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={value}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={`w-full px-3 py-2 pr-14 bg-slate-50 border rounded-lg text-xs text-slate-900 transition-all ${
            error 
              ? 'border-red-300 focus:border-red-500 bg-red-50/20' 
              : 'border-slate-200 focus:bg-white focus:outline-none focus:border-[#088395] focus:ring-1 focus:ring-[#088395]/20'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
        />

        {/* Action buttons inside the right end of the input */}
        <div className="absolute right-1.5 flex items-center gap-0.5 text-slate-400">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-600 rounded-md transition-colors"
              title="Clear input"
              tabIndex={-1}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!disabled) {
                setIsOpen(prev => !prev);
                inputRef.current?.focus();
              }
            }}
            className={`p-1 hover:text-slate-600 rounded-md transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-[#088395]' : ''
            }`}
            tabIndex={-1}
            title="Toggle suggestions dropdown"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {hint && !error && (
        <span className="text-[10px] text-slate-400 mt-1 block">{hint}</span>
      )}
      {error && (
        <span className="text-[10px] text-red-500 mt-1 block">{error}</span>
      )}

      {/* Suggestions Dropdown Popover */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-56 overflow-y-auto animate-in fade-in-50 duration-100">
          <div className="p-1 space-y-0.5 text-xs">
            {/* Header hint */}
            <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
              <span>Suggestions & History</span>
              <span className="text-[9px] font-normal lowercase">click or type custom</span>
            </div>

            {/* Filtered suggestions list */}
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((item, index) => {
                const isSelected = item.toLowerCase() === value.trim().toLowerCase();
                const isHighlighted = highlightedIndex === index;

                return (
                  <button
                    key={`${item}-${index}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      isHighlighted
                        ? 'bg-teal-50 text-[#088395]'
                        : isSelected
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{item}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#088395] shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-center text-slate-400 text-xs italic">
                No matching presets found
              </div>
            )}

            {/* If user typed something that doesn't match an exact suggestion, offer custom option */}
            {!hasExactMatch && query && (
              <div className="pt-1 border-t border-slate-100 mt-1">
                <button
                  type="button"
                  onClick={() => handleSelect(value.trim())}
                  onMouseEnter={() => setHighlightedIndex(filteredSuggestions.length)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-colors ${
                    highlightedIndex === filteredSuggestions.length
                      ? 'bg-teal-100 text-[#088395] font-semibold'
                      : 'bg-teal-50/70 text-[#088395] hover:bg-teal-100'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Use custom: &quot;{value.trim()}&quot;</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
