// Helper function for parsing date while considering UK timezone
function parseDateAsUKTimezone(dateString) {
  // Just return the date part of the string, making it timezone-independent
  return dateString.split('T')[0];
}

window.onload = async () => {
  function readFileAsBase64(file) {
    if (!file) return null;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target.result);
      };

      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  }

  const fileInput = document.querySelector('[wized="booking_guest_passport"]');
  if (fileInput) {
    fileInput.addEventListener("change", async function () {
      if (this.files && this.files[0]) {
        const base64String = await readFileAsBase64(this.files[0]);
        await Wized.data.setVariable("passportImageString", base64String);
      }
    });
  }

  async function setupDatePickers() {
    try {
      const checkIn = await Wized.data.get("r.4.d.availability.start_date");
      const checkOut = await Wized.data.get("r.4.d.availability.end_date");
      const arrival = await Wized.data.get("r.4.d.arrival_date");
      const departure = await Wized.data.get("r.4.d.departure_date");

      // Parse the dates as timezone-independent strings
      const startDate = parseDateAsUKTimezone(checkIn);
      const endDate = parseDateAsUKTimezone(checkOut);
      const arrivalDate = parseDateAsUKTimezone(arrival);
      const departureDate = parseDateAsUKTimezone(departure);

      // Create min and max dates for custom check-in and check-out
      const minCustomCheckInDate = new Date(startDate);
      minCustomCheckInDate.setDate(minCustomCheckInDate.getDate() + 1);
      const maxCustomCheckOutDate = new Date(endDate);
      maxCustomCheckOutDate.setDate(maxCustomCheckOutDate.getDate() - 1);

      console.log("minCustomCheckInDate:", minCustomCheckInDate.toISOString().split('T')[0]);
      console.log("maxCustomCheckOutDate:", maxCustomCheckOutDate.toISOString().split('T')[0]);

      // Update the initializeDatePicker function calls
      initializeDatePicker(
        "arrival-picker",
        arrivalDate,
        minCustomCheckInDate.toISOString().split('T')[0],
        endDate,
        "newArrival"
      );
      initializeDatePicker(
        "departure-picker",
        departureDate,
        startDate,
        maxCustomCheckOutDate.toISOString().split('T')[0],
        "newDeparture"
      );
    } catch (error) {
      console.error("Error initializing date pickers:", error);
    }
  }

  if (typeof Wized !== "undefined") {
    Wized.request.awaitAllPageLoad(setupDatePickers);
  } else {
    console.error("Wized is not defined.");
  }
};

function initializeDatePicker(elementId, defaultDate, minDate, maxDate, dataVariable) {
  const picker = new easepick.create({
    element: document.getElementById(elementId),
    css: ["https://csb-hrpwdp.netlify.app/augustcalendar.css"],
    plugins: ["LockPlugin"],
    format: "YYYY-MM-DD", // Changed to match the new date format
    LockPlugin: {
      minDate: minDate,
      maxDate: maxDate
    },
    setup(picker) {
      picker.on("select", async (e) => {
        const { date } = e.detail;
        const selectedDate = date.format("YYYY-MM-DD");

        // Use setTimeout to ensure UI refresh
        setTimeout(async () => {
          try {
            await Wized.data.setVariable(dataVariable, selectedDate);
          } catch (error) {
            console.error(`Error updating Wized variable: ${dataVariable}`, error);
          }
        }, 0); // Wait for the current execution queue to clear
      });
    },
  });

  picker.gotoDate(defaultDate);
  picker.setDate(defaultDate);
}