# Rosario 2.0

Prototipo statico di una webapp per recitare il Rosario con una corona interattiva, guida vocale del browser e una modalità test ispirata a **Maria che scioglie i nodi**.

## Stato

- Homepage provvisoria senza login.
- Area app con sezioni placeholder: Rosario, Misteri, Intenzioni, Diario, Profilo.
- Pagina dedicata `rosario.html` con testo a sinistra e filo di grani verticale,
  scorrevole al tocco, a destra.
- Rosario funzionante con autoplay tramite Web Speech API.
- Modalità demo breve e toggle per Rosario completo.
- Struttura pronta per essere pubblicata come Static Site su Render.

## Fonti usate per la struttura

- [Vatican.va — I Misteri del Santo Rosario](https://www.vatican.va/special/rosary/documents/misteri.html)
- [Vatican.va — Misteri Dolorosi, esempio di decina](https://www.vatican.va/special/rosary/documents/misteri_dolorosi_it.html)
- [Radio Maria — Come si recita il Santo Rosario](https://radiomaria.it/preghiere/santo-rosario/)
- [Radio Maria — Novena a Maria che scioglie i nodi](https://radiomaria.it/preghiere/coroncine-e-novene/novena-a-maria-che-scioglie-i-nodi/)

La prima versione non scarica audio: usa la sintesi vocale nativa del browser. Questo rende il prototipo leggero e deployabile come sito statico puro.

## Sviluppo locale

Apri `index.html` nel browser oppure avvia un server statico:

```bash
python -m http.server 4173
```

Poi visita `http://localhost:4173`.

## Deploy su Render

1. Crea una nuova repository GitHub e pusha questi file.
2. Su Render scegli **New > Static Site**.
3. Collega la repository.
4. Imposta:
   - Build Command: vuoto oppure `echo static`
   - Publish Directory: `.`

In alternativa puoi usare il blueprint `render.yaml`.

## Prossimi step

- Integrare Clerk nella sezione Profilo.
- Salvare intenzioni e progressi utente.
- Aggiungere calendario dei misteri.
- Sostituire la Web Speech API con audio TTS generato e sincronizzato a timestamp.
- Aggiungere testi completi della novena a Maria che scioglie i nodi, con selezione dei nove giorni.
