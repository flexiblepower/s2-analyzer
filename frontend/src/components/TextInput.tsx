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
    <div>
        <label
            htmlFor={id}
            className="block text-gray-700 text-sm font-bold mb-2"
        >
            {label}
        </label>
        <input
            type="text"
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
    </div>
);

export default TextInput;