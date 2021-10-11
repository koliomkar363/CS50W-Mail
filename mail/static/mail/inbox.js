document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#email-view").style.display = "none";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function send_email() {
  // POST Method
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: document.querySelector("#compose-recipients").value,
      subject: document.querySelector("#compose-subject").value,
      body: document.querySelector("#compose-body").value,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      // Print result
      console.log(result);
      load_mailbox("sent");
    });
  return false;
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      // Print result
      console.log(emails);

      // Iterate through each element of the array
      for (let email of emails) {
        let element;
        if (mailbox === "sent") {
          element = email.recipients;
        } else {
          element = email.sender;
        }

        // Creating New Div element for each item in the array
        const mailDiv = document.createElement("div");
        mailDiv.className = "border border-dark";
        mailDiv.style.cursor = "pointer";

        // Change the Background color of the div
        if (email.read) {
          mailDiv.style.backgroundColor = "lightgrey";
        } else {
          mailDiv.style.backgroundColor = "white";
        }

        mailDiv.innerHTML = `
          <span style="font-weight:bold; padding:5px 4px">
            ${element}
          </span>
          <span style="padding-left:10px">
            ${email.subject}
          </span>
          <span style="position:relative; float:right; padding-right:4px; color:grey">
            ${email.timestamp}
          </span>
        `;

        // Adding an event listener to the div
        mailDiv.addEventListener("click", function () {
          view_email(email.id, mailbox);
        });
        document.querySelector("#emails-view").appendChild(mailDiv);
      }
    });
}

function view_email(email_id, mailbox) {
  // Show the email and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-view").style.display = "block";

  // Request email
  fetch(`/emails/${email_id}`)
    .then((response) => response.json())
    .then((email) => {
      // Print email
      console.log(email);

      // Contents of the email
      document.querySelector("#email-view").innerHTML = `
      <p>
        <strong>From:</strong> ${email.sender} <br/>
        <strong>To:</strong> ${email.recipients} <br/>
        <strong>Subject:</strong> ${email.subject} <br/>
        <strong>Timestamp:</strong> ${email.timestamp}
      </p>
      `;
      const replyBtn = document.createElement("button");
      replyBtn.className = "btn btn-sm btn-outline-primary";
      replyBtn.textContent = "Reply";

      replyBtn.addEventListener("click", function () {
        console.log("Reply button was clicked!");
        reply_email(email.sender, email.subject, email.body, email.timestamp);
      });

      document.querySelector("#email-view").appendChild(replyBtn);

      if (mailbox !== "sent") {
        const archiveBtn = document.createElement("button");
        archiveBtn.className = "btn btn-sm btn-outline-primary";
        archiveBtn.style.marginLeft = "5px";

        if (email.archived) {
          archiveBtn.textContent = "Unarchive";
        } else {
          archiveBtn.textContent = "Archive";
        }

        archiveBtn.addEventListener("click", function () {
          console.log("Archive Button has been clicked!");
          // Toggle archive email
          archive_email(email.id, email.archived);
        });

        document.querySelector("#email-view").appendChild(archiveBtn);
      }

      const body = document.createElement("div");
      body.innerHTML = `
        <hr />
        <p>${email.body}</p>
      `;
      document.querySelector("#email-view").appendChild(body);
    });

  // Mark email as read
  fetch(`/emails/${email_id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  });
}

function archive_email(email_id, archived) {
  // Toggle the archived value
  archived = !archived;
  fetch(`/emails/${email_id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: archived,
    }),
  });
  load_mailbox("inbox");
  window.location.reload();
}

function reply_email(sender, subject, body, timestamp) {
  console.log(sender, subject, body, timestamp);
  compose_email();

  document.querySelector("#compose-recipients").value = sender;

  if (!subject.startsWith("Re: ")) {
    subject = `Re: ${subject}`;
  }
  document.querySelector("#compose-subject").value = subject;

  body = `\n\nOn ${timestamp} ${sender} wrote:\n${body}`;
  document.querySelector("#compose-body").value = body;
}
