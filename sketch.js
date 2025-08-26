const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'fmsine' },
  envelope: { attack: 0.2, decay: 0.2, sustain: 0.5, release: 1.0 }
}).toDestination();

const scale = ['G5', 'D5', 'A4', 'F#4', 'D4', 'G3'];
const numPitches = scale.length;
let notes = [];
const numSteps = 16;
let currentStep = -1;
let isPlaying = false;

// --- 화면 레이아웃 및 UI 요소 변수 ---
const headerHeight = 355;
const footerHeight = 238;
const sideMargin = 127;

let gridArea = {};
let playButton = {};
let progressBar = {};
let resetButton = {}; // 새로고침 버튼 객체 추가

let stepWidth, pitchHeight;
let img;

function preload(){
  img = loadImage('bgImage.png');
}
function setup() {
  createCanvas(1920, 1080);


  // 그리드 영역 계산
  gridArea = {
    x: sideMargin,
    y: headerHeight,
    width: width - sideMargin * 2, // 오른쪽 여백도 고려
    height: height - headerHeight - footerHeight
  };

  // 푸터 UI 요소 위치 계산
  playButton = {
    x: width - sideMargin - 350,
    y: gridArea.y + gridArea.height + 85,
    w: 162,
    h: 61
  };
  progressBar = {
    x: sideMargin,
    y: playButton.y + 23,
    w: gridArea.width - playButton.w - 220,
    h: 18
  };

  // 새로고침 버튼 위치 계산
  resetButton = {
    x: playButton.x + playButton.w + 24,
    y: gridArea.y + gridArea.height + 85,
    w: 162,
    h: 61
  };

  stepWidth = gridArea.width / numSteps;
  pitchHeight = gridArea.height / numPitches;

  // 시퀀서 설정
  const steps = Array.from(Array(numSteps).keys());
  new Tone.Sequence((time, step) => {
    currentStep = step;
    const notesToPlay = notes.filter(note => note.step === step);
    if (notesToPlay.length > 0) {
      const pitches = notesToPlay.map(note => note.pitch);
      synth.triggerAttackRelease(pitches, '8n', time);
    }
  }, steps, '8n').start(0);

  Tone.Transport.bpm.value = 100;
  Tone.Transport.loop = true;
  Tone.Transport.loopStart = 0;
  Tone.Transport.loopEnd = '2m';
}

// p5.js 그리기 함수
function draw() {
  image(img, 0, 0, width, height);
  
  drawHeader();
  drawResetButton(); // 새로고침 버튼 그리기
  drawGrid();
  drawNotes();

  if (isPlaying) {
    drawPlaybackBar();
  }

  drawFooter();
}

// 마우스 클릭 이벤트 처리 함수
function mousePressed() {
  // 1. 새로고침 버튼 클릭 확인
  if (mouseX > resetButton.x && mouseX < resetButton.x + resetButton.w &&
      mouseY > resetButton.y && mouseY < resetButton.y + resetButton.h) {
    resetSequencer();
    return;
  }

  // 2. 재생/멈춤 버튼 클릭 확인
  if (mouseX > playButton.x && mouseX < playButton.x + playButton.w &&
      mouseY > playButton.y && mouseY < playButton.y + playButton.h) {
    togglePlayPause();
    return;
  }

  // 3. 진행 바 클릭 확인 (탐색 기능)
  if (mouseX > progressBar.x && mouseX < progressBar.x + progressBar.w &&
      mouseY > progressBar.y && mouseY < progressBar.y + progressBar.h) {
    const seekRatio = constrain((mouseX - progressBar.x) / progressBar.w, 0, 1);
    const loopDuration = Tone.Transport.loopEnd;
    Tone.Transport.position = seekRatio * Tone.Time(loopDuration).toSeconds();
    if (Tone.context.state !== 'running') {
      Tone.start();
    }
    return;
  }

  // 4. 그리드 영역 클릭 확인 (노트 추가)
  if (mouseX > gridArea.x && mouseX < gridArea.x + gridArea.width &&
      mouseY > gridArea.y && mouseY < gridArea.y + gridArea.height) {
    
    if (Tone.context.state !== 'running') {
      Tone.start();
    }

    const mouseInGridX = mouseX - gridArea.x;
    const mouseInGridY = mouseY - gridArea.y;

    const step = Math.floor(mouseInGridX / stepWidth);
    const pitchIndex = Math.floor(mouseInGridY / pitchHeight);

    // 같은 위치에 이미 노트가 있는지 확인
    const existingNoteIndex = notes.findIndex(note => note.step === step && note.pitchIndex === pitchIndex);

    if (existingNoteIndex > -1) {
      // 노트가 있으면 제거
      notes.splice(existingNoteIndex, 1);
    } else {
      // 노트가 없으면 추가
      const pitch = scale[pitchIndex];
      const noteY = gridArea.y + pitchIndex * pitchHeight + pitchHeight / 2;
      const newNote = {
        x: gridArea.x + step * stepWidth + stepWidth / 2,
        y: noteY,
        pitch: pitch,
        step: step,
        pitchIndex: pitchIndex
      };
      notes.push(newNote);
      synth.triggerAttackRelease(pitch, '8n');
    }
  }
}

// --- 그리기 및 제어 함수들 ---

function drawHeader() {
  fill(80);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(28);
  text("", sideMargin, headerHeight / 2);
}

function drawResetButton() {
  stroke(255);
  strokeWeight(2);
  fill('#ffffff');
  rect(resetButton.x, resetButton.y, resetButton.w, resetButton.h, 60);
  fill(50);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(32);
  text('reset', resetButton.x + resetButton.w / 2, resetButton.y + resetButton.h / 2);
}

function drawGrid() {
  for (let i = 0; i < numPitches; i++) {
    const y = gridArea.y + i * pitchHeight;
    stroke(230);
    line(gridArea.x, y, gridArea.x + gridArea.width, y);
    noStroke();
    fill(150);
    textAlign(CENTER, CENTER);
    text(scale[i], gridArea.x - (sideMargin / 2), y + pitchHeight / 2);
  }
  stroke(230);
  line(gridArea.x, gridArea.y + gridArea.height, gridArea.x + gridArea.width, gridArea.y + gridArea.height);

  for (let i = 0; i <= numSteps / 4; i++) {
    const x = gridArea.x + i * (stepWidth * 4);
    stroke(200);
    strokeWeight(2);
    line(x, gridArea.y, x, gridArea.y + gridArea.height);
    if (i < numSteps / 4) {
      noStroke();
      fill(120);
      text(i + 1, x + (stepWidth * 2), gridArea.y - 20);
    }
  }
}

function drawNotes() {
  for (const note of notes) {
    fill('#ff3700');
    noStroke();
    ellipse(note.x, note.y, stepWidth * 0.5);
  }
}

function drawPlaybackBar() {
  const x = gridArea.x + currentStep * stepWidth;
  fill(255, 0, 0, 80);
  noStroke();
  rect(x, gridArea.y, stepWidth, gridArea.height);
}

function drawFooter() {
  noStroke();
  fill(isPlaying ? '#9F93DF' : '#FF3700');
  rect(playButton.x, playButton.y, playButton.w, playButton.h, 60);
  fill(0);
  noStroke();
  text(isPlaying ? 'stop' : 'start', playButton.x + playButton.w / 2, playButton.y + playButton.h / 2);

  noFill();
  stroke(150);
  rect(progressBar.x, progressBar.y, progressBar.w, progressBar.h, 4);
  if (isPlaying) {
    noStroke();
    fill('#FF3700');
    const progress = Tone.Transport.progress;
    rect(progressBar.x, progressBar.y, progressBar.w * progress, progressBar.h, 4);
  }
}

function togglePlayPause() {
  if (isPlaying) {
    Tone.Transport.pause();
    isPlaying = false;
  } else {
    if (Tone.context.state !== 'running') {
      Tone.start();
    }
    Tone.Transport.start();
    isPlaying = true;
  }
}

// 새로고침(리셋) 함수
function resetSequencer() {
  notes = []; // 모든 노트 삭제
  if (isPlaying) {
    Tone.Transport.stop(); // 재생 멈춤
    isPlaying = false; // 재생 상태 리셋
  }
  Tone.Transport.position = 0; // 재생 위치 처음으로
  currentStep = -1; // 현재 스텝 리셋
}