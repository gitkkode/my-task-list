/**
 * Task Workspace Application Engine
 * Pure Vanilla JavaScript State Management & SCIMAX Custom Components
 */

const INITIAL_TASKS = [
  {
    id: "task-101",
    code: "MOB-104",
    title: "Redesign Checkout Flow & One-Click Payment Gateway",
    type: "Feature",
    projectName: "E-Commerce Mobile App",
    projectType: "Mobile App (iOS/Android)",
    startDate: "2026-08-10",
    endDate: "2026-08-22",
    status: "In-Progress",
    isFavourite: true,
    createdOn: "2026-08-04T10:30:00",
    startedOn: "2026-08-10T09:15:00"
  },
  {
    id: "task-102",
    code: "UX-512",
    title: "Design System 3.0 Component Library & Dark/Light Tokens",
    type: "Design",
    projectName: "Customer Portal v2",
    projectType: "Enterprise Web Portal",
    startDate: "2026-08-14",
    endDate: "2026-08-25",
    status: "In-Progress",
    isFavourite: true,
    createdOn: "2026-08-08T14:20:00",
    startedOn: "2026-08-14T11:00:00"
  },
  {
    id: "task-103",
    code: "SEC-204",
    title: "Implement OAuth2.0 & Biometric Authentication",
    type: "Security",
    projectName: "E-Commerce Mobile App",
    projectType: "Mobile App (iOS/Android)",
    startDate: "2026-08-16",
    endDate: "2026-08-28",
    status: "Planned",
    isFavourite: true,
    createdOn: "2026-08-11T16:45:00"
  },
  {
    id: "task-104",
    code: "REF-402",
    title: "Refactor Order State Machine & Async Event Dispatcher",
    type: "Refactor",
    projectName: "Customer Portal v2",
    projectType: "Enterprise Web Portal",
    startDate: "2026-08-18",
    endDate: "2026-08-30",
    status: "Planned",
    isFavourite: false,
    createdOn: "2026-08-12T08:50:00"
  }
];

class TaskApp {
  constructor() {
    this.tasks = [];
    this.searchQuery = "";
    this.activeStatusFilter = "all";
    this.activeProjectFilter = "all";
    this.activeTypeFilter = "all";
    this.sortBy = "endDateAsc";
    this.currentViewMode = "grid"; // "grid" | "table" | "details"
    this.activeDetailTaskId = null;
    this.openDropdownId = null;

    this.init();
  }

  init() {
    this.loadState();
    this.cacheDOM();
    this.setupCustomSelects();
    this.populateProjectFilter();
    this.bindEvents();
    this.render();
    this.initIcons();
  }

  loadState() {
    const saved = localStorage.getItem("taskpulse_orange_tasks");
    if (saved) {
      try {
        this.tasks = JSON.parse(saved);
      } catch (e) {
        this.tasks = [...INITIAL_TASKS];
      }
    } else {
      this.tasks = [...INITIAL_TASKS];
      this.saveState();
    }
  }

  saveState() {
    localStorage.setItem("taskpulse_orange_tasks", JSON.stringify(this.tasks));
  }

  cacheDOM() {
    this.statsBanner = document.querySelector(".stats-banner");
    this.toolbarSection = document.querySelector(".toolbar-section");
    this.contentArea = document.querySelector(".content-area");
    this.detailsContainer = document.getElementById("detailsContainer");

    this.tasksGrid = document.getElementById("tasksGrid");
    this.tableContainer = document.getElementById("tableContainer");
    this.tasksTableBody = document.getElementById("tasksTableBody");
    this.emptyState = document.getElementById("emptyState");

    // Stats
    this.statActive = document.getElementById("statActive");
    this.statInProgress = document.getElementById("statInProgress");
    this.statPlanned = document.getElementById("statPlanned");
    this.statFavourites = document.getElementById("statFavourites");
    this.totalProjectCount = document.getElementById("totalProjectCount");

    // Filters & Search
    this.searchInput = document.getElementById("searchInput");
    this.clearSearchBtn = document.getElementById("clearSearchBtn");
    this.statusTabs = document.getElementById("statusTabs");
    this.resetFiltersBtn = document.getElementById("resetFiltersBtn");

    // Counters
    this.countAll = document.getElementById("countAll");
    this.countInProgress = document.getElementById("countInProgress");
    this.countPlanned = document.getElementById("countPlanned");
    this.countFavourites = document.getElementById("countFavourites");

    // Views Toggle
    this.viewGridBtn = document.getElementById("viewGridBtn");
    this.viewTableBtn = document.getElementById("viewTableBtn");

    // Modal elements
    this.taskModalOverlay = document.getElementById("taskModalOverlay");
    this.openCreateModalBtn = document.getElementById("openCreateModalBtn");
    this.closeModalBtn = document.getElementById("closeModalBtn");
    this.taskForm = document.getElementById("taskForm");
    this.modalTitle = document.getElementById("modalTitle");
    this.modalSubtitle = document.getElementById("modalSubtitle");
    this.saveBtnText = document.getElementById("saveBtnText");

    // Form Inputs
    this.formTaskId = document.getElementById("formTaskId");
    this.formTaskCode = document.getElementById("formTaskCode");
    this.formTaskTitle = document.getElementById("formTaskTitle");
    this.formTaskType = document.getElementById("formTaskType");
    this.formStatus = document.getElementById("formStatus");
    this.formProjectName = document.getElementById("formProjectName");
    this.formProjectType = document.getElementById("formProjectType");
    this.formStartDate = document.getElementById("formStartDate");
    this.formEndDate = document.getElementById("formEndDate");

    this.toastContainer = document.getElementById("toastContainer");
  }

  setupCustomSelects() {
    this.bindCustomSelect({
      triggerId: "sortSelectTrigger",
      panelId: "sortSelectPanel",
      labelId: "sortSelectLabel",
      onSelect: (value) => {
        this.sortBy = value;
        this.render();
      }
    });

    this.bindCustomSelect({
      triggerId: "typeFilterTrigger",
      panelId: "typeFilterPanel",
      labelId: "typeFilterLabel",
      onSelect: (value) => {
        this.activeTypeFilter = value;
        this.render();
      }
    });

    this.bindCustomSelect({
      triggerId: "formTaskTypeTrigger",
      panelId: "formTaskTypePanel",
      labelId: "formTaskTypeLabel",
      hiddenInputId: "formTaskType",
      onSelect: (value) => {
        this.formTaskType.value = value;
      }
    });

    this.bindCustomSelect({
      triggerId: "formStatusTrigger",
      panelId: "formStatusPanel",
      labelId: "formStatusLabel",
      hiddenInputId: "formStatus",
      onSelect: (value) => {
        this.formStatus.value = value;
      }
    });
  }

  bindCustomSelect({ triggerId, panelId, labelId, hiddenInputId, onSelect }) {
    const trigger = document.getElementById(triggerId);
    const panel = document.getElementById(panelId);
    const label = document.getElementById(labelId);

    if (!trigger || !panel) return;

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = !panel.classList.contains("hidden");
      this.closeAllCustomSelects();

      if (!isOpen) {
        panel.classList.remove("hidden");
        trigger.classList.add("is-open");
      }
    });

    panel.addEventListener("click", (e) => {
      const optionBtn = e.target.closest(".sci-custom-select-option");
      if (!optionBtn) return;

      const val = optionBtn.dataset.value;
      const text = optionBtn.querySelector("span") ? optionBtn.querySelector("span").textContent : optionBtn.textContent.trim();

      if (label) label.textContent = text;
      if (hiddenInputId) {
        const input = document.getElementById(hiddenInputId);
        if (input) input.value = val;
      }

      panel.querySelectorAll(".sci-custom-select-option").forEach(opt => {
        const isSel = opt === optionBtn;
        opt.classList.toggle("is-selected", isSel);
        
        let checkIcon = opt.querySelector(".sci-custom-select-option__check");
        if (isSel) {
          if (!checkIcon) {
            opt.insertAdjacentHTML("beforeend", `<i data-lucide="check" class="sci-custom-select-option__check"></i>`);
          }
        } else {
          if (checkIcon) checkIcon.remove();
        }
      });

      panel.classList.add("hidden");
      trigger.classList.remove("is-open");
      this.initIcons();

      if (onSelect) onSelect(val, text);
    });
  }

  closeAllCustomSelects() {
    document.querySelectorAll(".sci-custom-select-panel").forEach(p => p.classList.add("hidden"));
    document.querySelectorAll(".sci-custom-select-trigger").forEach(t => t.classList.remove("is-open"));
  }

  populateProjectFilter() {
    const projects = Array.from(new Set(this.tasks.map(t => t.projectName)));
    const panel = document.getElementById("projectFilterPanel");
    if (!panel) return;

    panel.innerHTML = `
      <button type="button" class="sci-custom-select-option ${this.activeProjectFilter === 'all' ? 'is-selected' : ''}" data-value="all">
        <span>All Projects (${projects.length})</span>
        ${this.activeProjectFilter === 'all' ? '<i data-lucide="check" class="sci-custom-select-option__check"></i>' : ''}
      </button>
      ${projects.map(p => `
        <button type="button" class="sci-custom-select-option ${this.activeProjectFilter === p ? 'is-selected' : ''}" data-value="${p}">
          <span>${p}</span>
          ${this.activeProjectFilter === p ? '<i data-lucide="check" class="sci-custom-select-option__check"></i>' : ''}
        </button>
      `).join("")}
    `;

    this.bindCustomSelect({
      triggerId: "projectFilterTrigger",
      panelId: "projectFilterPanel",
      labelId: "projectFilterLabel",
      onSelect: (value) => {
        this.activeProjectFilter = value;
        this.render();
      }
    });

    if (this.totalProjectCount) {
      this.totalProjectCount.textContent = `${projects.length} Projects`;
    }
  }

  bindEvents() {
    // Search Events
    this.searchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      if (this.searchQuery.length > 0) {
        this.clearSearchBtn.classList.add("visible");
      } else {
        this.clearSearchBtn.classList.remove("visible");
      }
      this.render();
    });

    this.clearSearchBtn.addEventListener("click", () => {
      this.searchInput.value = "";
      this.searchQuery = "";
      this.clearSearchBtn.classList.remove("visible");
      this.render();
    });

    // Keyboard shortcut (Cmd/Ctrl + K)
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        this.searchInput.focus();
      }
    });

    // Status Filter Tabs
    this.statusTabs.addEventListener("click", (e) => {
      const tabBtn = e.target.closest(".sci-chip-tab");
      if (!tabBtn) return;
      this.statusTabs.querySelectorAll(".sci-chip-tab").forEach(b => b.classList.remove("active"));
      tabBtn.classList.add("active");
      this.activeStatusFilter = tabBtn.dataset.status;
      if (this.currentViewMode === "details") this.closeDetailsView();
      this.render();
    });

    this.resetFiltersBtn.addEventListener("click", () => {
      this.searchInput.value = "";
      this.searchQuery = "";
      this.clearSearchBtn.classList.remove("visible");
      this.activeStatusFilter = "all";
      this.activeProjectFilter = "all";
      this.activeTypeFilter = "all";

      const projLabel = document.getElementById("projectFilterLabel");
      const typeLabel = document.getElementById("typeFilterLabel");
      if (projLabel) projLabel.textContent = "All Projects";
      if (typeLabel) typeLabel.textContent = "All Task Types";

      this.populateProjectFilter();
      
      this.statusTabs.querySelectorAll(".sci-chip-tab").forEach(b => {
        b.classList.toggle("active", b.dataset.status === "all");
      });
      if (this.currentViewMode === "details") this.closeDetailsView();
      this.render();
    });

    // View Switching
    this.viewGridBtn.addEventListener("click", () => {
      this.currentViewMode = "grid";
      this.viewGridBtn.classList.add("active");
      this.viewTableBtn.classList.remove("active");
      this.detailsContainer.classList.add("hidden");
      this.statsBanner.classList.remove("hidden");
      this.toolbarSection.classList.remove("hidden");
      this.contentArea.classList.remove("hidden");
      this.render();
    });

    this.viewTableBtn.addEventListener("click", () => {
      this.currentViewMode = "table";
      this.viewTableBtn.classList.add("active");
      this.viewGridBtn.classList.remove("active");
      this.detailsContainer.classList.add("hidden");
      this.statsBanner.classList.remove("hidden");
      this.toolbarSection.classList.remove("hidden");
      this.contentArea.classList.remove("hidden");
      this.render();
    });

    // Modal Triggers
    this.openCreateModalBtn.addEventListener("click", () => this.openModal());
    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener("click", () => this.closeModal());
    }
    this.taskModalOverlay.addEventListener("click", (e) => {
      if (e.target === this.taskModalOverlay) this.closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.taskModalOverlay.classList.contains("hidden")) {
        this.closeModal();
      }
    });

    // Form Submit
    this.taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    // Close Dropdowns & Custom Selects on outside click
    document.addEventListener("click", (e) => {
      if (
        !e.target.closest(".card-header-right") && 
        !e.target.closest(".table-action-cell") && 
        !e.target.closest(".action-dropdown-menu")
      ) {
        this.closeAllDropdowns();
      }

      if (!e.target.closest(".sci-custom-select-wrap")) {
        this.closeAllCustomSelects();
      }
    });
  }

  initIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  getFilteredTasks() {
    return this.tasks.filter(task => {
      if (task.status === "Completed") return false;

      if (this.activeStatusFilter === "In-Progress" && task.status !== "In-Progress") return false;
      if (this.activeStatusFilter === "Planned" && task.status !== "Planned") return false;
      if (this.activeStatusFilter === "favourite" && !task.isFavourite) return false;

      if (this.activeProjectFilter !== "all" && task.projectName !== this.activeProjectFilter) return false;
      if (this.activeTypeFilter !== "all" && task.type !== this.activeTypeFilter) return false;

      if (this.searchQuery) {
        const q = this.searchQuery;
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchCode = task.code.toLowerCase().includes(q);
        const matchProject = task.projectName.toLowerCase().includes(q);
        const matchType = task.type.toLowerCase().includes(q);
        return matchTitle || matchCode || matchProject || matchType;
      }

      return true;
    }).sort((a, b) => {
      if (this.sortBy === "endDateAsc") {
        return new Date(a.endDate) - new Date(b.endDate);
      } else if (this.sortBy === "startDateAsc") {
        return new Date(a.startDate) - new Date(b.startDate);
      } else if (this.sortBy === "titleAsc") {
        return a.title.localeCompare(b.title);
      } else if (this.sortBy === "idAsc") {
        return a.code.localeCompare(b.code);
      }
      return 0;
    });
  }

  updateStats() {
    const activeTasks = this.tasks.filter(t => t.status !== "Completed");
    const inProgressCount = activeTasks.filter(t => t.status === "In-Progress").length;
    const plannedCount = activeTasks.filter(t => t.status === "Planned").length;
    const favouritesCount = activeTasks.filter(t => t.isFavourite).length;

    if (this.statActive) this.statActive.textContent = activeTasks.length;
    if (this.statInProgress) this.statInProgress.textContent = inProgressCount;
    if (this.statPlanned) this.statPlanned.textContent = plannedCount;
    if (this.statFavourites) this.statFavourites.textContent = favouritesCount;

    this.countAll.textContent = activeTasks.length;
    this.countInProgress.textContent = inProgressCount;
    this.countPlanned.textContent = plannedCount;
    this.countFavourites.textContent = favouritesCount;
  }

  render() {
    this.updateStats();

    if (this.currentViewMode === "details") {
      this.renderDetailsView();
      return;
    }

    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      this.tasksGrid.classList.add("hidden");
      this.tableContainer.classList.add("hidden");
      this.emptyState.classList.remove("hidden");
    } else {
      this.emptyState.classList.add("hidden");
      if (this.currentViewMode === "grid") {
        this.tasksGrid.classList.remove("hidden");
        this.tableContainer.classList.add("hidden");
        this.renderGrid(filteredTasks);
      } else {
        this.tableContainer.classList.remove("hidden");
        this.tasksGrid.classList.add("hidden");
        this.renderTable(filteredTasks);
      }
    }

    this.initIcons();
  }

  formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  getWeekday(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }

  getTypeBadgeClass(type) {
    const map = {
      "Feature": "type-feature",
      "Bug Fix": "type-bug-fix",
      "Design": "type-design",
      "Refactor": "type-refactor",
      "Security": "type-security",
      "Infrastructure": "type-infrastructure"
    };
    return map[type] || "type-feature";
  }

  openDetailsView(taskId) {
    this.closeAllDropdowns();
    this.closeAllCustomSelects();

    this.activeDetailTaskId = taskId;
    this.currentViewMode = "details";

    this.statsBanner.classList.add("hidden");
    this.toolbarSection.classList.add("hidden");
    this.contentArea.classList.add("hidden");
    this.detailsContainer.classList.remove("hidden");

    this.renderDetailsView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeDetailsView() {
    this.detailsContainer.classList.add("hidden");
    this.statsBanner.classList.remove("hidden");
    this.toolbarSection.classList.remove("hidden");
    this.contentArea.classList.remove("hidden");

    this.currentViewMode = this.viewTableBtn.classList.contains("active") ? "table" : "grid";
    this.render();
  }

  renderDetailsView() {
    const task = this.tasks.find(t => t.id === this.activeDetailTaskId);
    if (!task) {
      this.closeDetailsView();
      return;
    }

    const isInProgress = task.status === "In-Progress";
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const today = new Date();

    const durationDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.round((today - start) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.round((end - today) / (1000 * 60 * 60 * 24));

    let progressPct = isInProgress ? Math.min(100, Math.max(10, Math.round((daysElapsed / durationDays) * 100))) : 0;
    if (task.status === "Completed") progressPct = 100;

    this.detailsContainer.innerHTML = `
      <div class="details-topbar">
        <button class="details-back-btn" onclick="app.closeDetailsView()" title="Back to Task List">
          <i data-lucide="arrow-left"></i>
        </button>
        <div class="details-breadcrumbs">
          <span>Projects</span>
          <span>/</span>
          <a href="#" onclick="event.preventDefault()">${task.projectName}</a>
          <span>/</span>
          <strong style="color: var(--sci-color-navy);">${task.code}</strong>
        </div>
      </div>

      <section class="details-hero ${isInProgress ? '' : 'is-planned'}">
        <div class="details-hero-row">
          <div>
            <div class="details-tagline">
              <span class="task-id-badge">${task.code}</span>
              <span class="task-type-badge ${this.getTypeBadgeClass(task.type)}">${task.type}</span>
              <div class="status-badge ${isInProgress ? 'badge-in-progress' : 'badge-planned'}">
                <span class="pulse-dot"></span>
                <span>${task.status}</span>
              </div>
            </div>

            <h1 class="details-title">${task.title}</h1>

            <p class="details-subline">
              <span>Project: <strong>${task.projectName}</strong></span>
              <span>•</span>
              <span>Category: <strong>${task.projectType}</strong></span>
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <button class="favourite-toggle-btn ${task.isFavourite ? 'is-favourite' : ''}" onclick="app.toggleFavourite('${task.id}')" style="width: 44px; height: 44px; border: 1px solid var(--sci-color-border); border-radius: var(--sci-radius-pill);">
              <i data-lucide="star"></i>
            </button>
            
            ${!isInProgress ? `
              <button class="sci-btn sci-btn--primary" onclick="app.startTask('${task.id}')">
                <i data-lucide="play-circle"></i>
                <span>Start Task</span>
              </button>
            ` : `
              <button class="sci-btn sci-btn--secondary" onclick="app.openModal('${task.id}')">
                <i data-lucide="edit-3"></i>
                <span>Update Task</span>
              </button>
            `}
          </div>
        </div>

        <div class="details-runway">
          <div class="runway-head">
            <span>Starts: <strong>${this.formatDate(task.startDate)}</strong></span>
            <span>Ends: <strong>${this.formatDate(task.endDate)}</strong></span>
          </div>

          <div class="runway-track">
            <div class="runway-fill" style="width: ${progressPct}%;"></div>
          </div>

          <div class="runway-foot">
            <span>Progress: <strong>${progressPct}% Completed</strong></span>
            <span>${daysRemaining >= 0 ? `<strong>${daysRemaining} days</strong> remaining` : 'Schedule completed'}</span>
          </div>
        </div>
      </section>

      <div class="details-grid">
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <section class="details-panel">
            <span class="details-panel-title">Schedule Breakdown</span>
            <div class="schedule-tiles">
              <div class="sched-tile">
                <span class="sched-tile-k">Start Date</span>
                <span class="sched-tile-v">${this.formatDate(task.startDate)}</span>
                <span class="sched-tile-s">${this.getWeekday(task.startDate)}</span>
              </div>
              <div class="sched-tile">
                <span class="sched-tile-k">End Date</span>
                <span class="sched-tile-v">${this.formatDate(task.endDate)}</span>
                <span class="sched-tile-s">${this.getWeekday(task.endDate)}</span>
              </div>
              <div class="sched-tile">
                <span class="sched-tile-k">Duration</span>
                <span class="sched-tile-v">${durationDays} Days</span>
                <span class="sched-tile-s">Total allocated</span>
              </div>
              <div class="sched-tile tile-orange">
                <span class="sched-tile-k">Remaining</span>
                <span class="sched-tile-v">${daysRemaining >= 0 ? daysRemaining : 0} Days</span>
                <span class="sched-tile-s">Until due date</span>
              </div>
            </div>
          </section>

          <section class="details-panel">
            <span class="details-panel-title">Status Journey</span>
            <ul class="journey-list">
              <li class="journey-item is-done">
                <div class="journey-icon"><i data-lucide="check"></i></div>
                <div class="journey-info">
                  <span class="journey-title">Task Created</span>
                  <span class="journey-meta">${this.formatDate(task.createdOn || task.startDate)}</span>
                </div>
              </li>
              <li class="journey-item ${isInProgress ? 'is-active' : ''}">
                <div class="journey-icon"><i data-lucide="${isInProgress ? 'play' : 'clock'}"></i></div>
                <div class="journey-info">
                  <span class="journey-title">In-Progress Execution</span>
                  <span class="journey-meta">${isInProgress ? `Started on ${this.formatDate(task.startedOn || task.startDate)}` : 'Pending start'}</span>
                </div>
              </li>
              <li class="journey-item">
                <div class="journey-icon"><i data-lucide="check-circle-2"></i></div>
                <div class="journey-info">
                  <span class="journey-title">Completion & Review</span>
                  <span class="journey-meta">Target: ${this.formatDate(task.endDate)}</span>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <div style="display: flex; flex-direction: column; gap: 20px;">
          <section class="details-panel">
            <span class="details-panel-title">Task Details</span>
            <div class="detail-rows">
              <div class="detail-row">
                <span class="detail-row-k">Task Code</span>
                <span class="detail-row-v" style="font-family: var(--sci-font-mono); color: var(--sci-color-orange);">${task.code}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row-k">Task Type</span>
                <span class="detail-row-v">${task.type}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row-k">Project</span>
                <span class="detail-row-v">${task.projectName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row-k">Project Type</span>
                <span class="detail-row-v">${task.projectType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row-k">Current Status</span>
                <span class="detail-row-v">${task.status}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row-k">Favourite</span>
                <span class="detail-row-v">${task.isFavourite ? 'Yes ⭐' : 'No'}</span>
              </div>
            </div>
          </section>

          <section class="details-panel">
            <span class="details-panel-title">Available Actions</span>
            <div class="detail-actions-list">
              ${!isInProgress ? `
                <button class="sci-btn sci-btn--primary" onclick="app.startTask('${task.id}')" style="width: 100%; justify-content: center;">
                  <i data-lucide="play-circle"></i>
                  <span>Start Task</span>
                </button>
              ` : ''}
              <button class="sci-btn sci-btn--secondary" onclick="app.openModal('${task.id}')" style="width: 100%; justify-content: center;">
                <i data-lucide="edit-3"></i>
                <span>Update Task Details</span>
              </button>
              <button class="sci-btn sci-btn--outline" onclick="app.completeTask('${task.id}')" style="width: 100%; justify-content: center;">
                <i data-lucide="check-circle-2"></i>
                <span>Mark as Complete</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    `;

    this.initIcons();
  }

  renderGrid(tasks) {
    this.tasksGrid.innerHTML = tasks.map(task => {
      const isFav = task.isFavourite ? "is-favourite" : "";
      const isInProgress = task.status === "In-Progress";
      const statusClass = isInProgress ? "is-in-progress" : "is-planned";
      const statusBadgeClass = isInProgress ? "badge-in-progress" : "badge-planned";

      return `
        <article class="task-card ${statusClass}" data-id="${task.id}" onclick="app.openDetailsView('${task.id}')">
          <div class="card-header">
            <div class="card-header-left">
              <span class="task-id-badge">${task.code}</span>
              <span class="task-type-badge ${this.getTypeBadgeClass(task.type)}">${task.type}</span>
            </div>
            <div class="card-header-right" onclick="event.stopPropagation()">
              <button class="favourite-toggle-btn ${isFav}" onclick="event.stopPropagation(); app.toggleFavourite('${task.id}')" title="${task.isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}">
                <i data-lucide="star"></i>
              </button>
              <button class="menu-trigger-btn" onclick="event.stopPropagation(); app.toggleDropdown(event, '${task.id}')" title="Available Actions">
                <i data-lucide="more-vertical"></i>
              </button>
              <div class="action-dropdown-menu hidden" id="dropdown-${task.id}">
                ${!isInProgress ? `
                  <button class="dropdown-item" onclick="event.stopPropagation(); app.startTask('${task.id}')">
                    <i data-lucide="play-circle"></i>
                    <span>Start Task</span>
                  </button>
                ` : ''}
                <button class="dropdown-item" onclick="event.stopPropagation(); app.openModal('${task.id}')">
                  <i data-lucide="edit-3"></i>
                  <span>Update Task</span>
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item item-complete" onclick="event.stopPropagation(); app.completeTask('${task.id}')">
                  <i data-lucide="check-circle-2"></i>
                  <span>Complete Task</span>
                </button>
              </div>
            </div>
          </div>

          <div class="card-body">
            <h3 class="task-title">${task.title}</h3>

            <div class="project-card-info">
              <div class="project-details">
                <i data-lucide="folder"></i>
                <span class="project-name-text" title="${task.projectName}">${task.projectName}</span>
              </div>
              <span class="project-type-tag">${task.projectType}</span>
            </div>

            <div class="schedule-block">
              <div class="schedule-row">
                <div class="schedule-date-item">
                  <i data-lucide="calendar"></i>
                  <span>Start: <strong class="schedule-date-value">${this.formatDate(task.startDate)}</strong></span>
                </div>
                <div class="schedule-date-item">
                  <span>End: <strong class="schedule-date-value">${this.formatDate(task.endDate)}</strong></span>
                </div>
              </div>
              <div class="timeline-bar">
                <div class="timeline-progress" style="width: ${isInProgress ? '60%' : '15%'}"></div>
              </div>
            </div>
          </div>

          <div class="card-footer" onclick="event.stopPropagation()">
            <div class="status-badge ${statusBadgeClass}">
              <span class="pulse-dot"></span>
              <span>${task.status}</span>
            </div>
            <div class="quick-actions">
              ${!isInProgress ? `
                <button class="sci-btn sci-btn--outline sci-btn--sm" onclick="event.stopPropagation(); app.startTask('${task.id}')">
                  <i data-lucide="play"></i>
                  <span>Start</span>
                </button>
              ` : `
                <button class="sci-btn sci-btn--secondary sci-btn--sm" onclick="event.stopPropagation(); app.openModal('${task.id}')">
                  <i data-lucide="edit"></i>
                  <span>Update</span>
                </button>
              `}
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  renderTable(tasks) {
    this.tasksTableBody.innerHTML = tasks.map(task => {
      const isFav = task.isFavourite ? "is-favourite" : "";
      const isInProgress = task.status === "In-Progress";

      return `
        <tr data-id="${task.id}" onclick="app.openDetailsView('${task.id}')">
          <td>
            <span class="task-id-badge">${task.code}</span>
          </td>
          <td>
            <div class="task-details-cell">
              <span class="table-title">${task.title}</span>
            </div>
          </td>
          <td>
            <div class="table-project-cell">
              <span class="table-project-title">${task.projectName}</span>
              <span class="table-project-type">${task.projectType}</span>
            </div>
          </td>
          <td>
            <span class="task-type-badge ${this.getTypeBadgeClass(task.type)}">${task.type}</span>
          </td>
          <td>
            <div class="table-schedule-cell">
              <span><strong>Start:</strong> ${this.formatDate(task.startDate)}</span>
              <span><strong>End:</strong> ${this.formatDate(task.endDate)}</span>
            </div>
          </td>
          <td>
            <div class="status-badge ${isInProgress ? 'badge-in-progress' : 'badge-planned'}">
              <span class="pulse-dot"></span>
              <span>${task.status}</span>
            </div>
          </td>
          <td class="table-action-cell" onclick="event.stopPropagation()">
            <div class="sci-action-menu">
              <button class="menu-trigger-btn" onclick="event.stopPropagation(); app.toggleDropdown(event, '${task.id}')" title="Available Actions">
                <i data-lucide="more-vertical"></i>
              </button>
              <div class="action-dropdown-menu hidden" id="dropdown-${task.id}">
                <button class="dropdown-item item-favourite ${isFav}" onclick="event.stopPropagation(); app.toggleFavourite('${task.id}')">
                  <i data-lucide="star"></i>
                  <span>${task.isFavourite ? 'Remove Favourite' : 'Add to Favourites'}</span>
                </button>
                <div class="dropdown-divider"></div>
                ${!isInProgress ? `
                  <button class="dropdown-item" onclick="event.stopPropagation(); app.startTask('${task.id}')">
                    <i data-lucide="play-circle"></i>
                    <span>Start Task</span>
                  </button>
                ` : ''}
                <button class="dropdown-item" onclick="event.stopPropagation(); app.openModal('${task.id}')">
                  <i data-lucide="edit-3"></i>
                  <span>Update Task</span>
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item item-complete" onclick="event.stopPropagation(); app.completeTask('${task.id}')">
                  <i data-lucide="check-circle-2"></i>
                  <span>Complete Task</span>
                </button>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  toggleDropdown(event, taskId) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.closeAllCustomSelects();

    const btn = event.target.closest("button");
    const dropdownMenu = btn ? btn.parentElement.querySelector(".action-dropdown-menu") : document.getElementById(`dropdown-${taskId}`);
    if (!dropdownMenu) return;

    const isOpen = !dropdownMenu.classList.contains("hidden");
    this.closeAllDropdowns();

    if (!isOpen) {
      dropdownMenu.classList.remove("hidden");
      this.openDropdownId = taskId;
    }
  }

  closeAllDropdowns() {
    document.querySelectorAll(".action-dropdown-menu").forEach(d => d.classList.add("hidden"));
    this.openDropdownId = null;
  }

  toggleFavourite(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.isFavourite = !task.isFavourite;
    this.saveState();
    this.render();

    this.showToast(
      task.isFavourite ? `Task ${task.code} added to Favourites ⭐` : `Task ${task.code} removed from Favourites`,
      "info"
    );
  }

  startTask(taskId) {
    this.closeAllDropdowns();
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = "In-Progress";
    if (!task.startedOn) task.startedOn = new Date().toISOString();
    this.saveState();
    this.render();

    this.showToast(`Task ${task.code} is now In-Progress! 🚀`, "success");
  }

  completeTask(taskId) {
    this.closeAllDropdowns();
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = this.tasks[taskIndex];
    const cardEl = document.querySelector(`[data-id="${taskId}"]`);

    if (cardEl) {
      cardEl.classList.add("task-exit-anim");
      setTimeout(() => {
        task.status = "Completed";
        this.saveState();
        if (this.currentViewMode === "details") this.closeDetailsView();
        else this.render();
        this.showToast(`Task ${task.code} marked as Completed!`, "success", task);
      }, 300);
    } else {
      task.status = "Completed";
      this.saveState();
      if (this.currentViewMode === "details") this.closeDetailsView();
      else this.render();
      this.showToast(`Task ${task.code} marked as Completed!`, "success", task);
    }
  }

  openModal(taskId = null) {
    this.closeAllDropdowns();
    this.closeAllCustomSelects();

    if (taskId) {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return;

      this.modalTitle.textContent = `Update Task ${task.code}`;
      this.modalSubtitle.textContent = "Task update configuration";
      this.saveBtnText.textContent = "Update Task";

      this.formTaskId.value = task.id;
      this.formTaskCode.value = task.code;
      this.formTaskTitle.value = task.title;
      this.formTaskType.value = task.type;
      this.formStatus.value = task.status;

      const typeLabel = document.getElementById("formTaskTypeLabel");
      const statusLabel = document.getElementById("formStatusLabel");
      if (typeLabel) typeLabel.textContent = task.type;
      if (statusLabel) statusLabel.textContent = task.status;

      this.formProjectName.value = task.projectName;
      this.formProjectType.value = task.projectType;
      this.formStartDate.value = task.startDate;
      this.formEndDate.value = task.endDate;
    } else {
      this.modalTitle.textContent = "Create New Task";
      this.modalSubtitle.textContent = "Progressive task configuration";
      this.saveBtnText.textContent = "Save Task";

      this.formTaskId.value = "";
      this.formTaskCode.value = `TSK-${Math.floor(100 + Math.random() * 900)}`;
      this.formTaskTitle.value = "";
      this.formTaskType.value = "Feature";
      this.formStatus.value = "Planned";

      const typeLabel = document.getElementById("formTaskTypeLabel");
      const statusLabel = document.getElementById("formStatusLabel");
      if (typeLabel) typeLabel.textContent = "Feature";
      if (statusLabel) statusLabel.textContent = "Planned";

      this.formProjectName.value = "E-Commerce Mobile App";
      this.formProjectType.value = "Mobile App";
      
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];
      this.formStartDate.value = today;
      this.formEndDate.value = nextWeek;
    }

    this.taskModalOverlay.classList.remove("hidden");
    this.initIcons();
  }

  closeModal() {
    this.taskModalOverlay.classList.add("hidden");
    this.taskForm.reset();
  }

  handleFormSubmit() {
    const taskId = this.formTaskId.value;
    const isEdit = Boolean(taskId);

    const taskData = {
      id: isEdit ? taskId : `task-${Date.now()}`,
      code: this.formTaskCode.value.trim(),
      title: this.formTaskTitle.value.trim(),
      type: this.formTaskType.value,
      projectName: this.formProjectName.value.trim(),
      projectType: this.formProjectType.value.trim(),
      startDate: this.formStartDate.value,
      endDate: this.formEndDate.value,
      status: this.formStatus.value,
      isFavourite: isEdit ? (this.tasks.find(t => t.id === taskId)?.isFavourite || false) : false,
      createdOn: isEdit ? (this.tasks.find(t => t.id === taskId)?.createdOn || new Date().toISOString()) : new Date().toISOString()
    };

    if (isEdit) {
      const idx = this.tasks.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        this.tasks[idx] = taskData;
      }
    } else {
      this.tasks.unshift(taskData);
    }

    this.saveState();
    this.populateProjectFilter();
    this.render();
    this.closeModal();

    this.showToast(isEdit ? `Task ${taskData.code} updated successfully!` : `New task ${taskData.code} created!`, "success");
  }

  showToast(message, type = "info", undoTask = null) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle-2' : 'info'}"></i>
      <span>${message}</span>
      ${undoTask ? `<button class="sci-btn sci-btn--outline sci-btn--sm" id="undoBtn" style="margin-left: 8px;">Undo</button>` : ''}
    `;

    this.toastContainer.appendChild(toast);
    this.initIcons();

    if (undoTask) {
      const undoBtn = toast.querySelector("#undoBtn");
      if (undoBtn) {
        undoBtn.addEventListener("click", () => {
          undoTask.status = "Planned";
          this.saveState();
          this.render();
          toast.remove();
          this.showToast(`Restored task ${undoTask.code}`, "info");
        });
      }
    }

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      toast.style.transition = "all 0.2s ease";
      setTimeout(() => toast.remove(), 200);
    }, 4000);
  }
}

// Global instance
let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new TaskApp();
});
