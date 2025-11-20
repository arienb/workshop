const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let adminToken = ""; // ⏳ Wordt gevuld bij opstart

// 🔐 Token ophalen bij opstart
async function fetchAdminToken() {
  try {
    const response = await fetch("http://localhost:8080/realms/myrealm/protocol/openid-connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: "admin-cli",
        username: "admin",         // ← jouw admin-gebruiker
        password: "admin",         // ← jouw admin-wachtwoord
        grant_type: "password"
      })
    });

    const data = await response.json();
    if (data.access_token) {
      adminToken = data.access_token;
      console.log("✅ Admin token opgehaald");
    } else {
      console.error("❌ Token ophalen mislukt:", data);
    }
  } catch (err) {
    console.error("🔥 Fout bij token ophalen:", err);
  }
}

app.get("/admin/user/:username", async (req, res) => {
  const username = req.params.username;
  const response = await fetch(`http://localhost:8080/admin/realms/myrealm/users?username=${username}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const users = await response.json();
  if (users.length > 0) {
    res.json(users[0]); // bevat firstName, lastName, email, etc.
  } else {
    res.status(404).send("User not found");
  }
});


// 🔁 Haal userId op via username
app.get("/admin/user-id", async (req, res) => {
  const username = req.query.username;
  const response = await fetch(`http://localhost:8080/admin/realms/myrealm/users?username=${username}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const users = await response.json();
  if (users.length > 0) {
    res.json({ id: users[0].id });
  } else {
    res.status(404).send("User not found");
  }
});

// ✏️ Update profiel via Admin API
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

// 🔐 Wachtwoord resetten via Admin API
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

// 🔁 Start proxy en haal token op
app.listen(3000, async () => {
  console.log("Proxy draait op http://localhost:3000");
  await fetchAdminToken();
});