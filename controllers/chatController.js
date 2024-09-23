const jwt = require("jsonwebtoken");
const Chat = require("../models/chat");
const user = require("../models/user");

// Secret key for JWT verification
const JWT_SECRET = process.env.JWT_TOKEN;

// Handle WebSocket Connection
function handleWebSocketConnection(ws, req, onlineUsers) {
  console.log("WebSocket connection initiated");

  const token = getTokenFromRequest(req);

  if (!token) {
    console.log("No token provided");
    ws.close(4001, "Unauthorized: No token provided");
    return;
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log("JWT verification failed:", err.message);
      ws.close(4002, "Unauthorized: Invalid token");
      return;
    }

    const userId = decoded._id;
    ws.userId = userId;

    onlineUsers.set(userId.toString(), ws);
    console.log(`User ${userId} connected`);

    ws.on("message", async (data) => {
      const messageData = JSON.parse(data);
      console.log("Message received:", messageData);
      try {
        if (messageData.type === "fetchChatHistory") {
          await handleChatHistoryRequest(messageData.to, ws);
        } else if (messageData.type === "newMessage") {
          await handleIncomingMessage(messageData, ws, onlineUsers);
        } else if ((messageData.type = "isOnline")) {
          await handleIsOnline(messageData, ws, onlineUsers);
        }
      } catch (error) {
        console.error("Error handling message:", error);
        ws.send(JSON.stringify({ error: "Invalid message format", err: error }));
      }
    });

    ws.on("close", () => {
      onlineUsers.delete(userId.toString());
      console.log(`User ${userId} disconnected`);
    });
  });
}

// Extract token from request
function getTokenFromRequest(req) {
  const urlParams = new URLSearchParams(req.url.replace(/^.*\?/, ""));
  return urlParams.get("token");
}

// Handle incoming chat messages
async function handleIncomingMessage(messageData, ws, onlineUsers) {
  const { to, message } = messageData;
  const from = ws.userId;

  if (!to || !message) {
    ws.send(JSON.stringify({ error: "Missing 'to' or 'message' fields" }));
    return;
  }

  if (from === to) {
    ws.send(JSON.stringify({ error: "Sending message to yourself is not allowed right now" }));
    return;
  }

  try {
    const loggedUser = await user.findById(from);
    const recipientUser = await user.findById(to);

    if (!loggedUser || !recipientUser) {
      ws.send(JSON.stringify({ error: "User not found" }));
      return;
    }

    // Check if the users are already friends
    const areAlreadyFriends = loggedUser.friends.includes(to);

    if (!areAlreadyFriends) {
      // Add each other to their friends list
      loggedUser.friends.push(to);
      recipientUser.friends.push(from);

      // Save both users
      await loggedUser.save();
      await recipientUser.save();

      console.log(`Users ${loggedUser.fullName} and ${recipientUser.fullName} are now friends.`);
    }

    // Save the message to the database
    const chatMessage = new Chat({
      senderId: from,
      receiverId: to,
      message,
    });

    await chatMessage.save();

    // Send message to receiver if they are online
    const receiverWs = onlineUsers.get(to.toString());
    if (receiverWs) {
      receiverWs.send(
        JSON.stringify({
          type: "newMessage",
          from,
          message,
          timestamp: chatMessage.createdAt,
          messageId: chatMessage._id,
        })
      );
    }

    // Optionally, send a confirmation back to the sender
    ws.send(
      JSON.stringify({
        success: true,
        message: "Message sent successfully",
        messageId: chatMessage._id,
      })
    );
  } catch (error) {
    console.error("Error handling incoming message:", error);
    ws.send(JSON.stringify({ error: "Internal server error" }));
  }
}

async function handleIsOnline(messageData, ws, onlineUsers) {
  const { id } = messageData;
  console.log(id);
  const isUserOnline = onlineUsers.get(id.toString());
  console.log(isUserOnline);
  if (isUserOnline) {
    ws.send(
      JSON.stringify({
        online: true,
      })
    );
  } else {
    ws.send(
      JSON.stringify({
        online: false,
      })
    );
  }
}

async function handleChatHistoryRequest(recipientId, ws) {
  const userId = ws.userId;

  try {
    const chatHistory = await Chat.find({
      $or: [
        { senderId: userId, receiverId: recipientId },
        { senderId: recipientId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 }) // Sort by timestamp (ascending)
      .lean(); // Return plain JavaScript objects

    ws.send(
      JSON.stringify({
        type: "chatHistory",
        data: chatHistory.map((chat) => ({
          from: chat.senderId,
          to: chat.receiverId,
          message: chat.message,
          timestamp: chat.createdAt,
        })),
      })
    );
  } catch (error) {
    console.error("Error fetching chat history:", error);
    ws.send(JSON.stringify({ error: "Failed to fetch chat history" }));
  }
}

// Export functions
module.exports = {
  handleWebSocketConnection,
};
