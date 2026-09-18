/**
 * Interactive SVG Mindmap Builder (Woordspin Studio)
 * Implements the 7 Golden Rules for Mindmapping - Volcano Edition for Brugklas
 */

class MindmapStudio {
    constructor() {
        this.centerNode = {
            id: 'center',
            text: 'Vulkanen',
            icon: '🌋',
            x: 500,
            y: 325
        };

        this.branches = [];
        this.selectedNodeId = 'center';
        this.editingNode = null;
        this.rulesCollapsed = false;
        this.moreToolbarCollapsed = true;
        
        // Color Palette for branches (Rule 6)
        this.palette = [
            '#ef4444', // 1 o'clock - Red
            '#ea580c', // 3 o'clock - Orange
            '#0284c7', // 6 o'clock - Sky Blue
            '#10b981', // 9 o'clock - Emerald Green
            '#8b5cf6', // 11 o'clock - Purple
        ];

        this.dragState = null;
    }

    init() {
        this.svg = document.getElementById('mindmap-svg');
        this.svgConnections = document.getElementById('svg-connections');
        this.svgNodes = document.getElementById('svg-nodes');
        
        if (!this.svg) return;

        this.setupEventListeners();
        this.setupIconGridPicker();
        this.loadPresetTekststructuur();
    }

    setupEventListeners() {
        this.svg.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', () => this.handleMouseUp());

        // Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                this.deleteSelectedNode();
            } else if (e.key === 'Insert' || e.key === '+') {
                this.addSubBranch();
            }
        });

        // Close icon picker panel when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.querySelector('.icon-picker-dropdown');
            if (dropdown && !dropdown.contains(e.target)) {
                this.closeIconPicker();
            }
        });
    }

    /* COLLAPSIBLE TOOLBAR LOGIC */
    toggleRulesCollapse() {
        this.rulesCollapsed = !this.rulesCollapsed;
        const container = document.getElementById('rules-badge-container');
        const icon = document.getElementById('rules-toggle-icon');

        if (container) {
            container.style.display = this.rulesCollapsed ? 'none' : 'flex';
        }
        if (icon) {
            icon.className = this.rulesCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
        }
    }

    toggleMoreToolbar() {
        this.moreToolbarCollapsed = !this.moreToolbarCollapsed;
        const panel = document.getElementById('collapsible-toolbar-panel');
        const label = document.getElementById('more-btn-label');

        if (panel) {
            panel.style.display = this.moreToolbarCollapsed ? 'none' : 'flex';
        }
        if (label) {
            label.textContent = this.moreToolbarCollapsed ? 'Meer Opties ▼' : 'Minder Opties ▲';
        }
    }

    // Default Preset: Complete Mindmap about "Vulkanen"
    loadPresetTekststructuur() {
        this.centerNode = { id: 'center', text: 'Vulkanen', icon: '🌋', x: 500, y: 325 };
        
        this.branches = [
            {
                id: 'b1',
                text: 'Krater',
                icon: '🔥',
                color: '#ef4444',
                angle: 30,
                distance: 180,
                x: 660,
                y: 200,
                subbranches: [
                    { id: 'sb1_2', text: 'Lava', icon: '🔥', x: 800, y: 200 }
                ]
            },
            {
                id: 'b2',
                text: 'Uitbarsting',
                icon: '💥',
                color: '#ea580c',
                angle: 110,
                distance: 190,
                x: 660,
                y: 430,
                subbranches: [
                    { id: 'sb2_1', text: 'pyroclastische wolk', icon: '💨', x: 810, y: 410 },
                    { id: 'sb2_2', text: 'Aswolken', icon: '☁️', x: 790, y: 490 }
                ]
            },
            {
                id: 'b3',
                text: 'Typen',
                icon: '⛰️',
                color: '#0284c7',
                angle: 210,
                distance: 190,
                x: 340,
                y: 440,
                subbranches: [
                    { id: 'sb3_1', text: 'Schildvulkaan', icon: '🛡️', x: 190, y: 480 },
                    { id: 'sb3_2', text: 'Stratovulkaan', icon: '🌋', x: 200, y: 400 }
                ]
            },
            {
                id: 'b4',
                text: 'Nut & Gevaar',
                icon: '🌱',
                color: '#10b981',
                angle: 310,
                distance: 180,
                x: 330,
                y: 200,
                subbranches: [
                    { id: 'sb4_1', text: 'Vruchtbaar', icon: '🌾', x: 180, y: 160 },
                    { id: 'sb4_2', text: 'Energie', icon: '⚡', x: 190, y: 240 }
                ]
            }
        ];

        this.render();
        this.syncToolbarWithSelection();
        this.updateRulesChecker();
        if (window.app) window.app.saveAnswers();
    }

    startEmptyMindmap() {
        if (confirm('Wil je een lege mindmap starten? Je kunt daarna zelf alle takken en trefwoorden toevoegen!')) {
            const topic = prompt('Wat is het centrale onderwerp van jouw mindmap?', 'Mijn Onderwerp');
            this.centerNode = { id: 'center', text: topic || 'Mijn Mindmap', icon: '🧠', x: 500, y: 325 };
            this.branches = [];
            this.selectedNodeId = 'center';

            this.addMainBranch();
            this.render();
            this.syncToolbarWithSelection();
            this.updateRulesChecker();
            if (window.app) window.app.saveAnswers();
        }
    }

    addMainBranch() {
        const count = this.branches.length;
        const color = this.palette[count % this.palette.length];
        
        const angleDeg = (30 + count * 72) % 360;
        const rad = (angleDeg * Math.PI) / 180;
        const dist = 180;

        const x = this.centerNode.x + Math.cos(rad) * dist;
        const y = this.centerNode.y + Math.sin(rad) * dist;

        const newBranch = {
            id: 'b_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            text: 'Hoofdtak',
            icon: '📌',
            color: color,
            angle: angleDeg,
            distance: dist,
            x: Math.round(x),
            y: Math.round(y),
            subbranches: []
        };

        this.branches.push(newBranch);
        this.selectedNodeId = newBranch.id;
        this.render();
        this.syncToolbarWithSelection();
        this.updateRulesChecker();

        if (window.app) window.app.saveAnswers();
    }

    addBranchForSelected() {
        if (this.selectedNodeId === 'center') {
            this.addMainBranch();
        } else {
            this.addSubBranch();
        }
    }

    addSubBranch() {
        const selected = this.findNode(this.selectedNodeId);
        if (!selected || selected.type === 'center') {
            this.addMainBranch();
            return;
        }

        const targetNode = selected.node;
        if (!targetNode.subbranches) {
            targetNode.subbranches = [];
        }

        const subCount = targetNode.subbranches.length;
        
        // Calculate offset outwards from parent node
        const dirX = targetNode.x >= this.centerNode.x ? 1 : -1;
        const offsetX = dirX * (selected.depth >= 2 ? 110 : 130);
        const offsetY = (subCount - 0.5) * 45;

        const newSub = {
            id: 'sb_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            text: 'Subtak',
            icon: '📌',
            x: Math.round(targetNode.x + offsetX),
            y: Math.round(targetNode.y + offsetY),
            subbranches: []
        };

        targetNode.subbranches.push(newSub);
        this.selectedNodeId = newSub.id;
        this.render();
        this.syncToolbarWithSelection();
        this.updateRulesChecker();

        if (window.app) window.app.saveAnswers();
    }

    deleteSelectedNode() {
        if (this.selectedNodeId === 'center') {
            if (confirm('Wil je de hele mindmap wissen om met een leeg vel te beginnen?')) {
                this.branches = [];
                this.selectedNodeId = 'center';
                this.render();
                this.syncToolbarWithSelection();
                this.updateRulesChecker();
                if (window.app) window.app.saveAnswers();
            }
            return;
        }

        // Recursive node deletion helper
        const removeRecursive = (list) => {
            for (let i = 0; i < list.length; i++) {
                if (list[i].id === this.selectedNodeId) {
                    list.splice(i, 1);
                    return true;
                }
                if (list[i].subbranches && removeRecursive(list[i].subbranches)) {
                    return true;
                }
            }
            return false;
        };

        if (removeRecursive(this.branches)) {
            this.selectedNodeId = 'center';
            this.render();
            this.syncToolbarWithSelection();
            this.updateRulesChecker();
            if (window.app) window.app.saveAnswers();
        }
    }

    updateCenterTitle(text) {
        this.centerNode.text = text || 'Onderwerp';
        this.render();
        this.updateRulesChecker();
        if (window.app) window.app.saveAnswers();
    }

    updateCenterIcon(icon) {
        this.centerNode.icon = icon;
        this.render();
        if (window.app) window.app.saveAnswers();
    }

    // LIVE TOOLBAR & FLOATING INPUT TEXT EDITING
    updateSelectedNodeText(val) {
        const found = this.findNode(this.selectedNodeId);
        if (found && found.node) {
            found.node.text = val;
            this.render();
            this.updateRulesChecker();
            
            const topInput = document.getElementById('mm-node-text-input');
            const floatInput = document.getElementById('floating-edit-input');

            if (topInput && topInput !== document.activeElement) topInput.value = val;
            if (floatInput && floatInput !== document.activeElement) floatInput.value = val;

            if (window.app) window.app.saveAnswers();
        }
    }

    /* VISUAL GRID ICON PICKER ENGINE (4 Icons Per Row) */
    setupIconGridPicker() {
        const container = document.getElementById('icon-grid-container');
        if (!container) return;

        container.innerHTML = '';
        const ALL_ICONS = [
            // Core & Vulkanen / Aardrijkskunde
            '📌', '🌋', '🧠', '📖', '🌍', '🔥', '💥', '💨', '⛰️', '🌱',
            '⚡', '⚠️', '☁️', '🛡️', '🌾', '💧', '🏔️', '☀️', '🌧️', '❄️',
            '🌊', '🪨', '🌪️', '🌿', '🍁', '🍎', '🏠', '🚜', '🏭', '🚗',
            '✈️', '🚢', '📡', '💣', '🆘', '❓', '❗', '➕', '➖', '❌',
            '✅', '🔔', '🔑', '🎁', '💎', '⏳', '👁️', '📢', '⭐', '💡',
            '🎯', '🚀', '🔬', '🏛️', '🗺️', '🌲', '🎨', '🔍', '📝', '🏆',
            '💬', '🍀', '🧭', '🎒', '🏫', '⚙️',
            
            // Dieren (Animals)
            '🐶', '🐱', '🦁', '🐯', '🐻', '🐼', '🐨', '🦊', '🐰', '🐸',
            '🐵', '🐧', '🦅', '🦉', '🦇', '🐴', '🦄', '🐝', '🦋', '🐢',
            '🐍', '🦖', '🐙', '🐬', '🐋', '🦈', '🐘', '🦒', '🦩', '🦚',
            '🐺', '🐗', '🐜', '🐞', '🦀', '🦐', '🐊', '🦍', '🦛', '🐪',

            // Sport & Spel (Sports & Games)
            '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🏓', '🏸', '🏒',
            '🥊', '🛹', '⛷️', '🏂', '🏋️', '🚴', '🏊', '🧗', '🥋', '🥏',
            '🥇', '🥈', '🥉', '🏅', '🎲', '🎮', '♟️', '🎳', '🎯', '🏹',

            // Vrije Tijd, School & Eten (Hobbies, School & Food)
            '🎤', '🎧', '🎸', '🎹', '🎬', '🍿', '🍕', '🍦', '🍔', '🍟',
            '⛵', '🏕️', '📷', '💻', '📱', '⏰', '👑', '🔮', '🎈', '🚲'
        ];

        ALL_ICONS.forEach(icon => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'icon-grid-item';
            item.textContent = icon;
            item.setAttribute('data-icon', icon);
            item.onclick = (e) => {
                e.stopPropagation();
                this.selectGridIcon(icon);
            };
            container.appendChild(item);
        });
    }

    toggleIconPicker(e) {
        if (e) e.stopPropagation();
        const panel = document.getElementById('icon-picker-panel');
        if (panel) {
            const isHidden = panel.style.display === 'none' || !panel.style.display;
            panel.style.display = isHidden ? 'block' : 'none';
        }
    }

    closeIconPicker() {
        const panel = document.getElementById('icon-picker-panel');
        if (panel) panel.style.display = 'none';
    }

    selectGridIcon(icon) {
        this.changeNodeIcon(icon);
        this.closeIconPicker();
    }

    syncToolbarWithSelection() {
        const found = this.findNode(this.selectedNodeId);
        const topInput = document.getElementById('mm-node-text-input');
        const colorInput = document.getElementById('mm-node-color');
        const iconTriggerCurrent = document.getElementById('icon-picker-current');
        const floatToolbar = document.getElementById('canvas-floating-node-toolbar');
        const floatInput = document.getElementById('floating-edit-input');
        const floatAddBtn = document.getElementById('floating-add-btn');
        const floatAddLabel = document.getElementById('floating-add-label');
        const floatDelBtn = document.getElementById('floating-del-btn');
        const wrapper = document.getElementById('mindmap-canvas-container');

        if (found && found.node) {
            if (topInput) topInput.value = found.node.text || '';
            if (found.branch && colorInput) colorInput.value = found.branch.color || '#ef4444';
            
            // Sync Icon Picker Trigger text and active grid highlights
            if (iconTriggerCurrent) {
                iconTriggerCurrent.textContent = found.node.icon || '🚫';
            }

            document.querySelectorAll('.icon-grid-item').forEach(item => {
                const iconVal = item.getAttribute('data-icon');
                if (found.node.icon && iconVal === found.node.icon) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Dynamic floating toolbar labels based on node type (center vs branch vs subbranch)
            if (found.type === 'center') {
                if (floatAddLabel) floatAddLabel.textContent = ' Hoofdtak';
                if (floatAddBtn) floatAddBtn.title = 'Voeg een hoofdtak toe';
                if (floatDelBtn) floatDelBtn.title = 'Wis de hele mindmap (leeg vel)';
            } else {
                if (floatAddLabel) floatAddLabel.textContent = ' Subtak';
                if (floatAddBtn) floatAddBtn.title = 'Voeg een subtak toe';
                if (floatDelBtn) floatDelBtn.title = 'Verwijder deze tak';
            }

            if (floatToolbar && wrapper && this.svg) {
                const svgRect = this.svg.getBoundingClientRect();
                const scaleX = svgRect.width / 1000;
                const scaleY = svgRect.height / 650;

                const posX = found.node.x * scaleX;
                const posY = (found.node.y - 45) * scaleY;

                floatToolbar.style.display = 'flex';
                floatToolbar.style.left = `${posX}px`;
                floatToolbar.style.top = `${posY}px`;

                if (floatInput) floatInput.value = found.node.text || '';
            }
        } else {
            if (floatToolbar) floatToolbar.style.display = 'none';
        }
    }

    changeNodeColor(color) {
        const selected = this.findNode(this.selectedNodeId);
        if (selected && selected.branch) {
            selected.branch.color = color;
            this.render();
            this.updateRulesChecker();
            if (window.app) window.app.saveAnswers();
        }
    }

    changeNodeIcon(icon) {
        const selected = this.findNode(this.selectedNodeId);
        if (selected && selected.node) {
            selected.node.icon = icon;
            this.render();
            this.updateRulesChecker();
            if (window.app) window.app.saveAnswers();
        }
    }

    /* RECURSIVE NODE SEARCH ENGINE */
    findNode(id, nodes = null, parentBranch = null, depth = 0) {
        if (id === 'center') return { node: this.centerNode, type: 'center', depth: 0 };

        const currentList = nodes || this.branches;
        for (let b of currentList) {
            const currentBranch = parentBranch || b;
            if (b.id === id) {
                return { 
                    node: b, 
                    branch: currentBranch, 
                    parent: parentBranch, 
                    type: depth === 0 ? 'main' : 'sub',
                    depth: depth + 1
                };
            }
            if (b.subbranches && b.subbranches.length > 0) {
                const found = this.findNode(id, b.subbranches, currentBranch, depth + 1);
                if (found) return found;
            }
        }
        return null;
    }

    resetCanvas() {
        if (confirm('Weet je zeker dat je de Vulkanen mindmap wilt herstellen?')) {
            this.loadPresetTekststructuur();
        }
    }

    exportState() {
        return {
            centerNode: JSON.parse(JSON.stringify(this.centerNode)),
            branches: JSON.parse(JSON.stringify(this.branches))
        };
    }

    importState(state) {
        if (!state) return;
        const center = state.centerNode || state.center || { id: 'center', text: 'Vulkanen', icon: '🌋', x: 500, y: 325 };
        const branches = state.branches || (Array.isArray(state) ? state : []);

        this.centerNode = JSON.parse(JSON.stringify(center));
        this.branches = JSON.parse(JSON.stringify(branches));
        this.selectedNodeId = 'center';
        
        this.render();
        this.syncToolbarWithSelection();
        this.updateRulesChecker();

        const centerInput = document.getElementById('mm-center-title');
        const centerIcon = document.getElementById('mm-center-icon');
        if (centerInput) centerInput.value = this.centerNode.text || '';
        if (centerIcon) centerIcon.value = this.centerNode.icon || '🌋';
    }

    /* INLINE TYPING EDITOR OVERLAY */
    editSelectedNodeText() {
        const found = this.findNode(this.selectedNodeId);
        if (found) {
            this.startInlineEdit(found.node);
        }
    }

    startInlineEdit(node) {
        const overlay = document.getElementById('node-inline-editor');
        const input = document.getElementById('inline-edit-input');
        const wrapper = document.getElementById('mindmap-canvas-container');

        if (!overlay || !input || !wrapper) return;

        this.editingNode = node;
        
        const svgRect = this.svg.getBoundingClientRect();
        const scaleX = svgRect.width / 1000;
        const scaleY = svgRect.height / 650;

        const posX = node.x * scaleX;
        const posY = node.y * scaleY;

        overlay.style.display = 'block';
        overlay.style.left = `${posX}px`;
        overlay.style.top = `${posY}px`;

        input.value = node.text;
        input.focus();
        input.select();
    }

    commitInlineEdit() {
        const input = document.getElementById('inline-edit-input');
        const overlay = document.getElementById('node-inline-editor');

        if (this.editingNode && input) {
            const val = input.value.trim();
            if (val !== '') {
                this.editingNode.text = val;
            }
            this.editingNode = null;
            this.render();
            this.syncToolbarWithSelection();
            this.updateRulesChecker();
            
            if (window.app) window.app.saveAnswers();
        }

        if (overlay) overlay.style.display = 'none';
    }

    handleInlineEditKey(e) {
        if (e.key === 'Enter') {
            this.commitInlineEdit();
        } else if (e.key === 'Escape') {
            this.editingNode = null;
            const overlay = document.getElementById('node-inline-editor');
            if (overlay) overlay.style.display = 'none';
        }
    }

    /* RECURSIVE RENDER ENGINE (SVG Bezier Curves + Multi-level Nested Nodes) */
    render() {
        if (!this.svgConnections || !this.svgNodes) return;

        this.svgConnections.innerHTML = '';
        this.svgNodes.innerHTML = '';

        // Recursive tree rendering helper for nested subbranches of any depth
        const renderTree = (nodeList, parentNode, mainColor, depth = 2) => {
            nodeList.forEach(node => {
                const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const subMidX = (parentNode.x + node.x) / 2;
                const subMidY = (parentNode.y + node.y) / 2;
                const strokeW = Math.max(1.5, 4 - depth * 0.8);
                const subD = `M ${parentNode.x} ${parentNode.y} Q ${subMidX} ${subMidY} ${node.x} ${node.y}`;

                pathEl.setAttribute('d', subD);
                pathEl.setAttribute('stroke', mainColor || '#ef4444');
                pathEl.setAttribute('stroke-width', strokeW.toString());
                pathEl.setAttribute('stroke-linecap', 'round');
                pathEl.setAttribute('fill', 'none');
                pathEl.setAttribute('class', 'mm-branch-path');
                this.svgConnections.appendChild(pathEl);

                this.renderNode(node, 'sub', mainColor, node.id === this.selectedNodeId);

                if (node.subbranches && node.subbranches.length > 0) {
                    renderTree(node.subbranches, node, mainColor, depth + 1);
                }
            });
        };

        // 1. Render Connections & Main Branches
        this.branches.forEach(branch => {
            const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            const midX = (this.centerNode.x + branch.x) / 2;
            const midY = (this.centerNode.y + branch.y) / 2;
            const ctrlX = midX + (branch.y - this.centerNode.y) * 0.2;
            const ctrlY = midY - (branch.x - this.centerNode.x) * 0.2;

            const d = `M ${this.centerNode.x} ${this.centerNode.y} Q ${ctrlX} ${ctrlY} ${branch.x} ${branch.y}`;
            
            pathEl.setAttribute('d', d);
            pathEl.setAttribute('stroke', branch.color || '#ef4444');
            pathEl.setAttribute('stroke-width', '8');
            pathEl.setAttribute('stroke-linecap', 'round');
            pathEl.setAttribute('fill', 'none');
            pathEl.setAttribute('class', 'mm-branch-path');
            this.svgConnections.appendChild(pathEl);

            if (branch.subbranches && branch.subbranches.length > 0) {
                renderTree(branch.subbranches, branch, branch.color, 2);
            }
        });

        // 2. Render Center Node
        this.renderNode(this.centerNode, 'center', '#ef4444', this.selectedNodeId === 'center');

        // 3. Render Main Nodes
        this.branches.forEach(b => {
            this.renderNode(b, 'main', b.color, b.id === this.selectedNodeId);
        });
    }

    renderNode(node, type, color, isSelected) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        group.setAttribute('class', `mm-node mm-${type}-node ${isSelected ? 'selected' : ''}`);
        group.setAttribute('data-id', node.id);

        const textStr = (node.icon ? node.icon + ' ' : '') + node.text;
        const fontPx = type === 'center' ? 18 : (type === 'main' ? 14 : 12);
        const paddingX = type === 'center' ? 24 : 16;
        const paddingY = type === 'center' ? 14 : 9;

        const textLen = textStr.length * (fontPx * 0.6);
        const rectW = Math.max(textLen + paddingX * 2, type === 'center' ? 140 : 90);
        const rectH = fontPx + paddingY * 2;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', -rectW / 2);
        rect.setAttribute('y', -rectH / 2);
        rect.setAttribute('width', rectW);
        rect.setAttribute('height', rectH);
        rect.setAttribute('rx', rectH / 2);
        rect.setAttribute('fill', type === 'center' ? '#fee2e2' : '#ffffff');
        rect.setAttribute('stroke', color || '#ef4444');
        rect.setAttribute('stroke-width', isSelected ? '4' : (type === 'center' ? '3' : '2'));
        if (type !== 'center') {
            rect.setAttribute('filter', 'url(#shadow)');
        }

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 0);
        text.setAttribute('y', fontPx * 0.35);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', fontPx);
        text.setAttribute('fill', type === 'center' ? '#991b1b' : '#0f172a');
        text.setAttribute('font-weight', '700');
        text.textContent = textStr;

        group.appendChild(rect);
        group.appendChild(text);

        // Single Click -> Select & Sync Floating & Top Toolbar
        group.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectedNodeId = node.id;
            this.render();
            this.syncToolbarWithSelection();
        });

        // Double Click -> Focus floating input directly
        group.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.selectedNodeId = node.id;
            this.render();
            this.syncToolbarWithSelection();

            const floatInput = document.getElementById('floating-edit-input');
            if (floatInput) {
                floatInput.focus();
                floatInput.select();
            }
        });

        this.svgNodes.appendChild(group);
    }

    /* DRAG AND DROP ENGINE */
    handleMouseDown(e) {
        const targetGroup = e.target.closest('.mm-node');
        if (targetGroup) {
            const id = targetGroup.getAttribute('data-id');
            const found = this.findNode(id);
            if (found) {
                this.selectedNodeId = id;
                this.dragState = {
                    node: found.node,
                    startX: e.clientX,
                    startY: e.clientY,
                    origX: found.node.x,
                    origY: found.node.y
                };
                this.render();
                this.syncToolbarWithSelection();
            }
        }
    }

    handleMouseMove(e) {
        if (!this.dragState) return;

        const dx = e.clientX - this.dragState.startX;
        const dy = e.clientY - this.dragState.startY;

        this.dragState.node.x = this.dragState.origX + dx;
        this.dragState.node.y = this.dragState.origY + dy;

        this.render();
        this.syncToolbarWithSelection();
    }

    handleMouseUp() {
        if (this.dragState) {
            this.dragState = null;
            this.updateRulesChecker();
            if (window.app) window.app.saveAnswers();
        }
    }

    /* ALL 7 RULES CHECKER REAL-TIME RECURSIVE FEEDBACK */
    updateRulesChecker() {
        const check1 = document.getElementById('check-r1');
        const check2 = document.getElementById('check-r2');
        const check3 = document.getElementById('check-r3');
        const check4 = document.getElementById('check-r4');
        const check5 = document.getElementById('check-r5');
        const check6 = document.getElementById('check-r6');
        const check7 = document.getElementById('check-r7');

        if (!check1) return;

        check1.className = 'rule-badge ' + (this.centerNode.text ? 'pass' : 'fail');
        check2.className = 'rule-badge ' + (this.branches.length > 0 ? 'pass' : 'fail');

        let maxWordPass = true;
        let totalSubbranches = 0;
        let iconCount = 0;

        const checkRecursive = (list) => {
            list.forEach(node => {
                if (node.text && node.text.split(' ').length > 3) maxWordPass = false;
                if (node.icon) iconCount++;
                if (node.subbranches && node.subbranches.length > 0) {
                    totalSubbranches += node.subbranches.length;
                    checkRecursive(node.subbranches);
                }
            });
        };

        this.branches.forEach(b => {
            if (b.text && b.text.split(' ').length > 3) maxWordPass = false;
            if (b.icon) iconCount++;
            if (b.subbranches && b.subbranches.length > 0) {
                totalSubbranches += b.subbranches.length;
                checkRecursive(b.subbranches);
            }
        });

        check3.className = 'rule-badge ' + (maxWordPass ? 'pass' : 'fail');
        check3.innerHTML = maxWordPass ? '<i class="fa-solid fa-check"></i> 3. Max 1 Woord/Tak' : '<i class="fa-solid fa-triangle-exclamation"></i> 3. Te veel woorden!';

        if (check4) {
            check4.className = 'rule-badge ' + (totalSubbranches > 0 ? 'pass' : 'fail');
        }

        check5.className = 'rule-badge ' + (this.branches.length >= 2 ? 'pass' : 'fail');

        const colors = new Set(this.branches.map(b => b.color));
        check6.className = 'rule-badge ' + (colors.size >= Math.min(this.branches.length, 3) ? 'pass' : 'fail');

        check7.className = 'rule-badge ' + (iconCount > 0 ? 'pass' : 'fail');
    }
}

// Global Mindmap Instance attached explicitly to window object
const mindmapApp = new MindmapStudio();
window.mindmapApp = mindmapApp;

document.addEventListener('DOMContentLoaded', () => {
    mindmapApp.init();
});
