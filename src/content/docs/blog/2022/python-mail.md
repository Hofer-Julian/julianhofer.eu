---
title: "How to send Emails via Python"
date: 2022-12-28
tags: ["Python", "Email", "Scripting"]
draft: false
---

I've assumed that sending emails via a CLI would be easy.
That might even be the case, but sending them in a way that they actually show up in the receiver's mailbox is quite a different story.

<!-- excerpt -->

After following multiple tutorials and using tools from `sendmail` to `mailx`, not a single email arrived.
Since I wanted to send the mail from within a Python script anyway, I moved on to a Real Python [tutorial](https://realpython.com/python-send-email/).
This is the snippet they use to send an email.

```python
import smtplib, ssl

port = 465  # For SSL
smtp_server = "smtp.domain.com"
sender_email = "my@domain.com"      # Enter your address
receiver_email = "your@domain.com"  # Enter receiver address
password = "MY_PASSWORD"            # Enter password
message = """\
Subject: Hi there

This message is sent from Python."""

context = ssl.create_default_context()
with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
    server.login(sender_email, password)
    server.sendmail(sender_email, receiver_email, message)
```

And again, nothing arrived at my preferred receiver [protonmail](https://proton.me/mail).
However, if you try to email to a gmail address, you get a helpful error back.

```
Our system has detected that this message is not RFC 550-5.7.1 5322
compliant: 'From' header is missing. To reduce the amount of spam sent
to Gmail, this message has been blocked.
```

This is how the snippet looks after adding the 'From' header:

```python
import smtplib, ssl

port = 465  # For SSL
smtp_server = "smtp.domain.com"
sender_email = "my@domain.com"      # Enter your address
receiver_email = "your@domain.com"  # Enter receiver address
password = "MY_PASSWORD"            # Enter password
# 👇 The string is now a f-string and the 'From' header has been added
message = f"""\
From: <{sender_email}>
Subject: Hi there

This message is sent from Python."""

context = ssl.create_default_context()
with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
    server.login(sender_email, password)
    server.sendmail(sender_email, receiver_email, message)
```

And voilà, the email arrives at gmail.
Again nothing at protonmail, but now it wasn't too hard to guess that it might want a 'To' header.

```python
import smtplib, ssl

port = 465  # For SSL
smtp_server = "smtp.domain.com"
sender_email = "my@domain.com"      # Enter your address
receiver_email = "your@domain.com"  # Enter receiver address
password = "MY_PASSWORD"            # Enter password
# 👇 The 'To' header has been added
message = f"""\
From: <{sender_email}>
To: <{receiver_email}>
Subject: Hi there

This message is sent from Python."""

context = ssl.create_default_context()
with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
    server.login(sender_email, password)
    server.sendmail(sender_email, receiver_email, message)
```

The Real Python tutorial is from 2018, so chances are that there are better ways to send emails nowadays.
After looking through the standard library docs, I think the following snippet is a more idiomatic way to achieve the same thing in 2022.
The main difference is that it removes duplication with the help of the `EmailMessage` class.

```python
import smtplib, ssl
from email.message import EmailMessage

port = 465  # For SSL
smtp_server = "smtp.domain.net"
sender_email = "my@domain.at"       # Enter your address
receiver_email = "your@domain.com"  # Enter receiver address
password = "MY_PASSWORD"            # Enter password

subject = "Hi there"
content = "This message is sent from Python."

msg = EmailMessage()
msg['Subject'] = subject
msg['From'] = sender_email
msg['To'] = receiver_email
msg.set_content(content)

context = ssl.create_default_context()
with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
    server.login(sender_email, password)
    server.send_message(msg)
```

You can find the discussion at this Mastodon [post](https://chaos.social/@ju/109489141171195265).
