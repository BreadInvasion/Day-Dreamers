import logo from './logo.svg';
import React, { useEffect, useState } from 'react';
import './App.css';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const BACKEND_URL = 'http://localhost:8080';
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

function App() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);



  // Helper function to update the data
  const fetchEvents = () => {
    fetch(`${BACKEND_URL}/api`, { method: "GET" })
        .then(response => response.json())
        .then(data => {
          const formattedEvents = data.map(event => ({
            start: moment.unix(event.start).toDate(),
            end: moment.unix(event.end).toDate(),
            title: event.title
          }));
          setEvents(formattedEvents);
        });
  };

  const onEventDrop = ({ event, start, end }) => {
    const idx = events.indexOf(event);
    const updatedEvent = {...event, start, end};
    const nextEvents = [...events];
    nextEvents.splice(idx, 1, updatedEvent);
    setEvents(nextEvents);
  }
  const onEventResize = ({ event, start, end }) => {
    const idx = events.indexOf(event);
    const updatedEvent = { ...event, start, end };
    const nextEvents = [...events];
    nextEvents.splice(idx, 1, updatedEvent);
    setEvents(nextEvents);
  };


  const toggleModal = () => {
    setShowModal(prev => !prev);
  }



  useEffect(() => {
    fetchEvents();
  }, []);


  const handleAddEvent = () => {
    const newEvent = {
      start: moment(startTime).unix(),
      end: moment(endTime).unix(),
      title: title,
      description: description
    };

    fetch(`${BACKEND_URL}/api`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newEvent)
    })
    .then(response => response.json())
    .then(data => {

      setEvents(prevEvents => [...prevEvents, {
        start: moment.unix(data.start).toDate(),
        end: moment.unix(data.end).toDate(),
        title: data.title
      }]);
      fetchEvents();
    });

    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    toggleModal();
  }


  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  }

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      const eventIndex = events.findIndex(e => e.start === selectedEvent.start && e.end === selectedEvent.end && e.title === selectedEvent.title);
      if (eventIndex > -1) {
        fetch(`${BACKEND_URL}/api/${eventIndex}`, {
          method: "DELETE"
        })
        .then(response => {
          if (response.ok) {
            setEvents(prevEvents => prevEvents.filter((_, index) => index !== eventIndex));
            setSelectedEvent(null);
          } else {
            console.error('Failed to delete the event');
          }
        })
        .catch(error => console.error('Network error:', error));
      }
    }
  }


  const handleSelectSlot = (slotInfo) => {
    // slotInfo 包含 start 和 end 时间
    const newEvent = {
      start: moment(slotInfo.start).unix(),
      end: moment(slotInfo.end).unix(),
      title: "",  // 你可以通过弹出一个模态框来自定义这个标题
      description: "Description"  // 同上
    };

    fetch(`${BACKEND_URL}/api`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newEvent)
    })
        .then(response => response.json())
        .then(data => {
          setEvents(prevEvents => [...prevEvents, {
            start: moment.unix(data.start).toDate(),
            end: moment.unix(data.end).toDate(),
            title: data.title
          }]);
          fetchEvents();
        });
  };

  return (
      <div>
        <DnDCalendar
            localizer={localizer}
            events={events}
            defaultDate={new Date()}
            defaultView="week"
            style={{ height: "100vh" }}
            selectable
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
            resizable
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
        />
      <button className="addButton" onClick={toggleModal}>Add Event +</button>
      {selectedEvent && (
        <button className="deleteButton" onClick={handleDeleteEvent}>Delete Event</button>
      )}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={toggleModal}>&times;</span>
            <h2>Add Event</h2>
            <div className="input-group">
              <label htmlFor="eventTitle">Title</label>
              <input id="eventTitle" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"/>
            </div>
            <div className="input-group">
              <label htmlFor="eventDescription">Description</label>
              <input id="eventDescription" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description"/>
            </div>
            <div className="input-group">
              <label htmlFor="startTime">Start Time</label>
              <input id="startTime" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}/>
            </div>
            <div className="input-group">
              <label htmlFor="endTime">End Time</label>
              <input id="endTime" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)}/>
            </div>
            <button onClick={handleAddEvent}>Save Event</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
