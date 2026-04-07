// ============================================================
//  THE CODEBREAKERS — WWI Cryptography Game
//  By Michael Lu & Michael Zhang
// ============================================================

const Game = (() => {
    // ----- STATE -----
    let currentLevel = 0;
    let timerInterval = null;
    let timeLeft = 0;
    let totalTime = 0;
    let hintsLeft = 3;
    let hintIndex = 0;
    let results = []; // { level, success, timeUsed }

    // Level 1 state
    let activeCodeGroup = null;

    // Level 3 state
    let activeChoctawSlot = null;

    // ----- LEVEL DATA -----
    const levels = [
        // ===== LEVEL 1: ZIMMERMANN TELEGRAM =====
        {
            id: 1,
            name: "The Zimmermann Telegram",
            location: "Room 40, British Admiralty, London",
            time: 300, // 5 minutes
            briefing: {
                title: "Mission I: The Zimmermann Telegram",
                date: "January 17, 1917",
                text: `British naval intelligence has intercepted a coded telegram sent by German Foreign Secretary Arthur Zimmermann to the German Ambassador in Mexico. The message was encrypted using the German diplomatic code known as "0075."<br><br>Our codebreakers in Room 40 have partially cracked the code. We have recovered portions of the codebook. Your task is to use the available codebook entries to decode the critical contents of the telegram.<br><br>Intelligence suggests this message may contain a proposal that could change the course of the war. If Germany discovers we've intercepted this communication, they will change their codes.`,
                objective: "Use the partial codebook to decode the intercepted number groups into the original German diplomatic message. The contents of this telegram could bring the United States into the war."
            },
            hints: [
                "The telegram proposes a military alliance between two nations against the United States.",
                "Germany is offering Mexico territory it lost in the American Southwest.",
                "The first word of the decoded message begins with 'We', meaning Germany is making a direct proposal."
            ],
            // Simplified version of the Zimmermann Telegram using code numbers
            codeGroups: [
                { code: "13042", word: "We" },
                { code: "13401", word: "intend" },
                { code: "8501",  word: "to" },
                { code: "17214", word: "begin" },
                { code: "6929",  word: "on" },
                { code: "14331", word: "the" },
                { code: "15857", word: "first" },
                { code: "67893", word: "of" },
                { code: "5905",  word: "February" },
                { code: "17166", word: "unrestricted" },
                { code: "13851", word: "submarine" },
                { code: "4458",  word: "warfare" },
            ],
            // Extra codebook entries (distractors)
            extraCodebook: [
                { code: "11310", word: "alliance" },
                { code: "18147", word: "Mexico" },
                { code: "17149", word: "Texas" },
                { code: "6224",  word: "Arizona" },
                { code: "14991", word: "territory" },
                { code: "7500",  word: "peace" },
                { code: "23677", word: "Japan" },
                { code: "36477", word: "attack" },
                { code: "21560", word: "financial" },
                { code: "4725",  word: "support" },
                { code: "22801", word: "empire" },
                { code: "19452", word: "ambassador" },
            ],
            answer: ["We", "intend", "to", "begin", "on", "the", "first", "of", "February", "unrestricted", "submarine", "warfare"],
            successResult: {
                title: "Telegram Decrypted",
                text: "Excellent work, cryptanalyst. You have decoded the Zimmermann Telegram. Germany intends to begin unrestricted submarine warfare and has proposed a military alliance with Mexico against the United States, promising the return of Texas, New Mexico, and Arizona.",
                history: "The real Zimmermann Telegram was intercepted and decoded by British codebreakers in Room 40 in January 1917. When its contents were revealed to the American public, outrage over Germany's proposal to Mexico was a major factor in the United States declaring war on Germany on April 6, 1917. This single decoded message changed the course of World War I."
            },
            failResult: {
                title: "Decryption Failed",
                text: "Time has run out. Without the decoded contents of this telegram, British intelligence cannot convince the Americans of Germany's treachery.",
                history: "Had Room 40 failed to decode the Zimmermann Telegram, the United States may have remained neutral far longer. Without American troops and resources, the exhausted Allied powers might have been forced to negotiate a less favorable peace or even face defeat on the Western Front."
            }
        },

        // ===== LEVEL 2: ADFGVX CIPHER =====
        {
            id: 2,
            name: "The ADFGVX Cipher",
            location: "French Army Intelligence, Paris",
            time: 360, // 6 minutes
            briefing: {
                title: "Mission II: The ADFGVX Cipher",
                date: "June 1, 1918",
                text: `German forces have launched a massive spring offensive. Our radio operators have intercepted a field message encrypted with the new German ADFGVX cipher. This a fiendishly complex system that combines a Polybius square substitution with columnar transposition.<br><br>French cryptanalyst Lieutenant Georges Painvin has spent months studying this cipher and has determined the key components. He has identified the Polybius square arrangement and the transposition keyword used for this message.<br><br>You must apply his method to decrypt the intercepted message. Intelligence suggests it contains the target of the next German attack.`,
                objective: "Use the provided Polybius square and transposition keyword to decrypt the ADFGVX cipher text. The decrypted message will reveal the location of the next German offensive."
            },
            hints: [
                "First, write the ciphertext under the keyword columns in order. Then rearrange columns alphabetically by keyword letter to undo the transposition.",
                "After undoing the transposition, read the letters in pairs (e.g., AD, FG). Each pair maps to one character in the Polybius square: first letter = row, second letter = column.",
                "The target is a French city north of Paris, which is a strategically vital location on the Western Front."
            ],
            // Polybius square (6x6 for ADFGVX, letters A-Z + digits 0-9)
            polybiusKey: "BTALPDHOZKQFVSNGICUXWMRYEJ",  // 26 letters filling the 6x6 (with digits placeholder)
            polybius: [
                //       A    D    F    G    V    X
                /* A */ ['B', 'T', 'A', 'L', 'P', 'D'],
                /* D */ ['H', 'O', 'Z', 'K', 'Q', 'F'],
                /* F */ ['V', 'S', 'N', 'G', 'I', 'C'],
                /* G */ ['U', 'X', 'W', 'M', 'R', 'Y'],
                /* V */ ['E', 'J', '2', '5', '8', '1'],
                /* X */ ['3', '6', '9', '4', '7', '0'],
            ],
            polybiusHeaders: ['A', 'D', 'F', 'G', 'V', 'X'],
            keyword: "FRITZ",
            // We'll encode "ATTACKCOMPIEGNE" (attack compiegne)
            // Plaintext: A T T A C K C O M P I E G N E
            // Using the polybius square above:
            // A = AF, T = AD, T = AD, A = AF, C = FX, K = DG
            // C = FX, O = DD, M = GG, P = AV, I = FV, E = VA
            // G = FG, N = FF, E = VA
            // Fractionated: AF AD AD AF FX DG FX DD GG AV FV VA FG FF VA
            // As string: AFADADAFFXDGFXDDGGAVFVVAFGFFVA
            // Transposition with keyword FRITZ:
            // F R I T Z  → alphabetical order: F=1 I=2 R=3 T=4 Z=5
            // Columns under FRITZ (6 chars per row, 5 columns, 30 chars / 5 = 6 rows):
            // F  R  I  T  Z
            // A  F  A  D  A
            // D  A  F  F  X
            // D  G  F  X  D
            // D  G  A  V  F
            // V  V  A  F  G
            // F  F  V  A  V
            // Read in alphabetical column order (F, I, T, R, Z → columns F=1, I=3, R=2, T=4, Z=5):
            // Col F(1): A D D D V F
            // Col I(3): A F F A A V
            // Col R(2): F A G G V F
            // Col T(4): D F X V F A
            // Col Z(5): A X D F G V
            ciphertext: "ADDDFG AFFGVF FAGGVF DFXAAV AXDVFA",
            transpositionColumns: {
                'F': 'ADDDFG',
                'R': 'FAGGVF',
                'I': 'AFFGVF',
                'T': 'DFXAAV',
                'Z': 'AXDVFA'
            },
            answer: "ATTACKCOMPIEGNE",
            acceptableAnswers: ["ATTACKCOMPIEGNE", "ATTACK COMPIEGNE", "ATTACK ON COMPIEGNE"],
            successResult: {
                title: "Cipher Broken",
                text: "Brilliant work! The message reads: ATTACK COMPIEGNE. The German army is planning to strike at Compiegne. This a vital position that, if captured, would split the Allied lines and open a path to Paris.",
                history: "In reality, French cryptanalyst Georges Painvin broke the ADFGVX cipher on June 2, 1918, after months of painstaking effort. His decryption revealed that the Germans planned to attack between Montdidier and Compiegne. This intelligence allowed French General Foch to reinforce the area just in time. The German offensive was halted, marking a turning point in the war. Painvin's work is considered one of the greatest feats of cryptanalysis in history."
            },
            failResult: {
                title: "Cipher Unbroken",
                text: "The ADFGVX cipher has defeated you. Without knowledge of the German target, French forces cannot prepare adequate defenses.",
                history: "Had Painvin failed to break the ADFGVX cipher, the German Spring Offensive of 1918 might have succeeded in splitting the Allied lines at Compiegne. With the road to Paris open, France could have been forced to negotiate, potentially ending the war on German terms before American reinforcements could arrive in full strength."
            }
        },

        // ===== LEVEL 3: CHOCTAW CODE TALKERS =====
        {
            id: 3,
            name: "The Choctaw Code Talkers",
            location: "Meuse-Argonne Front, France",
            time: 240, // 4 minutes
            briefing: {
                title: "Mission III: The Choctaw Code Talkers",
                date: "October 26, 1918",
                text: `The Meuse-Argonne Offensive, the largest American military operation of the war, is underway. But German intelligence has been intercepting and understanding our field telephone communications, anticipating every move.<br><br>Captain Lawrence of the 142nd Infantry Regiment has devised an ingenious solution: use Choctaw soldiers to transmit orders in their native language. The Germans have never encountered this language and cannot translate it.<br><br>You are an American officer receiving a coded Choctaw field transmission. Using the Choctaw-English military lexicon compiled by the code talkers, you must translate the battlefield orders to coordinate the upcoming assault.`,
                objective: "Translate the Choctaw field transmission into English military orders using the code talker lexicon. The Choctaw soldiers used everyday words as substitutes for military terms the language had no words for."
            },
            hints: [
                "The Choctaw code talkers used their word for 'big gun' to mean artillery, and 'little gun shoot fast' for machine gun.",
                "The message is a set of tactical orders. It describes troop movements and positions for an attack.",
                "The phrase structure follows standard military orders: who, what action, where."
            ],
            // Choctaw transmission with coded military terms
            phrases: [
                { choctaw: "Tanchi tohbi",  english: "Second Battalion",  type: "decode" },
                { choctaw: "aya",           english: "advance",           type: "static" },
                { choctaw: "okla",          english: "to",                type: "static" },
                { choctaw: "kulli chaha",   english: "the high ridge",    type: "static" },
                { choctaw: "ont ia.",       english: "at dawn.",          type: "static" },
                { choctaw: "Tanap ushi",    english: "Machine guns",      type: "decode" },
                { choctaw: "apisa",         english: "cover",             type: "static" },
                { choctaw: "naksika.",      english: "the flanks.",       type: "static" },
                { choctaw: "Tanap chito",   english: "Artillery",         type: "decode" },
                { choctaw: "hotopali",      english: "fire on",           type: "static" },
                { choctaw: "okla i kana",   english: "enemy positions",   type: "decode" },
                { choctaw: "tuklo ont ia.",  english: "at zero hour.",    type: "static" },
                { choctaw: "Hattak tushka", english: "Soldiers",          type: "decode" },
                { choctaw: "ile hullochi",  english: "hold steady",       type: "static" },
                { choctaw: "im anukfila.",  english: "and await signal.", type: "static" },
            ],
            // Dictionary entries (includes correct terms + distractors)
            dictionary: [
                { choctaw: "Tanap chito",    english: "Artillery (big gun)" },
                { choctaw: "Tanap ushi",     english: "Machine guns (little gun shoot fast)" },
                { choctaw: "Tanchi tohbi",   english: "Second Battalion (white corn)" },
                { choctaw: "Tanchi lakna",   english: "First Battalion (yellow corn)" },
                { choctaw: "Tanchi humma",   english: "Third Battalion (red corn)" },
                { choctaw: "Hattak tushka",  english: "Soldiers (warriors)" },
                { choctaw: "okla i kana",    english: "enemy positions (their places)" },
                { choctaw: "Tiak humma",     english: "Ammunition (red earth)" },
                { choctaw: "Iti fabussa",    english: "Grenades (stones)" },
                { choctaw: "Nan ithana",     english: "Scouts (learners)" },
                { choctaw: "Tushka chipota",  english: "Patrol (young warriors)" },
                { choctaw: "Holihta asha",   english: "Trenches (ditches)" },
                { choctaw: "Hiloha",         english: "Gas attack (bad air)" },
                { choctaw: "Isht holmo",     english: "Barbed wire (thorns)" },
            ],
            // The decoded phrases in order (only for 'decode' type)
            answerMap: {
                0: "Second Battalion",
                5: "Machine guns",
                8: "Artillery",
                10: "enemy positions",
                12: "Soldiers"
            },
            successResult: {
                title: "Transmission Decoded",
                text: "The orders are clear: Second Battalion advances to the ridge at dawn. Machine guns cover the flanks. Artillery fires on enemy positions at zero hour. Soldiers hold steady and await the signal. The attack is coordinated, and the Germans have no idea what's coming.",
                history: "In October 1918, Choctaw members of the 141st and 142nd Infantry Regiments transmitted tactical messages in their native language during the Meuse-Argonne Offensive. German intelligence, which had been successfully tapping American phone lines, was completely baffled. Within 24 hours of deploying the Choctaw code talkers, the tide of battle shifted. The Germans could no longer anticipate American movements. This was the first known use of Native American languages for military communications. This would become a practice that would be expanded with Navajo code talkers in World War II."
            },
            failResult: {
                title: "Translation Failed",
                text: "Without a proper translation, the field orders cannot be relayed to the battalion commanders. The attack will proceed uncoordinated.",
                history: "Had the Choctaw code talkers not been utilized, German intelligence would have continued intercepting and understanding American communications. The Meuse-Argonne Offensive, already the deadliest battle in American history with over 26,000 killed, could have suffered even greater casualties as the Germans anticipated each American move."
            }
        }
    ];

    // ----- TYPEWRITER AUDIO -----
    let audioCtx = null;
    function playCarriageReturn() {
        if (!audioCtx) {
            try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return; }
        }
        const t = audioCtx.currentTime;
        // Bell ding
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, t);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    function playKeystroke() {
        if (!audioCtx) {
            try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return; }
        }
        const t = audioCtx.currentTime;
        // Short percussive click
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800 + Math.random() * 600, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.02);

        filter.type = 'bandpass';
        filter.frequency.value = 1200 + Math.random() * 400;
        filter.Q.value = 0.5;

        gain.gain.setValueAtTime(0.06 + Math.random() * 0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(t);
        osc.stop(t + 0.05);
    }

    // ----- TYPEWRITER ENGINE -----
    let typewriterQueue = [];
    let typewriterRunning = false;

    function typewrite(element, html, speed = 18, callback = null) {
        // Parse HTML to extract text and tags
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const plainText = temp.textContent || temp.innerText;

        element.innerHTML = '';
        element.style.minHeight = element.offsetHeight + 'px';

        // Create a cursor element
        const cursor = document.createElement('span');
        cursor.className = 'typewriter-cursor on-paper';

        let i = 0;
        let htmlIndex = 0;
        let outputHtml = '';
        let insideTag = false;

        // We'll type the raw HTML character by character, but skip through tags instantly
        const rawHtml = html;

        function typeNext() {
            if (htmlIndex >= rawHtml.length) {
                // Done typing
                element.innerHTML = rawHtml;
                if (callback) callback();
                return;
            }

            // If we hit a tag, consume it all at once
            if (rawHtml[htmlIndex] === '<') {
                const closeIdx = rawHtml.indexOf('>', htmlIndex);
                if (closeIdx !== -1) {
                    const tag = rawHtml.substring(htmlIndex, closeIdx + 1);
                    outputHtml += tag;
                    htmlIndex = closeIdx + 1;
                    element.innerHTML = outputHtml;
                    element.appendChild(cursor);
                    // Play carriage return sound on line breaks
                    if (tag.toLowerCase() === '<br>' || tag.toLowerCase() === '<br/>') {
                        playCarriageReturn();
                        setTimeout(typeNext, speed * 6);
                        return;
                    }
                    typeNext();
                    return;
                }
            }

            // Type one visible character
            const char = rawHtml[htmlIndex];
            if (char !== ' ') playKeystroke();
            // Randomly add ink variation
            const rand = Math.random();
            if (rand < 0.08) {
                outputHtml += `<span class="ink-heavy">${char}</span>`;
            } else if (rand < 0.14) {
                outputHtml += `<span class="ink-light-char">${char}</span>`;
            } else {
                outputHtml += char;
            }
            htmlIndex++;

            element.innerHTML = outputHtml;
            element.appendChild(cursor);

            // Vary speed for realism
            let delay = speed;
            if (char === '.' || char === '!' || char === '?') delay = speed * 8;
            else if (char === ',') delay = speed * 4;
            else if (char === ' ') delay = speed * 1.5;
            else delay = speed + (Math.random() * speed * 0.8);

            setTimeout(typeNext, delay);
        }

        element.appendChild(cursor);
        setTimeout(typeNext, 300);
    }

    // Typewriter for dark backgrounds
    function typewriteDark(element, text, speed = 18, callback = null) {
        element.innerHTML = '';

        const cursor = document.createElement('span');
        cursor.className = 'typewriter-cursor on-dark';

        let i = 0;
        let output = '';

        function typeNext() {
            if (i >= text.length) {
                element.textContent = text;
                if (callback) callback();
                return;
            }

            const char = text[i];
            output += char;
            i++;

            element.textContent = output;
            element.appendChild(cursor);

            let delay = speed;
            if (char === '.' || char === '?') delay = speed * 8;
            else if (char === ',') delay = speed * 4;
            else delay = speed + (Math.random() * speed * 0.8);

            setTimeout(typeNext, delay);
        }

        element.appendChild(cursor);
        setTimeout(typeNext, 200);
    }

    // ----- SCREEN MANAGEMENT -----
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('screen-' + id).classList.add('active');
    }

    // ----- TIMER -----
    function startTimer(seconds) {
        timeLeft = seconds;
        totalTime = seconds;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                endLevel(false);
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        const timerText = document.getElementById('timer-text');
        const timerBar = document.getElementById('timer-bar');
        const pct = (timeLeft / totalTime) * 100;

        timerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        timerBar.style.width = pct + '%';

        // Color states
        timerText.className = 'timer-text';
        timerBar.className = 'timer-bar';
        if (pct <= 20) {
            timerText.classList.add('danger');
            timerBar.classList.add('danger');
        } else if (pct <= 40) {
            timerText.classList.add('warning');
            timerBar.classList.add('warning');
        }
    }

    // ----- INIT LEVELS -----
    function initLevel1() {
        const level = levels[0];
        activeCodeGroup = null;

        // Build cipher text with clickable code groups
        const cipherEl = document.getElementById('cipher-zimmermann');
        cipherEl.innerHTML = level.codeGroups.map((cg, i) =>
            `<span class="code-group" data-index="${i}" onclick="Game.selectCodeGroup(${i})">${cg.code}</span>`
        ).join(' ');

        // Build codebook (correct + distractors, shuffled)
        const allEntries = [...level.codeGroups, ...level.extraCodebook];
        allEntries.sort(() => Math.random() - 0.5);

        const codebookEl = document.getElementById('codebook');
        codebookEl.innerHTML = allEntries.map(e =>
            `<div class="codebook-entry" data-code="${e.code}" data-word="${e.word}" onclick="Game.selectCodebookEntry(this)">
                <span class="code-num">${e.code}</span>
                <span class="code-word">${e.word}</span>
            </div>`
        ).join('');

        // Build decode slots
        const slotsEl = document.getElementById('decode-slots-1');
        slotsEl.innerHTML = level.codeGroups.map((cg, i) =>
            `<span class="decode-slot" data-index="${i}" onclick="Game.selectCodeGroup(${i})">${cg.code}: ____</span>`
        ).join(' ');
    }

    function initLevel2() {
        const level = levels[1];
        const headers = level.polybiusHeaders;

        // Build Polybius table
        const table = document.getElementById('polybius-table');
        let html = '<tr><th></th>';
        headers.forEach(h => html += `<th>${h}</th>`);
        html += '</tr>';
        level.polybius.forEach((row, i) => {
            html += `<tr><th>${headers[i]}</th>`;
            row.forEach(cell => html += `<td>${cell}</td>`);
            html += '</tr>';
        });
        table.innerHTML = html;

        // Show cipher text
        document.getElementById('cipher-adfgvx').textContent = level.ciphertext;

        // Show keyword
        document.getElementById('adfgvx-keyword').textContent = level.keyword;

        // Build transposition workspace
        const ws = document.getElementById('transposition-workspace');
        const kw = level.keyword;
        const sorted = [...kw].map((ch, i) => ({ ch, i })).sort((a, b) => a.ch.localeCompare(b.ch));

        let tableHtml = '<table class="trans-table"><tr>';
        // Header row: sorted keyword letters with original column reference
        sorted.forEach(s => {
            tableHtml += `<th>${s.ch} <span class="trans-order">(col ${s.i + 1})</span></th>`;
        });
        tableHtml += '</tr>';

        // Column data — already in alphabetical order as transmitted
        const colData = sorted.map(s => level.transpositionColumns[s.ch]);
        const numRows = colData[0].length;
        for (let r = 0; r < numRows; r++) {
            tableHtml += '<tr>';
            colData.forEach(col => {
                tableHtml += `<td>${col[r]}</td>`;
            });
            tableHtml += '</tr>';
        }
        tableHtml += '</table>';

        // Add instructions
        ws.innerHTML = `
            <p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">
                The ciphertext columns are shown below in alphabetical order (as transmitted).
                To decrypt: rearrange columns back to keyword order (${kw}), then read row by row in pairs.
            </p>
            ${tableHtml}
        `;
    }

    function initLevel3() {
        const level = levels[2];
        activeChoctawSlot = null;

        // Build cipher text with highlighted decode phrases
        const cipherEl = document.getElementById('cipher-choctaw');
        cipherEl.innerHTML = level.phrases.map((p, i) => {
            if (p.type === 'decode') {
                return `<span class="choctaw-phrase" data-index="${i}" onclick="Game.selectChoctawPhrase(${i})">${p.choctaw}</span>`;
            }
            return `<span style="color:var(--text-primary)">${p.choctaw}</span>`;
        }).join(' ');

        // Build dictionary (shuffled)
        const dict = [...level.dictionary].sort(() => Math.random() - 0.5);
        const dictEl = document.getElementById('choctaw-dict');
        dictEl.innerHTML = dict.map(d =>
            `<div class="dict-entry" data-choctaw="${d.choctaw}" data-english="${d.english}" onclick="Game.selectDictEntry(this)">
                <span class="dict-choctaw">${d.choctaw}</span>
                <span class="dict-english">${d.english}</span>
            </div>`
        ).join('');

        // Build decode slots
        const slotsEl = document.getElementById('decode-slots-3');
        slotsEl.innerHTML = level.phrases.map((p, i) => {
            if (p.type === 'decode') {
                return `<span class="decode-slot" data-index="${i}" onclick="Game.selectChoctawPhrase(${i})">[${p.choctaw}]</span>`;
            }
            return `<span class="decode-slot static-word">${p.english}</span>`;
        }).join(' ');
    }

    // ----- LEVEL 1 INTERACTIONS -----
    function selectCodeGroup(index) {
        // Deselect previous
        document.querySelectorAll('.code-group').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.decode-slot:not(.static-word)').forEach(el => el.classList.remove('active'));

        // Select this one
        activeCodeGroup = index;
        const cg = document.querySelector(`.code-group[data-index="${index}"]`);
        if (cg) cg.classList.add('active');
        const slot = document.querySelector(`#decode-slots-1 .decode-slot[data-index="${index}"]`);
        if (slot) slot.classList.add('active');
    }

    function selectCodebookEntry(el) {
        if (activeCodeGroup === null) return;

        const word = el.dataset.word;
        const slot = document.querySelector(`#decode-slots-1 .decode-slot[data-index="${activeCodeGroup}"]`);
        const code = levels[0].codeGroups[activeCodeGroup].code;

        slot.textContent = `${code}: ${word}`;
        slot.classList.add('filled');
        slot.dataset.answer = word;

        // Mark code group as filled
        const cg = document.querySelector(`.code-group[data-index="${activeCodeGroup}"]`);
        if (cg) cg.classList.add('filled');

        // Auto advance to next unfilled
        const allSlots = document.querySelectorAll('#decode-slots-1 .decode-slot');
        let next = null;
        for (let s of allSlots) {
            if (!s.dataset.answer) { next = parseInt(s.dataset.index); break; }
        }
        if (next !== null) {
            selectCodeGroup(next);
        } else {
            activeCodeGroup = null;
            document.querySelectorAll('.code-group').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.decode-slot').forEach(el => el.classList.remove('active'));
        }
    }

    // ----- LEVEL 3 INTERACTIONS -----
    function selectChoctawPhrase(index) {
        document.querySelectorAll('.choctaw-phrase').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('#decode-slots-3 .decode-slot:not(.static-word)').forEach(el => el.classList.remove('active'));

        activeChoctawSlot = index;
        const phrase = document.querySelector(`.choctaw-phrase[data-index="${index}"]`);
        if (phrase) phrase.classList.add('active');
        const slot = document.querySelector(`#decode-slots-3 .decode-slot[data-index="${index}"]`);
        if (slot) slot.classList.add('active');
    }

    function selectDictEntry(el) {
        if (activeChoctawSlot === null) return;

        const english = el.dataset.english;
        // Extract just the main meaning (before parenthetical)
        const mainMeaning = english.split('(')[0].trim();

        const slot = document.querySelector(`#decode-slots-3 .decode-slot[data-index="${activeChoctawSlot}"]`);
        slot.textContent = mainMeaning;
        slot.classList.add('filled');
        slot.dataset.answer = mainMeaning;

        // Mark phrase as filled
        const phrase = document.querySelector(`.choctaw-phrase[data-index="${activeChoctawSlot}"]`);
        if (phrase) phrase.classList.add('filled');

        // Auto advance
        const allSlots = document.querySelectorAll('#decode-slots-3 .decode-slot:not(.static-word)');
        let next = null;
        for (let s of allSlots) {
            if (!s.dataset.answer) { next = parseInt(s.dataset.index); break; }
        }
        if (next !== null) {
            selectChoctawPhrase(next);
        } else {
            activeChoctawSlot = null;
            document.querySelectorAll('.choctaw-phrase').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('#decode-slots-3 .decode-slot').forEach(el => el.classList.remove('active'));
        }
    }

    // ----- CHECK ANSWERS -----
    function checkAnswer() {
        const level = levels[currentLevel];

        if (level.id === 1) {
            const slots = document.querySelectorAll('#decode-slots-1 .decode-slot');
            const answers = [];
            slots.forEach(s => answers.push(s.dataset.answer || ''));

            const correct = level.answer.every((w, i) => w.toLowerCase() === answers[i].toLowerCase());
            endLevel(correct);

        } else if (level.id === 2) {
            const input = document.getElementById('answer-adfgvx').value.trim().toUpperCase().replace(/\s+/g, '');
            const correct = level.acceptableAnswers.some(a =>
                a.replace(/\s+/g, '').toUpperCase() === input
            );
            endLevel(correct);

        } else if (level.id === 3) {
            const answerMap = level.answerMap;
            let correct = true;
            for (const [idx, expected] of Object.entries(answerMap)) {
                const slot = document.querySelector(`#decode-slots-3 .decode-slot[data-index="${idx}"]`);
                const answer = (slot?.dataset.answer || '').toLowerCase();
                if (answer !== expected.toLowerCase()) {
                    correct = false;
                    break;
                }
            }
            endLevel(correct);
        }
    }

    // ----- END LEVEL -----
    function endLevel(success) {
        clearInterval(timerInterval);

        const level = levels[currentLevel];
        const timeUsed = totalTime - timeLeft;

        results.push({
            level: level.id,
            name: level.name,
            success,
            timeUsed
        });

        const result = success ? level.successResult : level.failResult;

        document.getElementById('result-stamp').textContent = success ? 'MISSION COMPLETE' : 'MISSION FAILED';
        document.getElementById('result-stamp').className = 'result-stamp ' + (success ? 'success' : 'failure');
        document.getElementById('result-title').textContent = result.title;
        document.getElementById('result-text').textContent = '';
        document.getElementById('history-text').textContent = '';

        const btnNext = document.getElementById('btn-next');
        if (currentLevel < levels.length - 1) {
            btnNext.textContent = 'NEXT MISSION';
        } else {
            btnNext.textContent = 'VIEW SERVICE RECORD';
        }

        showScreen('result');

        // Typewriter the result text, then the history text
        setTimeout(() => {
            typewrite(
                document.getElementById('result-text'),
                result.text,
                12,
                () => {
                    typewrite(
                        document.getElementById('history-text'),
                        result.history,
                        10
                    );
                }
            );
        }, 600);
    }

    // ----- HINTS -----
    function useHint() {
        const level = levels[currentLevel];
        if (hintsLeft <= 0 || hintIndex >= level.hints.length) return;

        hintsLeft--;
        document.getElementById('hud-hints').textContent = hintsLeft;
        document.getElementById('hint-text').textContent = level.hints[hintIndex];
        document.getElementById('hint-panel').style.display = 'block';
        hintIndex++;

        if (hintsLeft <= 0) {
            document.getElementById('btn-hint').disabled = true;
        }
    }

    function closeHint() {
        document.getElementById('hint-panel').style.display = 'none';
    }

    // ----- PUBLIC API -----
    return {
        startBriefing() {
            const level = levels[currentLevel];
            document.getElementById('briefing-title').textContent = level.briefing.title;
            document.getElementById('briefing-date').textContent = level.briefing.date;
            document.getElementById('briefing-text').innerHTML = '';
            document.getElementById('briefing-objective').textContent = level.briefing.objective;
            showScreen('briefing');
            // Start typewriter on briefing text
            setTimeout(() => {
                typewrite(
                    document.getElementById('briefing-text'),
                    level.briefing.text,
                    14
                );
            }, 400);
        },

        startLevel() {
            const level = levels[currentLevel];

            // Update HUD
            document.getElementById('hud-level').textContent = `${level.id} / ${levels.length}`;
            document.getElementById('hud-location').textContent = level.location;
            document.getElementById('hud-hints').textContent = hintsLeft;
            document.getElementById('btn-hint').disabled = hintsLeft <= 0;

            // Reset hint index for this level
            hintIndex = 0;

            // Hide all levels, show current
            document.querySelectorAll('.level-container').forEach(el => el.style.display = 'none');
            document.getElementById('level-' + level.id).style.display = 'block';

            // Initialize level
            if (level.id === 1) initLevel1();
            else if (level.id === 2) initLevel2();
            else if (level.id === 3) initLevel3();

            // Close any open hint
            closeHint();

            showScreen('game');
            startTimer(level.time);
        },

        nextLevel() {
            currentLevel++;
            if (currentLevel >= levels.length) {
                showFinalScreen();
            } else {
                Game.startBriefing();
            }
        },

        checkAnswer,
        useHint,
        closeHint,
        selectCodeGroup,
        selectCodebookEntry,
        selectChoctawPhrase,
        selectDictEntry,

        restart() {
            currentLevel = 0;
            hintsLeft = 3;
            hintIndex = 0;
            results = [];
            showScreen('title');
        }
    };

    // ----- TITLE SCREEN TYPEWRITER ON LOAD -----
    document.addEventListener('DOMContentLoaded', () => {
        const introEl = document.querySelector('.intro-text');
        if (introEl) {
            const originalText = introEl.textContent;
            introEl.textContent = '';
            setTimeout(() => {
                typewrite(introEl, originalText, 20);
            }, 600);
        }
    });

    function showFinalScreen() {
        const statsEl = document.getElementById('final-stats-list');
        const successes = results.filter(r => r.success).length;

        statsEl.innerHTML = results.map(r => {
            const mins = Math.floor(r.timeUsed / 60);
            const secs = r.timeUsed % 60;
            const timeStr = `${mins}m ${secs}s`;
            return `
                <div class="stat-row">
                    <span class="stat-label">${r.name}</span>
                    <span class="stat-value ${r.success ? '' : 'fail'}">${r.success ? 'DECRYPTED' : 'FAILED'} — ${timeStr}</span>
                </div>
            `;
        }).join('');

        const msgEl = document.getElementById('final-message');
        let finalMsg = '';
        if (successes === 3) {
            finalMsg = "Outstanding, cryptanalyst. You have successfully completed all three missions. Your work in Room 40, French Intelligence, and the Meuse-Argonne front helped secure Allied victory. The war ends on November 11, 1918, and the codebreakers played a role history will never forget.";
        } else if (successes >= 2) {
            finalMsg = "Well done. Your codebreaking skills made a significant impact on the war effort, though not every mission succeeded. The Great War has ended, but the lessons of cryptography will echo through the century to come.";
        } else if (successes === 1) {
            finalMsg = "The war has been a difficult one for Allied intelligence. Only one mission was completed successfully. The cost of failed cryptanalysis is measured in lives lost and opportunities missed.";
        } else {
            finalMsg = "Allied intelligence has failed at every turn. Without the codebreakers' successes, the war drags on longer and costs more lives. History might have unfolded very differently.";
        }

        msgEl.textContent = '';
        showScreen('final');

        setTimeout(() => {
            typewrite(msgEl, finalMsg, 14);
        }, 800);
    }
})();
