import logo from './logo.svg';
import React, { useEffect, useState, useContext, createContext } from 'react';
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
    createuser: "Create New User",
    login: "Login",
    logout: "Logout",
    submit: "submit",
    username: "username",
    email: "email",
    password: "password",
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
    createuser: "创建新用户",
    login: "登录",
    logout: "登出",
    submit: "提交",
    username: "用户名",
    email: "邮件",
    password: "密码",
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
  toggleLanguage: () => { },
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

// Modal component for creating a new user
function CreateUserModal({ onSubmit }) {
  const { language } = useContext(LanguageContext);
  const t = (key) => translations[language][key];
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="modal">
      {/* Form elements and submit button */}
      <button onClick={() => onSubmit(username, email, password)}>{t('submit')}</button>
    </div>
  );
}

// Modal component for logging in
function LoginModal({ onSubmit }) {
  const { language } = useContext(LanguageContext);
  const t = (key) => translations[language][key];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="modal">
      {/* Form elements and submit button */}
      <button onClick={() => onSubmit(username, password)}>{t('submit')}</button>
    </div>
  );
}
function App() {
  const [activeUsername, setActiveUsername] = useState("");
  const [activeEmail, setActiveEmail] = useState("");

  const [addAttendeeField, setAddAttendeeField] = useState("");

  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);


  const getUserInfo = async () => {
    const resp = await fetch(`/api/user/me`, { method: "POST", headers: { "Authorization": "Bearer " + localStorage.getItem("daydreamers-access-token") } });
    if (resp.ok) {
      const jsonBody = await resp.json();
      setActiveEmail(jsonBody.email);
      setActiveUsername(jsonBody.username);
    }
  }

  const handleAddAttendee = async () => {
    const resp = await fetch(`/api/event/attendees/add`,
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          "Authorization": "Bearer " + localStorage.getItem("daydreamers-access-token")
        },
        body: {
          "event_id": selectedEvent.id,
          "new_attendee": addAttendeeField
        }
      });
  }

  const handleRemoveAttendee = async (event_id, attendee_id) => {
    const resp = await fetch(`/api/event/attendees/remove`,
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          "Authorization": "Bearer " + localStorage.getItem("daydreamers-access-token")
        },
        body: {
          "event_id": event_id,
          "removing_attendee": attendee_id
        }
      });
    if (resp.ok) {
      fetchEvents();
      return;
    }
    console.error("Something went wrong removing an attendee.")
  }

  // Helper function to update the data
  const fetchEvents = async () => {
    const resp = await fetch(`/api/event`, { method: "GET", headers: { "Authorization": "Bearer " + localStorage.getItem("daydreamers-access-token") } });
    if (resp.status == 200) {
      const respBody = await resp.json();
      console.log("Number of events retrieved: " + respBody.length)
      const formattedEvents = respBody.map(event => ({
        start: moment.unix(event.start).toDate(),
        end: moment.unix(event.end).toDate(),
        title: event.title,
        description: event.description,
        event_id: event.id,
        owner_id: event.owner?.id,
        owner_username: event.owner?.username,
        attendees: event.attendees
      }));
      console.log(formattedEvents)
      setEvents(formattedEvents);
    }
    else if (resp.status == 401) {
      //TODO: LOG OUT USER, THEIR ACCESS TOKEN IS INVALID
    }
  };

  const onEventDrop = ({ event, start, end }) => {
    const idx = events.indexOf(event);
    const updatedEvent = { ...event, start, end };
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
    getUserInfo();
  }, []);


  const handleAddEvent = () => {
    const newEvent = {
      start: moment(startTime).unix(),
      end: moment(endTime).unix(),
      title: title,
      description: description
    };

    fetch("/api/event/new", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': "Bearer " + localStorage.getItem("daydreamers-access-token")
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
      if (selectedEvent) {
        fetch(`/api/event/${selectedEvent.id}`, {
          method: "DELETE",
          headers: {
            'Authorization': "Bearer " + localStorage.getItem("daydreamers-access-token")
          }
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
    fetch(`/api/event/edit`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': "Bearer " + localStorage.getItem("daydreamers-access-token")
      },
      body: JSON.stringify({
        start: moment(start).unix(),
        stop: moment(end).unix(),
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

  const handleCreateUser = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');

    fetch(`/api/user/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Network response was not ok.');
      })
      .then(data => {
        console.log('User created:', data);
        setShowCreateUserModal(false);
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });
  };

  const handleEditEvent = async (title, description) => {
    setShowEditEventModal(false);
    const response = await fetch(`/api/event/edit`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': "Bearer " + localStorage.getItem("daydreamers-access-token")
      },
      body: {
        'title': title,
        'description': description,
        'start': moment(selectedEvent.start).unix(),
        'stop': moment(selectedEvent.end).unix()
      }
    })
    if (response.ok) {
      fetchEvents();
      return;
    }
    console.error("Something went wrong editing the event.");
  }

  // Function to handle user login
  const handleLogin = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('grant_type', 'password');

    const response = await fetch(`/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const jsonBody = await response.json();

    if (response.ok) {
      localStorage.setItem('daydreamers-access-token', jsonBody.access_token);
      getUserInfo();
      setShowLoginModal(false);
      return;
    }

    console.error('There has been a problem with your fetch operation:', jsonBody.detail?.msg);
    return;
  }



  // Function to handle user logout
  const handleLogout = () => {
    localStorage.removeItem("daydreamers-access-token"); // Clear the token from local storage
  };



  return (

    <div>
      <button onClick={toggleLanguage}>
        {language === 'en' ? '中文' : 'English'}
      </button>

      {/*User Login component*/}
      <button className='secondaryButton' onClick={() => setShowCreateUserModal(true)}>Create New User</button>
      <button onClick={() => setShowLoginModal(true)}>Login</button>
      <button onClick={handleLogout}>Logout</button>

      {/* Modal for creating a new user */}
      {showCreateUserModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowCreateUserModal(false)}>&times;</span>
            <h2>{t('subcreateusermit')}</h2>
            <form onSubmit={handleCreateUser}>
              <div className="input-group">
                <label htmlFor="username">{t('username')}:</label>
                <input id="username" type="text" name="username" required />
              </div>
              <div className="input-group">
                <label htmlFor="email">{t('email')}:</label>
                <input id="email" type="email" name="email" required />
              </div>
              <div className="input-group">
                <label htmlFor="password">{t('password')}:</label>
                <input id="password" type="password" name="password" required />
              </div>
              <button type="submit">{t('createuser')}</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for editing event */}
      {showEditEventModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowEditEventModal(false)}>&times;</span>
            <h2>Edit Event</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const title = e.target.title.value;
              const description = e.target.description.value;
              handleEditEvent(title, description);
            }}>
              <div className="input-group">
                <label htmlFor="title">Title:</label>
                <input id="title" type="text" name="title" defaultValue={selectedEvent.title} required />
              </div>
              <div className="input-group">
                <label htmlFor="description">Description:</label>
                <input id="description" type="text" name="description" defaultValue={selectedEvent.description} required />
              </div>
              <button type="submit">Submit Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for logging in */}
      {showLoginModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowLoginModal(false)}>&times;</span>
            <h2>{t('login')}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const username = e.target.username.value;
              const password = e.target.password.value;
              handleLogin(username, password);
            }}>
              <div className="input-group">
                <label htmlFor="username">{t('username  ')}:</label>
                <input id="username" type="text" name="username" required />
              </div>
              <div className="input-group">
                <label htmlFor="password">{t('password')}:</label>
                <input id="password" type="password" name="password" required />
              </div>
              <button type="submit">{t('login')}</button>
            </form>
          </div>
        </div>
      )}
      {/*  Calendar and Event Component*/}
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
      <button className="addButton" onClick={toggleModal}>Add Event +</button>
      {selectedEvent && (<>
        <button className="deleteButton" onClick={handleDeleteEvent}>Delete Event</button>
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
            {selectedEvent.attendees.map(attendee => (<><p onClick={() => { handleRemoveAttendee(selectedEvent.id, attendee.id) }}>{attendee.username}</p> <br /></>))}
          </p>
          {selectedEvent.owner_username === activeUsername &&
            <>
              <button className="secondaryButton" onClick={() => { setShowEditEventModal(true) }}>Edit Event</button> <br />
              <input placeholder='Attendee' onChange={e => setAddAttendeeField(e.target.value)} /> <br />
              <button className="secondaryButton" onClick={() => { handleAddAttendee() }}>Add</button>
            </>}
        </div>
      </>
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
