console.log("Burak, Easter Egg dosyası başarıyla yüklendi!");
let typedMetroKeys = '';
const secretMetroWord = 'metro';
const geigerSound = new Audio('./geiger.mp3'); // Başına ./ ekleyerek "tam buradaki klasörde" diyoruz. 
geigerSound.volume = 0.5;

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    typedMetroKeys += e.key.toLowerCase();
    if (typedMetroKeys.length > secretMetroWord.length) {
        typedMetroKeys = typedMetroKeys.slice(1);
    }

    // Şifre kontrolü
    if (typedMetroKeys === secretMetroWord) {
        console.log("Aha! Metro Easter Egg tetiklendi!"); // Bu yazı F12 konsolunda çıkacak
        
        geigerSound.play().catch(err => console.log("Ses çalma hatası:", err));
        
        // Senin yeni dosya adın:
        document.body.style.cursor = "url('cursorkesin.png'), auto"; 
        
        setTimeout(() => {
            document.body.style.cursor = "default";
            typedMetroKeys = ''; 
            console.log("Radyasyon dağıldı, her şey normale döndü.");
        }, 5000);
    }
});
