# Rosario 3D — laboratorio gravità e presa laterale

Servito dalla cartella statica `/rosario3d/` su Render, indipendente dal lettore principale.

## Modello
Modellazione Three.js in geometrie tridimensionali, texture di legno/avorio/onice, medaglia, croce e 59 grani (53 piccoli e 6 grandi). Non usa foto piatte.

## Forze e limiti
- Gravità: ad ogni frame i grani e il crocifisso cadono verso il bordo inferiore, con inerzia e collisioni approssimate.
- Presa destra: una finestra laterale trattiene elasticamente **cinque grani consecutivi**. Scorrendo, il gruppo di cinque cambia, come se il pollice lasciasse passare il filo.
- Appoggio sinistro: un singolo grano dell'anello, dalla parte opposta alla presa, è richiamato verso un piccolo anello a sinistra **alla stessa altezza**. Il vincolo elastico è più debole e cede al trascinamento diretto. Il grano associato cambia durante lo scorrimento, mantenendo la corona aperta senza immobilizzarla.
- Vincoli: pareti dello schermo su ogni grano, non spostamento/zoom di tutta l'immagine.
- Grandezza naturale *nominale*: grano piccolo circa 9 mm CSS (~34 px), senza zoom o adattamento all'intera corona. La misura fisica esatta richiederebbe calibrazione per dispositivo; è un'approssimazione.

## Interazione
- Tocca e trascina un grano: sposti il grano e tiri i collegamenti.
- Tocca due grani: due trascinamenti indipendenti.
- Trascina lo sfondo o la zona di presa verticalmente: fai passare i grani nella finestra, mantenendo la scala invariata.
- Rotellina su desktop: scorri i grani nella finestra, non ingrandisci.
- Ripristina ricrea la posa iniziale e la lascia assestare sotto gravità.

La simulazione è intenzionalmente sperimentale: la gravità e le collisioni sono approssimate con Verlet e vincoli, non un motore rigid-body completo. Three.js è importata da CDN. Il lettore principale di Rosario resta invariato.
