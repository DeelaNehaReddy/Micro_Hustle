# Micro Hustle (Basic Version)

A simple freelancing platform where users can create and browse gigs.

![image](https://github.com/user-attachments/assets/959a7524-d8b8-45c0-9eb6-83c9faec167e)
![image](https://github.com/user-attachments/assets/06ac9e84-d450-4532-ad05-13057eddd2fa)
![image](https://github.com/user-attachments/assets/f5b5e9a4-30e3-414b-9e7c-799133b3248c)
![image](https://github.com/user-attachments/assets/752c7192-56f4-4598-a6c1-712a31dc3f20)
![image](https://github.com/user-attachments/assets/7935cb09-5ee8-4ccf-bdf8-8f7d6814bb07)
![image](https://github.com/user-attachments/assets/1bf2e626-96e3-4831-9ca3-97c1d9abe489)





## Currently Working Features

✅ **User Authentication**
- **Secure Login/Signin (POST Method)**  
  Implemented with proper POST request handling and session management
- **Signup with Validation (POST Method)**  
  Form data submitted securely via POST with server-side validation
  
## 🔒 Security Implementations

### Password Security
- **Bcrypt Password Hashing**  
  All passwords are hashed before storage (10 salt rounds)

✅ **Gig Management**
- Create new gigs (title, description, price)
- Browse all available gigs
- Basic gig application system

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth

## Installation

1. **Clone the repository**:
     git clone https://github.com/yourusername/micro-hustle.git
     cd micro-hustle
2. **Set up environment variables (.env file)**
    PORT=3000
    FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json
    SESSION_SECRET=your_secure_secret

4. **Install dependencies**
    npm install

5. **Run the application**
    node app.js
