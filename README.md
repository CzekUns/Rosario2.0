# Rosario 2.0

Web app statica e installabile per accompagnare la recita del Rosario. Mostra il testo a sinistra e, a destra, un filo di grani da reggere e far avanzare con il pollice.

## Funzioni

- Misteri gaudiosi, luminosi, dolorosi e gloriosi.
- Selezione automatica dei misteri in base al giorno, con scelta manuale.
- Rosario completo oppure singola decina selezionabile.
- Grani grandi con zona di presa, risposta alla pressione e vibrazione sui dispositivi compatibili.
- Avanzamento strettamente sequenziale: il filo non funziona come menu e non consente di saltare preghiere.
- Codici accanto ai grani nel formato `Mis.5-7`.
- Tre modalità: audio automatico, audio con avanzamento gestito dall’utente e recita senza audio.
- Registrazioni Ogg/Opus dal Drive «Rosario App» per Credo, Padre Nostro, Ave Maria, Gloria e preghiera di fine mistero; senza download ripetuti grazie alla cache offline.
- Guida tramite Web Speech API per introduzione, brani biblici, conclusioni e fallback sui browser senza Ogg/Opus (la compatibilità varia secondo il dispositivo).
- Ritmo regolabile e pausa/ripresa.
- Salvataggio locale di avanzamento e preferenze, senza account.
- Intenzione personale facoltativa, non salvata e letta soltanto su richiesta.
- Web app installabile e interfaccia disponibile offline dopo la prima apertura.

## Struttura

- `index.html`: ingresso rapido, misteri del giorno e ripresa della recita.
- `rosario.html`: lettore del Rosario.
- `rosary-data.js`: testi, misteri e generazione della sequenza.
- `app.js`: stato del lettore, grani, persistenza, riproduzione di registrazioni e sintesi vocale.
- `assets/audio/`: cinque registrazioni originali in Ogg/Opus; aggiungere nuovi file e la mappatura in `app.js` per completare l'audio reale.
- `home.js`: contenuti dinamici della pagina iniziale.
- `sw.js` e `manifest.webmanifest`: installazione e uso offline.
- `tests/rosary-data.test.js`: controlli sulla sequenza e sulla mappatura dei grani.
- `tests/reader-contract.test.js`: controlli sulle modalità e sull’avanzamento sequenziale.

## Sviluppo locale

Avvia un server statico dalla cartella del progetto:

```bash
python -m http.server 4173
```

Poi visita `http://localhost:4173`.

Per verificare dati e sequenza:

```bash
node tests/rosary-data.test.js
node tests/reader-contract.test.js
```

## Deploy su Render

Il file `render.yaml` configura un sito statico con directory pubblica `.`. Ogni aggiornamento di `main` viene pubblicato dal servizio Render collegato alla repository.

## Fonti della struttura

- [Vatican.va — I Misteri del Santo Rosario](https://www.vatican.va/special/rosary/documents/misteri.html)
- [Radio Maria — Come si recita il Santo Rosario](https://radiomaria.it/preghiere/santo-rosario/)

Le registrazioni reali hanno priorità: la voce sintetica interviene per i testi non registrati o se Ogg/Opus non è supportato. Il file «Fine Mistero» è associato alla preghiera di Fatima al termine di ogni decina; verificare che la registrazione corrisponda al testo. La prima visita installa i file nella cache offline della PWA.
