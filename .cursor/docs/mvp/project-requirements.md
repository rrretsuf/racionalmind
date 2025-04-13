# Inner App - Project Requirements Document (MVP v1.0.0)

**Verzija:** 1.0.0
**Datum:** 12. april 2025

**Kazalo Vsebine**
1.  Pregled Aplikacije (App Overview)
2.  Uporabniški Tokovi (User Flows - Povzetek)
3.  Ključne Funkcionalnosti (Core Features - MVP)
4.  Obseg MVP-ja (In-Scope vs Out-of-Scope)
5.  Tehnološki Sklop in API-ji (Tech Stack & APIs - MVP Summary)
6.  Specifikacije Oblikovanja UI/UX (UI/UX Design Specifications - MVP Guidelines)
7.  Zahteve glede Zmogljivosti in Varnosti (Performance & Security Requirements)
8.  Omejitve Projekta in Predpostavke (Project Constraints & Assumptions)
9.  Ocena Tveganja (Risk Assessment)

---

## 1. Pregled Aplikacije (App Overview)

### 1.1. Ime Aplikacije
**Inner**

### 1.2. Namen Aplikacije (MVP)
MVP aplikacije Inner zagotavlja varen, zaseben in podpirajoč prostor, kjer lahko uporabniki (predvsem športniki ali posamezniki, osredotočeni na zmogljivost) komunicirajo s specializiranim **AI Športnim Psihologom/Terapevtom**. AI, ki ga poganja Gemini 2.0 Flash in napreden sistem spomina/konteksta, uporabnikom pomaga raziskovati misli, čustva in vedenja, povezana s športom in zmogljivostjo, ter spodbuja samorazumevanje in razvoj strategij za izboljšanje. MVP služi kot temelj za prihodnje razširitve.

### 1.3. Ciljna Publika (MVP)
* Športniki (amaterski in profesionalni), ki iščejo mentalno podporo.
* Posamezniki, ki želijo izboljšati svojo mentalno pripravo, fokus, motivacijo ali obvladovanje stresa v kontekstu športa ali drugih področij zmogljivosti.
* Uporabniki, ki iščejo dostopno in zasebno alternativo ali dopolnilo tradicionalni športni psihologiji.
* Radovedneži, ki želijo raziskati svoje misli skozi prizmo športne psihologije s pomočjo AI.

### 1.4. Ključni Cilji in Meritve Uspeha (MVP)
* **Primarni Cilj:** Lansirati funkcionalno in stabilno osnovno verzijo aplikacije s fokusom na AI Športnega Psihologa ter validirati osnovno vrednost koncepta pri ciljni publiki.
* **Sekundarni Cilj:** Zgraditi robusten tehnični temelj (Expo RN, Supabase, Memory/Context sistem) za prihodnje faze razvoja.
* **Meritve Uspeha (MVP):**
    * Število aktivnih uporabnikov (MAU/DAU).
    * Angažiranost uporabnikov (povprečen čas v aplikaciji, število začetih/zaključenih seans na uporabnika).
    * Stopnja zadržanja uporabnikov (retention rate).
    * Kvalitativne povratne informacije uporabnikov o uporabnosti in vrednosti AI Športnega Psihologa.
    * Stabilnost aplikacije (število hroščev/zrušitev).

### 1.5. Edinstvene Prodajne Točke (Unique Selling Points - MVP)
* **Specializiran AI Športni Psiholog:** Namenski AI asistent, treniran in usmerjen v specifike športne psihologije.
* **Napreden Spomin in Kontekst:** AI ohranja kontinuiteto med seansami in uporablja globok kontekst (profili, pretekle seanse, Journey Notes, RAG) za visoko personalizirane interakcije znotraj športne domene.
* **Zasebnost in Varnost:** Poudarek na varnem okolju za raziskovanje občutljivih tem.
* **Dostopnost:** Vedno na voljo (24/7) podpora v žepu.
* **Informativni Viri:** Integrirani moduli s praktičnimi informacijami o športni psihologiji.

---

## 2. Uporabniški Tokovi (User Flows - Povzetek MVP)

*(Podrobnejši opis je v dokumentu `App Flow Document (MVP v1.0.0)`)*

* **Onboarding in Prijava/Registracija:** Uporabnik se lahko prijavi/registrira preko Apple ID ali Email/Gesla. Novi uporabniki gredo skozi kratek onboarding tok, kjer odgovorijo na nekaj vprašanj za izgradnjo statičnega profila (fokus na športnem kontekstu).
* **Glavni Zaslon:** Po prijavi uporabnik vidi pozdrav, gumb za začetek nove seanse ter ikone za zgodovino in profil. Na dnu je drsljiva vrsta z informativnimi moduli o športni psihologiji.
* **Tok Seanse:** Uporabnik začne novo (tekstovno) seanso z AI Športnim Psihologom. AI odgovarja na podlagi sporočil in bogatega konteksta (Memory/Context system). Seansa se lahko zaključi ročno (opcijsko), samodejno po neaktivnosti ali ob začetku nove.
* **Tok Modulov:** Uporabnik lahko brska med moduli na glavnem zaslonu in si ogleda njihovo vsebino (samo za branje). Moduli služijo tudi kot vir znanja za AI (RAG).
* **Tok Zgodovine:** Uporabnik lahko dostopa do seznama preteklih seans, si ogleda njihov AI-generiran povzetek in zgodovino sporočil (samo za branje zaključenih seans).
* **Tok Profila in Nastavitev:** Uporabnik lahko ureja svoj statični profil, si ogleduje dinamični profil in vizualiziran Journey Doc, dostopa do nastavitev (npr. brisanje računa, pravna besedila) in se odjavi.

---

## 3. Ključne Funkcionalnosti (Core Features - MVP)

### 3.1. AI Klepetalne Seanse (s Športnim Psihologom)
* **Opis:** Osrednja funkcionalnost aplikacije. Interaktivne, **izključno tekstovne** klepetalne seanse med uporabnikom in AI asistentom, ki deluje v vlogi **specializiranega Športnega Psihologa**.
* **Funkcionalnost:**
    * Standardni klepetalni vmesnik (pošiljanje/prejemanje sporočil).
    * AI odgovori so generirani s strani **Google Gemini 2.0 Flash**, usmerjeni s podrobnim sistemskim promptom za Športnega Psihologa.
    * Odgovori AI se pretakajo (stream) v realnem času (SSE).
    * **Integracija s Sistemom Spomina/Konteksta:** AI uporablja statični/dinamični profil, povzetek prejšnje seanse, Journey Notes (RAG) in bazo znanja športne psihologije (RAG) za zagotavljanje kontekstualnih in personaliziranih odgovorov.
    * Zaključek seanse (ročno/avtomatsko) sproži procesiranje v ozadju (generiranje povzetka, Journey Notes, posodobitev din. profila).
* **Omejitve MVP:** Brez glasovnega vnosa/izhoda. Brez možnosti izbire drugih terapevtov ali teorij v UI.

### 3.2. Informativni Moduli (Športna Psihologija)
* **Opis:** Zbirka 5 člankov/zapisov, ki pokrivajo ključne teme, metode ali nasvete s področja športne psihologije.
* **Funkcionalnost:**
    * Uporabniki lahko brskajo in berejo vsebino modulov.
    * Vsebina modulov služi kot **osnova za RAG bazo znanja** (tabela `module_embeddings`), ki jo AI uporablja med seansami.
* **Omejitve MVP:** Moduli so samo za branje, brez interaktivnih elementov (npr. "Preizkusi v seansi").

### 3.3. Sistem Spomina in Konteksta (Memory & Context System)
* **Opis:** Napreden sistem, ki AI Športnemu Psihologu omogoča ohranjanje kontinuitete in zagotavljanje globoko personaliziranih odgovorov. *(Podrobnosti v `Memory / Context Feature Document`)*.
* **Funkcionalnost:**
    * **Komponente Konteksta:** Statični profil, dinamični profil, povzetek zadnje seanse, Journey Notes (RAG), baza znanja športne psihologije (RAG), zgodovina trenutne seanse, sistemski prompt.
    * **RAG (Retrieval-Augmented Generation):** Dinamično iskanje in vključevanje relevantnih informacij iz Journey Notes in baze znanja v AI prompt pred vsakim odgovorom. Uporablja Supabase AI embeddinge (`gte-small`) in `pgvector`.
    * **Obdelava ob Koncu Seanse:** Samodejno generiranje povzetka seanse, ekstrakcija in shranjevanje Journey Notes (z embeddingi) ter posodabljanje dinamičnega profila uporabnika.
* **Tehnične Zahteve:** Implementacija znotraj Supabase Edge Functions, uporaba definiranih tabel v `database_schema.md`.

### 3.4. Uporabniški Profil in Zgodovina
* **Opis:** Zasloni, ki omogočajo upravljanje in pregled uporabniških podatkov in preteklih interakcij.
* **Funkcionalnost:**
    * **Profil:** Urejanje statičnih podatkov (iz onboardinga), pregled AI-generiranega dinamičnega profila, pregled vizualiziranih Journey Doc Notes, dostop do nastavitev, odjava.
    * **Zgodovina:** Seznam preteklih seans s povzetki, možnost ogleda celotne zgodovine sporočil zaključene seanse (read-only), možnost brisanja seans.
    * **Nastavitve:** Osnovne nastavitve (Obvestila - če implementirano, Jezik - če implementirano) in dostop do pravnih besedil ter brisanja računa.
* **Tehnične Zahteve:** Pridobivanje in prikazovanje podatkov iz tabel `profiles`, `dynamic_profiles`, `journey_notes`, `sessions`, `messages`. Implementacija funkcionalnosti brisanja in odjave.

---

## 4. Obseg MVP-ja (In-Scope vs Out-of-Scope)

### 4.1. V Obsegu (In-Scope Features - MVP)
* Osnovna funkcionalnost AI klepeta s **specializiranim Športnim Psihologom**.
* Napreden **Memory / Context System** (kot definiran).
* **Tekstovna** interakcija v klepetu.
* **5 Informativnih Modulov** o športni psihologiji (read-only + RAG vir).
* **Onboarding** tok za zbiranje statičnega profila.
* **Uporabniški Profil** (statični/dinamični/Journey Doc prikaz).
* **Zgodovina Seans** (pregled, brisanje).
* **Osnovne Nastavitve** (pravna besedila, brisanje računa).
* **Avtentikacija** (Apple Sign In, Email/Password).
* **Cross-platform** podpora (iOS, Android) preko Expo React Native.
* **Osnovni UI/UX** (temna tema, glassy/glowing efekti).

### 4.2. Izven Obsega (Out-of-Scope Features - MVP)
* Drugi AI terapevti/psihološke usmeritve (Freudian, CBT, Družinska...).
* Multi-Agent arhitektura (Faza 2).
* Glasovni vnos (STT) ali izhod (TTS).
* Možnost izbire teorij/metod s strani uporabnika v UI med seanso.
* Napredne analize počutja ali metrike (čeprav se podatki zbirajo).
* Socialne funkcije, skupinske seanse.
* Povezovanje s profesionalnimi terapevti.
* Diagnostična orodja, medicinski nasveti.
* Spletna verzija aplikacije.
* Napredne funkcije nastavitev (npr. izvoz podatkov).
* Pripenjanje (pinning) seans v zgodovini.
* Kompleksne animacije ali gamifikacija.
* Offline način delovanja (razen morda prikaza že naloženih podatkov).

---

## 5. Tehnološki Sklop in API-ji (Tech Stack & APIs - MVP Summary)

*(Podrobnosti v `Tech Stack Document (MVP v1.0.0)`)*

* **Frontend:** Expo React Native, TypeScript, Expo Router, NativeWind, React Core APIs (State).
* **Backend:** Supabase (Auth, PostgreSQL z `pgvector`, Edge Functions - Deno/TypeScript).
* **AI Klepet:** Google Gemini 2.0 Flash (preko Edge Functions).
* **Embeddings:** Supabase AI vgrajen model (`gte-small`) (preko Edge Functions).
* **Avtentikacija:** Supabase Auth (Email/Pass, Apple).
* **Primarni API-ji:** Supabase API, Google Gemini API.

---

## 6. Specifikacije Oblikovanja UI/UX (UI/UX Design Specifications - MVP Guidelines)

*(Podrobnejša pravila bodo definirana kasneje)*

* **Splošni Videz:** Minimalističen, moderen, čist, zračen. Sledenje Applovim smernicam za kakovost.
* **Barvna Shema:** Primarno temna tema. Temno modra gradientna ozadja. Stekleni/prosojni elementi (frosted glass) za poudarke (npr. kartice, oblački).
* **Poudarki:** Subtilni "glowing" efekti za pomembne interaktivne elemente (npr. gumbi za ključna dejanja).
* **Tipografija:** Sistemska pisava platforme (San Francisco za iOS, Roboto za Android) za domačnost in berljivost.
* **Animacije:** Gladke, subtilne tranzicije med zasloni in diskretne animacije elementov za izboljšanje občutka odzivnosti in "živosti".
* **Občutek:** Pomirjujoč, varen, zaupanja vreden, profesionalen, a hkrati dostopen in prijazen.

---

## 7. Zahteve glede Zmogljivosti in Varnosti (Performance & Security Requirements)

### 7.1. Zmogljivost
* **Odzivnost AI:** Odgovori AI (stream) naj bodo dovolj hitri za ohranjanje naravnega toka pogovora.
* **Odzivnost Aplikacije:** UI mora biti tekoč, brez zatikanja pri navigaciji ali animacijah.
* **Nalaganje:** Jasni indikatorji nalaganja med čakanjem na podatke iz Supabase ali AI odgovore.
* **Poraba Virov:** Aplikacija naj bo optimizirana za razumno porabo baterije in pomnilnika.

### 7.2. Varnost
* **Avtentikacija:** Varna implementacija Apple Sign In in Email/Password preko Supabase Auth.
* **Avtorizacija:** Stroga uporaba Row Level Security (RLS) v Supabase za zagotovitev, da uporabniki dostopajo le do svojih podatkov.
* **Prenos Podatkov:** Vsa komunikacija med klientom, Supabase in Gemini API mora potekati preko varne (HTTPS/WSS) povezave.
* **Shranjevanje Ključev:** API ključi (Supabase service_role, Gemini) morajo biti varno shranjeni kot skrivnosti (secrets) v Supabase in nikoli izpostavljeni na klientu.
* **Zasebnost Podatkov:** Upoštevanje načel zasebnosti pri oblikovanju in implementaciji (glej Politiko Zasebnosti).

---

## 8. Omejitve Projekta in Predpostavke (Project Constraints & Assumptions)

### 8.1. Omejitve
* **Ekipa:** Razvoj izvaja ena oseba.
* **Časovnica:** Ni strogega roka (stranski projekt), vendar ciljamo na čim hitrejši MVP.
* **Proračun:** Ni specificiran; predvideva se uporaba brezplačnih ali "pay-as-you-go" nivojev storitev (Supabase, Gemini), dokler je mogoče.
* **Obseg MVP:** Strogo omejen na zgoraj definirane funkcionalnosti.

### 8.2. Predpostavke
* **Uporabniki:** Razumejo, da aplikacija ni nadomestilo za profesionalno terapijo. So tehnično dovolj pismeni za uporabo mobilne aplikacije. So pripravljeni na reflektivno tekstovno komunikacijo z AI. Najdejo vrednost v specializiranem AI Športnem Psihologu.
* **Tehnologija:** Supabase in Google Gemini API bosta zagotavljala zanesljive in dovolj zmogljive storitve po sprejemljivih cenah za MVP obseg. Izbrani tehnični sklop (Expo RN, Supabase AI Embeddings) je primeren za implementacijo zahtevanih funkcionalnosti.
* **Razvoj:** Ena oseba lahko obvlada kompleksnost razvoja MVP-ja v razumnem času.

---

## 9. Ocena Tveganja (Risk Assessment - MVP)

* **Tehnična Tveganja:**
    * Kompleksnost implementacije Memory/Context sistema in RAG (zagotavljanje relevance in zmogljivosti).
    * Zanesljivost/latenca/stroški Supabase storitev (DB, Auth, Edge Functions, AI Embeddings).
    * Zanesljivost/latenca/stroški/omejitve Gemini 2.0 Flash API.
    * Izzivi pri integraciji vseh komponent (RN -> Edge Function -> Gemini -> DB -> RAG -> Edge Function -> RN).
* **Tveganja Uporabniške Izkušnje:**
    * AI odgovori niso dovolj koristni, relevantni ali empatični kljub kontekstu.
    * Uporabniki ne vidijo vrednosti v *samo* Športnem Psihologu.
    * UI/UX ni dovolj intuitiven ali prijeten za uporabo.
* **Tveganja Odvisnosti:**
    * Spremembe v Supabase ali Gemini API-jih, ki zahtevajo prilagoditve kode.
    * Morebitne omejitve brezplačnih nivojev storitev.
* **Varnostna Tveganja:**
    * Nenamerno razkritje občutljivih podatkov zaradi napak v RLS politikah ali kodi.
    * Varnostne ranljivosti v uporabljenih knjižnicah.
* **Tveganja Višje Sile:**
    * Pomanjkanje časa razvijalca za dokončanje projekta.

*(Za vsako tveganje je treba med razvojem razmišljati o strategijah mitigacije in ukrepih ob morebitnem nastopu.)*