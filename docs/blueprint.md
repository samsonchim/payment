# **App Name**: CourseRep Payments

## Core Features:

- Admin Login: Admin login with hardcoded credentials.
- CSV Upload: Upload student class list as CSV for user authentication and data population.
- Student Login: Student login using registration number.  Upon successful login, the student's name is displayed.
- Textbook Selection: Display a list of textbooks with prices, which the admin can post and edit.
- Shopping Cart: Implement a cart to accumulate selected textbooks and display the total price.
- Receipt Upload: Students upload payment receipt. No receipts are saved.
- Receipt Verification: Use Gemini AI tool to extract receipt data. Verify payment amount, recipient name (Chimaraoke Samson), and recipient bank (Monipoint) against the selected textbooks and generate approprate acceptance / rejection notifications to the user.
- Transaction Recording: Record approved transactions in an Excel file for admin download, including student name, registration number, and textbooks paid for.

## Style Guidelines:

- Primary color: A muted teal (#45A0A2) to convey trust and reliability. Avoid highly saturated teals.
- Background color: Very light grey (#F0F0F0), nearly white, to give a clean and professional feel. A dark theme is not suitable for this application.
- Accent color: A subdued light orange (#D4A373), for a contrasting color that indicates calls to action, or interactive elements.
- Body and headline font: 'Inter', a sans-serif font that's highly legible and conveys neutrality and professionalism.
- Use simple, clear icons from a standard library (e.g., Material Design Icons) for navigation and actions.
- Maintain a clean, organized layout with clear sections for textbook selection, cart display, and receipt upload.
- Use subtle transitions and loading indicators to provide feedback during data processing and AI analysis.