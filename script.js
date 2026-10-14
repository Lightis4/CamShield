
document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "camshield_data_v1";

    const initialData = {
        cameras: [
            {
                id: 1,
                name: "Câmera da sala",
                location: "Sala de estar",
                model: "CAM-HOME-01",
                score: 94,
                profile: "good"
            },
            {
                id: 2,
                name: "Câmera da garagem",
                location: "Garagem",
                model: "CAM-HOME-02",
                score: 72,
                profile: "medium"
            },
            {
                id: 3,
                name: "Câmera do quintal",
                location: "Área externa",
                model: "CAM-HOME-03",
                score: 43,
                profile: "risk"
            }
        ],
        alerts: [
            {
                id: 1,
                cameraId: 3,
                title: "Verificar configuração de segurança",
                description: "A pontuação demonstrativa está baixa. Revise as configurações do dispositivo.",
                severity: "high",
                resolved: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                cameraId: 2,
                title: "Revisão de segurança recomendada",
                description: "A pontuação indica que algumas configurações merecem atenção.",
                severity: "medium",
                resolved: false,
                createdAt: new Date().toISOString()
            }
        ],
        activities: [
            {
                id: 1,
                message: "Painel CamShield iniciado em modo demonstrativo.",
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                message: "Dispositivos de exemplo carregados no painel.",
                createdAt: new Date().toISOString()
            }
        ]
    };

    let data = loadData();

    const cameraList = document.getElementById("camera-list");
    const allCameraList = document.getElementById("all-camera-list");
    const alertList = document.getElementById("alert-list");
    const allAlertList = document.getElementById("all-alert-list");
    const recentActivity = document.getElementById("recent-activity");
    const allActivityList = document.getElementById("all-activity-list");
    const searchInput = document.getElementById("camera-search");
    const modal = document.getElementById("camera-modal");
    const cameraForm = document.getElementById("camera-form");
    const toastContainer = document.getElementById("toast-container");

    function loadData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                return structuredClone(initialData);
            }

            const parsed = JSON.parse(saved);

            if (
                !parsed ||
                !Array.isArray(parsed.cameras) ||
                !Array.isArray(parsed.alerts) ||
                !Array.isArray(parsed.activities)
            ) {
                return structuredClone(initialData);
            }

            return parsed;
        } catch {
            return structuredClone(initialData);
        }
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
            showToast("Não foi possível salvar os dados no navegador.", "error");
        }
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    function getCamera(id) {
        return data.cameras.find(camera => camera.id === id);
    }

    function getProfile(score) {
        if (score >= 85) return "good";
        if (score >= 60) return "medium";
        return "risk";
    }

    function getProfileLabel(score) {
        if (score >= 85) return "Boa";
        if (score >= 60) return "Moderada";
        return "Atenção";
    }

    function getScoreColor(score) {
        return getProfile(score);
    }

    function getAverageScore() {
        if (data.cameras.length === 0) return 0;

        const total = data.cameras.reduce((sum, camera) => {
            return sum + camera.score;
        }, 0);

        return Math.round(total / data.cameras.length);
    }

    function getOpenAlerts() {
        return data.alerts.filter(alert => !alert.resolved);
    }

    function getProtectedCount() {
        return data.cameras.filter(camera => camera.score >= 85).length;
    }

    function formatTime(dateString) {
        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "Data indisponível";
        }

        return date.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function showToast(message, type = "success") {
        const toast = document.createElement("div");
        toast.className = `toast${type === "error" ? " error" : ""}`;

        const symbol = document.createElement("span");
        symbol.className = "toast-symbol";
        symbol.textContent = type === "error" ? "!" : "✓";

        const text = document.createElement("span");
        text.textContent = message;

        toast.append(symbol, text);
        toastContainer.appendChild(toast);

        window.setTimeout(() => {
            toast.remove();
        }, 3500);
    }

    function addActivity(message) {
        data.activities.unshift({
            id: Date.now() + Math.random(),
            message,
            createdAt: new Date().toISOString()
        });

        data.activities = data.activities.slice(0, 100);
        saveData();
        renderActivities();
    }

    function renderCamera(camera) {
        const score = Math.min(100, Math.max(0, Number(camera.score) || 0));
        const profile = getScoreColor(score);

        return `
            <article class="camera-item">
                <div class="camera-main">
                    <div class="camera-symbol">▣</div>

                    <div class="camera-info">
                        <h3>${escapeHTML(camera.name)}</h3>
                        <p>⌖ ${escapeHTML(camera.location)}</p>
                        <span class="camera-model">${escapeHTML(camera.model)}</span>
                    </div>

                    <div class="score-number">
                        ${score}<small>/100</small>
                    </div>
                </div>

                <div
                    class="score-track"
                    role="progressbar"
                    aria-label="Pontuação demonstrativa de segurança de ${escapeHTML(camera.name)}"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow="${score}"
                >
                    <div class="score-fill ${profile}" style="width: ${score}%"></div>
                </div>

                <div class="camera-bottom">
                    <span class="status-badge ${profile}">
                        <span>●</span>
                        ${getProfileLabel(score)} segurança
                    </span>

                    <button
                        class="scan-button"
                        data-scan="${camera.id}"
                        ${camera.scanning ? "disabled" : ""}
                    >
                        ${camera.scanning ? "Analisando..." : "Analisar agora"}
                    </button>
                </div>
            </article>
        `;
    }

    function renderCameras() {
        const term = searchInput.value.trim().toLocaleLowerCase("pt-BR");

        const filtered = data.cameras.filter(camera => {
            const searchable = `${camera.name} ${camera.location} ${camera.model}`
                .toLocaleLowerCase("pt-BR");

            return searchable.includes(term);
        });

        cameraList.innerHTML = filtered.map(renderCamera).join("");
        allCameraList.innerHTML = data.cameras.map(renderCamera).join("");

        document.getElementById("camera-empty").classList.toggle(
            "hidden",
            filtered.length > 0
        );

        if (data.cameras.length === 0) {
            allCameraList.innerHTML = `
                <div class="empty-state">
                    <span>▣</span>
                    <strong>Nenhuma câmera cadastrada</strong>
                    <p>Use o botão para adicionar seu primeiro dispositivo.</p>
                </div>
            `;
        }

        document.getElementById("camera-total").textContent = data.cameras.length;
        document.getElementById("average-score").textContent = getAverageScore();
        document.getElementById("protected-total").textContent = getProtectedCount();
        document.getElementById("protected-out-of").textContent = data.cameras.length;

        document.querySelectorAll("[data-scan]").forEach(button => {
            button.addEventListener("click", () => {
                scanCamera(Number(button.dataset.scan));
            });
        });
    }

    function renderAlert(alert) {
        const camera = getCamera(alert.cameraId);
        const cameraName = camera ? camera.name : "Dispositivo removido";

        return `
            <article class="alert-item">
                <div class="alert-symbol ${alert.severity}">
                    ${alert.severity === "high" ? "!" : "⚠"}
                </div>

                <div class="alert-content">
                    <h3>${escapeHTML(alert.title)}</h3>
                    <p>${escapeHTML(alert.description)}</p>
                    <div class="alert-meta">
                        ${escapeHTML(cameraName)} · ${formatTime(alert.createdAt)}
                    </div>
                </div>

                <button class="resolve-button" data-resolve="${alert.id}">
                    Resolver
                </button>
            </article>
        `;
    }

    function renderAlerts() {
        const openAlerts = getOpenAlerts();

        alertList.innerHTML = openAlerts.slice(0, 4).map(renderAlert).join("");
        allAlertList.innerHTML = openAlerts.map(renderAlert).join("");

        document.getElementById("alert-total").textContent = openAlerts.length;
        document.getElementById("sidebar-alert-count").textContent = openAlerts.length;
        document.getElementById("alert-header-count").textContent =
            `${openAlerts.length} ativo${openAlerts.length === 1 ? "" : "s"}`;

        document.getElementById("alert-empty").classList.toggle(
            "hidden",
            openAlerts.length > 0
        );

        document.getElementById("all-alert-empty").classList.toggle(
            "hidden",
            openAlerts.length > 0
        );

        document.querySelectorAll("[data-resolve]").forEach(button => {
            button.addEventListener("click", () => {
                resolveAlert(Number(button.dataset.resolve));
            });
        });
    }

    function renderActivities() {
        const activities = data.activities;

        const renderOne = activity => `
            <article class="activity-item">
                <div class="activity-icon">✓</div>
                <div class="activity-content">
                    <p>${escapeHTML(activity.message)}</p>
                    <span>Registro local do protótipo</span>
                </div>
                <span class="activity-time">${formatTime(activity.createdAt)}</span>
            </article>
        `;

        recentActivity.innerHTML = activities.slice(0, 4).map(renderOne).join("");
        allActivityList.innerHTML = activities.map(renderOne).join("");

        document.getElementById("activity-empty").classList.toggle(
            "hidden",
            activities.length > 0
        );
    }

    function renderAll() {
        renderCameras();
        renderAlerts();
        renderActivities();
    }

    function openModal() {
        modal.classList.remove("hidden");
        document.getElementById("camera-name").focus();
    }

    function closeModal() {
        modal.classList.add("hidden");
        cameraForm.reset();
    }

    function addCamera(event) {
        event.preventDefault();

        const formData = new FormData(cameraForm);
        const name = String(formData.get("name") || "").trim();
        const location = String(formData.get("location") || "").trim();
        const model = String(formData.get("model") || "").trim();
        const profile = String(formData.get("profile") || "medium");

        if (!name || !location || !model) {
            showToast("Preencha todos os campos.", "error");
            return;
        }

        const scores = {
            good: 94,
            medium: 72,
            risk: 43
        };

        const camera = {
            id: Date.now(),
            name,
            location,
            model,
            score: scores[profile] || 72,
            profile
        };

        data.cameras.push(camera);

        if (camera.score < 85) {
            data.alerts.unshift({
                id: Date.now() + 1,
                cameraId: camera.id,
                title: "Revisar segurança do dispositivo",
                description: "A pontuação inicial deste dispositivo merece atenção.",
                severity: camera.score < 60 ? "high" : "medium",
                resolved: false,
                createdAt: new Date().toISOString()
            });
        }

        saveData();
        addActivity(`Câmera "${camera.name}" cadastrada no painel.`);
        renderAll();
        closeModal();
        showPage("dashboard");
        showToast("Câmera cadastrada com sucesso.");
    }

    function scanCamera(cameraId) {
        const camera = getCamera(cameraId);

        if (!camera || camera.scanning) return;

        camera.scanning = true;
        renderCameras();

        window.setTimeout(() => {
            const currentCamera = getCamera(cameraId);

            if (!currentCamera) return;

            const previousScore = currentCamera.score;
            const variation = Math.floor(Math.random() * 11) - 5;

            currentCamera.score = Math.max(
                20,
                Math.min(100, currentCamera.score + variation)
            );

            delete currentCamera.scanning;

            const profile = getProfile(currentCamera.score);

            const existingAlert = data.alerts.find(alert => {
                return alert.cameraId === cameraId && !alert.resolved;
            });

            if (currentCamera.score < 60 && !existingAlert) {
                data.alerts.unshift({
                    id: Date.now(),
                    cameraId,
                    title: "Pontuação de segurança baixa",
                    description: "A análise simulada recomenda revisar as configurações do dispositivo.",
                    severity: "high",
                    resolved: false,
                    createdAt: new Date().toISOString()
                });
            }

            saveData();
            addActivity(
                `Análise demonstrativa de "${currentCamera.name}" concluída: ${previousScore} → ${currentCamera.score}/100.`
            );
            renderAll();

            showToast(
                `Análise simulada concluída. Resultado: ${currentCamera.score}/100 (${getProfileLabel(currentCamera.score)}).`
            );

            if (profile === "risk") {
                showToast("A pontuação simulada indica que o dispositivo precisa de atenção.", "error");
            }
        }, 900);
    }

    function resolveAlert(alertId) {
        const alert = data.alerts.find(item => item.id === alertId);

        if (!alert || alert.resolved) return;

        alert.resolved = true;

        saveData();

        addActivity(`Alerta "${alert.title}" marcado como resolvido.`);
        renderAll();
        showToast("Alerta marcado como resolvido.");
    }

    function showPage(pageName) {
        const validPages = ["dashboard", "cameras", "alerts", "activity"];
        const page = validPages.includes(pageName) ? pageName : "dashboard";

        document.querySelectorAll(".page-section").forEach(section => {
            section.classList.toggle("active", section.id === `page-${page}`);
        });

        document.querySelectorAll(".nav-item").forEach(button => {
            button.classList.toggle("active", button.dataset.page === page);
        });

        const names = {
            dashboard: "Visão geral",
            cameras: "Minhas câmeras",
            alerts: "Alertas",
            activity: "Atividades"
        };

        document.getElementById("breadcrumb-current").textContent = names[page];
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.querySelectorAll("[data-page]").forEach(button => {
        button.addEventListener("click", () => {
            showPage(button.dataset.page);
        });
    });

    document.getElementById("add-camera-button").addEventListener("click", openModal);
    document.getElementById("add-camera-button-2").addEventListener("click", openModal);
    document.getElementById("close-modal").addEventListener("click", closeModal);
    document.getElementById("cancel-modal").addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.classList.contains("hidden")) {
            closeModal();
        }
    });

    cameraForm.addEventListener("submit", addCamera);

    searchInput.addEventListener("input", renderCameras);

    document.getElementById("clear-activity").addEventListener("click", () => {
        const confirmed = window.confirm(
            "Tem certeza de que deseja apagar todo o histórico de atividades?"
        );

        if (!confirmed) return;

        data.activities = [];
        saveData();
        renderActivities();
        showToast("Histórico de atividades apagado.");
    });

    document.getElementById("theme-button").addEventListener("click", () => {
        document.body.classList.toggle("light-theme");

        const isLight = document.body.classList.contains("light-theme");

        showToast(
            isLight
                ? "Aparência clara ativada."
                : "Aparência escura ativada."
        );
    });

    renderAll();
});
