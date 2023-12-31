import React, { useContext } from 'react';
import { LanguageContext } from '../LanguageContext';

export function EditEventModal({setShowEditEventModal, handleEditEvent, selectedEvent, translations}) {
    const { language } = useContext(LanguageContext);
    const t_ = (key) => translations[language][key];

    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={() => setShowEditEventModal(false)}>&times;</span>
                <h2>{t_('editEvent')}</h2>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const title = e.target.title.value;
                    const description = e.target.description.value;
                    handleEditEvent(title, description);
                }}>
                    <div className="input-group">
                        <label htmlFor="title">{t_('title')}</label>
                        <input id="title" type="text" name="title" defaultValue={selectedEvent.title} required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="description">{t_('description')}</label>
                        <input id="description" type="text" name="description" defaultValue={selectedEvent.description} required />
                    </div>
                    <button type="submit">{t_("saveEvent")}</button>
                </form>
            </div>
        </div>
    )
}