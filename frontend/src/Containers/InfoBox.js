import React, { useContext } from 'react';
import { LanguageContext } from '../LanguageContext';

export function InfoBox({ activeUsername, selectedEvent, handleAddAttendee, handleRemoveAttendee, setShowEditEventModal, setAddAttendeeField, translations }) {
    const { language } = useContext(LanguageContext);
    const t_ = (key) => translations[language][key];
    
    return (
        <div className='infoBox'>
            <p>
                <b>{selectedEvent.title}</b>
                <br />
                <i>{selectedEvent.description}</i>
                <br />
                <b>{t_('hostLabel')} </b>{selectedEvent.owner_username}
                <br />
                <b>{t_('attendeeListLabel')} </b>
                <br />
                {selectedEvent.attendees.map(attendee => (<><p className={selectedEvent.owner_username === activeUsername || attendee.username === activeUsername ? "removableName" : "attendeeName"} onClick={() => { if (selectedEvent.owner_username === activeUsername || attendee.username === activeUsername) handleRemoveAttendee(selectedEvent.event_id, attendee.id) }}>{attendee.username}</p> <br /></>))}
            </p>
            {selectedEvent.owner_username === activeUsername &&
                <>
                    <button className="editEventButton" onClick={() => { setShowEditEventModal(true) }}>{t_('editEvent')}</button> <br />
                    <input className="attendeeInput" placeholder={t_('newAttendee')} onChange={e => setAddAttendeeField(e.target.value)} /> <br />
                    <button className="attendeeButton" onClick={() => { handleAddAttendee() }}>{t_('addAttendeeButton')}</button>
                </>}
        </div>
    )
}