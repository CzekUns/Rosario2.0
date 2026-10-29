# Rosario 3D — laboratorio indipendente

Esperimento frontend in `/rosario3d/`, senza modificare il lettore principale.

## Costruzione

Modello Three.js creato interamente con geometrie 3D reali e texture procedurali Canvas (legno, avorio, onice), niente fotografie appiattite. Una corona tradizionale contiene **59 grani**:
- anello con 50 Ave Maria e 4 Padre Nostro separatori
- medaglia al raccordo
- coda con 3 Ave Maria e 2 Padre Nostro
- crocifisso modellato in tre dimensioni

La medaglia sostituisce il raccordo fra quinta e prima decina. Corda e grani si muovono insieme, con ritorno elastico.

## Gesti

- Un dito su un grano: trascina quel grano, che trascina i vicini tramite connessioni elastiche.
- Due dita su due grani: manipola entrambi.
- Un dito sullo sfondo: ruota il modello in 3D.
- Due dita sullo sfondo (o una sullo sfondo e una sul grano): ingrandisci/riduci, ruota sul piano e sposta la corona.
- Mouse: trascina; rotellina per ingrandire.
- Pulsanti: materiali, ripristino, visualizzazione senza controlli.
- Tastiera: frecce per selezionare il grano, Esc o R per ripristinare.

I bordi della viewport limitano lo spostamento e le trasformazioni del modello (la scala viene ridotta se è impossibile contenerlo).

## Hosting e prestazioni

Funziona come file statico su GitHub Pages / Render, senza backend e senza build.
Three.js 0.186.1 (licenza MIT) è importata da jsDelivr con versione bloccata.
Al primo caricamento **serve una connessione Internet** per la libreria 3D; non è inclusa nella cache offline della PWA principale.
Materiali e texture sono generati localmente; i file non vengono caricati da Drive.

Non è ancora la versione definitiva della recita: questo percorso serve per provare l'interazione e raccogliere feedback tattile.
