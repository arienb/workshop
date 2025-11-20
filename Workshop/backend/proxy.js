const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let adminToken = "";

// Fetch admin token on startup
async function fetchAdminToken() {
  try {
    const response = await fetch("http://localhost:8080/realms/myrealm/protocol/openid-connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: "admin-cli",
        username: "admin",
        password: "admin",
        grant_type: "password"
      })
    });

    const data = await response.json();
    if (data.access_token) {
      adminToken = data.access_token;
      console.log("Admin token retrieved");
    } else {
      console.error("Failed to retrieve token:", data);
    }
  } catch (err) {
    console.error("Error fetching token:", err);
  }
}

// Get full user info by username
app.get("/admin/user/:username", async (req, res) => {
  const username = req.params.username;
  const response = await fetch(`http://localhost:8080/admin/realms/myrealm/users?username=${username}&exact=true`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const users = await response.json();
  if (users.length > 0) {
    res.json(users[0]);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Get user ID by username
app.get("/admin/user-id", async (req, res) => {
  const username = req.query.username;
  const response = await fetch(`http://localhost:8080/admin/realms/myrealm/users?username=${username}&exact=true`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const users = await response.json();
  if (users.length > 0) {
    res.json({ id: users[0].id });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Update user profile
app.put("/admin/update-user/:id", async (req, res) => {
  const userId = req.params.id;
  const response = await fetch(`http://localhost:8080/admin/realms/myrealm/users/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(req.body)
  });

  const text = await response.text();
  res.status(response.status).send(text);
});

// put user password
app.put("/admin/reset-password/:id", async (req, res) => {
  const userId = req.params.id;
  const response = await fetch(`http://localhost:8080/admin/realms/myrealm/users/${userId}/reset-password`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "password",
      value: req.body.newPassword,
      temporary: false
    })
  });

  const text = await response.text();
  res.status(response.status).send(text);
});

// Start proxy and fetch token
app.listen(3000, async () => {
  console.log("Proxy running at http://localhost:3000");
  await fetchAdminToken();
});