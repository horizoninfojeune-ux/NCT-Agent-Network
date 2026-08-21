const express = require("express");
const path = require("path");
const fs = require("fs");

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

// API du réseau NCT Agent
app.get("/api/network", (req, res) => {
  const filePath = path.join(__dirname, "data", "network.json");

  try {
    const data = fs.readFileSync(filePath, "utf8");
    const network = JSON.parse(data);

    res.json(network);
  } catch (error) {
    console.error("Erreur lors du chargement de network.json :", error);

    res.status(500).json({
      success: false,
      error: "Impossible de charger les données du réseau NCT Agent."
    });
  }
});

// Démarrage du serveur
app.listen(PORT, "0.0.0.0", () => {
  console.log(`NCT Agent Network lancé sur le port ${PORT}`);
});
