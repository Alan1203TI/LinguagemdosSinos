const tones = Array.isArray(window.SINO_DATA) ? window.SINO_DATA : [];
const grid = document.getElementById('tonesGrid');
const audio = document.getElementById('audioPlayer');
const quizAudio = document.getElementById('quizAudio');
const searchInput = document.getElementById('searchInput');
const filterRow = document.getElementById('filterRow');
const emptyState = document.getElementById('emptyState');
const globalPlayBtn = document.getElementById('globalPlayBtn');
const globalProgress = document.getElementById('globalProgress');
const globalVolume = document.getElementById('globalVolume');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const nowPlayingTitle = document.getElementById('nowPlayingTitle');
const heroNowTitle = document.getElementById('heroNowTitle');
const heroNowSubtitle = document.getElementById('heroNowSubtitle');
const heroBell = document.getElementById('heroBell');
const miniBell = document.getElementById('miniBell');
const statToques = document.getElementById('statToques');
const infoModal = document.getElementById('infoModal');
const infoModalTitle = document.getElementById('infoModalTitle');
const infoModalText = document.getElementById('infoModalText');
const infoModalClose = document.getElementById('infoModalClose');
const infoModalPlay = document.getElementById('infoModalPlay');
let infoTone = null;

let currentTone = null;
let currentFilter = 'Todos';
let isSeeking = false;

statToques.textContent = tones.length;
audio.volume = Number(globalVolume.value);
quizAudio.volume = Number(globalVolume.value);

function fmt(seconds){
  if(!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds/60);
  const s = Math.floor(seconds%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));
}

function categories(){
  return ['Todos', ...new Set(tones.map(t => t.categoria || 'Outros'))];
}

function renderFilters(){
  filterRow.innerHTML = categories().map(cat => `
    <button class="filter-btn ${cat===currentFilter?'active':''}" data-filter="${escapeHtml(cat)}">${escapeHtml(cat)}</button>
  `).join('');
  filterRow.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    renderFilters();
    renderTones();
  }));
}

function filteredTones(){
  const q = searchInput.value.trim().toLowerCase();
  return tones.filter(t => {
    const inCategory = currentFilter === 'Todos' || (t.categoria || 'Outros') === currentFilter;
    const haystack = `${t.nome} ${t.resumo || ''} ${t.descricao} ${t.categoria}`.toLowerCase();
    return inCategory && haystack.includes(q);
  });
}

function renderTones(){
  const list = filteredTones();
  emptyState.classList.toggle('hidden', list.length>0);
  grid.innerHTML = list.map((t, index) => `
    <article class="tone-card ${currentTone?.id===t.id && !audio.paused?'playing':''}" data-id="${escapeHtml(t.id)}">
      ${t.imagem ? `<div class="tone-thumb-wrap"><img class="tone-thumb" src="${escapeHtml(t.imagem)}" alt="Imagem ilustrativa para ${escapeHtml(t.nome)}"></div>` : ''}
      <span class="tone-number">${String(index+1).padStart(2,'0')}</span>
      <div class="tone-meta"><span class="tone-icon">🔔</span><span class="tone-category">${escapeHtml(t.categoria || 'Toque')}</span></div>
      <h3>${escapeHtml(t.nome)}</h3>
      <p class="tone-summary">${escapeHtml(t.resumo || t.descricao)}</p>
      <div class="tone-actions">
        <button class="play-tone" data-id="${escapeHtml(t.id)}">${currentTone?.id===t.id && !audio.paused?'❚❚ Pausar':'▶ Ouvir toque'}</button>
        <button class="cloud-info-btn" data-info-id="${escapeHtml(t.id)}" aria-label="Ler explicação de ${escapeHtml(t.nome)}"><span>☁</span><b>Conheça este toque</b></button>
      </div>
      <div class="tone-duration">Duração aproximada: ${escapeHtml(t.duracao || 'áudio')}</div>
    </article>
  `).join('');

  grid.querySelectorAll('.play-tone').forEach(btn => btn.addEventListener('click', () => playTone(btn.dataset.id)));
  grid.querySelectorAll('.cloud-info-btn').forEach(btn => btn.addEventListener('click', () => openInfo(btn.dataset.infoId)));
}

function openInfo(id){
  const tone = tones.find(t => t.id === id);
  if(!tone) return;
  infoTone = tone;
  infoModalTitle.textContent = tone.nome;
  infoModalText.textContent = tone.descricao;
  infoModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  infoModalClose.focus();
}
function closeInfo(){
  infoModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  infoTone = null;
}
infoModalClose.addEventListener('click', closeInfo);
infoModal.querySelectorAll('[data-close-info]').forEach(el => el.addEventListener('click', closeInfo));
document.addEventListener('keydown', e => { if(e.key === 'Escape' && !infoModal.classList.contains('hidden')) closeInfo(); });
infoModalPlay.addEventListener('click', () => { if(infoTone){ playTone(infoTone.id); closeInfo(); } });

function setPlayingUi(playing){
  globalPlayBtn.textContent = playing ? '❚❚' : '▶';
  heroBell.classList.toggle('playing', playing);
  miniBell.classList.toggle('playing', playing);
  renderTones();
}

function playTone(id){
  const tone = tones.find(t => t.id === id);
  if(!tone) return;
  quizAudio.pause();

  if(currentTone?.id === id){
    if(audio.paused){audio.play().catch(showAudioError);}else{audio.pause();}
    return;
  }

  currentTone = tone;
  audio.src = tone.arquivo;
  audio.currentTime = 0;
  nowPlayingTitle.textContent = tone.nome;
  heroNowTitle.textContent = tone.nome;
  heroNowSubtitle.textContent = tone.resumo || tone.descricao;
  globalPlayBtn.disabled = false;
  globalProgress.disabled = false;
  audio.play().catch(showAudioError);
}

function showAudioError(){
  setPlayingUi(false);
  heroNowSubtitle.textContent = 'Arquivo de áudio ainda não encontrado. Coloque o MP3/WAV na pasta assets/audio/.';
}

audio.addEventListener('play', () => setPlayingUi(true));
audio.addEventListener('pause', () => setPlayingUi(false));
audio.addEventListener('ended', () => setPlayingUi(false));
audio.addEventListener('loadedmetadata', () => {durationEl.textContent = fmt(audio.duration)});
audio.addEventListener('timeupdate', () => {
  if(!isSeeking && audio.duration){globalProgress.value = (audio.currentTime/audio.duration)*100;}
  currentTimeEl.textContent = fmt(audio.currentTime);
});

globalPlayBtn.addEventListener('click', () => {
  if(!currentTone) return;
  if(audio.paused) audio.play().catch(showAudioError); else audio.pause();
});

globalProgress.addEventListener('input', () => {
  isSeeking = true;
  if(audio.duration) audio.currentTime = (Number(globalProgress.value)/100)*audio.duration;
});
globalProgress.addEventListener('change', () => isSeeking = false);
globalVolume.addEventListener('input', () => {
  audio.volume = Number(globalVolume.value);
  quizAudio.volume = Number(globalVolume.value);
});
searchInput.addEventListener('input', renderTones);

// Menu mobile
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.querySelector('.nav-links');
menuBtn.addEventListener('click',()=>{
  const open = navLinks.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>navLinks.classList.remove('open')));

// Quiz
const quizListenBtn = document.getElementById('quizListenBtn');
const quizOptions = document.getElementById('quizOptions');
const quizFeedback = document.getElementById('quizFeedback');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const scoreLabel = document.getElementById('scoreLabel');
const quizBell = document.getElementById('quizBell');
let quizTone = null;
let quizScore = 0;
let quizLocked = false;

function shuffle(arr){return [...arr].sort(()=>Math.random()-.5)}
function newQuizQuestion(){
  quizLocked = false;
  quizFeedback.textContent = '';
  nextQuestionBtn.classList.add('hidden');
  quizTone = tones[Math.floor(Math.random()*tones.length)] || null;
  if(!quizTone){
    quizOptions.innerHTML = '<div class="empty-state">Cadastre os toques em assets/data.js para ativar o quiz.</div>';
    quizListenBtn.disabled = true;
    return;
  }
  const distractors = shuffle(tones.filter(t=>t.id!==quizTone.id)).slice(0,2);
  const options = shuffle([quizTone,...distractors]);
  quizOptions.innerHTML = options.map(t=>`<button class="quiz-option" data-id="${escapeHtml(t.id)}">${escapeHtml(t.quizTexto || t.resumo || t.descricao)}</button>`).join('');
  quizOptions.querySelectorAll('.quiz-option').forEach(btn => btn.addEventListener('click',()=>answerQuiz(btn)));
}
function answerQuiz(btn){
  if(quizLocked) return;
  quizLocked = true;
  quizOptions.querySelectorAll('.quiz-option').forEach(b=>{
    b.disabled = true;
    if(b.dataset.id===quizTone.id) b.classList.add('correct');
  });
  if(btn.dataset.id===quizTone.id){
    quizScore++;
    btn.classList.add('correct');
    quizFeedback.textContent = '✅ Acertou! Muito bem!';
  } else {
    btn.classList.add('wrong');
    quizFeedback.textContent = `❌ Esse era o toque: ${quizTone.nome}`;
  }
  scoreLabel.textContent = `${quizScore} ${quizScore===1?'ponto':'pontos'}`;
  nextQuestionBtn.classList.remove('hidden');
}
quizListenBtn.addEventListener('click',()=>{
  if(!quizTone) return;
  audio.pause();
  if(quizAudio.src.endsWith(quizTone.arquivo) && !quizAudio.paused){quizAudio.pause();return;}
  quizAudio.src = quizTone.arquivo;
  quizAudio.currentTime = 0;
  quizAudio.play().catch(()=>{quizFeedback.textContent='Arquivo de áudio ainda não encontrado na pasta assets/audio/.'});
});
quizAudio.addEventListener('play',()=>quizBell.classList.add('playing'));
quizAudio.addEventListener('pause',()=>quizBell.classList.remove('playing'));
quizAudio.addEventListener('ended',()=>quizBell.classList.remove('playing'));
nextQuestionBtn.addEventListener('click',()=>{quizAudio.pause();newQuizQuestion();});

renderFilters();
renderTones();
newQuizQuestion();
