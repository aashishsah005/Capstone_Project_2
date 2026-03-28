# E-Commerce Product Analyzer

An E-Commerce Product Analyzer and Comparison Tool that allows users to search for products and compare their prices across major e-commerce platforms like Amazon and Flipkart.

## Features

- **Live Product Scraping**: Fetches real-time product data (price, title, image, link) from Amazon and Flipkart using Python (`BeautifulSoup` and `Selenium`).
- **User Authentication**: Secure user registration and login system using Argon2 password hashing.
- **Product Management & Cart**: Users can view products, add them to their cart, and proceed to checkout.
- **Payment Integration**: Dummy payment gateway integration using Razorpay.
- **Order Tracking**: Users can view their past orders.
- **Product Feedback System**: Users can leave persistent feedback/reviews for specific products.
- **Admin Dashboard**: Dedicated admin panel to track users, manage orders, and view platform statistics.

## Tech Stack

**Frontend:**
- HTML, CSS, JavaScript
- Responsive UI with a modern design architecture

**Backend:**
- Node.js & Express.js
- RESTful APIs for authentication, products, feedback, and payments
- Python (BeautifulSoup, Selenium) for web scraping

**Database:**
- MySQL2 for robust relational data storage (Users, Orders, Feedback)

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MySQL Server
- Google Chrome (for Selenium WebDriver)

## Installation

1. **Clone the repository:**
   ```bash
   git clone (https://github.com/aashishsah005/Capstone_Project_2.git)
   cd Capstone_Project_2
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install Python dependencies:**
   ```bash
   pip install requests beautifulsoup4 selenium
   ```

4. **Environment Setup:**
   Create a `.env` file in the root directory and add the following configurations (adjust to your local setup):
   ```env
   PORT=3001
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=ecommerce_db
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

5. **Initialize the Database:**
   The application will automatically create the required database (`ecommerce_db`) and tables (`users`, `orders`, `product_feedback`) upon the first run, provided the MySQL server is running and credentials are correct.

## Running the Application

Start the development server:
```bash
npm run dev
```
Or start the production server:
```bash
npm start
```

The application will be accessible at `http://localhost:3001`.

## Usage

- **Home Page (`/`)**: Search for products, view comparisons, and add items to your cart.
- **Authentication**: Create an account (`/signup.html`) or log in (`/login.html`) to checkout and leave feedback.
- **Admin Panel (`/admin`)**: Access the admin dashboard to monitor the platform (requires an `is_admin` flag in the DB).
- **Orders (`/orders.html`)**: View your order history and statuses.


