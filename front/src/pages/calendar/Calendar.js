import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

function Calendar({ calendarData }) {
  const [fetchedCalendarData, setFetchedCalendarData] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsArray = Object.values(calendarData).flat();
        setFetchedCalendarData(eventsArray);
        console.log("Fetched Calendar Data:", eventsArray);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [calendarData]);

  const handleEventClick = (info) => {
    if (info.event) {
      setSelectedEvent(info.event);
      // Trigger Bootstrap modal manually
      const modal = new window.bootstrap.Modal(document.getElementById("modalDialogScrollable"));
      modal.show();
    }
  };

  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={"dayGridMonth"}
        headerToolbar={{
          start: "today prev,next",
          center: "title",
          end: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height={"80vh"}
        events={fetchedCalendarData}
        eventClick={handleEventClick}
      />

      {/* Bootstrap Modal */}
      <div className="modal fade" id="modalDialogScrollable" tabIndex="-1" role="dialog" aria-labelledby="modalDialogScrollableTitle" aria-hidden="true">
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="modalDialogScrollableTitle">Appointment Details</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            {selectedEvent && (
              <div className="modal-body">
                <h5><strong>{selectedEvent.extendedProps.firstname} {selectedEvent.extendedProps.lastname}</strong> ||<strong> PID: </strong>{selectedEvent.extendedProps.pId}</h5>
                <p><strong>Summary of Visit:</strong><br /> <span>{selectedEvent.extendedProps.reason}</span></p>
                <p><strong>Price:</strong><br /> <span>₦{selectedEvent.extendedProps.price}</span></p>
                <p><strong>Attending Doctor:</strong><br /> <span>{selectedEvent.extendedProps.doctor}</span></p>
                <p><strong>Status:</strong><br /> <span>{selectedEvent.extendedProps.status}</span></p>
                <p><strong>Visited:</strong><br /> <span>{selectedEvent.extendedProps.visited}</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* End of Bootstrap Modal */}
    </div>
  );
}

export default Calendar;
