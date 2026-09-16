/**
 * Application Controller for Kernzinnen & Mindmapping Web App (Brugklas Vulkanen Edition)
 * Includes Save Progress & Upload/Resume functionality for both JSON and PDF files
 */

class AppController {
    constructor() {
        this.activeHighlightColor = 'kernzin';
        this.studentInfo = { name: '', class: '' };
        this.answers = {};
    }

    init() {
        this.loadSavedData();
        this.setupTextHighlighter();
    }

    /* Tab Switching */
    switchTab(tabId) {
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));

        const targetPane = document.getElementById(tabId);
        const targetTab = document.querySelector(`[data-tab="${tabId}"]`);

        if (targetPane) targetPane.classList.add('active');
        if (targetTab) targetTab.classList.add('active');

        // Re-render mindmap if entering tab 3
        if (tabId === 'tab-mindmap-maker' && window.mindmapApp) {
            setTimeout(() => window.mindmapApp.render(), 50);
        }
    }

    /* Student Info Management */
    saveStudentInfo() {
        const nameInput = document.getElementById('student-name');
        const classInput = document.getElementById('student-class');

        this.studentInfo = { 
            name: nameInput ? nameInput.value : '', 
            class: classInput ? classInput.value : '' 
        };
        localStorage.setItem('mm_student_info', JSON.stringify(this.studentInfo));
    }

    loadSavedData() {
        // 1. Student Info
        const savedInfo = localStorage.getItem('mm_student_info');
        if (savedInfo) {
            try {
                this.studentInfo = JSON.parse(savedInfo);
                if (document.getElementById('student-name')) document.getElementById('student-name').value = this.studentInfo.name || '';
                if (document.getElementById('student-class')) document.getElementById('student-class').value = this.studentInfo.class || '';
            } catch (e) {}
        }

        // 2. Answers
        const savedAns = localStorage.getItem('mm_answers');
        if (savedAns) {
            try {
                this.answers = JSON.parse(savedAns);

                ['q_par1', 'q_par2', 'q_par3', 'q_par4'].forEach(qKey => {
                    if (this.answers[qKey]) {
                        const radio = document.querySelector(`input[name="${qKey}"][value="${this.answers[qKey]}"]`);
                        if (radio) radio.checked = true;
                    }
                });

                if (this.answers.q5 && document.getElementById('q-summary-words')) document.getElementById('q-summary-words').value = this.answers.q5;
                if (this.answers.ref1 && document.getElementById('ref-q1')) document.getElementById('ref-q1').value = this.answers.ref1;
                if (this.answers.ref2 && document.getElementById('ref-q2')) document.getElementById('ref-q2').value = this.answers.ref2;
                if (this.answers.ref3 && document.getElementById('ref-q3')) document.getElementById('ref-q3').value = this.answers.ref3;
            } catch (e) {}
        }

        // 3. Highlights
        const savedHl = localStorage.getItem('mm_highlights');
        if (savedHl && document.getElementById('interactive-text-body')) {
            if (savedHl.includes('Ring van Vuur') || savedHl.includes('Eyjafjallajökull')) {
                document.getElementById('interactive-text-body').innerHTML = savedHl;
            } else {
                // Purge stale highlights from previous text version
                localStorage.removeItem('mm_highlights');
            }
        }

        // 4. Mindmap State
        const savedMm = localStorage.getItem('mm_mindmap_state');
        if (savedMm && window.mindmapApp) {
            try {
                const mmState = JSON.parse(savedMm);
                window.mindmapApp.importState(mmState);
            } catch (err) {
                console.error('Error restoring mindmap state:', err);
            }
        }
    }

    /* Text Highlighter Logic */
    setHighlightColor(color) {
        this.activeHighlightColor = color;
        document.querySelectorAll('.hl-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.hl-btn[data-color="${color}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    setupTextHighlighter() {
        const container = document.getElementById('interactive-text-body');
        if (!container) return;

        container.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            if (!selection.rangeCount || selection.isCollapsed) return;

            const range = selection.getRangeAt(0);
            if (!container.contains(range.commonAncestorContainer)) return;

            const selectedText = selection.toString().trim();
            if (selectedText.length === 0) return;

            const span = document.createElement('span');
            span.className = `hl-${this.activeHighlightColor}`;
            span.textContent = selectedText;

            range.deleteContents();
            range.insertNode(span);

            selection.removeAllRanges();
            this.saveHighlights();
        });
    }

    clearHighlights() {
        const container = document.getElementById('interactive-text-body');
        if (!container) return;

        const highlights = container.querySelectorAll('.hl-kernzin, .hl-structuur');
        highlights.forEach(hl => {
            const text = hl.textContent;
            hl.replaceWith(document.createTextNode(text));
        });

        localStorage.removeItem('mm_highlights');
    }

    saveHighlights() {
        const container = document.getElementById('interactive-text-body');
        if (container) {
            localStorage.setItem('mm_highlights', container.innerHTML);
        }
    }

    toggleAnswerModel() {
        const panel = document.getElementById('answer-model-panel');
        const btnText = document.getElementById('answer-model-btn-text');
        if (!panel) return;

        const isVisible = panel.style.display !== 'none';
        if (isVisible) {
            panel.style.display = 'none';
            if (btnText) btnText.textContent = 'Antwoordmodel Controleren';
        } else {
            panel.style.display = 'block';
            if (btnText) btnText.textContent = 'Verberg Antwoordmodel';
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            if (window.confetti) {
                confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
            }
        }
    }

    /* Answers Management */
    saveAnswers() {
        const getRadioValue = (name) => {
            const checked = document.querySelector(`input[name="${name}"]:checked`);
            return checked ? checked.value : '';
        };

        this.answers = {
            q_par1: getRadioValue('q_par1'),
            q_par2: getRadioValue('q_par2'),
            q_par3: getRadioValue('q_par3'),
            q_par4: getRadioValue('q_par4'),
            q5: document.getElementById('q-summary-words') ? document.getElementById('q-summary-words').value : '',
            ref1: document.getElementById('ref-q1') ? document.getElementById('ref-q1').value : '',
            ref2: document.getElementById('ref-q2') ? document.getElementById('ref-q2').value : '',
            ref3: document.getElementById('ref-q3') ? document.getElementById('ref-q3').value : ''
        };

        localStorage.setItem('mm_answers', JSON.stringify(this.answers));

        if (window.mindmapApp) {
            const mmState = window.mindmapApp.exportState();
            localStorage.setItem('mm_mindmap_state', JSON.stringify(mmState));
        }
    }

    downloadProgressJSON() {
        this.saveStudentInfo();
        this.saveAnswers();

        // 1. Retrieve active mindmap state directly from MindmapStudio
        let mmState = null;
        if (window.mindmapApp && typeof window.mindmapApp.exportState === 'function') {
            mmState = window.mindmapApp.exportState();
        }

        // 2. Fallback to localStorage if live export was empty or null
        if (!mmState || !mmState.centerNode || !Array.isArray(mmState.branches)) {
            const savedMm = localStorage.getItem('mm_mindmap_state');
            if (savedMm) {
                try {
                    mmState = JSON.parse(savedMm);
                } catch (e) {}
            }
        }

        // 3. Fallback default structure if no state exists yet
        if (!mmState) {
            mmState = {
                centerNode: { id: 'center', text: 'Vulkanen', icon: '🌋', x: 500, y: 325 },
                branches: []
            };
        }

        const fullData = {
            studentInfo: this.studentInfo,
            answers: this.answers,
            highlights: localStorage.getItem('mm_highlights') || '',
            mindmapState: mmState,
            mindmap: mmState,
            timestamp: new Date().toISOString()
        };

        const jsonStr = JSON.stringify(fullData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const studentClean = (this.studentInfo.name || 'Leerling').replace(/[^a-zA-Z0-9]/g, '_');
        const a = document.createElement('a');
        a.href = url;
        a.download = `Vulkanen_Leswerk_${studentClean}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (window.confetti) {
            confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
        }

        alert('Je voortgang is opgeslagen als bestand! Je kunt dit bestand de volgende les weer uploaden met de knop "📂 Werk Laden".');
    }

    /* BULLETPROOF UPLOAD / LOAD PROGRESS ENGINE (SUPPORT BOTH JSON AND PDF) */
    handleFileUpload(event) {
        const input = event.target;
        if (!input.files || !input.files[0]) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                let rawText = e.target.result;
                if (!rawText) throw new Error('Het gekozen bestand is leeg.');

                // Strip UTF-8 BOM if present
                rawText = rawText.replace(/^\uFEFF/, '').trim();

                let parsedData = null;

                // 1. Try direct JSON parse
                try {
                    parsedData = JSON.parse(rawText);
                } catch (jsonErr) {
                    // 2. If PDF or embedded text, look for ---PROGRESS_JSON_START--- or JSON match
                    const startMarker = '---PROGRESS_JSON_START---';
                    const endMarker = '---PROGRESS_JSON_END---';

                    if (rawText.includes(startMarker) && rawText.includes(endMarker)) {
                        const jsonSub = rawText.substring(
                            rawText.indexOf(startMarker) + startMarker.length,
                            rawText.indexOf(endMarker)
                        );
                        parsedData = JSON.parse(jsonSub);
                    } else {
                        // Search for JSON object containing studentInfo and mindmapState
                        const match = rawText.match(/\{[\s\S]*?"studentInfo"[\s\S]*?"mindmapState"[\s\S]*?\}/);
                        if (match) {
                            parsedData = JSON.parse(match[0]);
                        }
                    }
                }

                if (!parsedData || typeof parsedData !== 'object') {
                    throw new Error('Geen geldige voortgangsgegevens gevonden in dit bestand.');
                }

                // Restore the data
                this.applyRestoredData(parsedData);

                // Reset input so re-selecting same file triggers change event
                input.value = '';

            } catch (err) {
                console.error('Error loading progress file:', err);
                alert('Fout bij het inladen van het bestand: ' + err.message + '\nZorg ervoor dat je het opgeslagen .json bestand kiest.');
                input.value = '';
            }
        };

        reader.readAsText(file);
    }

    applyRestoredData(data) {
        console.log('Restoring data from file:', data);

        // Fallback resolution for mindmap state (wrapped or direct JSON object/array)
        let mmState = data.mindmapState || data.mindmap;
        if (!mmState && (data.centerNode || data.branches)) {
            mmState = data;
        } else if (!mmState && Array.isArray(data)) {
            mmState = {
                centerNode: { id: 'center', text: 'Vulkanen', icon: '🌋', x: 500, y: 325 },
                branches: data
            };
        }

        // 1. Student Info
        if (data.studentInfo) {
            this.studentInfo = data.studentInfo;
            localStorage.setItem('mm_student_info', JSON.stringify(this.studentInfo));
            if (document.getElementById('student-name')) document.getElementById('student-name').value = this.studentInfo.name || '';
            if (document.getElementById('student-class')) document.getElementById('student-class').value = this.studentInfo.class || '';
        }

        // 2. Answers
        if (data.answers) {
            this.answers = data.answers;
            localStorage.setItem('mm_answers', JSON.stringify(this.answers));
            
            ['q_par1', 'q_par2', 'q_par3', 'q_par4'].forEach(qKey => {
                const radios = document.querySelectorAll(`input[name="${qKey}"]`);
                radios.forEach(r => { r.checked = (r.value === this.answers[qKey]); });
            });

            if (this.answers.q5 && document.getElementById('q-summary-words')) document.getElementById('q-summary-words').value = this.answers.q5;
            if (this.answers.ref1 && document.getElementById('ref-q1')) document.getElementById('ref-q1').value = this.answers.ref1;
            if (this.answers.ref2 && document.getElementById('ref-q2')) document.getElementById('ref-q2').value = this.answers.ref2;
            if (this.answers.ref3 && document.getElementById('ref-q3')) document.getElementById('ref-q3').value = this.answers.ref3;
        }

        // 3. Highlights
        if (data.highlights && document.getElementById('interactive-text-body')) {
            if (data.highlights.includes('Ring van Vuur') || data.highlights.includes('Eyjafjallajökull')) {
                document.getElementById('interactive-text-body').innerHTML = data.highlights;
                localStorage.setItem('mm_highlights', data.highlights);
            }
        }

        // 4. Mindmap State
        const targetMindmap = window.mindmapApp || (window.app ? window.app.mindmapApp : null);
        if (mmState && targetMindmap) {
            targetMindmap.importState(mmState);
            localStorage.setItem('mm_mindmap_state', JSON.stringify(mmState));
        }

        // Automatically switch to Mindmap Studio tab when restoring mindmap
        this.switchTab('tab-mindmap-maker');

        if (window.confetti) {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }

        const branchCount = (mmState && mmState.branches) ? mmState.branches.length : 0;
        const nameStr = (this.studentInfo && this.studentInfo.name) ? ` van ${this.studentInfo.name}` : '';
        alert(`🎉 Werk succesvol geladen${nameStr}!\nAlle antwoorden, markeringen en de mindmap (${branchCount} takken) zijn hersteld.`);
    }

    /* Quiz Tab 2 Check */
    checkQuiz() {
        const selected = document.querySelector('input[name="quiz_r3"]:checked');
        const feedback = document.getElementById('quiz-feedback');
        
        if (!selected || !feedback) return;

        if (selected.value === 'A') {
            feedback.className = 'quiz-feedback correct';
            feedback.innerHTML = '<i class="fa-solid fa-circle-check"></i> Super gedaan! Eén trefwoord per tak laat je hersenen supersnel associëren!';
            if (window.confetti) {
                confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
            }
        } else {
            feedback.className = 'quiz-feedback incorrect';
            feedback.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Niet helemaal! Denk aan hoe je hersenen associeren met losse sleutelwoorden.';
        }
    }

    /* PDF EXPORT ENGINE (With Embedded Progress JSON for Resuming Later) */
    async generatePDF() {
        this.saveStudentInfo();
        this.saveAnswers();

        const fullData = {
            studentInfo: this.studentInfo,
            answers: this.answers,
            highlights: localStorage.getItem('mm_highlights') || '',
            mindmapState: window.mindmapApp ? window.mindmapApp.exportState() : null,
            timestamp: new Date().toISOString()
        };

        const embedContainer = document.getElementById('pdf-embedded-json-wrapper');
        if (embedContainer) {
            embedContainer.innerHTML = `---PROGRESS_JSON_START---${JSON.stringify(fullData)}---PROGRESS_JSON_END---`;
        }

        // 1. Populate PDF Metadata
        document.getElementById('pdf-student-name').textContent = this.studentInfo.name || '(Niet ingevuld)';
        document.getElementById('pdf-student-class').textContent = this.studentInfo.class || '(Niet ingevuld)';
        document.getElementById('pdf-date').textContent = new Date().toLocaleDateString('nl-NL');

        const optTexts = {
            q_par1: { A: 'A) Een vulkaan is een opening in de aardkorst...', B: 'B) Magma buiten de vulkaan is lava.', C: 'C) Onder de aardkorst is het heel heet.' },
            q_par2: { A: 'A) Vergelijking met frisdrank.', B: 'B) Een vulkaanuitbarsting ontstaat door de enorme druk van gassen en magma onder de grond.', C: 'C) As en stenen vliegen kilometers de lucht in.' },
            q_par3: { A: 'A) Schildvulkanen (breed/plat) en Stratovulkanen (steil met dikke lava en as).', B: 'B) Er bestaan verschillende typen vulkanen op aarde.', C: 'C) De vorm van een vulkaan hangt af van de uitbarsting.' },
            q_par4: { A: 'A) Vulkanen zorgen voor gevaar, maar leveren ook vruchtbare grond en energie op.', B: 'B) Aardwarmte in IJsland.', C: 'C) Vulkanische as daalt neer.' }
        };

        // 2. Populate Answers
        document.getElementById('pdf-ans-q1').textContent = optTexts.q_par1[this.answers.q_par1] || '(Nog geen optie gekozen)';
        document.getElementById('pdf-ans-q2').textContent = optTexts.q_par2[this.answers.q_par2] || '(Nog geen optie gekozen)';
        document.getElementById('pdf-ans-q3').textContent = optTexts.q_par3[this.answers.q_par3] || '(Nog geen optie gekozen)';
        document.getElementById('pdf-ans-q4').textContent = optTexts.q_par4[this.answers.q_par4] || '(Nog geen optie gekozen)';
        document.getElementById('pdf-ans-q5').textContent = this.answers.q5 || '(Geen antwoord)';
        
        document.getElementById('pdf-ans-ref1').textContent = this.answers.ref1 || '(Geen antwoord)';
        document.getElementById('pdf-ans-ref2').textContent = this.answers.ref2 || '(Geen antwoord)';
        document.getElementById('pdf-ans-ref3').textContent = this.answers.ref3 || '(Geen antwoord)';

        // 3. Render Mindmap Image snapshot into PDF
        const pdfMmContainer = document.getElementById('pdf-mindmap-container');
        const svgEl = document.getElementById('mindmap-svg');
        
        if (svgEl && pdfMmContainer) {
            try {
                const xml = new XMLSerializer().serializeToString(svgEl);
                const svg64 = btoa(unescape(encodeURIComponent(xml)));
                const image64 = 'data:image/svg+xml;base64,' + svg64;

                pdfMmContainer.innerHTML = `<img src="${image64}" style="max-width:100%; height:auto; border-radius:8px;" alt="Gemaakte Mindmap">`;
            } catch (err) {
                console.error('Error rendering SVG snapshot:', err);
                pdfMmContainer.innerHTML = '<p>(Mindmap kon niet worden verwerkt als afbeelding)</p>';
            }
        }

        // 4. Generate PDF using html2pdf.js
        const element = document.getElementById('pdf-report-template');
        element.style.display = 'block';

        const studentClean = (this.studentInfo.name || 'Leerling').replace(/[^a-zA-Z0-9]/g, '_');
        const opt = {
            margin:       10,
            filename:     `Kernzinnen_Mindmap_Vulkanen_${studentClean}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const btn = document.getElementById('download-pdf-btn');
        const origBtnText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> PDF Genereren...';
        btn.disabled = true;

        try {
            await html2pdf().set(opt).from(element).save();
            if (window.confetti) {
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            }
        } catch (error) {
            alert('Er is een fout opgetreden bij het maken van de PDF: ' + error.message);
        } finally {
            element.style.display = 'none';
            btn.innerHTML = origBtnText;
            btn.disabled = false;
        }
    }
}

// Global App Instance attached explicitly to window object
const app = new AppController();
window.app = app;

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
