# Security engineer

- S1: How do people log in, and can they reset a password safely?
- S2: How are passwords stored? Only with a slow password hash (bcrypt, argon2, scrypt), never as plain text or with a reversible method. Better still: no passwords of our own (school login, magic link) if the project allows.
- S3: Can one user see or change another user's data by changing an id in a link or a request?
- S4: Who can do what (roles)? Is every rule checked on the server, not only hidden in the page?
- S5: Where do secrets live? Never in the repo, never in the app bundle sent to browsers or phones.
- S6: What personal data is stored, who can see it, where does it live, and how long is it kept (GDPR for people in the EU)?
- S7: Is every input checked on the server? Are database queries built with placeholders, never by joining strings?
- S8: Is there a limit on login attempts and sign-ups?
- S9: Is all traffic over HTTPS?
- S10: Which dependencies or services are risky, unmaintained, or send data somewhere unexpected?
- S11: What happens if the database leaks, and what limits the damage?
- S12: Does any idea in the brief put people or data at risk? Push back with a safe option.
