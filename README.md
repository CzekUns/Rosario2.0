# Rosario 2.0

Web app statica e installabile per accompagnare la recita del Rosario. Mostra il testo a sinistra e un filo di grani verticale, scorrevole al tocco, a destra.

## Funzioni

- Misteri gaudiosi, luminosi, dolorosi e gloriosi.
- Selezione automatica dei misteri in base al giorno, con scelta manuale.
- Rosario completo oppure singola decina selezionabile.
- Codici accanto ai grani nel formato `Mis.5-7`.
- Guida tramite Web Speech API con scelta automatica della voce italiana migliore disponibile.
- Ritmo regolabile, pausa/ripresa e avanzamento automatico.
- Salvataggio locale di avanzamento e preferenze, senza account.
- Intenzione personale facoltativa, non salvata e letta soltanto su richiesta.
- Web app installabile e interfaccia disponibile offline dopo la prima apertura.

## Struttura

- `index.html`: ingresso rapido, misteri del giorno e ripresa della recita.
- `rosario.html`: lettore del Rosario.
- `rosary-data.js`: testi, misteri e generazione della sequenza.
- `app.js`: stato del lettore, grani, persistenza e sintesi vocale.
- `home.js`: contenuti dinamici della pagina iniziale.
- `sw.js` e `manifest.webmanifest`: installazione e uso offline.
- `tests/rosary-data.test.js`: controlli sulla sequenza e sulla mappatura dei grani.

## Sviluppo locale

Avvia un server statico dalla cartella del progetto:

```bash
python -m http.server 4173
```

Poi visita `http://localhost:4173`.

Per verificare dati e sequenza:

```bash
node tests/rosary-data.test.js
```

## Deploy su Render

Il file `render.yaml` configura un sito statico con directory pubblica `.`. Ogni aggiornamento di `main` viene pubblicato dal servizio Render collegato alla repository.

## Fonti della struttura

- [Vatican.va — I Misteri del Santo Rosario](https://www.vatican.va/special/rosary/documents/misteri.html)
- [Radio Maria — Come si recita il Santo Rosario](https://radiomaria.it/preghiere/santo-rosario/)

La voce dipende dalle voci italiane installate o rese disponibili dal browser. In futuro il player potrà usare audio registrati mantenendo invariata la sequenza definita in `rosary-data.js`.
