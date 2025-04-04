# Micro Hustle (Basic Version)

A simple freelancing platform where users can create and browse gigs.

## Currently Working Features

✅ **User Authentication**
- **Secure Login (POST Method)**  
  Implemented with proper POST request handling and session management
  ![Login](https://github.com/user-attachments/assets/06ac9e84-d450-4532-ad05-13057eddd2fa)
  
- **Signup with Validation (POST Method)**  
  Form data submitted securely via POST with server-side validation
  ![image](https://github.com/user-attachments/assets/f5b5e9a4-30e3-414b-9e7c-799133b3248c)
  
 - **Dashboard/Ensuring a Decent User Interface (UI)**:
  ![image](https://github.com/user-attachments/assets/959a7524-d8b8-45c0-9eb6-83c9faec167e)

- **Email Duplication Prevention in Sign-Up Functionality**
  To maintain data integrity and user uniqueness, the application must validate that the email provided during sign-up has not been used before.
  ![image](https://github.com/user-attachments/assets/752c7192-56f4-4598-a6c1-712a31dc3f20)

  **Mandatory Use of the POST Method for Sign-In and Sign-Up Functionality:**
  ![WhatsApp Image 2025-04-03 at 14 28 12_3ea05b31](https://github.com/user-attachments/assets/b93bb927-6477-469c-8df3-449777b5faae)

  
## 🔒 Security Implementations

### Password Security
- **Password Hashing**  
  All passwords are hashed before storage (10 salt rounds)
  ![image](https://github.com/user-attachments/assets/1bf2e626-96e3-4831-9ca3-97c1d9abe489)

 - **Mandatory Use of the POST Method for Sign-In and Sign-Up Functionality:**

   
✅ **Gig Management**
- Create new gigs (title, description, price)
 ![image](https://github.com/user-attachments/assets/7935cb09-5ee8-4ccf-bdf8-8f7d6814bb07)

- Browse all available gigs
 ![image](https://github.com/user-attachments/assets/ef9e25df-6aaf-459a-bd03-9848d7133a6d)

- Basic gig application system

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth

## Installation

1. **Clone the repository**:


     git clone https://github.com/yourusername/micro-hustle.git
     cd micro-hustle
3. **Set up environment variables (.env file)**:

   
    PORT=3000
    FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json
    SESSION_SECRET=your_secure_secret

4. **Install dependencies**:

   
    npm install

6. **Run the application**:

   
    node app.js
