import React, { useContext } from 'react';
import { LanguageContext } from '../LanguageContext';

export function CreateUserModal({ setShowCreateUserModal, handleCreateUser, translations }) {
    const { language } = useContext(LanguageContext);
    const t_ = (key) => translations[language][key];

    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={() => setShowCreateUserModal(false)}>&times;</span>
                <h2>{t_('subcreateusermit')}</h2>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const email = e.target.email.value;
                    const username = e.target.username.value;
                    const password = e.target.password.value;
                    handleCreateUser(email, username, password);
                }}>
                    <div className="input-group">
                        <label htmlFor="username">{t_('username')}:</label>
                        <input id="username" type="text" name="username" required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">{t_('email')}:</label>
                        <input id="email" type="email" name="email" required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">{t_('password')}:</label>
                        <input id="password" type="password" name="password" required />
                    </div>
                    <button type="submit">{t_('createuser')}</button>
                </form>
            </div>
        </div>
    );
}