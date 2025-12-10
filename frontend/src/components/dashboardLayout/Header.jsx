// components/Header.jsx
import React from 'react';

const Header = ({ userName }) => {
    return (
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
                Welcome back, {userName}!
            </h1>
        </div>
    );
};

export default Header;