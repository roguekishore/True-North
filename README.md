# 🧭 True North

A personal growth companion app for journaling, habit tracking, and emotional wellness monitoring. Built with React and Firebase.

![True North Banner](./docs/images/banner-placeholder.png)

## ✨ Features

### 📓 Journal
- **Daily Entries**: Capture your thoughts with a distraction-free editor
- **Daily Moments**: Log your favorite moments throughout each day
- **Entry History**: Browse and revisit past journal entries

![Journal Screenshot](./docs/images/journal-placeholder.png)

### 📊 Multi-Tracker System
Track various aspects of your daily life with customizable trackers:

| Tracker | Description |
|---------|-------------|
| 🌞 **Day Rating** | Rate how your day felt overall |
| 😴 **Sleep Quality** | Log nightly sleep quality |
| 😰 **Anxiety Level** | Monitor anxiety intensity |
| 😓 **Stress Level** | Track daily stress |
| 📱 **Screen Time** | Hours spent on screens |
| 😊 **Mood** | Record overall mood |
| ⚡ **Energy** | Log energy levels |
| 📋 **Discipline** | Track consistency with goals |
| 💭 **Thoughts** | Monitor intrusive thoughts |

![Trackers Screenshot](./docs/images/trackers-placeholder.png)

### 📈 Analytics & Visualization
- **Interactive Charts**: Visualize your tracker data over time
- **Monthly Views**: See patterns and trends across months
- **SAS/MEDS Dashboard**: Combined view of specific tracker groups

![Analytics Screenshot](./docs/images/analytics-placeholder.png)

### ✅ Habit Tracker
- Build and maintain daily habits
- Visual progress tracking
- Streak monitoring

![Habits Screenshot](./docs/images/habits-placeholder.png)

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router v7
- **State Management**: Redux Toolkit
- **Backend**: Firebase (Firestore, Authentication)
- **Charts**: Chart.js, Recharts
- **Icons**: React Icons
- **Styling**: CSS with CSS Variables (Dark/Light theme support)

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Firebase account and project

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

3. **Set up Firebase**
   
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Create a new project (or use an existing one)
   - Enable **Firestore Database**
   - Enable **Authentication** and set up your preferred sign-in methods (Email/Password, Google)
   - Get your Firebase config from Project Settings > General > Your apps

4. **Configure environment variables**
   
   Copy the example environment file and add your Firebase credentials:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Firebase configuration:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key_here
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

5. **Start the development server**
   ```bash
   npm start
   ```
   
   Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Firebase Security Rules

For your Firestore database, set up these security rules to ensure users can only access their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Journal entries
    match /journal_entries/{entryId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Home.js         # Landing page
│   ├── Journal.js      # Journal entry component
│   ├── HabitTracker.js # Habit tracking
│   ├── Login.js        # Authentication
│   └── ...
├── trackers/           # Tracker system
│   ├── UnifiedTracker.js    # Main tracker component
│   └── trackerConfig.js     # Tracker definitions
├── context/            # React context (Auth)
├── utils/              # Utility functions
│   ├── firestore.js    # Firestore operations
│   ├── localCache.js   # Local caching
│   └── dataSync.js     # Data synchronization
├── css/                # Stylesheets
├── firebase.js         # Firebase configuration
└── App.js              # Main app component
```

## 🎨 Theming

True North supports both dark and light themes. The theme is controlled via CSS variables defined in the stylesheets.

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Chart.js](https://www.chartjs.org/)
- [Recharts](https://recharts.org/)
- [React Icons](https://react-icons.github.io/react-icons/)

---

<p align="center">
  Made with ❤️ for personal growth and self-improvement
</p>

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
