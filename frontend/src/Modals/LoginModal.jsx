import React, { useState, useContext } from 'react';
import { LanguageContext } from '../LanguageContext';

// Modal component for logging in
export function LoginModal({ setShowLoginModal, handleLogin, translations }) {
    const { language } = useContext(LanguageContext);
    const t_ = (key) => translations[language][key];

    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={() => setShowLoginModal(false)}>&times;</span>
                <h2>{t_('login')}</h2>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const username = e.target.username.value;
                    const password = e.target.password.value;
                    handleLogin(username, password);
                }}>
                    <div className="input-group">
                        <label htmlFor="username">{t_('username')}:</label>
                        <input id="username" type="text" name="username" required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">{t_('password')}:</label>
                        <input id="password" type="password" name="password" required />
                    </div>
                    <button type="submit">{t_('login')}</button>
                </form>
            </div>
        </div>
    );
}