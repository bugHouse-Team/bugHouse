# UTA bugHouse 🐞 Tutoring Software

### Features
- Role based access
- Card reading (check in/out)
- Tutor scheduling
- Session management
- Attendance tracking
- Analytics

### Developer Instructions
- Direct pushes into `main` are restricted. You must create a pull request.

## Prerequisites

1. **Install Docker**: Download and install Docker from [here](https://www.docker.com/).
2. **Create Accounts**:
   - **Firebase (Admin Only)**: Sign up at [Firebase Console](https://console.firebase.google.com/u/0/).
   - **MongoDB Atlas (All DB Users)**: Create an account at [MongoDB Atlas](https://cloud.mongodb.com/).

## Database Setup

- **Firebase**
   1. Create Firebase project
   2. Create Firebase Web App
   3. Enable Email/Password (passwordless) Sign-in Method
   4. Navigtate to **Project Settings->Your Apps** and find the `npm` `firebaseConfig`
   - Example:
   ```js
   const firebaseConfig = {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
      measurementId: ""
   };
   ```
   5. Replace `firebaseConfig` in `frontend/firebase.js`
- **MongoDB**
   1. Create Organization
   2. Create Project
   3. Create Cluster
   4. Save connection string for later (see **Getting Started**)


## Getting Started

1. **Clone the repository**:

   ```bash
   git clone https://github.com/bugHouse-Team/bugHouse.git
   cd bugHouse
   ```

2. **Run build_deploy.sh**:
   - Windows (GitBash)
      ```bash
      sh ./build_deploy.sh
      ```
   - Linux/Mac
      ```bash
      ./build_deploy.sh
      ```

3. **Enter MongoDB Connection String (initial setup only)** :
   i.e.
   ```bash
   Enter your MONGO_URI (e.g. mongodb+srv://user:pass@host.mongodb.net/): mongodb+srv://testuser:pass123@users.gywhgfy.mongodb.net/
   ```

4. **Accessing the Application**
   - The backend server will be available at: [http://localhost:5000](http://localhost:5000)
   - The frontend will be available at: [http://localhost:3000](http://localhost:3000)

5. **Stopping the application**:

   ```bash
   docker compose down
   ```

## Troubleshooting

- **Port Conflicts**: Ensure no other applications are running on port 5000 or 3000.
