import logo from './logo.svg';
import React, { useEffect, useState, useContext, createContext  } from 'react';
import './App.css';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const BACKEND_URL = 'http://localhost:8080';
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const translations = {
  en: {
    addEvent: "Add Event +",
    deleteEvent: "Delete Event",
    addEventModalTitle: "Add Event",
    title: "Title",
    description: "Description",
    startTime: "Start Time",
    endTime: "End Time",
    saveEvent: "Save Event",
  },
  zh: {
    addEvent: "添加事件 +",
    deleteEvent: "删除事件",
    addEventModalTitle: "添加事件",
    title: "标题",
    description: "描述",
    startTime: "开始时间",
    endTime: "结束时间",
    saveEvent: "保存事件",
  }
};
// Create a Language Context
const LanguageContext = createContext({
  language: 'en',
  toggleLanguage: () => {},
});

// Language provider with state and function to toggle language
function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    setLanguage((prevLanguage) => (prevLanguage === 'en' ? 'zh' : 'en'));
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

function App() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { language, toggleLanguage  } = useContext(LanguageContext);
  const t = (key) => translations[language][key];


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
    handleEventDrop(event, start, end);
  }
  const onEventResize = ({ event, start, end }) => {
    const idx = events.indexOf(event);
    const updatedEvent = { ...event, start, end };
    const nextEvents = [...events];
    nextEvents.splice(idx, 1, updatedEvent);
    setEvents(nextEvents);
    handleEventResize(event, start, end);
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
  const handleEventDrop = (event, start, end) => {
    const idx = events.indexOf(event);
    fetch(`${BACKEND_URL}/api/${idx}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        start: moment(start).unix(),
        end: moment(end).unix(),
        title: event.title,
        description: event.description
      })
    })
        .then(response => {
          if (response.ok) {
            fetchEvents();
          } else {
            console.error('Failed to update the event');
          }
        })
        .catch(error => console.error('Network error:', error));
  }

  const handleEventResize = (event, start, end) => {
    handleEventDrop(event, start, end);
  }


// Drag create
  const handleSelectSlot = ({ start, end }) => {
    // only create for slot > 3o minutes
    if (moment(end).diff(moment(start), 'minutes') > 30) {
      const newEvent = {
        start: moment(start).unix(),
        end: moment(end).unix(),
        title: "",
        description: ""
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
    }
  }

  return (
      <div>
        <button onClick={toggleLanguage}>
        {language === 'en' ? '中文' : 'English'}
       </button>
        <DnDCalendar
            localizer={localizer}
            events={events}
            defaultDate={new Date()}
            defaultView="week"
            style={{ height: "100vh" }}
            selectable={'ignoreEvents'}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
            resizable
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
        />
      <button className="addButton" onClick={toggleModal}>{t('addEvent')}</button>
      {selectedEvent && (
        <button className="deleteButton" onClick={handleDeleteEvent}>{t('deleteEvent')}</button>
      )}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={toggleModal}>&times;</span>
            <h2>{t('addEventModalTitle')}</h2>
            <div className="input-group">
              <label htmlFor="eventTitle">{t('title')}</label>
              <input
                id="eventTitle"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t('title')}
              />
            </div>
            <div className="input-group">
              <label htmlFor="eventDescription">{t('description')}</label>
              <input
                id="eventDescription"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('description')}
              />
            </div>
            <div className="input-group">
              <label htmlFor="startTime">{t('startTime')}</label>
              <input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="endTime">{t('endTime')}</label>
              <input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
            <button onClick={handleAddEvent}>{t('saveEvent')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default function WrappedApp() {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}
