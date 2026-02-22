# Ticket Manager WebApp

Front-end web application for ticket management developed with **HTML5**, **CSS3**, and **Vanilla JavaScript**.  
The application integrates with a REST API (Module 8) and implements full CRUD operations, dynamic UI updates, and dashboard statistics.

---

## 📌 Project Overview

Main objectives:

- Build a responsive web application
- Consume a REST API using Fetch / async / await
- Implement full CRUD operations
- Provide user feedback and loading states
- Ensure proper mobile and desktop behaviour

---

## 🚀 Features

### Ticket Management (index.html)

- Automatic ticket loading (GET)
- Create new tickets (POST)
- Update existing tickets (PUT)
- Archive/remove tickets (DELETE)
- Dynamic DOM manipulation (no page reload)
- Input validation
- User feedback messages
- Option to show archived tickets

---

### Statistics Dashboard (stats.html)

- Tickets grouped by status
- Tickets grouped by priority
- Recently created tickets (last 7 days)
- Data retrieved from API endpoints

---

### About Page (about.html)

- Project information
- Technologies used
- Development notes

---

## 🛠 Technologies Used

- HTML5 (Semantic Structure)
- CSS3 (Responsive Layout / Flexbox)
- Vanilla JavaScript (ES6+)
- Fetch API (Async / Await)
- REST API Integration

No external libraries or frameworks were used.

---

## 📡 API Integration

The application communicates with the REST API developed in Module 8.

Example base URL: http://localhost:3000


Endpoints used:

- GET /api/tickets
- POST /api/tickets
- PUT /api/tickets/{id}
- DELETE /api/tickets/{id}
- Stats endpoints

---

## 📱 Responsiveness

The interface was designed following a **mobile-first approach** and tested on:

- iPhone 14 Pro Max (430 × 932)
- Desktop Chrome (1920 × 1080)

Design goals:

- No horizontal scrolling
- Readable cards
- Accessible buttons and forms

---

## ✅ Validation & UX

- Client-side validation before API requests
- Loading states during async operations
- Success and error feedback messages
- Confirmation before deletion

---

## ⚙ Running the Project

1. Start the REST API (Module 8)
2. Ensure API base URL is correct in `config.js`
3. Open `index.html` in Google Chrome

---

## 👥 Development Notes

- Project structured according to a technical contract
- Clear separation between API, UI, and Stats logic
- Code written for clarity and maintainability

---

## 📄 License

Academic project – educational purposes only.
