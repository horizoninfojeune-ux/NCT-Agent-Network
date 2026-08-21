const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers du site
app.use(express.static(path.join(__dirname, "public")));

// Accueil
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Vérification du serveur
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "NCT Agent Network fonctionne correctement."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NCT Agent Network lancé sur le port ${PORT}`);
});
