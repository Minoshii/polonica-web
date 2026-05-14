// --- POLONICA EASTER EGGS ---

// 1. METRO 2033
let typedMetroKeys = '';
const secretMetroWord = 'metro';
const geigerSound = new Audio('geiger.mp3'); 
geigerSound.volume = 0.5;

document.addEventListener('keydown', (e) => {
    // Input ve Textarea içindeyken çalışmasını engelle
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    typedMetroKeys += e.key.toLowerCase();
    
    if (typedMetroKeys.length > secretMetroWord.length) {
        typedMetroKeys = typedMetroKeys.slice(1);
    }

    if (typedMetroKeys === secretMetroWord) {
        geigerSound.play();
        // Senin kestiğin png dosyasının adı
        document.body.style.cursor = "url('cursor1-removebg-preview (2).png'), auto"; 
        
        setTimeout(() => {
            document.body.style.cursor = "default";
            typedMetroKeys = ''; 
        }, 5000);
    }
});
