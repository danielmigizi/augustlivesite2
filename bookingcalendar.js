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

      const startDate = new Date(checkIn);
      const endDate = new Date(checkOut);
      const arrivalDate = new Date(arrival);
      const departureDate = new Date(departure);

      // Create min and max dates for custom check-in and check-out
      const minCustomCheckInDate = new Date(startDate);
      minCustomCheckInDate.setDate(minCustomCheckInDate.getDate() + 2);
      const maxCustomCheckOutDate = new Date(endDate);
      maxCustomCheckOutDate.setDate(maxCustomCheckOutDate.getDate());

      // Update the initializeDatePicker function calls
      initializeDatePicker(
        "arrival-picker",
        arrivalDate,
        minCustomCheckInDate,
        endDate,
        "newArrival"
      );
      initializeDatePicker(
        "departure-picker",
        departureDate,
        startDate,
        maxCustomCheckOutDate,
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
  
  function initializeDatePicker(elementId, defaultDate, minDate, maxDate, dataVariable) {
    const picker = new easepick.create({
      element: document.getElementById(elementId),
      css: ["https://csb-hrpwdp.netlify.app/augustcalendar.css"],
      plugins: ["LockPlugin"],
      format: "DD MMM YYYY",
      LockPlugin: {
        minDate: minDate,
        maxDate: maxDate // Ensure maxDate is included
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
};