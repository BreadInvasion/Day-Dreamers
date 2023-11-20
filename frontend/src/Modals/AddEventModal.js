import React, { useState, useContext } from 'react';
import { LanguageContext } from '../LanguageContext';

export function AddEventModal({ toggleModal, handleAddEvent, translations }) {
    const { language } = useContext(LanguageContext);
    const t_ = (key) => translations[language][key];

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);


    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={toggleModal}>&times;</span>
                <h2>{t_('addEventModalTitle')}</h2>
                <div className="input-group">
                    <label htmlFor="eventTitle">{t_('title')}</label>
                    <input
                        id="eventTitle"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={t_('title')}
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="eventDescription">{t_('description')}</label>
                    <input
                        id="eventDescription"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder={t_('description')}
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="startTime">{t_('startTime')}</label>
                    <input
                        id="startTime"
                        type="datetime-local"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="endTime">{t_('endTime')}</label>
                    <input
                        id="endTime"
                        type="datetime-local"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                    />
                </div>
                <button onClick={() => { handleAddEvent(title, description, startTime, endTime) }}>{t_('saveEvent')}</button>
            </div>
        </div>
    );
}