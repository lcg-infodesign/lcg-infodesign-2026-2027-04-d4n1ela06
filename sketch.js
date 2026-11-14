let data;
let backgroundColor = '#EDE9DD';
let accentColor = '#9B3329';
let discColor = '#1D1F24';
let hoverColor = '#E0584A'; 

let numberOfAlbums = 0;

// Variabili per l'interazione col mouse
let hoveredIndex = -1;
let hoveredId = null;


async function setup() {
  
  createCanvas(windowWidth, windowHeight);

  
  data = await loadTable("assets/album_selezionati.csv", ",", "header");

  // Ogni riga del CSV è un album: il numero di righe serve a dividere il disco in spicchi uguali.
  numberOfAlbums = data.getRowCount();
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Testo accorciato in modo che stia dentro maxWidth.
function shortenText(txt, maxWidth) {
  while (txt.length > 1 && textWidth(txt) > maxWidth) {
    txt = txt.slice(0, -2) + "…";
  }
  return txt;
}

// Trasforma la durata in minuti decimali
function formatDuration(minutes) {
  let m = floor(minutes);
  let s = round((minutes - m) * 60);
  if (s === 60) {
    m += 1;
    s = 0;
  }
  return m + ":" + nf(s, 2);
}

// Titolo e sottotitolo 
function drawTitle() {
  let textWidthMax = min(300, width * 0.25);

  // Titolo in rosso con una linea sottile sotto
  noStroke();
  fill(accentColor);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(36);
  text("SPOTIFY TRACKS", 28, 24);

  stroke(accentColor);
  strokeWeight(1.5);
  line(28, 76, 28 + textWidthMax, 76);

  // Sottotitolo: cosa contiene il dataset
  noStroke();
  fill(discColor);
  textStyle(NORMAL);
  textSize(14);
  text(
    "Tracce di Spotify di 114 generi. " +
    "Il disco mostra i 100 album più popolari (almeno 10 tracce e un solo artista accreditato), in ordine alfabetico per artista. ",
    28, 92, textWidthMax, 200
  );

}

function draw() {
  background(backgroundColor);


  if (numberOfAlbums === 0) {
    return;
  }

  // Centro e raggio del disco
  let cx = width / 2;
  let cy = height / 2;
  let radius = min(width, height) * 0.46;

  // Etichetta del disco + punto da cui partono i nomi.
  let labelRadius = radius * 0.30;
  let textStart = radius * 0.36;
  let textEnd = radius * 0.96;

  // Ogni album occupa uno spicchio dell'angolo giro.
  let step = TWO_PI / numberOfAlbums;

  //Disco
  noStroke();
  fill(discColor);
  circle(cx, cy, radius * 2);

  // Solchi del disco
  noFill();
  stroke(60);
  strokeWeight(1);
  circle(cx, cy, radius * 1.98);
  circle(cx, cy, radius * 1.1);
  circle(cx, cy, radius * 0.8);

  // Inidca quale album è sotto il mouse
  hoveredIndex = -1;
  hoveredId = null;

  let dx = mouseX - cx;
  let dy = mouseY - cy;
  let distance = sqrt(dx * dx + dy * dy);

  // Il mouse conta solo se sta sulla zona dei nomi
  if (distance > textStart * 0.9 && distance < radius) {
    // Angolo del mouse, contato dall'alto in senso orario
    let angle = atan2(dy, dx) + HALF_PI;
    if (angle < 0) {
      angle += TWO_PI;
    }
    hoveredIndex = round(angle / step) % numberOfAlbums;
    hoveredId = data.getString(hoveredIndex, "id");
  }

  //Nomi a raggiera
  noStroke();
  textSize(max(6, textStart * step * 0.85));

  for (let i = 0; i < numberOfAlbums; i++) {
    let artist = data.getString(i, "artista");
    let album = data.getString(i, "album");

    // Angolo dell'album: il primo parte dall'alto.
    let angle = i * step - HALF_PI;

    push();
    translate(cx, cy);
    rotate(angle);

    // Sulla metà sinistra il testo verrebbe capovolto quindi lo si ruota di 180°.
    let leftSide = cos(angle) < 0;
    if (leftSide) {
      rotate(PI);
      textAlign(RIGHT, CENTER);
    } else {
      textAlign(LEFT, CENTER);
    }

    
  if (i === hoveredIndex) {
    fill(hoverColor);
  } else {
    fill(240);
  }

    let label = shortenText(artist + " – " + album, textEnd - textStart);
    if (leftSide) {
      text(label, -textStart, 0);
    } else {
      text(label, textStart, 0);
    }
    pop();
  }

  //Etichetta centrale con le informazioni
  noStroke();
  fill(backgroundColor);
  circle(cx, cy, labelRadius * 2);

  let boxWidth = labelRadius * 1.6;
  fill(discColor);
  textAlign(CENTER, CENTER);


  if (hoveredIndex >= 0) {
    let artist = data.getString(hoveredIndex, "artista");
    let album = data.getString(hoveredIndex, "album");
    let duration = data.getNum(hoveredIndex, "durata_min");

    // Artista: grassetto e rosso
    fill(accentColor);
    textStyle(BOLD);
    textSize(radius * 0.045);
    text(artist, cx - boxWidth / 2, cy - labelRadius * 0.5, boxWidth, labelRadius * 0.3);

    // Album: testo scuro
    fill(discColor);
    textStyle(NORMAL);
    textSize(radius * 0.038);
    text(album, cx - boxWidth / 2, cy - labelRadius * 0.3, boxWidth, labelRadius * 0.5);

    fill(accentColor);
    textSize(radius * 0.04);
    text("Durata media: " + formatDuration(duration), cx - boxWidth / 2, cy + labelRadius * 0.15, boxWidth, labelRadius * 0.25);
  } else {
    textStyle(NORMAL);
    textSize(radius * 0.04);
    text("Passa il mouse su un album", cx - boxWidth / 2, cy - labelRadius * 0.3, boxWidth, labelRadius * 0.6);
  }

   // Il puntatore diventa una mano sopra un album cliccabile.
  if (hoveredIndex >= 0) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }

  drawTitle();
}


function mousePressed() {
  
  if (hoveredId !== null) {
    window.location.href = "index_detail.html?album=" + hoveredId;
  }
}