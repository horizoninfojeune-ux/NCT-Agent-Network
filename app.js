const $ = (s) => document.querySelector(s);

let token = localStorage.getItem("nct_token");

async function api(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({
    success: false,
    message: "Réponse invalide."
  }));

  if (!res.ok) {
    throw new Error(data.message || "Erreur serveur");
  }

  return data;
}

function show(id, text, ok = false) {
  const el = $(id);

  if (!el) return;

  el.textContent = text;
  el.style.color = ok ? "#0b6e4f" : "#b42318";
}

// Vérifier le serveur
async function checkStatus() {
  try {
    const data = await api("/api/status");

    $("#serverBadge").textContent =
      `Serveur OK · ${data.agents} agent(s)`;

  } catch {
    $("#serverBadge").textContent =
      "Serveur indisponible";
  }
}

// Charger le tableau de bord
async function loadDashboard() {
  if (!token) return;

  try {
    const me = await api("/api/me");

    $("#authSection").hidden = true;
    $("#dashboard").hidden = false;

    $("#welcome").textContent =
      `Bienvenue ${me.agent.name} · ${me.agent.role}`;

    $("#profile").innerHTML = `
      <p><strong>${escapeHtml(me.agent.name)}</strong></p>

      <p>
        ${escapeHtml(
          me.agent.phone || "Téléphone non renseigné"
        )}
      </p>

      <p>
        ${escapeHtml(
          me.agent.island || "Île non renseignée"
        )}
        ·
        ${escapeHtml(
          me.agent.locality || "Localité non renseignée"
        )}
      </p>
    `;

    await Promise.all([
      loadNetwork(),
      loadAgents(),
      loadMessages()
    ]);

  } catch {
    token = null;
    localStorage.removeItem("nct_token");
  }
}

// Statistiques du réseau
async function loadNetwork() {
  const data = await api("/api/network");

  $("#totalAgents").textContent =
    data.totalAgents;

  $("#activeAgents").textContent =
    data.activeAgents;

  $("#islandCount").textContent =
    Object.keys(data.islands).length;
}

// Liste des agents
async function loadAgents() {
  const data = await api("/api/agents");

  $("#agentsList").innerHTML =
    data.agents.length
      ? data.agents.map(a => `
        <div class="agent">

          <strong>
            ${escapeHtml(a.name)}
          </strong>

          <small>
            ${escapeHtml(a.role)}
            ·
            ${escapeHtml(
              a.island || "Zone non renseignée"
            )}
            ·
            ${escapeHtml(
              a.locality || "Localité non renseignée"
            )}
          </small>

        </div>
      `).join("")
      : "<p>Aucun autre agent dans l'annuaire.</p>";
}

// Messages
async function loadMessages() {
  const data = await api("/api/messages");

  $("#messagesList").innerHTML =
    data.messages.length
      ? data.messages.map(m => `
        <div class="messageItem">

          <strong>
            ${escapeHtml(m.fromName)}
          </strong>

          <small>
            ${new Date(
              m.createdAt
            ).toLocaleString("fr-FR")}
          </small>

          <div>
            ${escapeHtml(m.text)}
          </div>

        </div>
      `).join("")
      : "<p>Aucun message pour le moment.</p>";
}

// INSCRIPTION
$("#registerForm").addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const body =
      Object.fromEntries(
        new FormData(e.target)
      );

    try {

      const data = await api(
        "/api/register",
        {
          method: "POST",
          body: JSON.stringify(body)
        }
      );

      show(
        "#registerMessage",
        data.message +
        " Vous pouvez maintenant vous connecter.",
        true
      );

      e.target.reset();

    } catch (err) {

      show(
        "#registerMessage",
        err.message
      );

    }
  }
);

// CONNEXION
$("#loginForm").addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const body =
      Object.fromEntries(
        new FormData(e.target)
      );

    try {

      const data = await api(
        "/api/login",
        {
          method: "POST",
          body: JSON.stringify(body)
        }
      );

      token = data.token;

      localStorage.setItem(
        "nct_token",
        token
      );

      show(
        "#loginMessage",
        "Connexion réussie.",
        true
      );

      await loadDashboard();

    } catch (err) {

      show(
        "#loginMessage",
        err.message
      );

    }
  }
);

// DÉCONNEXION
$("#logoutBtn").addEventListener(
  "click",
  async () => {

    try {

      await api(
        "/api/logout",
        {
          method: "POST"
        }
      );

    } catch {}

    token = null;

    localStorage.removeItem(
      "nct_token"
    );

    location.reload();
  }
);

// AJOUTER UN AGENT
$("#addAgentForm").addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const body =
      Object.fromEntries(
        new FormData(e.target)
      );

    try {

      const data = await api(
        "/api/agents",
        {
          method: "POST",
          body: JSON.stringify(body)
        }
      );

      show(
        "#addMessage",
        `${data.message} Mot de passe temporaire : ${data.temporaryPassword}`,
        true
      );

      e.target.reset();

      await loadNetwork();
      await loadAgents();

    } catch (err) {

      show(
        "#addMessage",
        err.message
      );

    }
  }
);

// ENVOYER UN MESSAGE
$("#messageForm").addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const body =
      Object.fromEntries(
        new FormData(e.target)
      );

    try {

      await api(
        "/api/messages",
        {
          method: "POST",
          body: JSON.stringify(body)
        }
      );

      e.target.reset();

      await loadMessages();

    } catch (err) {

      alert(err.message);

    }
  }
);

// Protection contre l'injection HTML
function escapeHtml(value) {

  return String(value).replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c])
  );
}

// Démarrage
checkStatus();

loadDashboard();

// Actualisation automatique
setInterval(() => {

  if (token) {

    loadNetwork().catch(() => {});

    loadMessages().catch(() => {});

  }

}, 15000);
