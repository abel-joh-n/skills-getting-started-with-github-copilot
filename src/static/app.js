document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, className) {
    messageDiv.textContent = message;
    messageDiv.className = className;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function renderParticipants(activityName, details, participantsSection, availabilityText) {
    participantsSection.replaceChildren();

    const participantsHeading = document.createElement("h5");
    participantsHeading.textContent = "Participants";
    participantsSection.appendChild(participantsHeading);

    if (details.participants.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "participants-empty";
      emptyMessage.textContent = "No participants yet.";
      participantsSection.appendChild(emptyMessage);
      return;
    }

    const participantsList = document.createElement("ul");
    participantsList.className = "participants-list";

    details.participants.forEach((email) => {
      const participant = document.createElement("li");
      const participantEmail = document.createElement("span");
      participantEmail.className = "participant-email";
      participantEmail.textContent = email;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-participant-button";
      removeButton.textContent = "🗑️";
      removeButton.setAttribute("aria-label", `Unregister ${email} from ${activityName}`);
      removeButton.title = "Unregister participant";
      removeButton.addEventListener("click", async () => {
        removeButton.disabled = true;

        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
            { method: "DELETE" }
          );
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.detail || "Failed to unregister participant.");
          }

          const participantIndex = details.participants.indexOf(email);
          if (participantIndex !== -1) {
            details.participants.splice(participantIndex, 1);
          }

          availabilityText.textContent =
            `${details.max_participants - details.participants.length} spots left`;
          renderParticipants(activityName, details, participantsSection, availabilityText);
          showMessage(result.message, "success");
        } catch (error) {
          removeButton.disabled = false;
          showMessage(error.message || "Failed to unregister participant.", "error");
          console.error("Error unregistering participant:", error);
        }
      });

      participant.appendChild(participantEmail);
      participant.appendChild(removeButton);
      participantsList.appendChild(participant);
    });

    participantsSection.appendChild(participantsList);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability">
            <strong>Availability:</strong> <span class="availability-count">${spotsLeft} spots left</span>
          </p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";
        const availabilityText = activityCard.querySelector(".availability-count");
        renderParticipants(name, details, participantsSection, availabilityText);

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        signupForm.reset();
        await fetchActivities();
        showMessage(result.message, "success");
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
