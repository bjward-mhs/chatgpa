# ChatGPA

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/bjward-mhs/chatgpa.git
   cd chatgpa
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment:
   - Create a `.env` file based on the `.env.example` file and fill in required values.

## Usage Examples
- To start the application:
  ```bash
  npm start
  ```
- Example API request:
  ```bash
  curl -X POST http://localhost:3000/api/chat -d '{"message":"Hello!"}'
  ```
- For testing:
  ```bash
  npm test
  ```
