const App = {
    leads: [],
    followUps: [],
    notifications: [],
    currentPage: 1,
    itemsPerPage: 10,
    editingLeadId: null,
    currency: 'USD',
    currencyRates: { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.12 },
    stages: [],
    fixedStages: [
        { id: 'new', name: 'New Lead', color: '#06b6d4', icon: 'fas fa-plus-circle', fixed: true, order: 1 },
        { id: 'contacted', name: 'Contacted', color: '#3b82f6', icon: 'fas fa-phone', fixed: true, order: 2 },
        { id: 'qualified', name: 'Qualified', color: '#8b5cf6', icon: 'fas fa-check-circle', fixed: true, order: 3 },
        { id: 'proposal', name: 'Proposal Sent', color: '#f97316', icon: 'fas fa-file-alt', fixed: true, order: 4 },
        { id: 'negotiation', name: 'Negotiation', color: '#f59e0b', icon: 'fas fa-handshake', fixed: true, order: 5 },
        { id: 'won', name: 'Won', color: '#10b981', icon: 'fas fa-trophy', fixed: true, order: 6 },
        { id: 'lost', name: 'Lost', color: '#ef4444', icon: 'fas fa-times-circle', fixed: true, order: 7 }
    ],
    nextStageOrder: 8,

    init() {
        this.loadStages();
        this.generateSampleData();
        this.createSidebarOverlay();
        this.bindEvents();
        this.renderDashboard();
        this.renderLeadsTable();
        this.renderPipeline();
        this.renderFollowUps();
        this.renderReports();
        this.renderStageSettings();
        this.updateStats();
        this.updateStatusDropdowns();
        this.initCharts();
        this.initCalendar();
        this.initFormBuilder();
        this.initOfflineDetection();
        this.initTouchGestures();
    },

    loadStages() {
        const saved = localStorage.getItem('leadflow_stages');
        if (saved) {
            this.stages = JSON.parse(saved);
        } else {
            this.stages = JSON.parse(JSON.stringify(this.fixedStages));
        }
    },

    saveStages() {
        localStorage.setItem('leadflow_stages', JSON.stringify(this.stages));
        this.updateStatusDropdowns();
        this.renderPipeline();
        this.renderStageSettings();
    },

    getAllStages() {
        return [...this.stages].sort((a, b) => a.order - b.order);
    },

    getStageById(id) {
        return this.stages.find(s => s.id === id);
    },

    getStageColor(id) {
        const stage = this.getStageById(id);
        return stage ? stage.color : '#64748b';
    },

    getStageName(id) {
        const stage = this.getStageById(id);
        return stage ? stage.name : id;
    },

    addStage(name, color, icon) {
        const id = 'custom_' + Date.now();
        const newStage = {
            id,
            name,
            color: color || '#6366f1',
            icon: icon || 'fas fa-flag',
            fixed: false,
            order: this.nextStageOrder++
        };

        const wonIndex = this.stages.findIndex(s => s.id === 'won');
        if (wonIndex > -1) {
            this.stages.splice(wonIndex, 0, newStage);
        } else {
            this.stages.push(newStage);
        }

        this.saveStages();
        this.showToast(`Stage "${name}" created`, 'success');
        return newStage;
    },

    updateStage(id, updates) {
        const stage = this.stages.find(s => s.id === id);
        if (stage && !stage.fixed) {
            Object.assign(stage, updates);
            this.saveStages();
            this.showToast(`Stage updated`, 'success');
        }
    },

    deleteStage(id) {
        const stage = this.stages.find(s => s.id === id);
        if (stage && !stage.fixed) {
            const leadsInStage = this.leads.filter(l => l.status === id);
            if (leadsInStage.length > 0) {
                if (!confirm(`There are ${leadsInStage.length} leads in this stage. They will be moved to "New Lead". Continue?`)) {
                    return false;
                }
                leadsInStage.forEach(l => { l.status = 'new'; });
            }
            this.stages = this.stages.filter(s => s.id !== id);
            this.saveStages();
            this.renderLeadsTable();
            this.showToast(`Stage "${stage.name}" deleted`, 'info');
            return true;
        }
        return false;
    },

    reorderStages(newOrder) {
        newOrder.forEach((id, index) => {
            const stage = this.stages.find(s => s.id === id);
            if (stage) stage.order = index + 1;
        });
        this.saveStages();
    },

    moveStageUp(id) {
        const sorted = this.getAllStages();
        const idx = sorted.findIndex(s => s.id === id);
        if (idx > 0) {
            const prev = sorted[idx - 1];
            const curr = sorted[idx];
            const tempOrder = curr.order;
            curr.order = prev.order;
            prev.order = tempOrder;
            this.saveStages();
        }
    },

    moveStageDown(id) {
        const sorted = this.getAllStages();
        const idx = sorted.findIndex(s => s.id === id);
        if (idx < sorted.length - 1) {
            const next = sorted[idx + 1];
            const curr = sorted[idx];
            const tempOrder = curr.order;
            curr.order = next.order;
            next.order = tempOrder;
            this.saveStages();
        }
    },

    updateStatusDropdowns() {
        const allStages = this.getAllStages();
        const dropdowns = ['leadStatus', 'filterStatus'];
        dropdowns.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const currentVal = el.value;
            const firstOption = id === 'filterStatus' ? '<option value="">All Status</option>' : '';
            el.innerHTML = firstOption + allStages.map(s =>
                `<option value="${s.id}">${s.name}</option>`
            ).join('');
            if (currentVal && allStages.find(s => s.id === currentVal)) {
                el.value = currentVal;
            }
        });
    },

    createSidebarOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.id = 'sidebarOverlay';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => {
            this.closeSidebar();
        });
    },

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.add('mobile-open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    },

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    },

    generateSampleData() {
        const companies = ['Acme Corp', 'Tech Solutions', 'Innovate Inc', 'Global Systems', 'DataFlow', 'CloudFirst', 'NexGen', 'Pinnacle', 'StratEdge', 'Quantum Labs', 'Velocity', 'Synergy', 'Atlas Digital', 'Horizon Tech', 'Vertex Solutions', 'BlueWave', 'RedShift', 'GreenPath', 'SilverLine', 'GoldenGate'];
        const contacts = ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Emily Davis', 'James Wilson', 'Lisa Brown', 'David Lee', 'Anna Garcia', 'Robert Taylor', 'Jennifer Martinez', 'Chris Anderson', 'Amanda White', 'Thomas Harris', 'Rachel Clark', 'Kevin Lewis', 'Maria Rodriguez', 'Daniel Kim', 'Laura Thompson', 'Ryan Murphy', 'Nicole Young'];
        const sources = ['website', 'referral', 'ads', 'social', 'cold-call'];
        const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
        const priorities = ['low', 'medium', 'high'];
        const executives = ['sarah', 'mike', 'emily', 'james'];

        for (let i = 1; i <= 50; i++) {
            const ci = Math.floor(Math.random() * companies.length);
            const budget = Math.floor(Math.random() * 500000) + 10000;
            this.leads.push({
                id: i,
                leadNo: 'LD-' + String(1000 + i).padStart(4, '0'),
                companyName: companies[ci],
                contactPerson: contacts[ci],
                mobile: '+1 (555) ' + String(Math.floor(Math.random() * 900) + 100) + '-' + String(Math.floor(Math.random() * 9000) + 1000),
                email: contacts[ci].toLowerCase().replace(' ', '.') + '@' + companies[ci].toLowerCase().replace(' ', '') + '.com',
                source: sources[Math.floor(Math.random() * sources.length)],
                requirement: 'Enterprise software solution for business process automation.',
                budget: budget,
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                assignedTo: executives[Math.floor(Math.random() * executives.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                description: 'Looking for comprehensive ERP solution.',
                score: Math.floor(Math.random() * 100),
                industry: ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail'][Math.floor(Math.random() * 5)],
                companySize: ['1-10', '11-50', '51-200', '201-1000', '1000+'][Math.floor(Math.random() * 5)],
                website: 'https://' + companies[ci].toLowerCase().replace(' ', '') + '.com',
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000).toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        for (let i = 1; i <= 20; i++) {
            const lead = this.leads[Math.floor(Math.random() * this.leads.length)];
            this.followUps.push({
                id: i,
                leadId: lead.id,
                leadName: lead.contactPerson,
                company: lead.companyName,
                date: new Date(Date.now() + Math.floor(Math.random() * 14) * 86400000).toISOString().split('T')[0],
                nextDate: new Date(Date.now() + Math.floor(Math.random() * 30) * 86400000).toISOString().split('T')[0],
                type: ['call', 'meeting', 'email'][Math.floor(Math.random() * 3)],
                outcome: ['positive', 'negative', 'pending'][Math.floor(Math.random() * 3)],
                priority: priorities[Math.floor(Math.random() * 3)],
                notes: 'Discussed requirements and budget allocation.'
            });
        }
    },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(item.dataset.page);
            });
        });

        document.querySelectorAll('.view-all').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(link.dataset.page);
            });
        });

        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        document.getElementById('mobileMenuBtn').addEventListener('click', () => {
            this.openSidebar();
        });

        document.getElementById('addLeadBtn').addEventListener('click', () => this.openLeadModal());
        document.getElementById('closeLeadModal').addEventListener('click', () => this.closeModal('leadModal'));
        document.getElementById('cancelLead').addEventListener('click', () => this.closeModal('leadModal'));
        document.getElementById('saveLead').addEventListener('click', () => this.saveLead());

        document.getElementById('addFollowUpBtn').addEventListener('click', () => this.openFollowUpModal());
        document.getElementById('closeFollowUpModal').addEventListener('click', () => this.closeModal('followUpModal'));
        document.getElementById('cancelFollowUp').addEventListener('click', () => this.closeModal('followUpModal'));
        document.getElementById('saveFollowUp').addEventListener('click', () => this.saveFollowUp());

        document.getElementById('closeDetailModal').addEventListener('click', () => this.closeModal('leadDetailModal'));
        document.getElementById('editFromDetail').addEventListener('click', () => {
            this.closeModal('leadDetailModal');
            const leadId = parseInt(document.getElementById('detailLeadTitle').dataset.leadId);
            this.openLeadModal(leadId);
        });
        document.getElementById('convertLead').addEventListener('click', () => {
            const leadId = parseInt(document.getElementById('detailLeadTitle').dataset.leadId);
            this.convertLead(leadId);
        });

        document.getElementById('notificationBtn').addEventListener('click', () => {
            document.getElementById('notifPanel').classList.toggle('show');
        });

        document.getElementById('clearNotifs').addEventListener('click', () => {
            document.getElementById('notifList').innerHTML = '<div class="notif-item"><div class="notif-content"><p style="text-align:center;color:var(--text-muted)">No notifications</p></div></div>';
            document.getElementById('notifBadge').style.display = 'none';
        });

        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
            document.documentElement.setAttribute('data-theme', e.target.checked ? 'dark' : '');
            document.querySelector('#themeToggle i').className = e.target.checked ? 'fas fa-sun' : 'fas fa-moon';
        });

        document.getElementById('currencySelect')?.addEventListener('change', (e) => {
            this.currency = e.target.value;
            this.updateCurrencyDisplay();
            this.showToast(`Currency changed to ${this.currency}`, 'info');
        });

        document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });

        document.getElementById('globalSearch')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const results = document.getElementById('searchResults');
            if (q.length > 1) {
                const matches = this.leads.filter(l =>
                    l.companyName.toLowerCase().includes(q) ||
                    l.contactPerson.toLowerCase().includes(q) ||
                    l.leadNo.toLowerCase().includes(q)
                ).slice(0, 5);
                results.innerHTML = matches.length ? matches.map(l =>
                    `<div class="search-result-item" onclick="App.viewLead(${l.id})"><div class="search-result-title">${l.companyName}</div><div class="search-result-sub">${l.contactPerson} • ${l.leadNo}</div></div>`
                ).join('') : '<div class="search-result-item"><div class="search-result-sub">No results found</div></div>';
                results.classList.add('show');
            } else {
                results.classList.remove('show');
            }
        });

        document.querySelectorAll('.followup-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.followup-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });

        document.querySelectorAll('.comm-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.comm-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });

        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.settings-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('settings-' + tab.dataset.tab).classList.add('active');
            });
        });

        document.querySelectorAll('.saved-filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.saved-filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            });
        });

        document.getElementById('leadSearch')?.addEventListener('input', () => this.filterLeads());
        document.getElementById('filterStatus')?.addEventListener('change', () => this.filterLeads());
        document.getElementById('filterPriority')?.addEventListener('change', () => this.filterLeads());
        document.getElementById('filterSource')?.addEventListener('change', () => this.filterLeads());

        document.getElementById('importLeadsBtn')?.addEventListener('click', () => {
            document.getElementById('importModal').classList.add('show');
        });

        document.getElementById('exportLeadsBtn')?.addEventListener('click', () => {
            document.getElementById('exportModal').classList.add('show');
        });

        document.getElementById('sendEmailBtn')?.addEventListener('click', () => {
            document.getElementById('emailModal').classList.add('show');
        });

        document.getElementById('sendSmsBtn')?.addEventListener('click', () => {
            document.getElementById('smsModal').classList.add('show');
        });

        document.getElementById('logCallBtn')?.addEventListener('click', () => {
            document.getElementById('callModal').classList.add('show');
        });

        document.getElementById('uploadDocBtn')?.addEventListener('click', () => {
            document.getElementById('uploadDocModal').classList.add('show');
        });

        document.getElementById('editGoalBtn')?.addEventListener('click', () => {
            document.getElementById('goalModal').classList.add('show');
        });

        document.getElementById('calendarViewBtn')?.addEventListener('click', () => {
            const cal = document.getElementById('calendarView');
            const table = document.getElementById('followupTableCard');
            cal.style.display = cal.style.display === 'none' ? 'block' : 'none';
            table.style.display = cal.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('addNoteBtn')?.addEventListener('click', () => {
            const text = document.getElementById('newNoteText').value.trim();
            if (text) {
                const notes = document.getElementById('leadNotes');
                const note = document.createElement('div');
                note.className = 'note-item';
                note.innerHTML = `<div class="note-header"><strong>Admin User</strong><span>Just now</span></div><p>${text}</p>`;
                notes.insertBefore(note, notes.firstChild);
                document.getElementById('newNoteText').value = '';
                this.showToast('Note added', 'success');
            }
        });

        document.getElementById('smsBody')?.addEventListener('input', (e) => {
            document.getElementById('charCount').textContent = e.target.value.length;
        });

        document.getElementById('copyApiKey')?.addEventListener('click', () => {
            navigator.clipboard.writeText(document.getElementById('apiKey').value);
            this.showToast('API key copied to clipboard', 'success');
        });

        document.getElementById('generateQrBtn')?.addEventListener('click', () => {
            const qr = document.getElementById('qrCode');
            qr.innerHTML = '<div style="text-align:center"><i class="fas fa-qrcode" style="font-size:100px;color:var(--text)"></i><p style="margin-top:8px;font-size:12px;color:var(--text-secondary)">https://forms.leadflow.com/abc123</p></div>';
            this.showToast('QR Code generated', 'success');
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.classList.remove('show');
            });
        });

        document.getElementById('pwaDismiss')?.addEventListener('click', () => {
            document.getElementById('pwaBanner').classList.add('hidden');
        });

        document.querySelectorAll('.color-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-box')) {
                document.getElementById('searchResults')?.classList.remove('show');
            }
            if (!e.target.closest('#notifPanel') && !e.target.closest('#notificationBtn')) {
                document.getElementById('notifPanel')?.classList.remove('show');
            }
        });

        // Stage Management Events
        document.getElementById('addStageBtn')?.addEventListener('click', () => this.openAddStageModal());
        document.getElementById('saveStageBtn')?.addEventListener('click', () => this.saveStage());
        document.getElementById('stageName')?.addEventListener('input', (e) => {
            document.getElementById('stagePreviewName').textContent = e.target.value || 'New Stage';
        });
        document.getElementById('stageColor')?.addEventListener('input', (e) => {
            document.getElementById('stagePreviewDot').style.background = e.target.value;
        });
    },

    navigateTo(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById('page-' + page).classList.add('active');
        document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
        this.closeSidebar();
    },

    toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? '' : 'dark');
        document.querySelector('#themeToggle i').className = isDark ? 'fas fa-moon' : 'fas fa-sun';
        const dt = document.getElementById('darkModeToggle');
        if (dt) dt.checked = !isDark;
    },

    generateLeadNo() {
        const maxNum = this.leads.reduce((max, l) => {
            const num = parseInt(l.leadNo.replace('LD-', ''));
            return num > max ? num : max;
        }, 1000);
        return 'LD-' + String(maxNum + 1).padStart(4, '0');
    },

    openLeadModal(leadId = null) {
        this.editingLeadId = leadId;
        const modal = document.getElementById('leadModal');
        const title = document.getElementById('modalTitle');

        if (leadId) {
            const lead = this.leads.find(l => l.id === leadId);
            title.textContent = 'Edit Lead';
            document.getElementById('leadNo').value = lead.leadNo;
            document.getElementById('companyName').value = lead.companyName;
            document.getElementById('contactPerson').value = lead.contactPerson;
            document.getElementById('mobileNumber').value = lead.mobile;
            document.getElementById('leadEmail').value = lead.email;
            document.getElementById('leadSource').value = lead.source;
            document.getElementById('leadBudget').value = lead.budget;
            document.getElementById('leadPriority').value = lead.priority;
            document.getElementById('leadAssigned').value = lead.assignedTo;
            document.getElementById('leadStatus').value = lead.status;
            document.getElementById('leadDescription').value = lead.description;
            document.getElementById('leadRequirement').value = lead.requirement;
        } else {
            title.textContent = 'New Lead';
            document.getElementById('leadForm').reset();
            document.getElementById('leadNo').value = this.generateLeadNo();
        }
        modal.classList.add('show');
    },

    saveLead() {
        const form = document.getElementById('leadForm');
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const leadData = {
            leadNo: document.getElementById('leadNo').value,
            companyName: document.getElementById('companyName').value,
            contactPerson: document.getElementById('contactPerson').value,
            mobile: document.getElementById('mobileNumber').value,
            email: document.getElementById('leadEmail').value,
            source: document.getElementById('leadSource').value,
            budget: parseInt(document.getElementById('leadBudget').value) || 0,
            priority: document.getElementById('leadPriority').value,
            assignedTo: document.getElementById('leadAssigned').value,
            status: document.getElementById('leadStatus').value,
            description: document.getElementById('leadDescription').value,
            requirement: document.getElementById('leadRequirement').value,
            industry: document.getElementById('customIndustry')?.value || '',
            companySize: document.getElementById('customSize')?.value || '',
            website: document.getElementById('customWebsite')?.value || '',
            updatedAt: new Date().toISOString()
        };

        if (this.editingLeadId) {
            const idx = this.leads.findIndex(l => l.id === this.editingLeadId);
            this.leads[idx] = { ...this.leads[idx], ...leadData };
            this.showToast('Lead updated successfully', 'success');
        } else {
            leadData.id = Date.now();
            leadData.score = Math.floor(Math.random() * 100);
            leadData.createdAt = new Date().toISOString();
            this.leads.unshift(leadData);
            this.showToast('Lead created successfully', 'success');
        }

        this.closeModal('leadModal');
        this.renderLeadsTable();
        this.renderPipeline();
        this.updateStats();
    },

    deleteLead(id) {
        if (confirm('Are you sure you want to delete this lead?')) {
            this.leads = this.leads.filter(l => l.id !== id);
            this.renderLeadsTable();
            this.renderPipeline();
            this.updateStats();
            this.showToast('Lead deleted', 'info');
        }
    },

    viewLead(id) {
        const lead = this.leads.find(l => l.id === id);
        if (!lead) return;
        document.getElementById('detailLeadTitle').textContent = lead.companyName;
        document.getElementById('detailLeadTitle').dataset.leadId = id;

        const execNames = { sarah: 'Sarah Johnson', mike: 'Mike Chen', emily: 'Emily Davis', james: 'James Wilson' };
        const stageColor = this.getStageColor(lead.status);
        const stageName = this.getStageName(lead.status);
        const fields = [
            { label: 'Lead No', value: lead.leadNo },
            { label: 'Company', value: lead.companyName },
            { label: 'Contact', value: lead.contactPerson },
            { label: 'Phone', value: lead.mobile },
            { label: 'Email', value: lead.email },
            { label: 'Source', value: lead.source },
            { label: 'Budget', value: '$' + lead.budget.toLocaleString() },
            { label: 'Score', value: lead.score + '/100' },
            { label: 'Priority', value: lead.priority },
            { label: 'Assigned To', value: execNames[lead.assignedTo] || 'Unassigned' },
            { label: 'Status', value: `<span class="status-badge" style="background:${stageColor}20;color:${stageColor}">${stageName}</span>` }
        ];

        document.getElementById('detailFields').innerHTML = fields.map(f =>
            `<div class="detail-field"><span class="detail-field-label">${f.label}</span><span class="detail-field-value">${f.value}</span></div>`
        ).join('');

        document.getElementById('detailTimeline').innerHTML = [
            { type: 'call', title: 'Initial Call', desc: 'First contact made', time: '3 days ago', color: 'bg-blue' },
            { type: 'envelope', title: 'Proposal Sent', desc: 'Sent detailed proposal', time: '1 day ago', color: 'bg-purple' },
            { type: 'users', title: 'Follow-up Meeting', desc: 'Scheduled meeting', time: 'Tomorrow', color: 'bg-green' }
        ].map(t =>
            `<div class="timeline-item"><div class="timeline-dot ${t.color}"><i class="fas fa-${t.type}"></i></div><div class="timeline-content"><div class="timeline-title">${t.title}</div><div class="timeline-desc">${t.desc}</div><div class="timeline-time">${t.time}</div></div></div>`
        ).join('');

        document.getElementById('leadDetailModal').classList.add('show');
    },

    convertLead(id) {
        const lead = this.leads.find(l => l.id === id);
        lead.status = 'won';
        this.closeModal('leadDetailModal');
        this.renderLeadsTable();
        this.renderPipeline();
        this.updateStats();
        this.showToast(`${lead.companyName} converted to customer!`, 'success');
    },

    filterLeads() {
        const search = (document.getElementById('leadSearch')?.value || '').toLowerCase();
        const status = document.getElementById('filterStatus')?.value || '';
        const priority = document.getElementById('filterPriority')?.value || '';
        const source = document.getElementById('filterSource')?.value || '';

        let filtered = this.leads.filter(l => {
            const matchSearch = !search || l.companyName.toLowerCase().includes(search) || l.contactPerson.toLowerCase().includes(search) || l.leadNo.toLowerCase().includes(search);
            const matchStatus = !status || l.status === status;
            const matchPriority = !priority || l.priority === priority;
            const matchSource = !source || l.source === source;
            return matchSearch && matchStatus && matchPriority && matchSource;
        });

        this.renderLeadsTable(filtered);
    },

    renderLeadsTable(leads = null) {
        const data = leads || this.leads;
        const execNames = { sarah: 'Sarah Johnson', mike: 'Mike Chen', emily: 'Emily Davis', james: 'James Wilson' };
        const tbody = document.getElementById('leadsTableBody');

        tbody.innerHTML = data.slice(0, this.itemsPerPage).map(l => {
            const scoreClass = l.score >= 70 ? 'score-high' : l.score >= 40 ? 'score-medium' : 'score-low';
            const stageColor = this.getStageColor(l.status);
            const stageName = this.getStageName(l.status);
            return `<tr>
                <td><input type="checkbox" class="custom-checkbox lead-checkbox" data-id="${l.id}"></td>
                <td><strong>${l.leadNo}</strong></td>
                <td>${l.companyName}</td>
                <td>${l.contactPerson}</td>
                <td>${l.mobile}</td>
                <td><span class="source-badge">${l.source}</span></td>
                <td><span class="score-badge ${scoreClass}">${l.score}</span></td>
                <td><span class="priority-badge priority-${l.priority}">${l.priority}</span></td>
                <td><span class="status-badge" style="background:${stageColor}20;color:${stageColor}">${stageName}</span></td>
                <td>${execNames[l.assignedTo] || 'Unassigned'}</td>
                <td>${this.formatCurrency(l.budget)}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn" title="View" onclick="App.viewLead(${l.id})"><i class="fas fa-eye"></i></button>
                        <button class="action-btn" title="Edit" onclick="App.openLeadModal(${l.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn danger" title="Delete" onclick="App.deleteLead(${l.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        document.querySelectorAll('.lead-checkbox').forEach(cb => {
            cb.addEventListener('change', () => this.updateBulkActions());
        });

        document.getElementById('selectAll')?.addEventListener('change', (e) => {
            document.querySelectorAll('.lead-checkbox').forEach(cb => { cb.checked = e.target.checked; });
            this.updateBulkActions();
        });
    },

    updateBulkActions() {
        const checked = document.querySelectorAll('.lead-checkbox:checked');
        const bar = document.getElementById('bulkActions');
        if (checked.length > 0) {
            bar.style.display = 'flex';
            document.getElementById('selectedCount').textContent = checked.length;
        } else {
            bar.style.display = 'none';
        }
    },

    renderPipeline() {
        const container = document.getElementById('pipelineContainer');
        const allStages = this.getAllStages();
        const execNames = { sarah: 'SJ', mike: 'MC', emily: 'ED', james: 'JW' };
        const execColors = { sarah: 'bg-pink', mike: 'bg-blue', emily: 'bg-green', james: 'bg-purple' };

        container.innerHTML = allStages.map(stage => {
            const leads = this.leads.filter(l => l.status === stage.id);
            const totalValue = leads.reduce((sum, l) => sum + l.budget, 0);

            return `<div class="pipeline-column" data-status="${stage.id}" style="border-top: 3px solid ${stage.color}">
                <div class="pipeline-header">
                    <div class="pipeline-title">
                        <span class="pipeline-dot" style="background:${stage.color}"></span>
                        <h4>${stage.name}</h4>
                        <span class="pipeline-count">${leads.length}</span>
                    </div>
                    <span class="pipeline-value">$${Math.round(totalValue / 1000)}K</span>
                </div>
                <div class="pipeline-cards" id="pipeline-${stage.id}">
                    ${leads.slice(0, 6).map(l => `
                        <div class="pipeline-card" draggable="true" ondragstart="App.dragStart(event, ${l.id})" ondragend="App.dragEnd(event)" onclick="App.viewLead(${l.id})">
                            <div class="pipeline-card-company">${l.companyName}</div>
                            <div class="pipeline-card-contact">${l.contactPerson}</div>
                            <div class="pipeline-card-footer">
                                <span class="pipeline-card-value">$${(l.budget / 1000).toFixed(0)}K</span>
                                <div class="pipeline-card-avatar ${execColors[l.assignedTo] || 'bg-cyan'}">${execNames[l.assignedTo] || 'NA'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }).join('');

        document.querySelectorAll('.pipeline-column').forEach(col => {
            col.addEventListener('dragover', (e) => { e.preventDefault(); col.style.background = 'rgba(99,102,241,0.05)'; });
            col.addEventListener('dragleave', () => { col.style.background = ''; });
            col.addEventListener('drop', (e) => {
                e.preventDefault();
                col.style.background = '';
                const leadId = parseInt(e.dataTransfer.getData('text/plain'));
                const newStatus = col.dataset.status;
                const lead = this.leads.find(l => l.id === leadId);
                if (lead) {
                    lead.status = newStatus;
                    this.renderPipeline();
                    this.renderLeadsTable();
                    this.updateStats();
                    this.showToast(`${lead.companyName} moved to ${this.getStageName(newStatus)}`, 'info');
                }
            });
        });
    },

    dragStart(e, id) {
        e.dataTransfer.setData('text/plain', id);
        e.target.classList.add('dragging');
    },

    dragEnd(e) { e.target.classList.remove('dragging'); },

    openFollowUpModal() {
        const select = document.getElementById('fuLead');
        select.innerHTML = '<option value="">Select Lead</option>' +
            this.leads.map(l => `<option value="${l.id}">${l.contactPerson} - ${l.companyName}</option>`).join('');
        document.getElementById('followUpForm').reset();
        document.getElementById('fuDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('followUpModal').classList.add('show');
    },

    saveFollowUp() {
        const form = document.getElementById('followUpForm');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const leadId = parseInt(document.getElementById('fuLead').value);
        const lead = this.leads.find(l => l.id === leadId);

        this.followUps.unshift({
            id: Date.now(), leadId, leadName: lead.contactPerson, company: lead.companyName,
            date: document.getElementById('fuDate').value,
            nextDate: document.getElementById('fuNextDate').value,
            type: document.getElementById('fuType').value,
            outcome: document.getElementById('fuOutcome').value,
            priority: document.getElementById('fuPriority').value,
            notes: document.getElementById('fuNotes').value
        });

        this.closeModal('followUpModal');
        this.renderFollowUps();
        this.showToast('Follow-up saved successfully', 'success');
    },

    renderFollowUps() {
        const tbody = document.getElementById('followUpsTable');
        const typeIcons = { call: 'phone', meeting: 'users', email: 'envelope' };
        const outcomeColors = { positive: 'text-green', negative: 'text-red', pending: 'text-orange' };

        tbody.innerHTML = this.followUps.map(fu =>
            `<tr>
                <td><input type="checkbox" class="custom-checkbox"></td>
                <td>${fu.date}</td>
                <td>${fu.nextDate || '-'}</td>
                <td>${fu.leadName}</td>
                <td>${fu.company}</td>
                <td><span class="source-badge"><i class="fas fa-${typeIcons[fu.type]}"></i> ${fu.type}</span></td>
                <td><span class="${outcomeColors[fu.outcome]}">${fu.outcome}</span></td>
                <td><span class="priority-badge priority-${fu.priority}">${fu.priority}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="action-btn danger" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`
        ).join('');

        const upcoming = this.followUps.filter(fu => fu.nextDate).slice(0, 5);
        document.getElementById('upcomingFollowUps').innerHTML = upcoming.map(fu =>
            `<tr>
                <td>${fu.nextDate}</td><td>${fu.leadName}</td><td>${fu.company}</td>
                <td><span class="source-badge">${fu.type}</span></td>
                <td><span class="priority-badge priority-${fu.priority}">${fu.priority}</span></td>
                <td><button class="btn btn-sm btn-primary">Follow Up</button></td>
            </tr>`
        ).join('');
    },

    updateStats() {
        const total = this.leads.length;
        const open = this.leads.filter(l => !['won', 'lost'].includes(l.status)).length;
        const won = this.leads.filter(l => l.status === 'won').length;
        const lost = this.leads.filter(l => l.status === 'lost').length;
        document.getElementById('statTotal').textContent = total;
        document.getElementById('statOpen').textContent = open;
        document.getElementById('statWon').textContent = won;
        document.getElementById('statLost').textContent = lost;
    },

    renderStageSettings() {
        const container = document.getElementById('stagesList');
        if (!container) return;

        const allStages = this.getAllStages();

        container.innerHTML = allStages.map((stage, index) => {
            const leadsCount = this.leads.filter(l => l.status === stage.id).length;
            return `<div class="stage-item ${stage.fixed ? 'fixed' : 'dynamic'}" data-id="${stage.id}" draggable="${!stage.fixed}">
                <div class="stage-drag"><i class="fas fa-grip-vertical"></i></div>
                <div class="stage-color" style="background:${stage.color}"></div>
                <div class="stage-info">
                    <div class="stage-name">${stage.name}</div>
                    <div class="stage-meta">
                        <span>${leadsCount} leads</span>
                        ${stage.fixed ? '<span class="stage-type-badge fixed">Fixed</span>' : '<span class="stage-type-badge dynamic">Custom</span>'}
                    </div>
                </div>
                <div class="stage-actions">
                    <button class="action-btn" title="Move Up" onclick="App.moveStageUp('${stage.id}')" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="action-btn" title="Move Down" onclick="App.moveStageDown('${stage.id}')" ${index === allStages.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    ${!stage.fixed ? `
                        <button class="action-btn" title="Edit" onclick="App.openEditStageModal('${stage.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn danger" title="Delete" onclick="App.deleteStage('${stage.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : '<span class="stage-fixed-icon"><i class="fas fa-lock"></i></span>'}
                </div>
            </div>`;
        }).join('');

        this.initStageDragDrop();
    },

    initStageDragDrop() {
        const container = document.getElementById('stagesList');
        if (!container) return;

        let draggedItem = null;

        container.querySelectorAll('.stage-item[draggable="true"]').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                draggedItem = null;
                container.querySelectorAll('.stage-item').forEach(i => i.classList.remove('drag-over'));
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedItem && draggedItem !== item) {
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                if (draggedItem && draggedItem !== item) {
                    const allItems = [...container.querySelectorAll('.stage-item')];
                    const fromIndex = allItems.indexOf(draggedItem);
                    const toIndex = allItems.indexOf(item);

                    if (fromIndex < toIndex) {
                        container.insertBefore(draggedItem, item.nextSibling);
                    } else {
                        container.insertBefore(draggedItem, item);
                    }

                    const newOrder = [...container.querySelectorAll('.stage-item')].map(i => i.dataset.id);
                    this.reorderStages(newOrder);
                }
            });
        });
    },

    openAddStageModal() {
        document.getElementById('stageModalTitle').textContent = 'Add New Stage';
        document.getElementById('stageName').value = '';
        document.getElementById('stageColor').value = '#6366f1';
        document.getElementById('stageIcon').value = 'fas fa-flag';
        document.getElementById('editStageId').value = '';
        document.getElementById('stageModal').classList.add('show');
    },

    openEditStageModal(id) {
        const stage = this.getStageById(id);
        if (!stage || stage.fixed) return;

        document.getElementById('stageModalTitle').textContent = 'Edit Stage';
        document.getElementById('stageName').value = stage.name;
        document.getElementById('stageColor').value = stage.color;
        document.getElementById('stageIcon').value = stage.icon;
        document.getElementById('editStageId').value = id;
        document.getElementById('stageModal').classList.add('show');
    },

    saveStage() {
        const name = document.getElementById('stageName').value.trim();
        const color = document.getElementById('stageColor').value;
        const icon = document.getElementById('stageIcon').value;
        const editId = document.getElementById('editStageId').value;

        if (!name) {
            this.showToast('Please enter a stage name', 'error');
            return;
        }

        if (editId) {
            this.updateStage(editId, { name, color, icon });
        } else {
            this.addStage(name, color, icon);
        }

        this.closeModal('stageModal');
    },

    formatCurrency(amount) {
        const converted = amount * this.currencyRates[this.currency];
        const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
        return symbols[this.currency] + Math.round(converted).toLocaleString();
    },

    updateCurrencyDisplay() {
        document.getElementById('revenueForecast').textContent = this.formatCurrency(1240000);
        this.renderLeadsTable();
    },

    renderDashboard() {
        const recentLeads = this.leads.slice(0, 5);
        const execNames = { sarah: 'Sarah Johnson', mike: 'Mike Chen', emily: 'Emily Davis', james: 'James Wilson' };

        document.getElementById('recentLeadsTable').innerHTML = recentLeads.map(l => {
            const scoreClass = l.score >= 70 ? 'score-high' : l.score >= 40 ? 'score-medium' : 'score-low';
            const stageColor = this.getStageColor(l.status);
            const stageName = this.getStageName(l.status);
            return `<tr>
                <td><strong>${l.contactPerson}</strong></td>
                <td>${l.companyName}</td>
                <td><span class="status-badge" style="background:${stageColor}20;color:${stageColor}">${stageName}</span></td>
                <td><span class="score-badge ${scoreClass}">${l.score}</span></td>
                <td>${this.formatCurrency(l.budget)}</td>
            </tr>`;
        }).join('');

        const topLeads = [...this.leads].sort((a, b) => b.score - a.score).slice(0, 5);
        document.getElementById('leadScoreList').innerHTML = topLeads.map(l => {
            const scoreClass = l.score >= 70 ? 'score-high' : l.score >= 40 ? 'score-medium' : 'score-low';
            return `<div class="lead-score-item">
                <div class="lead-score-info"><div class="lead-score-name">${l.contactPerson}</div><div class="lead-score-company">${l.companyName}</div></div>
                <span class="score-badge ${scoreClass}">${l.score}</span>
            </div>`;
        }).join('');

        const perfData = [
            { name: 'Sarah Johnson', role: 'Senior Executive', leads: 45, rate: '72%', color: 'bg-pink', initials: 'SJ' },
            { name: 'Mike Chen', role: 'Sales Executive', leads: 38, rate: '65%', color: 'bg-blue', initials: 'MC' },
            { name: 'Emily Davis', role: 'Sales Executive', leads: 42, rate: '58%', color: 'bg-green', initials: 'ED' },
            { name: 'James Wilson', role: 'Junior Executive', leads: 31, rate: '52%', color: 'bg-purple', initials: 'JW' }
        ];

        document.getElementById('performanceList').innerHTML = perfData.map(p =>
            `<div class="performance-item">
                <div class="perf-avatar ${p.color}">${p.initials}</div>
                <div class="perf-info"><span class="perf-name">${p.name}</span><span class="perf-role">${p.role}</span></div>
                <div class="perf-stats"><span class="perf-leads">${p.leads} leads</span><span class="perf-rate">${p.rate} win</span></div>
            </div>`
        ).join('');
    },

    renderReports() {
        document.getElementById('execPerformanceTable').innerHTML = [
            { name: 'Sarah Johnson', assigned: 45, won: 32, rate: '71.1%', revenue: '$584,000', cycle: '28 days', rating: '★★★★★' },
            { name: 'Mike Chen', assigned: 38, won: 25, rate: '65.8%', revenue: '$462,000', cycle: '32 days', rating: '★★★★☆' },
            { name: 'Emily Davis', assigned: 42, won: 24, rate: '57.1%', revenue: '$441,000', cycle: '35 days', rating: '★★★★☆' },
            { name: 'James Wilson', assigned: 31, won: 16, rate: '51.6%', revenue: '$294,000', cycle: '38 days', rating: '★★★☆☆' }
        ].map(e =>
            `<tr><td><strong>${e.name}</strong></td><td>${e.assigned}</td><td>${e.won}</td><td><span class="text-green">${e.rate}</span></td><td>${e.revenue}</td><td>${e.cycle}</td><td style="color:var(--warning)">${e.rating}</td></tr>`
        ).join('');

        const funnelSteps = [
            { label: 'Total Leads', value: '248', width: '100%', color: '#3b82f6' },
            { label: 'Contacted', value: '186', width: '82%', color: '#8b5cf6' },
            { label: 'Qualified', value: '124', width: '65%', color: '#f97316' },
            { label: 'Proposal Sent', value: '89', width: '48%', color: '#06b6d4' },
            { label: 'Negotiation', value: '52', width: '32%', color: '#f59e0b' },
            { label: 'Won', value: '38', width: '20%', color: '#10b981' }
        ];

        document.getElementById('conversionFunnel').innerHTML = funnelSteps.map(s =>
            `<div class="funnel-step" style="width:${s.width};background:${s.color}">${s.label}<span style="position:absolute;right:-60px;font-size:12px;font-weight:600">${s.value}</span></div>`
        ).join('');
    },

    initCharts() {
        setTimeout(() => {
            this.createLeadTrendsChart();
            this.createLeadSourcesChart();
            this.createRevenueChart();
            this.createStatusChart();
            this.createSourcesPieChart();
        }, 300);
    },

    createLeadTrendsChart() {
        const ctx = document.getElementById('leadTrendsChart');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                    { label: 'New Leads', data: [45, 52, 68, 72, 85, 78, 92, 88, 95, 102, 89, 110], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3 },
                    { label: 'Won Leads', data: [12, 15, 22, 18, 28, 24, 32, 26, 35, 30, 28, 38], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } } }
        });
    },

    createLeadSourcesChart() {
        const ctx = document.getElementById('leadSourcesChart');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'bar',
            data: { labels: ['Website', 'Referral', 'Ads', 'Social', 'Cold Call'], datasets: [{ label: 'Leads', data: [68, 52, 45, 38, 45], backgroundColor: ['#6366f1', '#10b981', '#f97316', '#8b5cf6', '#06b6d4'], borderRadius: 8, barThickness: 40 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } } }
        });
    },

    createRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'bar',
            data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], datasets: [{ label: 'Revenue', data: [42000, 55000, 48000, 72000, 65000, 84000, 78000, 92000, 85000, 98000, 88000, 110000], backgroundColor: 'rgba(99,102,241,0.8)', borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: v => '$' + (v / 1000) + 'K' } }, x: { grid: { display: false } } } }
        });
    },

    createStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'], datasets: [{ data: [35, 28, 20, 15, 12, 38, 10], backgroundColor: ['#06b6d4', '#3b82f6', '#8b5cf6', '#f97316', '#f59e0b', '#10b981', '#ef4444'], borderWidth: 0, spacing: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { usePointStyle: true, padding: 12, font: { size: 12 } } } } }
        });
    },

    createSourcesPieChart() {
        const ctx = document.getElementById('sourcesPieChart');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'pie',
            data: { labels: ['Website', 'Referral', 'Ads', 'Social Media', 'Cold Call'], datasets: [{ data: [68, 52, 45, 38, 45], backgroundColor: ['#6366f1', '#10b981', '#f97316', '#8b5cf6', '#06b6d4'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { usePointStyle: true, padding: 12, font: { size: 12 } } } } }
        });
    },

    initCalendar() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        let html = days.map(d => `<div class="calendar-day-header">${d}</div>`).join('');
        for (let i = 0; i < firstDay; i++) {
            const prevDay = new Date(today.getFullYear(), today.getMonth(), -firstDay + i + 1).getDate();
            html += `<div class="calendar-day other-month">${prevDay}</div>`;
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === today.getDate();
            const hasEvent = [5, 12, 18, 24].includes(d);
            html += `<div class="calendar-day${isToday ? ' today' : ''}${hasEvent ? ' has-event' : ''}">${d}</div>`;
        }
        const remaining = 42 - (firstDay + daysInMonth);
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="calendar-day other-month">${i}</div>`;
        }
        grid.innerHTML = html;
    },

    initFormBuilder() {
        const area = document.getElementById('formbuilderArea');
        if (!area) return;

        area.addEventListener('dragover', (e) => { e.preventDefault(); area.style.borderColor = 'var(--primary)'; });
        area.addEventListener('dragleave', () => { area.style.borderColor = ''; });
        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.style.borderColor = '';
            const type = e.dataTransfer.getData('text/plain');
            if (type) {
                const field = document.createElement('div');
                field.className = 'formbuilder-field';
                field.draggable = true;
                const labels = { text: 'Text Input', email: 'Email', tel: 'Phone', number: 'Number', textarea: 'Textarea', select: 'Dropdown', radio: 'Radio', checkbox: 'Checkbox', date: 'Date', file: 'File Upload' };
                const inputTypes = { text: 'text', email: 'email', tel: 'tel', number: 'number', date: 'date', file: 'file' };
                let input = '';
                if (inputTypes[type]) input = `<input type="${inputTypes[type]}" placeholder="Enter ${labels[type]}" disabled>`;
                else if (type === 'textarea') input = `<textarea placeholder="Enter text" disabled></textarea>`;
                else if (type === 'select') input = `<select disabled><option>Select option</option></select>`;
                else if (type === 'radio') input = `<div style="display:flex;gap:12px"><label style="font-size:13px"><input type="radio" disabled> Option 1</label><label style="font-size:13px"><input type="radio" disabled> Option 2</label></div>`;
                else if (type === 'checkbox') input = `<label style="font-size:13px"><input type="checkbox" disabled> Option 1</label>`;

                field.innerHTML = `<div class="field-drag"><i class="fas fa-grip-vertical"></i></div><div class="field-config"><label>${labels[type] || 'Field'}</label>${input}</div><button class="field-remove" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
                area.appendChild(field);
                App.showToast('Field added', 'success');
            }
        });

        document.querySelectorAll('.palette-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.type);
            });
        });

        document.querySelectorAll('.field-remove').forEach(btn => {
            btn.addEventListener('click', () => btn.parentElement.remove());
        });
    },

    initOfflineDetection() {
        window.addEventListener('online', () => {
            document.getElementById('offlineIndicator').classList.remove('show');
            this.showToast('Back online', 'success');
        });
        window.addEventListener('offline', () => {
            document.getElementById('offlineIndicator').classList.add('show');
        });
    },

    initTouchGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        const sidebar = document.getElementById('sidebar');

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });

        document.querySelectorAll('.pipeline-container').forEach(container => {
            let isDown = false;
            let startX;
            let scrollLeft;

            container.addEventListener('mousedown', (e) => {
                isDown = true;
                startX = e.pageX - container.offsetLeft;
                scrollLeft = container.scrollLeft;
            });

            container.addEventListener('mouseleave', () => { isDown = false; });
            container.addEventListener('mouseup', () => { isDown = false; });
            container.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - container.offsetLeft;
                const walk = (x - startX) * 2;
                container.scrollLeft = scrollLeft - walk;
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSidebar();
                document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
                document.getElementById('notifPanel')?.classList.remove('show');
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 991) {
                this.closeSidebar();
            }
        });
    },

    handleSwipe(startX, endX) {
        const diff = startX - endX;
        const threshold = 80;

        if (window.innerWidth <= 991) {
            if (diff < -threshold && startX < 50) {
                this.openSidebar();
            } else if (diff > threshold) {
                this.closeSidebar();
            }
        }
    },

    closeModal(id) {
        document.getElementById(id)?.classList.remove('show');
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const colors = { success: 'bg-green', error: 'bg-red', info: 'bg-blue', warning: 'bg-orange' };
        const icons = { success: 'check-circle', error: 'times-circle', info: 'info-circle', warning: 'exclamation-triangle' };

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon ${colors[type]}"><i class="fas fa-${icons[type]}"></i></div>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
