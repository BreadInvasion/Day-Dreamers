import logo from './logo.svg';
import React, { useEffect, useState, useContext, createContext } from 'react';
import './App.css';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { AddEventModal } from './Modals/AddEventModal';
import { LanguageContext } from './LanguageContext';
import { InfoBox } from './Containers/InfoBox';
import { CreateUserModal } from './Modals/CreateUserModal';
import { LoginModal } from './Modals/LoginModal';
import { EditEventModal } from './Modals/EditEventModal';


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

function App() {
  const [activeUsername, setActiveUsername] = useState("");
  const [activeEmail, setActiveEmail] = useState("");

  const [addAttendeeField, setAddAttendeeField] = useState("");

  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { language, toggleLanguage } = useContext(LanguageContext);
  const t_ = (key) => translations[language][key];


  const getUserInfo = async () => {
    const resp = await fetch(`/api/user/me`, { method: "POST", headers: { "Authorization": "Bearer " + localStorage.getItem("daydreamers-access-token") } });
    if (resp.ok) {
      const jsonBody = await resp.json();
      setActiveEmail(jsonBody.email);
      setActiveUsername(jsonBody.username);
    }
  }

  const handleAddAttendee = async () => {
    const event_id = selectedEvent.event_id
    const new_attendee = addAttendeeField
    const resp = await fetch(`/api/event/attendees/add`,
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          "Authorization": "Bearer " + localStorage.getItem("daydreamers-access-token")
        },
        body: JSON.stringify({ event_id, new_attendee })
      });
    if(resp.ok) {
      fetchEvents();
      setSelectedEvent(undefined);
    }
  }

  const handleRemoveAttendee = async (eid, attendee_id) => {
    const removing_attendee = attendee_id
    const resp = await fetch(`/api/event/attendees/remove`,
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          "Authorization": "Bearer " + localStorage.getItem("daydreamers-access-token")
        },
        body: JSON.stringify({ event_id: eid, removing_attendee: removing_attendee })
      });
    if (resp.ok) {
      fetchEvents();
      setSelectedEvent(undefined);
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


  const handleAddEvent = (title, description, startTime, endTime) => {
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
    toggleModal();
  }


  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  }

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      const eventIndex = events.findIndex(e => e.start === selectedEvent.start && e.end === selectedEvent.end && e.title === selectedEvent.title);
      if (selectedEvent) {
        const event_id = selectedEvent.event_id;
        fetch(`/api/event/delete`, {
          method: "POST",
          headers: {
            'Content-Type': "application/json",
            'Authorization': "Bearer " + localStorage.getItem("daydreamers-access-token")
          },
          body: JSON.stringify({event_id})
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

  const handleCreateUser = (email, username, password) => {
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
    const start = moment(selectedEvent.start).unix()
    const end = moment(selectedEvent.end).unix()
    const response = await fetch(`/api/event/edit`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': "Bearer " + localStorage.getItem("daydreamers-access-token")
      },
      body: JSON.stringify({ title, description, start, end })
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
      await getUserInfo();
      setShowLoginModal(false);
      fetchEvents();
      return;
    }

    console.error('There has been a problem with your fetch operation:', jsonBody.detail?.msg);
    return;
  }



  // Function to handle user logout
  const handleLogout = () => {
    localStorage.removeItem("daydreamers-access-token"); // Clear the token from local storage
    setActiveUsername("")
    setActiveEmail("")
    setSelectedEvent(undefined)
    setEvents([])
  };



  return (

    <div>
      <button onClick={toggleLanguage}>
        {language === 'en' ? '中文' : 'English'}
      </button>

      {/*User Login component*/}
      <button className='secondaryButton' onClick={() => setShowCreateUserModal(true)}>{t_('createuser')}</button>
      <button onClick={() => setShowLoginModal(true)}>{t_('login')}</button>
      <button onClick={handleLogout}>{t_('logout')}</button>

      {/* Modal for creating a new user */}
      {showCreateUserModal && <CreateUserModal
        setShowCreateUserModal={setShowCreateUserModal}
        handleCreateUser={handleCreateUser}
        translations={translations}
      />
      }

      {/* Modal for editing event */}
      {showEditEventModal && <EditEventModal
        setShowEditEventModal={setShowEditEventModal}
        handleEditEvent={handleEditEvent}
        selectedEvent={selectedEvent}
        translations={translations}
      />
      }

      {/* Modal for logging in */}
      {showLoginModal && <LoginModal
        setShowLoginModal={setShowLoginModal}
        handleLogin={handleLogin}
        translations={translations}
      />
      }
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
      <button className="addButton" onClick={toggleModal}>{t_('addEvent')}</button>
      {selectedEvent && (<>
        <button className="deleteButton" onClick={handleDeleteEvent}>{t_('deleteEvent')}</button>
        <InfoBox
          activeUsername={activeUsername}
          selectedEvent={selectedEvent}
          handleAddAttendee={handleAddAttendee}
          handleRemoveAttendee={handleRemoveAttendee}
          setShowEditEventModal={setShowEditEventModal}
          setAddAttendeeField={setAddAttendeeField}
          translations={translations}
        />
      </>
      )}
      {showModal && <AddEventModal
        toggleModal={toggleModal}
        handleAddEvent={handleAddEvent}
        translations={translations}
      />
      }
    </div>
  );
}

export default App;