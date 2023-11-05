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




// Modal component for creating a new user
  function CreateUserModal({ onSubmit }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className="modal">
          {/* Form elements and submit button */}
          <button onClick={() => onSubmit(username, email, password)}>Submit</button>
        </div>
    );
  }

// Modal component for logging in
  function LoginModal({ onSubmit }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className="modal">
          {/* Form elements and submit button */}
          <button onClick={() => onSubmit(username, password)}>Submit</button>
        </div>
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
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);


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

  const handleUserCreated = (userData) => {
    fetch(`${BACKEND_URL}/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
  };

  const handleLoggedIn = (loginData) => {
    fetch(`${BACKEND_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData),
    })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
  };

  const handleLoggedOut = () => {
    fetch(`${BACKEND_URL}/logout`, { method: 'POST' })
        .then(response => {
          if (response.ok) console.log('Logged out successfully');
        })
        .catch(error => console.error('Error:', error));
  };

  const handleCreateUser = (username, email, password) => {
    fetch(`${BACKEND_URL}/api/users`, {
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

  // Function to handle user login
  const handleLogin = (username, password) => {
    fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Network response was not ok.');
        })
        .then(data => {
          console.log('Login successful:', data);
          setShowLoginModal(false);
        })
        .catch(error => {
          console.error('There has been a problem with your fetch operation:', error);
        });
  };

  // Function to handle user logout
  const handleLogout = () => {
    fetch(`${BACKEND_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    })
        .then(response => {
          if (response.ok) {
            console.log('Logout successful');
          } else {
            throw new Error('Network response was not ok.');
          }
        })
        .catch(error => {
          console.error('There has been a problem with your fetch operation:', error);
        });
  };


  return (

      <div>
        {/*User Login component*/}
        <button onClick={() => setShowCreateUserModal(true)}>Create New User</button>
        <button onClick={() => setShowLoginModal(true)}>Login</button>
        <button onClick={handleLogout}>Logout</button>

        {/* Modal for creating a new user */}
        {showCreateUserModal && (
            <div className="modal">
              <div className="modal-content">
                <span className="close" onClick={() => setShowCreateUserModal(false)}>&times;</span>
                <h2>Create New User</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const username = e.target.username.value;
                  const email = e.target.email.value;
                  const password = e.target.password.value;
                  handleCreateUser(username, email, password);
                }}>
                  <div className="input-group">
                    <label htmlFor="username">Username:</label>
                    <input id="username" type="text" name="username" required />
                  </div>
                  <div className="input-group">
                    <label htmlFor="email">Email:</label>
                    <input id="email" type="email" name="email" required />
                  </div>
                  <div className="input-group">
                    <label htmlFor="password">Password:</label>
                    <input id="password" type="password" name="password" required />
                  </div>
                  <button type="submit">Create User</button>
                </form>
              </div>
            </div>
        )}

        {/* Modal for logging in */}
        {showLoginModal && (
            <div className="modal">
              <div className="modal-content">
                <span className="close" onClick={() => setShowLoginModal(false)}>&times;</span>
                <h2>Login</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const username = e.target.username.value;
                  const password = e.target.password.value;
                  handleLogin(username, password);
                }}>
                  <div className="input-group">
                    <label htmlFor="username">Username:</label>
                    <input id="username" type="text" name="username" required />
                  </div>
                  <div className="input-group">
                    <label htmlFor="password">Password:</label>
                    <input id="password" type="password" name="password" required />
                  </div>
                  <button type="submit">Login</button>
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
