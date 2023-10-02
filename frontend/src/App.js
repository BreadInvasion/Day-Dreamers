import logo from './logo.svg';
import './App.css';
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEffect, useState } from 'react';

function App() {
  const [events, setEvents] = useState([]);

  useEffect(()=>{
    fetch('/api/myevent', {method: "POST"}).then(response => response.json()).then(response => setEvents([{'start': moment.unix(response.start).toDate(), 'end': moment.unix(response.end).toDate(), 'title': response.title}]));
  }, []);


  return (
    <Calendar localizer={momentLocalizer(moment)} events={events} defaultDate={new Date()} defaultView="month" style={{ height: "100vh" }} />
  );
}

export default App;
