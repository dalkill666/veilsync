# PhantomV VeilSync

A single-click, zero-setup desktop app simulation for securely synchronizing browser data via the VeilSync protocol. It demonstrates a futuristic, glassmorphic UI based on the PhantomV branding.

This project is a Single-Page Application (SPA) built with React and TypeScript, styled with Tailwind CSS, and ready for deployment on Firebase Hosting.

## How to Run Locally

### Prerequisites

*   **Node.js and npm**: Ensure you have Node.js (which includes npm) installed on your system. You can download it from [nodejs.org](https://nodejs.org/).

### Installation & Execution

1.  **Install Dependencies**: Open your terminal, navigate to the project's root directory, and run the following command. This will download all necessary tools for development.
    ```bash
    npm install
    ```

2.  **Start the Development Server**: Once the installation is complete, run this command to start the live development server:
    ```bash
    npm run dev
    ```

3.  **Open in Browser**: The server will start and display a local URL. Open your web browser and navigate to it, usually:
    > `http://localhost:5173`

The PhantomV VeilSync application should now be running with hot-reloading enabled.

---

## Run on Replit

This project is configured to run seamlessly on [Replit](https://replit.com).

1.  **Import Project**: Import this repository directly into Replit.
2.  **Run**: Once the workspace is ready, simply click the big "Run" button at the top. Replit will automatically install the dependencies and start the development server.
3.  **View App**: The application will appear in the "Webview" pane.

---

## Version Control with Git

To manage your project with Git and push it to a remote repository like GitHub:

1.  **Initialize Git**: In the project root, run:
    ```bash
    git init
    ```

2.  **Add Files and Commit**: Stage all files and make your first commit.
    ```bash
    git add .
    git commit -m "Initial commit"
    ```

3.  **Connect to Remote Repository**: Create a new repository on GitHub (or another service) and add it as a remote. Replace `<repository_url>` with your own URL.
    ```bash
    git remote add origin <repository_url>
    git branch -M main
    git push -u origin main
    ```

---

## Deployment with Firebase

This project is configured for easy deployment with Firebase Hosting.

### Prerequisites

*   A [Firebase Project](https://console.firebase.google.com/).
*   **Firebase CLI**: If you don't have it, install it globally:
    ```bash
    npm install -g firebase-tools
    ```

### Deployment Steps

1.  **Login to Firebase**:
    ```bash
    firebase login
    ```

2.  **Configure Project**:
    *   Open the `.firebaserc` file in this project.
    *   Replace `"phantomv-veilsync-YOUR-ID"` with your actual Firebase Project ID.

3.  **Build the Project**: Before deploying, you need to create a production-ready package. Run this command from your project's root directory:
    ```bash
    npm run build
    ```
    This will create an optimized version of your app in a `dist` folder.

4.  **Deploy**: Now, deploy the contents of the `dist` folder.
    ```bash
    firebase deploy --only hosting
    ```

After deployment, the Firebase CLI will provide you with the live URL for your application.