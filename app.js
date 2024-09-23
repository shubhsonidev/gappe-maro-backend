require("dotenv").config();

const express = require("express");
const { connectToDB } = require("./connectToDB");
const userRouter = require("./routes/user");
const cookieParser = require("cookie-parser");
const { checkForAuthenticationCookie } = require("./middlewares/authentication");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
// Controllers
const { handleWebSocketConnection } = require("./controllers/chatController");

// Initialize Express app
const app = express();
const port = process.env.PORT || 4200;
app.set("trust proxy", true);

// List of allowed origins
const allowedOrigins = [
  "http://localhost:4200", // Local development
  "https://gappe-maro.netlify.app", // Production URL
];

app.use((req, res, next) => {
  // Set the Access-Control-Allow-Origin header dynamically based on the allowed origins
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true"); // Allow credentials
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE"); // Allow specific methods
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Allow specific headers
  next();
});

// Use CORS middleware after setting the headers
app.use(
  cors({
    origin: (origin, callback) => {
      if (origin && allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Connect to DB
connectToDB().then(() => console.log("MONGODB Connection Successful!"));

// Middlewares
app.use(express.json({ limit: "200mb" }));
app.use(cookieParser());
app.use(checkForAuthenticationHeader("authToken"));

//Master routes
app.use("/api/user", userRouter);

// Create HTTP Server
const server = http.createServer(app);

// Initialize WebSocket Server
const wss = new WebSocket.Server({ server });

// Store online users: Map of userId => WebSocket
const onlineUsers = new Map();

// Handle WebSocket connections
wss.on("connection", (ws, req) => {
  handleWebSocketConnection(ws, req, onlineUsers);
});

// Start the server
server.listen(port, () => {
  console.log(`Server started listening at ${port}`);
});
