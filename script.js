let selectedProgram = "";

// IMPORTANT: Paste your Power Automate HTTP trigger URL here.
// Example: const POWER_AUTOMATE_FLOW_URL = "https://prod-xx.australiaeast.logic.azure.com/...";
const POWER_AUTOMATE_FLOW_URL = "https://bb57378c2a0aea0895a75c16061df6.c2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b4f717d4ea32463888f8ee627bfdb9a9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qRbYAEWa6GRuVNmL78AYJF1y7AnGLosuT8MVLrbq4JI";

function toggleAccordion(button) {
  const accordion = button.parentElement;
  const arrow = button.querySelector("span");

  accordion.classList.toggle("open");
  arrow.textContent = accordion.classList.contains("open") ? "⌃" : "⌄";
}

function nextStep(stepNumber) {
  document.querySelectorAll(".form-step").forEach(step => {
    step.classList.remove("active");
  });

  document.querySelector("#step" + stepNumber).classList.add("active");

  document.querySelectorAll(".step").forEach((step, index) => {
    step.classList.remove("active");

    if (index < stepNumber) {
      step.classList.add("active");
    }
  });

  window.scrollTo({
    top: document.querySelector(".booking-box").offsetTop - 90,
    behavior: "smooth"
  });
}

document.querySelectorAll(".program-card").forEach(card => {
  card.addEventListener("click", function () {
    document.querySelectorAll(".program-card").forEach(c => {
      c.classList.remove("selected");
    });

    this.classList.add("selected");

    const radio = this.querySelector("input[type='radio']");
    radio.checked = true;

    selectedProgram = this.querySelector("p").textContent.trim();
  });
});

function getSelectedYearLevels() {
  return Array.from(document.querySelectorAll(".year-level-option:checked"))
    .map(option => option.value)
    .join(", ");
}

function getSessionTimes(requestedTime) {
  if (requestedTime === "Morning") {
    return { startTime: "9:30 AM", endTime: "12:00 PM" };
  }

  if (requestedTime === "Afternoon") {
    return { startTime: "1:00 PM", endTime: "3:00 PM" };
  }

  if (requestedTime === "Full Day") {
    return { startTime: "9:30 AM", endTime: "3:00 PM" };
  }

  return { startTime: "", endTime: "" };
}

function setStatus(message, type) {
  const statusBox = document.querySelector("#submissionStatus");

  if (!statusBox) {
    return;
  }

  statusBox.textContent = message;
  statusBox.className = "submission-status " + type;
}

async function submitForm() {
  const contactName = document.querySelector("#contactName").value.trim();
  const email = document.querySelector("#email").value.trim();
  const phone = document.querySelector("#phone").value.trim();
  const position = document.querySelector("#position").value.trim();
  const students = document.querySelector("#students").value;
  const classes = document.querySelector("#classes").value;
  const date = document.querySelector("#bookingDate").value;
  const requestedTime = document.querySelector("#bookingTime").value;
  const schoolName = document.querySelector("#schoolName").value.trim();
  const partnerSchool = document.querySelector("#partnerSchool").value;
  const yearLevels = getSelectedYearLevels();
  const message = document.querySelector("#message").value.trim();
  const sessionTimes = getSessionTimes(requestedTime);

  if (!selectedProgram) {
    alert("Please select a program before submitting.");
    nextStep(1);
    return;
  }

  if (!date || !requestedTime || !students || !classes || !schoolName || !contactName || !email || !phone || !yearLevels) {
    alert("Please complete all required fields before submitting.");
    return;
  }

  if (POWER_AUTOMATE_FLOW_URL === "PASTE_YOUR_POWER_AUTOMATE_HTTP_POST_URL_HERE") {
    alert("Power Automate URL is missing. Please paste your flow URL into script.js first.");
    return;
  }

  const bookingData = {
  sessionDate: date,
  school: schoolName,
  program: selectedProgram,
  startTime: sessionTimes.startTime,
  endTime: sessionTimes.endTime,
  yearLevel: yearLevels,
  deliveryType: "Face-to-Face",
  approval: "Pending",
  numberOfClasses: Number(classes),
  enrolledStudents: Number(students),
  attendedStudents: 0,
  isCancelled: false,
  contactName: contactName,
  contactEmail: email,
  contactPhone: phone,
  sessionNotes:
    "Online booking request submitted from demo website.\n" +
    "Requested time: " + requestedTime + "\n" +
    "Partner school: " + partnerSchool + "\n" +
    "Contact: " + contactName + "\n" +
    "Position: " + position + "\n" +
    "Email: " + email + "\n" +
    "Phone: " + phone + "\n" +
    "Message: " + (message || "No message provided")
};

  setStatus("Submitting booking request...", "loading");

  try {
    // mode: "no-cors" is used because Power Automate HTTP triggers often block browser CORS preflight requests.
    // The request is still sent to the flow, but the browser cannot read the response.
    await fetch(POWER_AUTOMATE_FLOW_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
    "Content-Type": "text/plain"
  },
      body: JSON.stringify(bookingData)
    });

    setStatus("Booking submitted successfully. Please check the Power Apps Bookings table.", "success");

    alert(
    "Booking request submitted successfully!\n\n" +
    "Program: " + selectedProgram + "\n" +
    "School: " + schoolName + "\n" +
    "Date: " + date + "\n" +
    "Time: " + requestedTime + "\n\n" +
    "The booking data has been sent to Power Automate.\n" +
    "Booking ID will be generated automatically in Power Apps."
    );

  } catch (error) {
    console.error("Submission error:", error);
    setStatus("Submission failed. Please check the Power Automate flow URL and try again.", "error");
    alert("Submission failed. Please check the Power Automate flow URL and try again.");
  }
}
