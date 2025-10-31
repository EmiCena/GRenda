import React from 'react';

interface SwitchProps {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    children?: React.ReactNode;
}

export const Switch: React.FC<SwitchProps> = ({ id, checked, onChange }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.checked);
    };

    return (
        <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                id={id}
                className="sr-only peer"
                checked={checked}
                onChange={handleChange}
            />
            <div className="w-11 h-6 bg-secondary rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
    );
};