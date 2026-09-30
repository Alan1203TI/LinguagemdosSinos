const tones = Array.isArray(window.SINO_DATA) ? window.SINO_DATA : [];
const grid = document.getElementById('tonesGrid');
const audio = document.getElementById('audioPlayer');
const quizAudio = document.getElementById('quizAudio');
const searchInput = document.getElementById('searchInput');
const filterRow = document.getElementById('filterRow');
const emptyState = document.getElementById('emptyState');
const heroNowTitle = document.getElementById('heroNowTitle');
const heroNowSubtitle = document.getElementById('heroNowSubtitle');
const heroBell = document.getElementById('heroBell');
const statToques = document.getElementById('statToques');
const infoModal = document.getElementById('infoModal');
const infoModalTitle = document.getElementById('infoModalTitle');
const infoModalText = document.getElementById('infoModalText');
const infoModalClose = document.getElementById('infoModalClose');
const infoModalPlay = document.getElementById('infoModalPlay');
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.querySelector('.nav-links');

let currentTone = null;
let currentFilter = 'Todos';
let infoTone = null;

statToques.textContent = tones.length;
audio.volume = 0.9;
quizAudio.volume = 0.9;

function fmt(seconds){
  if(!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
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
    <button class="filter-btn ${cat === currentFilter ? 'active' : ''}" data-filter="${escapeHtml(cat)}">${escapeHtml(cat)}</button>
  `).join('');
  filterRow.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      renderFilters();
      renderTones();
    });
  });
}

function filteredTones(){
  const q = searchInput.value.trim().toLowerCase();
  return tones.filter(t => {
    const inCategory = currentFilter === 'Todos' || (t.categoria || 'Outros') === currentFilter;
    const haystack = `${t.nome} ${t.resumo || ''} ${t.descricao || ''} ${t.categoria || ''}`.toLowerCase();
    return inCategory && haystack.includes(q);
  });
}

function currentProgressValue(){
  if(!currentTone || !audio.duration) return 0;
  return (audio.currentTime / audio.duration) * 100;
}

function renderTones(){
  const list = filteredTones();
  emptyState.classList.toggle('hidden', list.length > 0);

  grid.innerHTML = list.map((t) => {
    const active = currentTone?.id === t.id;
    const playing = active && !audio.paused;
    const currentTime = active ? fmt(audio.currentTime) : '0:00';
    const duration = active && Number.isFinite(audio.duration) ? fmt(audio.duration) : (t.duracao || '0:00');
    const progress = active ? currentProgressValue() : 0;

    return `
      <article class="tone-card ${active ? 'is-active' : ''} ${playing ? 'playing' : ''}" data-id="${escapeHtml(t.id)}">
        ${t.imagem ? `<div class="tone-thumb-wrap"><img class="tone-thumb" src="${escapeHtml(t.imagem)}" alt="Imagem ilustrativa para ${escapeHtml(t.nome)}"></div>` : ''}
        <div class="tone-card-body">
          <div class="tone-card-top">
            <span class="tone-category">${escapeHtml(t.categoria || 'Toque')}</span>
            <span class="tone-index">${String(tones.findIndex(item => item.id === t.id) + 1).padStart(2,'0')}</span>
          </div>
          <h3>${escapeHtml(t.nome)}</h3>
          <p class="tone-summary">${escapeHtml(t.resumo || t.descricao || '')}</p>

          <div class="card-player ${active ? 'active' : ''}">
            <div class="card-player-row">
              <button class="play-tone" data-id="${escapeHtml(t.id)}" aria-label="Ouvir ${escapeHtml(t.nome)}">${playing ? '❚❚ Pausar' : '▶ Ouvir toque'}</button>
              <button class="cloud-info-btn" data-info-id="${escapeHtml(t.id)}" aria-label="Abrir explicação de ${escapeHtml(t.nome)}">
                <span class="cloud-icon">☁</span>
                <b>Conheça este toque</b>
              </button>
            </div>
            <input class="card-progress" data-progress-id="${escapeHtml(t.id)}" type="range" min="0" max="100" value="${progress}" ${active ? '' : 'disabled'} />
            <div class="card-time-row">
              <span data-current-id="${escapeHtml(t.id)}">${currentTime}</span>
              <span data-duration-id="${escapeHtml(t.id)}">${duration}</span>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.play-tone').forEach(btn => btn.addEventListener('click', () => playTone(btn.dataset.id)));
  grid.querySelectorAll('.cloud-info-btn').forEach(btn => btn.addEventListener('click', () => openInfo(btn.dataset.infoId)));
  grid.querySelectorAll('.card-progress').forEach(input => {
    input.addEventListener('input', () => {
      if(currentTone?.id !== input.dataset.progressId || !audio.duration) return;
      audio.currentTime = (Number(input.value) / 100) * audio.duration;
      syncCurrentCardUi();
    });
  });

  syncCurrentCardUi();
}

function updateHero(){
  if(currentTone){
    heroNowTitle.textContent = currentTone.nome;
    heroNowSubtitle.textContent = currentTone.resumo || currentTone.descricao || '';
  } else {
    heroNowTitle.textContent = 'Selecione um toque';
    heroNowSubtitle.textContent = 'Clique em um card para ouvir o áudio e conhecer o significado.';
  }
}

function syncCurrentCardUi(){
  grid.querySelectorAll('.card-progress').forEach(input => {
    const active = currentTone?.id === input.dataset.progressId;
    input.disabled = !active;
    input.value = active && audio.duration ? currentProgressValue() : 0;
  });

  grid.querySelectorAll('[data-current-id]').forEach(el => {
    const active = currentTone?.id === el.dataset.currentId;
    el.textContent = active ? fmt(audio.currentTime) : '0:00';
  });

  grid.querySelectorAll('[data-duration-id]').forEach(el => {
    const tone = tones.find(item => item.id === el.dataset.durationId);
    const active = currentTone?.id === el.dataset.durationId;
    el.textContent = active && Number.isFinite(audio.duration) ? fmt(audio.duration) : (tone?.duracao || '0:00');
  });
}

function setPlayingUi(){
  heroBell.classList.toggle('playing', !!currentTone && !audio.paused);
  renderTones();
  updateHero();
}

function playTone(id){
  const tone = tones.find(t => t.id === id);
  if(!tone) return;
  quizAudio.pause();

  if(currentTone?.id === id){
    if(audio.paused){
      audio.play().catch(showAudioError);
    } else {
      audio.pause();
    }
    return;
  }

  currentTone = tone;
  audio.src = tone.arquivo;
  audio.currentTime = 0;
  updateHero();
  audio.play().catch(showAudioError);
  setPlayingUi();
}

function showAudioError(){
  heroNowSubtitle.textContent = 'Arquivo de áudio não encontrado. Verifique a pasta assets/audio/.';
  renderTones();
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
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && !infoModal.classList.contains('hidden')) closeInfo();
});
infoModalPlay.addEventListener('click', () => {
  if(infoTone){
    playTone(infoTone.id);
    closeInfo();
  }
});

audio.addEventListener('play', setPlayingUi);
audio.addEventListener('pause', setPlayingUi);
audio.addEventListener('ended', setPlayingUi);
audio.addEventListener('loadedmetadata', () => {
  renderTones();
});
audio.addEventListener('timeupdate', syncCurrentCardUi);

searchInput.addEventListener('input', renderTones);

menuBtn.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

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

function shuffle(arr){
  return [...arr].sort(() => Math.random() - .5);
}

function newQuizQuestion(){
  quizLocked = false;
  quizFeedback.textContent = '';
  nextQuestionBtn.classList.add('hidden');
  quizTone = tones[Math.floor(Math.random() * tones.length)] || null;
  if(!quizTone){
    quizOptions.innerHTML = '<div class="empty-state">Cadastre os toques em assets/data.js para ativar o quiz.</div>';
    quizListenBtn.disabled = true;
    return;
  }
  const distractors = shuffle(tones.filter(t => t.id !== quizTone.id)).slice(0, 2);
  const options = shuffle([quizTone, ...distractors]);
  quizOptions.innerHTML = options.map(t => `<button class="quiz-option" data-id="${escapeHtml(t.id)}">${escapeHtml(t.quizTexto || t.resumo || t.descricao)}</button>`).join('');
  quizOptions.querySelectorAll('.quiz-option').forEach(btn => btn.addEventListener('click', () => answerQuiz(btn)));
}

function answerQuiz(btn){
  if(quizLocked) return;
  quizLocked = true;
  quizOptions.querySelectorAll('.quiz-option').forEach(b => {
    b.disabled = true;
    if(b.dataset.id === quizTone.id) b.classList.add('correct');
  });
  if(btn.dataset.id === quizTone.id){
    quizScore++;
    btn.classList.add('correct');
    quizFeedback.textContent = '✅ Acertou! Muito bem!';
  } else {
    btn.classList.add('wrong');
    quizFeedback.textContent = `❌ Esse era o toque: ${quizTone.nome}`;
  }
  scoreLabel.textContent = `${quizScore} ${quizScore === 1 ? 'ponto' : 'pontos'}`;
  nextQuestionBtn.classList.remove('hidden');
}

quizListenBtn.addEventListener('click', () => {
  if(!quizTone) return;
  audio.pause();
  if(quizAudio.src.endsWith(quizTone.arquivo) && !quizAudio.paused){
    quizAudio.pause();
    return;
  }
  quizAudio.src = quizTone.arquivo;
  quizAudio.currentTime = 0;
  quizAudio.play().catch(() => {
    quizFeedback.textContent = 'Arquivo de áudio ainda não encontrado na pasta assets/audio/.';
  });
});
quizAudio.addEventListener('play', () => quizBell.classList.add('playing'));
quizAudio.addEventListener('pause', () => quizBell.classList.remove('playing'));
quizAudio.addEventListener('ended', () => quizBell.classList.remove('playing'));
nextQuestionBtn.addEventListener('click', () => {
  quizAudio.pause();
  newQuizQuestion();
});

renderFilters();
renderTones();
updateHero();
newQuizQuestion();
