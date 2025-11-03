document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const title = document.createElement("div");
        title.className = "participants-title";
        title.textContent = "Participants";
        participantsDiv.appendChild(title);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";
            
            // Create participant email text
            const participantText = document.createTextNode(p);
            li.appendChild(participantText);
            
            // Create delete icon
            const deleteIcon = document.createElement("span");
            deleteIcon.innerHTML = "✖";
            deleteIcon.className = "delete-icon";
            deleteIcon.title = "Remove participant";
            deleteIcon.onclick = async (e) => {
              e.preventDefault();
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(p)}`,
                  {
                    method: "DELETE",
                  }
                );

                const result = await response.json();

                if (response.ok) {
                  // Remove the participant from the list
                  li.remove();
                  // If this was the last participant, show the "no participants" message
                  if (ul.children.length === 0) {
                    const noOne = document.createElement("p");
                    noOne.className = "info";
                    noOne.textContent = "No participants yet. Be the first!";
                    participantsDiv.replaceChild(noOne, ul);
                  }
                  // Update activity select option
                  const option = Array.from(activitySelect.options).find(
                    opt => opt.value === name  // Fixed: using name instead of activity_name
                  );
                  if (option) {
                    option.textContent = name;  // Fixed: using name instead of activity_name
                  }
                } else {
                  alert(result.detail || "Failed to unregister participant");
                }
              } catch (error) {
                console.error("Error unregistering participant:", error);
                if (error instanceof TypeError && error.message.includes('json')) {
                  alert("Server error: Could not parse response");
                } else {
                  alert("Failed to unregister participant. Please try again.");
                }
              }
            };
            li.appendChild(deleteIcon);
            ul.appendChild(li);
          });

          participantsDiv.appendChild(ul);
        } else {
          const noOne = document.createElement("p");
          noOne.className = "info";
          noOne.textContent = "No participants yet. Be the first!";
          participantsDiv.appendChild(noOne);
        }

        activityCard.appendChild(participantsDiv);
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
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Find the activity card that needs updating
        const activityCards = document.querySelectorAll('.activity-card');
        const targetCard = Array.from(activityCards).find(card => 
          card.querySelector('h4').textContent === activity
        );

        if (targetCard) {
          const participantsDiv = targetCard.querySelector('.participants');
          const participantsList = participantsDiv.querySelector('.participants-list');
          const noParticipantsMsg = participantsDiv.querySelector('.info');

          if (noParticipantsMsg) {
            // Remove "no participants" message and create new list
            const ul = document.createElement('ul');
            ul.className = 'participants-list';
            const li = document.createElement('li');
            li.className = 'participant-item';
            
            // Add participant email
            const participantText = document.createTextNode(email);
            li.appendChild(participantText);
            
            // Add delete icon
            const deleteIcon = document.createElement('span');
            deleteIcon.innerHTML = '✖';
            deleteIcon.className = 'delete-icon';
            deleteIcon.title = 'Remove participant';
            deleteIcon.onclick = async (e) => {
              e.preventDefault();
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
                  {
                    method: 'DELETE',
                  }
                );

                const result = await response.json();

                if (response.ok) {
                  li.remove();
                  if (ul.children.length === 0) {
                    const noOne = document.createElement('p');
                    noOne.className = 'info';
                    noOne.textContent = 'No participants yet. Be the first!';
                    participantsDiv.replaceChild(noOne, ul);
                  }
                } else {
                  alert(result.detail || 'Failed to unregister participant');
                }
              } catch (error) {
                console.error('Error unregistering participant:', error);
                if (error instanceof TypeError && error.message.includes('json')) {
                  alert('Server error: Could not parse response');
                } else {
                  alert('Failed to unregister participant. Please try again.');
                }
              }
            };
            li.appendChild(deleteIcon);
            ul.appendChild(li);
            participantsDiv.replaceChild(ul, noParticipantsMsg);
          } else if (participantsList) {
            // Add to existing list
            const li = document.createElement('li');
            li.className = 'participant-item';
            
            // Add participant email
            const participantText = document.createTextNode(email);
            li.appendChild(participantText);
            
            // Add delete icon
            const deleteIcon = document.createElement('span');
            deleteIcon.innerHTML = '✖';
            deleteIcon.className = 'delete-icon';
            deleteIcon.title = 'Remove participant';
            deleteIcon.onclick = async (e) => {
              e.preventDefault();
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
                  {
                    method: 'DELETE',
                  }
                );

                const result = await response.json();

                if (response.ok) {
                  li.remove();
                  if (participantsList.children.length === 0) {
                    const noOne = document.createElement('p');
                    noOne.className = 'info';
                    noOne.textContent = 'No participants yet. Be the first!';
                    participantsDiv.replaceChild(noOne, participantsList);
                  }
                } else {
                  alert(result.detail || 'Failed to unregister participant');
                }
              } catch (error) {
                console.error('Error unregistering participant:', error);
                if (error instanceof TypeError && error.message.includes('json')) {
                  alert('Server error: Could not parse response');
                } else {
                  alert('Failed to unregister participant. Please try again.');
                }
              }
            };
            li.appendChild(deleteIcon);
            participantsList.appendChild(li);
          }
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
