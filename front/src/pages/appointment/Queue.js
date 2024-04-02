import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Calendar from '../../pages/calendar/Calendar';

const Queue = () => {
    const [calendarData, setCalendarData] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch calendar data
                const calendarResponse = await axios.get('http://localhost:3001/thomas/full_calendar');
                const fetchedCalendarData = calendarResponse.data.calendarData;
                setCalendarData(fetchedCalendarData); // Update calendarData state
                console.log('Fetched Calendar Data:', fetchedCalendarData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <main id="main" className="main">
            <section className="section dashboard">
                <div className="row">
                    <div className="col-12">
                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-body d-flex justify-content-between align-items-center">
                                        <h5 className="card-title">Appointments <span>/Today</span></h5>
                                        <Link to="/create-appointments" className="btn btn-primary">
                                            <i className="ri-add-circle-fill"></i> Add Appointment
                                        </Link>
                                    </div>
                                    <div className="card-body">
                                        <Calendar calendarData={calendarData} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Queue;
