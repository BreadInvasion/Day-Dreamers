import { createContext } from "react";

// Create a Language Context
export const LanguageContext = createContext({
    language: 'en',
    toggleLanguage: () => { },
});