const DATA_URL = './data/songs.json';
const STORAGE_KEY = 'healing-song-custom-songs';
const FALLBACK_SONGS = [
  {
    "title": "BRAIN",
    "artist": "Kanaria",
    "mood": "dreamy",
    "moodLabel": "몽환적인",
    "reason": "강한 비트와 신비로운 전자 사운드가 어두운 분위기 속에서 몰입감을 만들어 주는 곡입니다.",
    "lyric": "현실과 꿈 사이를 걷는 듯한 긴장감",
    "image": "assets/night.svg",
    "link": "https://www.youtube.com/watch?v=h4HkXR3NSI4"
  },
  {
    "title": "Serenade",
    "artist": "natori",
    "mood": "energetic",
    "moodLabel": "활기찬",
    "reason": "가볍게 움직이는 리듬과 선명한 보컬이 기분 전환이 필요할 때 잘 어울립니다.",
    "lyric": "발걸음을 조금 더 가볍게 만드는 리듬",
    "image": "assets/energy.svg",
    "link": "https://www.youtube.com/watch?v=gNg2Qw5R-Q4"
  }
];

const MOOD_META = {
  dreamy: { label: '몽환적인', image: 'assets/night.svg', lyric: '현실과 꿈 사이를 걷는 듯한 분위기' },
  energetic: { label: '활기찬', image: 'assets/energy.svg', lyric: '기분을 다시 움직이게 하는 리듬' },
  sentimental: { label: '애틋한', image: 'assets/memory.svg', lyric: '조용히 오래 남는 마음의 여운' },
  uplifting: { label: '가슴이 벅차오르는', image: 'assets/focus.svg', lyric: '앞으로 나아가고 싶게 만드는 벅찬 감정' },
  calm: { label: '차분함', image: 'assets/calm.svg', lyric: '차분하게 마음을 정리하는 시간' },
  focus: { label: '집중', image: 'assets/focus.svg', lyric: '생각을 모으고 흐름을 되찾는 시간' },
  energy: { label: '활력', image: 'assets/energy.svg', lyric: '멈춰 있던 하루를 다시 움직이는 에너지' }
};

const state = {
  baseSongs: [],
  customSongs: [],
  songs: [],
  currentFilter: 'all',
  lyricIndex: 0,
  lyricTimerId: null,
  isLyricPaused: false
};

const songGrid = document.querySelector('#songGrid');
const dataStatus = document.querySelector('#dataStatus');
const lyricText = document.querySelector('#lyricText');
const pauseSliderButton = document.querySelector('#pauseSlider');
const nextLyricButton = document.querySelector('#nextLyric');
const themeToggleButton = document.querySelector('#themeToggle');
const menuButton = document.querySelector('.site-header__menu-button');
const navigation = document.querySelector('#primary-navigation');
const toast = document.querySelector('#welcomeToast');
const filterButtons = document.querySelectorAll('.filter__button');
const songForm = document.querySelector('#songForm');
const formStatus = document.querySelector('#formStatus');
const clearCustomSongsButton = document.querySelector('#clearCustomSongs');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getSongId(song) {
  return `${song.artist}-${song.title}-${song.link}`.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-');
}

function getYouTubeVideoId(url) {
  try {
    const parsedUrl = new URL(url.trim());
    const host = parsedUrl.hostname.replace('www.', '');

    if (host === 'youtu.be') {
      return parsedUrl.pathname.split('/').filter(Boolean)[0] || '';
    }

    if (host.includes('youtube.com')) {
      if (parsedUrl.pathname.startsWith('/watch')) {
        return parsedUrl.searchParams.get('v') || '';
      }

      if (parsedUrl.pathname.startsWith('/embed/') || parsedUrl.pathname.startsWith('/shorts/')) {
        return parsedUrl.pathname.split('/').filter(Boolean)[1] || '';
      }
    }
  } catch (error) {
    return '';
  }

  return '';
}

function normalizeYouTubeLink(url) {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return url.trim();
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function getEmbedUrl(url) {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
}

function loadCustomSongsFromStorage() {
  try {
    const savedSongs = localStorage.getItem(STORAGE_KEY);
    state.customSongs = savedSongs ? JSON.parse(savedSongs) : [];
  } catch (error) {
    state.customSongs = [];
    formStatus.textContent = '저장된 노래 목록을 불러오지 못했습니다.';
  }
}

function saveCustomSongsToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.customSongs));
}

function syncSongs() {
  state.songs = [...state.baseSongs, ...state.customSongs];
}

async function loadSongs() {
  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error('JSON 파일을 불러오지 못했습니다.');
    }

    const data = await response.json();
    state.baseSongs = data.songs;
    dataStatus.textContent = `${state.baseSongs.length}개의 기본 추천곡과 ${state.customSongs.length}개의 직접 추가곡을 불러왔습니다.`;
  } catch (error) {
    state.baseSongs = FALLBACK_SONGS;
    dataStatus.textContent = `데이터 연결에 문제가 있어 예비 데이터를 표시합니다. 서버 환경에서 다시 확인하세요. (${error.message})`;
  }

  syncSongs();
  renderSongs();
  renderLyric();
  startLyricSlider();
}

function renderSongs() {
  syncSongs();
  const filteredSongs = state.currentFilter === 'all'
    ? state.songs
    : state.songs.filter((song) => song.mood === state.currentFilter);

  songGrid.innerHTML = '';

  filteredSongs.forEach((song) => {
    const songId = getSongId(song);
    const embedUrl = getEmbedUrl(song.link);
    const card = document.createElement('article');
    card.className = 'song-card';

    card.innerHTML = `
      <img class="song-card__image" src="${escapeHtml(song.image)}" alt="${escapeHtml(song.title)} 분위기를 표현한 앨범형 이미지" />
      <div class="song-card__body">
        <span class="song-card__mood">${escapeHtml(song.moodLabel)}</span>
        <h3 class="song-card__title">${escapeHtml(song.title)}</h3>
        <p class="song-card__artist">${escapeHtml(song.artist)}</p>
        <p class="song-card__reason">${escapeHtml(song.reason)}</p>
        ${embedUrl ? `
          <div class="song-card__player">
            <iframe src="${embedUrl}" title="${escapeHtml(song.title)} 유튜브 플레이어" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
          </div>
        ` : ''}
        <div class="song-card__actions">
          <a class="song-card__link" href="${escapeHtml(song.link)}" target="_blank" rel="noopener noreferrer">유튜브에서 바로 듣기</a>
          ${song.isCustom ? `<button class="song-card__pick" type="button" data-remove-custom="${escapeHtml(songId)}">추가한 곡 삭제</button>` : ''}
        </div>
      </div>
    `;

    songGrid.appendChild(card);
  });

  if (filteredSongs.length === 0) {
    songGrid.innerHTML = '<p class="status-message">선택한 감정에 해당하는 곡이 아직 없습니다. 아래 입력창에서 직접 추가해 보세요.</p>';
  }
}

function createCustomSong(formData) {
  const mood = formData.get('mood');
  const moodMeta = MOOD_META[mood] || MOOD_META.dreamy;
  const title = String(formData.get('title')).trim();
  const artist = String(formData.get('artist')).trim();
  const originalLink = String(formData.get('link')).trim();
  const reason = String(formData.get('reason')).trim() || `${moodMeta.label} 기분일 때 직접 추가한 추천곡입니다.`;
  const normalizedLink = normalizeYouTubeLink(originalLink);

  return {
    title,
    artist,
    mood,
    moodLabel: moodMeta.label,
    reason,
    lyric: moodMeta.lyric,
    image: moodMeta.image,
    link: normalizedLink,
    isCustom: true
  };
}

function validateSongForm(formData) {
  const title = String(formData.get('title')).trim();
  const artist = String(formData.get('artist')).trim();
  const link = String(formData.get('link')).trim();
  const mood = String(formData.get('mood')).trim();

  if (!title || !artist || !link || !mood) {
    return '노래 제목, 가수, 유튜브 링크, 기분을 모두 입력해야 합니다.';
  }

  try {
    const url = new URL(link);
    const isYouTube = url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be');
    if (!isYouTube) {
      return '유튜브 링크만 추가할 수 있습니다.';
    }
  } catch (error) {
    return '올바른 URL 형식으로 입력해 주세요.';
  }

  return '';
}

function handleSongSubmit(event) {
  event.preventDefault();
  const formData = new FormData(songForm);
  const errorMessage = validateSongForm(formData);

  if (errorMessage) {
    formStatus.textContent = errorMessage;
    showTemporaryToast(errorMessage);
    return;
  }

  const nextSong = createCustomSong(formData);
  const nextSongId = getSongId(nextSong);
  const alreadyAdded = state.customSongs.some((song) => getSongId(song) === nextSongId);

  if (alreadyAdded) {
    formStatus.textContent = '이미 추가한 노래입니다.';
    showTemporaryToast('이미 추가한 노래입니다.');
    return;
  }

  state.customSongs.push(nextSong);
  saveCustomSongsToStorage();
  renderSongs();
  renderLyric();
  songForm.reset();
  formStatus.textContent = `${nextSong.title} - ${nextSong.artist}를 ${nextSong.moodLabel} 추천곡에 추가했습니다.`;
  dataStatus.textContent = `${state.baseSongs.length}개의 기본 추천곡과 ${state.customSongs.length}개의 직접 추가곡을 불러왔습니다.`;
  showTemporaryToast('기분별 추천곡에 추가했습니다.');
}

function removeCustomSong(songId) {
  state.customSongs = state.customSongs.filter((song) => getSongId(song) !== songId);
  saveCustomSongsToStorage();
  renderSongs();
  renderLyric();
  dataStatus.textContent = `${state.baseSongs.length}개의 기본 추천곡과 ${state.customSongs.length}개의 직접 추가곡을 불러왔습니다.`;
  showTemporaryToast('직접 추가한 곡을 삭제했습니다.');
}

function clearCustomSongs() {
  if (state.customSongs.length === 0) {
    showTemporaryToast('삭제할 직접 추가곡이 없습니다.');
    return;
  }

  state.customSongs = [];
  saveCustomSongsToStorage();
  renderSongs();
  renderLyric();
  dataStatus.textContent = `${state.baseSongs.length}개의 기본 추천곡과 0개의 직접 추가곡을 불러왔습니다.`;
  formStatus.textContent = '직접 추가한 곡을 모두 삭제했습니다.';
  showTemporaryToast('직접 추가한 곡을 모두 삭제했습니다.');
}

function renderLyric() {
  syncSongs();
  if (state.songs.length === 0) {
    lyricText.textContent = '표시할 추천 문장이 없습니다.';
    return;
  }

  const currentSong = state.songs[state.lyricIndex % state.songs.length];
  lyricText.textContent = `“${currentSong.lyric}” — ${currentSong.title}`;
}

function moveToNextLyric() {
  state.lyricIndex += 1;
  renderLyric();
}

function startLyricSlider() {
  clearInterval(state.lyricTimerId);
  state.lyricTimerId = setInterval(moveToNextLyric, 3000);
  state.isLyricPaused = false;
  pauseSliderButton.textContent = '자동 전환 멈춤';
}

function stopLyricSlider() {
  clearInterval(state.lyricTimerId);
  state.isLyricPaused = true;
  pauseSliderButton.textContent = '자동 전환 다시 시작';
}

function showTemporaryToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');

  setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2200);
}

function handleFilterClick(event) {
  const nextFilter = event.currentTarget.dataset.filter;
  state.currentFilter = nextFilter;

  filterButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.filter === nextFilter);
  });

  renderSongs();
}

function handleThemeToggle() {
  document.body.classList.toggle('is-dark');
  const isDark = document.body.classList.contains('is-dark');
  themeToggleButton.setAttribute('aria-pressed', String(isDark));
  themeToggleButton.textContent = isDark ? '라이트 모드' : '다크 모드';
}

function handleMenuToggle() {
  navigation.classList.toggle('is-open');
  const isOpen = navigation.classList.contains('is-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
}

filterButtons.forEach((button) => button.addEventListener('click', handleFilterClick));
themeToggleButton.addEventListener('click', handleThemeToggle);
menuButton.addEventListener('click', handleMenuToggle);
nextLyricButton.addEventListener('click', moveToNextLyric);
pauseSliderButton.addEventListener('click', () => {
  if (state.isLyricPaused) {
    startLyricSlider();
  } else {
    stopLyricSlider();
  }
});

songGrid.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove-custom]');
  if (!removeButton) return;
  removeCustomSong(removeButton.dataset.removeCustom);
});

songForm.addEventListener('submit', handleSongSubmit);
clearCustomSongsButton.addEventListener('click', clearCustomSongs);

loadCustomSongsFromStorage();
showTemporaryToast('기분에 맞는 노래를 골라 보세요.');
loadSongs();
