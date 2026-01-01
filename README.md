<p align="center">
  <h1 align="center">🧭 True North</h1>
  <p align="center">
    <strong>A personal growth companion for journaling, habit tracking, and emotional wellness</strong>
  </p>
  <p align="center">
    <a href="https://thetruenorth.app">Live Demo</a> •
    <a href="#features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#tech-stack">Tech Stack</a>
  </p>
</p>

---

<img width="1920" alt="True North Dashboard" src="https://github.com/user-attachments/assets/91d4d837-f678-47b2-a93b-7c7a219ac6ea" />

## 📋 Overview

True North is a comprehensive personal wellness application designed to help you track your daily habits, journal your thoughts, and monitor emotional well-being patterns over time. Built with React and Firebase, it offers a seamless, responsive experience across all devices.

---

## ✨ Features

### 📓 Journaling

Capture your thoughts with a clean, distraction-free writing experience. Log daily moments, revisit past entries, and build a personal narrative of your journey.

<p align="center">
  <img width="1920" alt="Journal Feature" src="https://github.com/user-attachments/assets/4781be30-fbec-4b41-85e2-7aa121e7b062" />
</p>

<p align="center">
  <img width="1920" alt="Daily Moments" src="https://github.com/user-attachments/assets/8b0334b0-f7a2-4cba-9d46-0193143925e7" />
</p>

<p align="center">
  <img width="1920" alt="Entry History" src="https://github.com/user-attachments/assets/42085b14-7dd9-4098-b32a-c630e13d4c1c" />
</p>

---

### 📊 Multi-Tracker System

Track various aspects of your daily life with a flexible, customizable tracking system:

| Tracker | Description |
|:--------|:------------|
| 🌞 **Day Rating** | Rate your overall day experience |
| 😴 **Sleep Quality** | Monitor nightly sleep patterns |
| 😰 **Anxiety Level** | Track anxiety intensity |
| 😓 **Stress Level** | Log daily stress levels |
| 📱 **Screen Time** | Record hours spent on screens |
| 😊 **Mood** | Capture your emotional state |
| ⚡ **Energy** | Track daily energy levels |
| 📋 **Discipline** | Measure consistency with goals |
| 💭 **Thoughts** | Monitor intrusive thought patterns |

<p align="center">
  <img width="1920" alt="Tracker System" src="https://github.com/user-attachments/assets/04a9254c-0aea-4a19-91e4-a52316cba246" />
</p>

---

### 📈 Analytics & Visualization

Gain insights into your patterns with interactive charts and monthly trend analysis.

<p align="center">
  <img width="1920" alt="Analytics Dashboard" src="https://github.com/user-attachments/assets/fb374570-5856-4194-9372-aad4e887dbe5" />
</p>

<p align="center">
  <img width="1920" alt="Trend Analysis" src="https://github.com/user-attachments/assets/7dc049a7-1a28-4345-9e2e-f4cb68c0231f" />
</p>

---

### ✅ Habit Tracker

Build and maintain daily habits with visual progress tracking and streak monitoring.

<p align="center">
  <img width="1920" alt="Habit Tracker" src="https://github.com/user-attachments/assets/a594600d-bc23-470b-91d4-a3b25a1e4310" />
</p>

---

## 🛠️ Tech Stack

| Category | Technologies |
|:---------|:-------------|
| **Frontend** | React 18, React Router v7 |
| **State Management** | Redux Toolkit |
| **Backend** | Firebase (Firestore, Authentication) |
| **Visualization** | Chart.js, Recharts |
| **Styling** | CSS with CSS Variables (Dark/Light theme) |
| **Icons** | React Icons |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v16 or higher
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/truenorth.git
   cd truenorth
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Firebase**

   - Create a project at [Firebase Console](https://console.firebase.google.com/)
   - Enable **Firestore Database** and **Authentication**
   - Copy your Firebase config credentials

4. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your Firebase credentials:

   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

5. **Create firebase.js**

   Copy the example file and it will automatically use your `.env` variables:

   ```bash
   cp src/firebase.js.example src/firebase.js
   ```

6. **Start the development server**

   ```bash
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Firebase Security Rules

Configure Firestore rules to protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /journal_entries/{entryId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Home.js          # Landing page
│   ├── Journal.js       # Journal entries
│   ├── HabitTracker.js  # Habit tracking
│   └── Login.js         # Authentication
├── trackers/            # Tracker system
│   ├── UnifiedTracker.js
│   └── trackerConfig.js
├── context/             # React context (Auth)
├── utils/               # Utility functions
│   ├── firestore.js     # Firestore operations
│   ├── localCache.js    # Local caching
│   └── dataSync.js      # Data synchronization
├── css/                 # Stylesheets
└── App.js               # Main app component
```

---

## 📦 Scripts

| Command | Description |
|:--------|:------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run test suite |

---

## 🎨 Theming

True North supports both dark and light themes using CSS variables, automatically adapting to user preference.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add YourFeature'`
4. Push to branch: `git push origin feature/YourFeature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Chart.js](https://www.chartjs.org/)
- [Recharts](https://recharts.org/)
- [React Icons](https://react-icons.github.io/react-icons/)

---

<p align="center">
  Made with ❤️ for personal growth
</p>
