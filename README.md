# Bogglenc

Igra iskanja besed na 4x4 mreži črk (varianta igre [boggle](https://en.wikipedia.org/wiki/Boggle)).

**Igra**

[https://boggelnc.web.app/](https://boggelnc.web.app/)

## Za začetek

Za poganjanje projekta je potreben NodeJs.

**Zagon grafičnega vmesnika**

```shell
ng serve --watch --live-reload
```

**Zagon zalednih storitev**

```shell
cd functions
npm run serve
```

## Navodila za uporabo

### Objava sprememb na firebase

```shell
ng build
```

```shell
firebase deploy
```

### Predstavitveno okolje

Za nalaganje aplikacije na predstavitveno okolje, je potrebno nastavit v 

```json
  // environment.ts
  backendPath: "http://127.0.0.1:5001/bogglenc-feature/europe-west1",
```

in

```json
  // environment.prod.ts
  backendPath: 'https://europe-west1-bogglenc-feature.cloudfunctions.net'
```

in za lokalni razvoj

```shell
firebase projects:list
firebase use PROJECT_ID
```

## Tehnični detajli

### Fran.si

Igra preverja besede na portal [fran.si](https://fran.si). Pogosto množine samostalnikov tam ne najde (npr. garaže, čevlji, perice,...).

### Angular Firebase

https://github.com/angular/angularfire

---

## ☕ Časti avtorja [kafe](https://ko-fi.com/janmaselj)
