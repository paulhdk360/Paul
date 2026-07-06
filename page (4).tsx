@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0f2226;
  --bg-panel: #123330;
  --bg-card: #1a3d39;
  --bg-card-hover: #204841;
  --accent: #1fa98a;
  --accent-bright: #52cba9;
  --accent-mint: #8fe0c4;
  --text-dark: #0f2226;
  --text-light: #f2fbf8;
  --text-muted: #84afa6;
  --border: #28504a;
  --danger: #d9694f;
  --warning: #e8b23d;
  --success: #52cba9;
}

html,
body {
  height: 100%;
}

body {
  background: var(--bg);
  color: var(--text-light);
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 600;
}
.badge.b-green {
  background: rgba(82, 203, 169, 0.16);
  color: var(--accent-bright);
}
.badge.b-amber {
  background: rgba(232, 178, 61, 0.16);
  color: var(--warning);
}
.badge.b-red {
  background: rgba(217, 105, 79, 0.16);
  color: var(--danger);
}
.badge.b-gray {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
}

.kpi-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background-image: repeating-linear-gradient(
    to bottom,
    var(--accent-bright) 0 3px,
    transparent 3px 9px
  );
  opacity: 0.8;
}

.plan-cell.busy {
  background: rgba(82, 203, 169, 0.14);
  color: var(--accent-bright);
  border: 1px solid rgba(82, 203, 169, 0.3);
}
.plan-cell.maint {
  background: rgba(232, 178, 61, 0.14);
  color: var(--warning);
  border: 1px solid rgba(232, 178, 61, 0.3);
}
.plan-cell.free {
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-muted);
  border: 1px dashed var(--border);
}

.dropzone.drag {
  border-color: var(--accent-bright);
  background: rgba(82, 203, 169, 0.06);
}
