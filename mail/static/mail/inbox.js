document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  //document.querySelector('#inbox').addEventListener('click', () => document.querySelectorAll('div.message').addEventListener('click', console.log('hello')));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = send_email;
  document.querySelector('#archive_form').addEventListener('submit', function() {
    let id = parseInt(document.querySelector('#archive_id').value);
    let option = document.querySelector('#archive_button').value;
    if (option === 'Archive') {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: true
        })
      })
      console.log('Email archived');
    } else if (option === 'Unarchive') {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: false
        })
      })
      console.log('Email unarchived');
    } else {
      console.log('Something went wrong when trying to archive this email');
    }

    return false;
  });

  // By default, load the inbox
  load_mailbox('inbox');

  document.querySelector('#reply_form').addEventListener('submit', function() {
    let id = parseInt(document.querySelector('#reply_id').value);
    reply(id);
    return false;
  });

});

//Listens for when a message in the inbox is clicked on
document.addEventListener('DOMNodeInserted', function() {
  let list = document.querySelectorAll('.message');
  //console.log(list);
  for (var i = 0; i < list.length; i++) {
    console.log(list);
    let div_id = list[i].id;
    if (list[i].getAttribute('listener') !== 'true') {}
      list[i].addEventListener('click', show_email.bind(this, div_id));
      list[i].setAttribute('listener', 'true');
    console.log(list[i].getAttribute('listener'));
  };
  return false;
});

function send_email() {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    //console.log(result);
    setTimeout(function() { load_mailbox('sent'); }, 100);
  });

  return false;
}

//Shows the email that was clicked on
function show_email(id) {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#message-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  let body = document.querySelector('#message_body');
  let subject = document.querySelector('#message_subject');
  let sender = document.querySelector('#message_sender');
  let recipients = document.querySelector('#message_recipients');
  let timestamp = document.querySelector('#message_timestamp');
  let isRead = false;
  let isArchived = false;
  var emailcopy = {};

  //Display contents of email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    //console.log(email.read);
    body.innerHTML = `<b>Body: </b>${email.body}`;
    sender.innerHTML = `<b>From: </b>${email.sender}`;
    subject.innerHTML = `<b>Subject: </b>${email.subject}`;
    timestamp.innerHTML = `<b>Sent at: </b>${email.timestamp}`;
    recipients.innerHTML = `<b>To: </b>${email.recipients}`;
    status_checker(email);
  });

  console.log(emailcopy);



}

function status_checker(email) {
  console.log('status checker output: ' + email.body);
  let isRead = email.read;
  let isArchived = email.archived;
  let us = document.querySelector('#us').value;
  let sender = email.sender;

  if (isRead === false) {
    //Mark email as read
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
      read: true
    })
  });
  }

  //Hide archive button if we're the sender, otherwise show it
  if (us === sender) {
    document.querySelector('#archive_form').style.display = 'none';
  } else {
    document.querySelector('#archive_form').style.display = 'block';
  }

  //Set value of button depending on if the email is archived or not
  document.querySelector('#archive_id').value = email.id;
  document.querySelector('#reply_id').value = email.id;
  if (isArchived === false) {
    console.log('not archived');
    document.querySelector('#archive_button').value = 'Archive';
    //document.archive.archive_button.value = 'Archive';
  } else {
    console.log('already archived');
    document.querySelector('#archive_button').value = 'Unarchive';
    //document.archive.archive_button.value = 'Unarchive';
  };
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#message-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

//Populates compose_form with values from email
function reply(reply_id) {
  compose_email();

  fetch(`/emails/${reply_id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.recipients} wrote: \n${email.body}\n\n`;
  });
  return false;
}

function load_mailbox(mailbox) {

  const messageBox = document.querySelector('#emails-view');

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#message-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //if (mailbox === 'sent') {
  //  document.querySelector('#archive_form').style.display = 'none';
  //}

  // Show what's in the inbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    //loop through all the emails
    if (mailbox === 'inbox') {
      for (let i in emails) {
        let newDiv = document.createElement('div');
        newDiv.id = `${emails[i].id}`;
        newDiv.className = 'message';
        if (emails[i].read === true) {
          newDiv.style.backgroundColor = 'lightgrey';
        }
        newDiv.innerHTML = `<b>From: </b>${emails[i].sender}<br><b>Subject: </b>${emails[i].subject}<br><b>Sent at: </b>${emails[i].timestamp}</div>`
        newDiv.style.border = "thin solid black";
        newDiv.style.padding = "5px";
        newDiv.style.margin = '10px';
        messageBox.appendChild(newDiv);
      };
    } else if (mailbox === 'sent') {
      for (let i in emails) {
        let newDiv = document.createElement('div');
        newDiv.id = `${emails[i].id}`;
        newDiv.className = 'message';
        if (emails[i].read === true) {
          newDiv.style.backgroundColor = 'lightgrey';
        }
        newDiv.innerHTML = `<b>Sent to: </b>${emails[i].recipients}<br><b>Subject:</b> ${emails[i].subject}<br><b>Sent at: </b>${emails[i].timestamp}</div>`
        newDiv.style.border = "thin solid black";
        newDiv.style.padding = "5px";
        newDiv.style.margin = '10px';
        messageBox.appendChild(newDiv);
      };
    } else if (mailbox === 'archive') {
      for (let i in emails) {
        let newDiv = document.createElement('div');
        newDiv.id = `${emails[i].id}`;
        newDiv.className = 'message';
        if (emails[i].read === true) {
          newDiv.style.backgroundColor = 'lightgrey';
        }
        newDiv.innerHTML = `<b>From: </b>${emails[i].sender}<br><b>Subject: </b>${emails[i].subject}<br><b>Sent at: </b>${emails[i].timestamp}</div>`
        newDiv.style.border = "thin solid black";
        newDiv.style.padding = "5px";
        newDiv.style.margin = '10px';
        messageBox.appendChild(newDiv);
      };
    }
      //messageBox.innerHTML = `<div id=${emails[i].id}>From: ${emails[i].sender}<br>Subject: ${emails[i].subject}<br>Sent at: ${emails[i].timestamp}</div>`;}
    //console.log(emails[0].body);
    //console.log('hello');
  });
}

//function load_messages()