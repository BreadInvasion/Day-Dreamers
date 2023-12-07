import React, { useState, useContext } from 'react';
import { LanguageContext } from './LanguageContext';

// Language provider with state and function to toggle language
export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');

    const toggleLanguage = () => {
        setLanguage((prevLanguage) => (prevLanguage === 'en' ? 'zh' : (prevLanguage === 'zh' ? 'de' : 'en')));
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}