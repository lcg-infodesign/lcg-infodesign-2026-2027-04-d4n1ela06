let data;
let backgroundColor = '#EDE9DD';
let accentColor = '#9B3329';
let discColor = '#1D1F24';
let hoverColor = '#E0584A';

let selectedAlbumId;

// Gli indicatori mostrati come cursori verticali e come anelli del disco.
// "min" e "max" sono gli estremi della scala
// "mean" è la media dei 100 album del dataset.
let indicators = [
  {
    name: "Popolarità", column: "popolarita", min: 0, max: 100, decimals: 1, mean: 0,
    description: "Indice Spotify da 0 a 100 che indica quanto sono ascoltati i brani dell'album."
  },
  {
    name: "Danceability", column: "danzabilita", min: 0, max: 1, decimals: 3, mean: 0,
    description: "Descrive quanto un brano è adatto al ballo, in base a tempo, stabilità del ritmo, forza del beat e regolarità generale. 0.0 è il meno ballabile, 1.0 il più ballabile."
  },
  {
    name: "Energy", column: "energia", min: 0, max: 1, decimals: 3, mean: 0,
    description: "Misura da 0.0 a 1.0 dell'intensità e dell'attività percepite. I brani energici sembrano veloci, forti e rumorosi: il death metal ha energia alta, un preludio di Bach bassa."
  }
];

// Il mouse è sopra il link "Homepage"?
let backHovered = false;

// Indice del cursore sotto il mouse: -1 se il mouse non è su nessun cursore
let hoveredIndicator = -1;

async function setup() {
  createCanvas(windowWidth, windowHeight);

  // Legge i parametri passati nell'URL e salva l'id dell'album selezionato.
  let params = getURLParams();
  selectedAlbumId = params.album;

  data = await loadTable("assets/album_selezionati.csv", ",", "header");

  // Calcola la media dei 100 album per ogni indicatore.
  for (let ind of indicators) {
    let total = 0;
    for (let rowNumber = 0; rowNumber < data.getRowCount(); rowNumber++) {
      total += data.getNum(rowNumber, ind.column);
    }
    ind.mean = total / data.getRowCount();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(backgroundColor);

  // Se i dati non sono ancora stati caricati non c'è niente da disegnare.
  if (!data) {
    return;
  }

  // Link per tornare alla homepage
  textStyle(NORMAL);
  textSize(14);
  textAlign(LEFT, TOP);
  let backLabel = "← Homepage";
  backHovered = mouseX > 20 && mouseX < 20 + textWidth(backLabel) && mouseY > 20 && mouseY < 40;
  noStroke();
  fill(backHovered ? accentColor : discColor);
  text(backLabel, 20, 20);
  cursor(backHovered ? HAND : ARROW);

  // Cerca nel CSV la riga con l'id passato nell'URL.
  let albumRow = data.findRow(selectedAlbumId, "id");

  if (!albumRow) {
    fill(discColor);
    textSize(18);
    text("Album non trovato. Torna alla homepage e scegline uno.", 20, 70);
    return;
  }

  let artist = albumRow.get("artista");
  let album = albumRow.get("album");
  let tracks = albumRow.get("tracce");

  // Misure della zona dei cursori (servono anche per sapere quale cursore è sotto il mouse)
  let left = width * 0.5;
  let colWidth = (width * 0.46) / indicators.length;
  let trackTop = height * 0.2;
  let trackBottom = height * 0.66;
  let trackWidth = 22;

  // Quale colonna (cursore + nome) è sotto il mouse?
  hoveredIndicator = -1;
  for (let i = 0; i < indicators.length; i++) {
    let colLeft = left + i * colWidth;
    if (mouseX > colLeft && mouseX < colLeft + colWidth && mouseY > trackTop - 20 && mouseY < trackBottom + 60) {
      hoveredIndicator = i;
    }
  }

  // Disco a sinistra
  let cx = width * 0.25;
  let cy = height * 0.47;
  let radius = min(width * 0.22, height * 0.4);
  let labelRadius = radius * 0.47;

  noStroke();
  fill(discColor);
  circle(cx, cy, radius * 2);

  // Anelli del disco: uno per indicatore, dall'esterno verso il centro
  // (stesso ordine dei cursori: popolarità, danceability, energy)
  let ringThickness = radius * 0.1;
  for (let i = 0; i < indicators.length; i++) {
    let ind = indicators[i];
    let ringRadius = radius * (0.88 - i * 0.14);
    let value = float(albumRow.get(ind.column));

    // Giro completo = valore massimo della scala (la stessa dei cursori)
    let valueAngle = map(value, ind.min, ind.max, 0, TWO_PI);
    let meanAngle = map(ind.mean, ind.min, ind.max, 0, TWO_PI);

    noFill();
    strokeCap(SQUARE); // estremità piatte (in p5 SQUARE = estremità senza prolungamento)
    strokeWeight(ringThickness);

    // Binario dell'anello
    stroke(52);
    circle(cx, cy, ringRadius * 2);

    // Arco del valore: parte dall'alto e gira in senso orario.
    // Diventa rosso chiaro se il mouse è sul cursore corrispondente.
    stroke(i === hoveredIndicator ? hoverColor : accentColor);
    arc(cx, cy, ringRadius * 2, ringRadius * 2, -HALF_PI, -HALF_PI + valueAngle, OPEN);

    // Tacca chiara della media dei 100 album
    let a = -HALF_PI + meanAngle;
    let r1 = ringRadius - ringThickness / 2;
    let r2 = ringRadius + ringThickness / 2;
    stroke(backgroundColor);
    strokeWeight(3);
    line(cx + r1 * cos(a), cy + r1 * sin(a), cx + r2 * cos(a), cy + r2 * sin(a));
  }
  strokeCap(ROUND);

  // Etichetta centrale
  noStroke();
  fill(backgroundColor);
  circle(cx, cy, labelRadius * 2);

  let boxWidth = labelRadius * 1.6;
  textAlign(CENTER, CENTER);

  fill(accentColor);
  textStyle(BOLD);
  textSize(radius * 0.075);
  text(artist, cx - boxWidth / 2, cy - labelRadius * 0.55, boxWidth, labelRadius * 0.3);

  fill(discColor);
  textStyle(NORMAL);
  textSize(radius * 0.062);
  text(album, cx - boxWidth / 2, cy - labelRadius * 0.3, boxWidth, labelRadius * 0.5);

  textSize(radius * 0.05);
  text(tracks + " tracce nel dataset", cx - boxWidth / 2, cy + labelRadius * 0.3, boxWidth, labelRadius * 0.25);

  // Titolo e istruzione della zona dei cursori
  fill(discColor);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(24);
  text("Informazioni sull'album", left, height * 0.07);
  textStyle(NORMAL);
  textSize(13);
  text("Passa il mouse su un cursore per sapere cosa misura", left, height * 0.07 + 26);

  // Cursori verticali
  for (let i = 0; i < indicators.length; i++) {
    let ind = indicators[i];
    let value = float(albumRow.get(ind.column));
    let sliderX = left + i * colWidth + colWidth * 0.5 + 14;

    // Scala: 6 tacche da min a max
    textAlign(RIGHT, CENTER);
    textSize(11);
    for (let t = 0; t <= 5; t++) {
      let tickValue = map(t, 0, 5, ind.min, ind.max);
      let tickY = map(tickValue, ind.min, ind.max, trackBottom, trackTop);
      stroke(accentColor);
      strokeWeight(0.5);
      line(sliderX - 20, tickY, sliderX - 14, tickY);
      noStroke();
      fill(discColor);
      if (ind.max === 1) {
        text(nf(tickValue, 1, 1), sliderX - 24, tickY);
      } else {
        text(tickValue, sliderX - 24, tickY);
      }
    }

    // Binario del cursore
    noStroke();
    fill(discColor);
    rect(sliderX - trackWidth / 2, trackTop - 8, trackWidth, trackBottom - trackTop + 16, trackWidth / 2);

    // Tacca della media dei 100 album
    let meanY = map(ind.mean, ind.min, ind.max, trackBottom, trackTop);
    stroke(backgroundColor);
    strokeWeight(3);
    line(sliderX - trackWidth / 2, meanY, sliderX + trackWidth / 2, meanY);

    // Cursore dell'album
    let valueY = map(value, ind.min, ind.max, trackBottom, trackTop);
    stroke(backgroundColor);
    strokeWeight(3);
    fill(i === hoveredIndicator ? hoverColor : accentColor);
    circle(sliderX, valueY, 26);

    // Valore numerico accanto al cursore
    noStroke();
    fill(accentColor);
    textStyle(BOLD);
    textSize(14);
    textAlign(LEFT, CENTER);
    text(nf(value, 1, ind.decimals), sliderX + 22, valueY);

    // Nome e media sotto il cursore. Se il mouse è sulla colonna il nome diventa rosso
    fill(i === hoveredIndicator ? accentColor : discColor);
    textAlign(CENTER, TOP);
    textSize(15);
    text(ind.name, sliderX, trackBottom + 22);
    textStyle(NORMAL);
    textSize(12);
    text("media " + nf(ind.mean, 1, ind.decimals), sliderX, trackBottom + 44);
  }

  // Definizione dell'indicatore sotto il mouse
  let boxX = left;
  let boxY = trackBottom + 72;
  let boxW = width * 0.46;
  textAlign(LEFT, TOP);
  textSize(14);
  if (hoveredIndicator >= 0) {
    fill(accentColor);
    textStyle(BOLD);
    text(indicators[hoveredIndicator].name, boxX, boxY);
    fill(discColor);
    textStyle(NORMAL);
    text(indicators[hoveredIndicator].description, boxX, boxY + 22, boxW, 80);
  }

  // Legenda
  let legendY = height - 22;
  noStroke();
  fill(discColor);
  textAlign(LEFT, CENTER);
  textStyle(NORMAL);
  textSize(12);
  text("Anelli del disco, dall'esterno verso il centro: popolarità, danceability, energy (stesse scale dei cursori)", 20, legendY - 24);

  fill(accentColor);
  circle(28, legendY, 14);
  fill(discColor);
  text("media delle tracce dell'album", 42, legendY);

  rect(250, legendY - 8, 22, 16, 8);
  stroke(backgroundColor);
  strokeWeight(3);
  line(250, legendY, 272, legendY);
  noStroke();
  fill(discColor);
  text("rispetto alla media dei 100 album selezionati", 282, legendY);
}

function mousePressed() {
  if (backHovered) {
    window.location.href = "index.html";
  }
}