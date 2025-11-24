import React from "react";

type TextInputProps = {
    label: string;
    id: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const TextInput: React.FC<TextInputProps> = ({
    label,
    id,
    name,
    value,
    onChange,
}) => (
    <div className="flex flex-row gap-4 items-center">
        <label
            htmlFor={id}
            className="block text-gray-700 basis-24 text-lg font-bold text-right"
        >
            {label}
        </label>
        <input
            type="text"
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            className="appearance-none border border-blue-700 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
    </div>
);

export default TextInput;