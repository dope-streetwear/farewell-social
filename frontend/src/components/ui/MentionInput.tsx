import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { VerifiedBadge } from './VerifiedBadge';

interface MentionUser {
    _id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
    verificationTier?: number;
}

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    multiline?: boolean;
    disabled?: boolean;
    maxLength?: number;
}

export const MentionInput: React.FC<MentionInputProps> = ({
    value,
    onChange,
    placeholder,
    className = '',
    multiline = false,
    disabled = false,
    maxLength,
}) => {
    const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [cursorPos, setCursorPos] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<number | null>(null);

    const searchUsers = useCallback(async (query: string) => {
        if (!query || query.length < 1) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data);
                setShowDropdown(data.length > 0);
                setSelectedIndex(0);
            }
        } catch {
            setSuggestions([]);
            setShowDropdown(false);
        }
    }, []);

    const getMentionContext = (text: string, pos: number) => {
        const beforeCursor = text.slice(0, pos);
        const match = beforeCursor.match(/@([a-zA-Z0-9_]*)$/);
        return match ? match[1] : null;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const newValue = e.target.value;
        const pos = e.target.selectionStart || 0;
        onChange(newValue);
        setCursorPos(pos);

        const query = getMentionContext(newValue, pos);
        if (query !== null) {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = window.setTimeout(() => searchUsers(query), 200);

            // Position dropdown near cursor
            if (inputRef.current) {
                const rect = inputRef.current.getBoundingClientRect();
                setDropdownPos({
                    top: rect.height + 4,
                    left: 0,
                });
            }
        } else {
            setShowDropdown(false);
            setSuggestions([]);
        }
    };

    const insertMention = (user: MentionUser) => {
        const beforeCursor = value.slice(0, cursorPos);
        const afterCursor = value.slice(cursorPos);
        const mentionStart = beforeCursor.lastIndexOf('@');
        const newValue = beforeCursor.slice(0, mentionStart) + `@${user.username} ` + afterCursor;
        onChange(newValue);
        setShowDropdown(false);
        setSuggestions([]);

        // Refocus input
        setTimeout(() => {
            if (inputRef.current) {
                const newPos = mentionStart + user.username.length + 2;
                inputRef.current.focus();
                inputRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            insertMention(suggestions[selectedIndex]);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    const sharedProps = {
        ref: inputRef as any,
        value,
        onChange: handleInputChange,
        onKeyDown: handleKeyDown,
        placeholder,
        disabled,
        maxLength,
        className: `w-full bg-transparent text-white focus:outline-none placeholder:text-white/50 ${className}`,
    };

    return (
        <div className="relative w-full">
            {multiline ? (
                <textarea {...sharedProps} ref={inputRef as React.RefObject<HTMLTextAreaElement>} />
            ) : (
                <input type="text" {...sharedProps} ref={inputRef as React.RefObject<HTMLInputElement>} />
            )}

            {/* Autocomplete Dropdown */}
            {showDropdown && suggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full max-h-48 overflow-y-auto bg-primary border border-white/20 rounded-xl shadow-2xl shadow-black/50"
                    style={{ top: dropdownPos.top, left: dropdownPos.left }}
                >
                    {suggestions.map((user, i) => (
                        <button
                            key={user._id}
                            type="button"
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIndex ? 'bg-secondary/20' : 'hover:bg-white/5'
                                }`}
                            onClick={() => insertMention(user)}
                            onMouseEnter={() => setSelectedIndex(i)}
                        >
                            <div className="w-8 h-8 rounded-full bg-accent-1 overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                                {user.profileImageUrl ? (
                                    <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    user.displayName.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate flex items-center gap-1">
                                    {user.displayName}
                                    <VerifiedBadge tier={user.verificationTier || 0} size={12} />
                                </p>
                                <p className="text-xs text-white/50 truncate">@{user.username}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
