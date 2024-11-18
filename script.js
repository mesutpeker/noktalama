document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sentenceElement = document.querySelector('.sentence');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const progressSpan = document.querySelector('.progress');
    const popupOverlay = document.getElementById('popupOverlay');
    const punctuationButtons = document.querySelector('.punctuation-buttons');
    const addSentenceBtn = document.getElementById('addSentence');
    const editSentenceBtn = document.getElementById('editSentence');
    const importBtn = document.getElementById('importSentences');
    const exportBtn = document.getElementById('exportSentences');
    const sentenceModal = document.getElementById('sentenceModal');
    const sentenceInput = document.getElementById('sentenceInput');
    const saveSentenceBtn = document.getElementById('saveSentence');
    const fileInput = document.getElementById('fileInput');
    const punctuationInputs = document.querySelector('.punctuation-inputs');
    const addPunctuationBtn = document.querySelector('.add-punctuation-btn');

    // State
    let sentences = [];
    let currentSentenceIndex = 0;
    let currentSlotIndex = -1;
    let isEditing = false;

    // Noktalama işaretleri
    const punctuationMarks = ['.', ',', '!', '?', ';', ':', '...', '"'];

    // Initialize
    loadSentences();

    // Event Listeners
    prevBtn.addEventListener('click', showPreviousSentence);
    nextBtn.addEventListener('click', showNextSentence);
    addSentenceBtn.addEventListener('click', () => showSentenceModal(false));
    editSentenceBtn.addEventListener('click', () => showSentenceModal(true));
    importBtn.addEventListener('click', () => fileInput.click());
    exportBtn.addEventListener('click', exportSentences);
    fileInput.addEventListener('change', importSentences);
    saveSentenceBtn.addEventListener('click', saveSentence);
    addPunctuationBtn.addEventListener('click', addPunctuationInput);

    // Touch Events for Mobile
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchEndX - touchStartX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && currentSentenceIndex > 0) {
                showPreviousSentence();
            } else if (diff < 0 && currentSentenceIndex < sentences.length - 1) {
                showNextSentence();
            }
        }
    }

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            popupOverlay.style.display = 'none';
            sentenceModal.style.display = 'none';
        });
    });

    // Functions
    async function loadSentences() {
        try {
            const response = await fetch('sentences.json');
            const data = await response.json();
            sentences = data.sentences;
            updateSentence();
        } catch (error) {
            console.error('Error loading sentences:', error);
            sentences = [];
        }
    }

    function updateSentence() {
        if (sentences.length === 0) {
            sentenceElement.innerHTML = 'Henüz cümle eklenmemiş.';
            return;
        }

        const currentSentence = sentences[currentSentenceIndex];
        sentenceElement.innerHTML = '';
        
        currentSentence.text.forEach((word, index) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            wordSpan.textContent = word;
            sentenceElement.appendChild(wordSpan);
            
            const punctuation = currentSentence.punctuations.find(p => p.position === index);
            if (punctuation) {
                const slot = createPunctuationSlot(index, punctuation.selected || '');
                sentenceElement.appendChild(slot);
            }
            
            if (index < currentSentence.text.length - 1) {
                sentenceElement.appendChild(document.createTextNode(' '));
            }
        });

        progressSpan.textContent = `${currentSentenceIndex + 1}/${sentences.length}`;
        prevBtn.disabled = currentSentenceIndex === 0;
        nextBtn.disabled = currentSentenceIndex === sentences.length - 1;

        attachSlotListeners();
    }

    function createPunctuationSlot(position, selected = '') {
        const slot = document.createElement('span');
        slot.className = 'punctuation-slot';
        slot.dataset.position = position.toString();
        slot.textContent = selected;
        return slot;
    }

    function attachSlotListeners() {
        const slots = document.querySelectorAll('.punctuation-slot');
        slots.forEach(slot => {
            slot.addEventListener('click', (e) => {
                e.stopPropagation();
                currentSlotIndex = parseInt(e.target.dataset.position);
                showPunctuationPopup();
            });

            // Touch events for mobile
            slot.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                currentSlotIndex = parseInt(e.target.dataset.position);
                showPunctuationPopup();
            });
        });
    }

    function showPunctuationPopup() {
        punctuationButtons.innerHTML = '';
        punctuationMarks.forEach(mark => {
            const button = document.createElement('button');
            button.className = 'punct-btn';
            button.textContent = mark;
            button.addEventListener('click', () => selectPunctuation(mark));
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                selectPunctuation(mark);
            });
            punctuationButtons.appendChild(button);
        });
        popupOverlay.style.display = 'flex';
    }

    function selectPunctuation(mark) {
        const currentSentence = sentences[currentSentenceIndex];
        const punctuationIndex = currentSentence.punctuations.findIndex(
            p => p.position === currentSlotIndex
        );

        if (punctuationIndex !== -1) {
            currentSentence.punctuations[punctuationIndex].selected = mark;
            const slot = document.querySelector(`[data-position="${currentSlotIndex}"]`);
            if (slot) {
                slot.textContent = mark;
                slot.classList.remove('correct', 'incorrect');
                slot.classList.add(
                    mark === currentSentence.punctuations[punctuationIndex].correct 
                        ? 'correct' 
                        : 'incorrect'
                );
            }
        }

        popupOverlay.style.display = 'none';
    }

    function showPreviousSentence() {
        if (currentSentenceIndex > 0) {
            currentSentenceIndex--;
            updateSentence();
        }
    }

    function showNextSentence() {
        if (currentSentenceIndex < sentences.length - 1) {
            currentSentenceIndex++;
            updateSentence();
        }
    }

    function addPunctuationInput() {
        const words = sentenceInput.value.trim().split(/\s+/);
        const div = document.createElement('div');
        div.className = 'punctuation-input';

        const positionSelect = document.createElement('select');
        positionSelect.className = 'position-select';
        words.forEach((_, index) => {
            const option = document.createElement('option');
            option.value = index.toString();
            option.textContent = `${words[index]} sonrası`;
            positionSelect.appendChild(option);
        });

        const punctSelect = document.createElement('select');
        punctSelect.className = 'punctuation-select';
        punctuationMarks.forEach(mark => {
            const option = document.createElement('option');
            option.value = mark;
            option.textContent = mark;
            punctSelect.appendChild(option);
        });

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-punctuation-btn';
        removeBtn.innerHTML = '<span class="material-icons">remove</span>';
        removeBtn.addEventListener('click', () => div.remove());

        div.appendChild(positionSelect);
        div.appendChild(punctSelect);
        div.appendChild(removeBtn);
        punctuationInputs.appendChild(div);
    }

    function showSentenceModal(editing) {
        isEditing = editing;
        sentenceModal.style.display = 'flex';
        punctuationInputs.innerHTML = '';

        if (editing && sentences.length > 0) {
            const currentSentence = sentences[currentSentenceIndex];
            sentenceInput.value = currentSentence.text.join(' ');
            
            currentSentence.punctuations.forEach(punct => {
                const div = document.createElement('div');
                div.className = 'punctuation-input';
                
                const positionSelect = document.createElement('select');
                positionSelect.className = 'position-select';
                currentSentence.text.forEach((_, index) => {
                    const option = document.createElement('option');
                    option.value = index.toString();
                    option.textContent = `${currentSentence.text[index]} sonrası`;
                    if (index === punct.position) option.selected = true;
                    positionSelect.appendChild(option);
                });

                const punctSelect = document.createElement('select');
                punctSelect.className = 'punctuation-select';
                punctuationMarks.forEach(mark => {
                    const option = document.createElement('option');
                    option.value = mark;
                    option.textContent = mark;
                    if (mark === punct.correct) option.selected = true;
                    punctSelect.appendChild(option);
                });

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-punctuation-btn';
                removeBtn.innerHTML = '<span class="material-icons">remove</span>';
                removeBtn.addEventListener('click', () => div.remove());

                div.appendChild(positionSelect);
                div.appendChild(punctSelect);
                div.appendChild(removeBtn);
                punctuationInputs.appendChild(div);
            });
        } else {
            sentenceInput.value = '';
        }
    }

    function saveSentence() {
        const text = sentenceInput.value.trim().split(/\s+/);
        const punctuationInputs = document.querySelectorAll('.punctuation-input');
        const punctuations = Array.from(punctuationInputs).map(input => ({
            position: parseInt(input.querySelector('.position-select').value),
            correct: input.querySelector('.punctuation-select').value,
            selected: ''
        }));

        const newSentence = {
            text,
            punctuations: punctuations.sort((a, b) => a.position - b.position)
        };

        if (isEditing) {
            sentences[currentSentenceIndex] = newSentence;
        } else {
            sentences.push(newSentence);
            currentSentenceIndex = sentences.length - 1;
        }

        updateSentence();
        sentenceModal.style.display = 'none';
    }

    function importSentences(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    sentences = data.sentences;
                    currentSentenceIndex = 0;
                    updateSentence();
                } catch (error) {
                    console.error('Error importing sentences:', error);
                }
            };
            reader.readAsText(file);
        }
    }

    function exportSentences() {
        const data = JSON.stringify({ sentences }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sentences.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});