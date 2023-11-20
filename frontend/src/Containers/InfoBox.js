import React from 'react';

export function InfoBox({ activeUsername, selectedEvent, handleAddAttendee, handleRemoveAttendee, setShowEditEventModal, setAddAttendeeField }) {
    return (
        <div className='infoBox'>
            <p>
                <b>{selectedEvent.title}</b>
                <br />
                <i>{selectedEvent.description}</i>
                <br />
                <b>Host: </b>{selectedEvent.owner_username}
                <br />
                <b>Attendees: </b>
                <br />
                {selectedEvent.attendees.map(attendee => (<><p className="attendeeName" onClick={() => { handleRemoveAttendee(selectedEvent.event_id, attendee.id) }}>{attendee.username}</p> <br /></>))}
            </p>
            {selectedEvent.owner_username === activeUsername &&
                <>
                    <button className="secondaryButton" onClick={() => { setShowEditEventModal(true) }}>Edit Event</button> <br />
                    <input placeholder='Attendee' onChange={e => setAddAttendeeField(e.target.value)} /> <br />
                    <button className="secondaryButton" onClick={() => { handleAddAttendee() }}>Add</button>
                </>}
        </div>
    )
}