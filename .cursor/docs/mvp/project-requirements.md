# Rational Mind App - Project Requirements Document (MVP v2.0.0)

**Verzija:** 2.0.0 (Updated with OpenAI Models)
**Datum:** 8. maj 2025

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
**Rational Mind**

### 1.2. Namen Aplikacije (MVP)
MVP aplikacije Rational Mind zagotavlja varen, zaseben in podpirajoč prostor, kjer lahko uporabniki (predvsem mladi med 16. in 24. letom, ki se soočajo z overthinkanjem) komunicirajo s personaliziranim **AI Racionalnim Prijateljem**. AI, ki ga poganjajo **OpenAI modeli (`o4-mini` in `40-mini`)** in napreden sistem spomina/konteksta, uporabnikom pomaga raziskovati in obvladovati misli, ki vodijo v overthinkanje, ter spodbuja samorazumevanje in razvoj strategij za mentalno jasnost. AI se uči o uporabniku, prepoznava vzorce in prilagaja svoje odgovore, deluje kot vedno dostopen (24/7) prijatelj. Uporabniki izbirajo svojo stopnjo racionalnosti (1-5), ki vpliva na odzive AI. MVP služi kot temelj za prihodnje razširitve in uvedbo premium funkcij.

### 1.3. Ciljna Publika (MVP)
* Mladi odrasli (16-24 let), ki se pogosto znajdejo v zankah overthinkanja.
* Posamezniki, ki iščejo orodje za samopomoč pri obvladovanju anksioznih misli, stresa ali dvomov vase.
* Uporabniki, ki potrebujejo dostopnega, zasebnega in nevtralnega "sogovornika" za razreševanje miselnih vzorcev.
* Radovedneži, ki želijo raziskati svoje misli s pomočjo AI v varnem okolju.

### 1.4. Ključni Cilji in Meritve Uspeha (MVP)
* **Primarni Cilj:** Lansirati funkcionalno in stabilno osnovno verzijo aplikacije s fokusom na AI Racionalnega Prijatelja ter validirati osnovno vrednost koncepta pri ciljni publiki (16-24 letniki, ki overthinkajo).
* **Sekundarni Cilj:** Zgraditi robusten tehnični temelj (Expo RN, Supabase, Memory/Context sistem, STT/TTS) za prihodnje faze razvoja in monetizacijo.
* **Meritve Uspeha (MVP):**
    * Število aktivnih uporabnikov (MAU/DAU).
    * Angažiranost uporabnikov (povprečen čas v aplikaciji, število začetih/zaključenih seans na uporabnika, uporaba glasovnih funkcij).
    * Stopnja zadržanja uporabnikov (retention rate).
    * Kvalitativne povratne informacije uporabnikov o uporabnosti in vrednosti AI Racionalnega Prijatelja ter o izkušnji z overthinkanjem.
    * Stabilnost aplikacije (število hroščev/zrušitev).
    * Konverzija v premium tier (dolgoročno).

### 1.5. Edinstvene Prodajne Točke (Unique Selling Points - MVP)
* **Specializiran AI Racionalni Prijatelj:** Namenski AI asistent, zasnovan za pomoč pri prepoznavanju in obvladovanju overthinkanja, prilagodljiv glede na izbrano stopnjo racionalnosti (1-5).
* **Napreden Spomin in Kontekst:** AI ohranja kontinuiteto, prepoznava vzorce in uporablja globok kontekst (specifični statični profil, pretekle seanse, prepoznani vzorci, RAG na podlagi racionalnosti) za visoko personalizirane in prilagodljive interakcije.
* **Glasovna Interakcija:** Podpora za vnos govora (STT) in opcijski izhod govora (TTS) za lažjo uporabo.
* **Zasebnost in Varnost:** Poudarek na varnem okolju za raziskovanje misli.
* **Dostopnost:** Vedno na voljo (24/7) podpora v žepu.
* **Informativni Viri:** Integrirani moduli s praktičnimi metodami za obvladovanje overthinkanja, ki jih AI lahko uporabi v seansah (RAG na podlagi racionalnosti).
* **Dva Nivoja:** **Brezplačen račun (Free)** in **Plačljiv račun (Paying)** z različnimi omejitvami/funkcijami in uporabljenimi AI modeli.

---

## 2. Uporabniški Tokovi (User Flows - Povzetek MVP)

*(Podrobnejši opis je v dokumentu `App Flow Document (MVP v1.0.0)`)*

* **Onboarding in Prijava/Registracija:** Uporabnik se lahko prijavi/registrira preko Apple ID ali Email/Gesla. Novi uporabniki gredo skozi kratek onboarding tok, kjer odgovorijo na nekaj vprašanj za izgradnjo statičnega profila in **izberejo svojo začetno stopnjo racionalnosti (1-5)**.
* **Glavni Zaslon:** Po prijavi uporabnik vidi pozdrav, gumb za začetek nove seanse ter ikone za zgodovino in profil. Na dnu je drsljiva vrsta z informativnimi moduli o metodah proti overthinkanju. Prikazana je tudi izbrana stopnja racionalnosti.
* **Tok Seanse:** Uporabnik začne novo seanso z AI Racionalnim Prijateljem, ki deluje na podlagi izbrane stopnje racionalnosti. Uporablja lahko **tekstovni vnos ali glasovni vnos (STT)**. AI odgovarja na podlagi sporočil in bogatega konteksta (Memory/Context system). Uporabnik lahko **opcijsko posluša AI odgovor (TTS)** s klikom na ikono. Seansa se lahko zaključi ročno, samodejno po neaktivnosti ali ob začetku nove. Uporabnik lahko med seanso prilagaja stopnjo racionalnosti.
* **Tok Modulov:** Uporabnik lahko brska med moduli na glavnem zaslonu in si ogleda njihovo vsebino (samo za branje). Moduli vsebujejo metode/tehnike, ki jih AI lahko uporabi med seanso (RAG).
* **Tok Zgodovine:** Uporabnik lahko dostopa do seznama preteklih seans, si ogleda njihov AI-generiran povzetek in zgodovino sporočil (samo za branje zaključenih seans).
* **Tok Profila in Nastavitev:** Uporabnik lahko ureja svoj statični profil, si ogleduje AI-generiran dinamični profil ter **seznam glavnih vzorcev**, ki jih je AI prepoznal v njunih pogovorih. Dostopa do nastavitev (npr. brisanje računa, pravna besedila, morda menjava avatarja) in se odjavi.

---

## 3. Ključne Funkcionalnosti (Core Features - MVP)

### 3.1. AI Klepetalne Seanse (z Racionalnim Prijateljem)
* **Opis:** Osrednja funkcionalnost aplikacije. Interaktivne klepetalne seanse med uporabnikom in AI Racionalnim Prijateljem, katerega odzivnost je odvisna od izbrane stopnje racionalnosti (1-5).
* **Funkcionalnost:**
    * Standardni klepetalni vmesnik.
    * **Vnos:** Tekstovni ali glasovni (Speech-to-Text - STT).
    * **Izhod:** Tekstovni odgovori AI, ki se pretakajo (stream) v realnem času (SSE). **Opcijski glasovni izhod (Text-to-Speech - TTS)** odgovora ob kliku na ikono.
    * AI odgovori so generirani s strani **OpenAI modelov (`o4-mini` ali `40-mini`, odvisno od nivoja uporabnika)**, usmerjeni s podrobnim sistemskim promptom, specifičnim za izbrano stopnjo racionalnosti in osredotočenim na racionalno analizo in boj proti overthinkanju.
    * **Integracija s Sistemom Spomina/Konteksta:** AI uporablja specifični statični profil (ime, starostna skupina, glavna tema, cilj), dinamični profil, povzetek prejšnje seanse, prepoznane vzorce (RAG), bazo znanja o metodah proti overthinkanju (RAG, filtrirano po racionalnosti) za zagotavljanje kontekstualnih in personaliziranih odgovorov.
    * Zaključek seanse sproži procesiranje v ozadju (generiranje povzetka, identifikacija in shranjevanje novih vzorcev, posodobitev din. profila) z uporabo **ustreznega modela glede na nivo uporabnika (`o4-mini` za plačljive, `40-mini` za brezplačne)**.
    * **Izbira Stopnje Racionalnosti:** Uporabnik izbere stopnjo racionalnosti (1-5), ki vpliva na sistemski prompt in filtriranje RAG baze znanja.
* **Tier Omejitve**:
    * **Free Account (Tier 1):** Omejeno na 10 sporočil na dan. Uporablja **`40-mini`** za klepet in **`40-mini`** za procesiranje v ozadju (kontekst/spomin, RAG).
    * **Paying Account (Tier 2):** Neomejeno število sporočil. Uporablja **`o4-mini`** za klepet in **`o4-mini`** za procesiranje v ozadju (kontekst/spomin, RAG).

### 3.2. Informativni Moduli (Metode proti Overthinkanju)
* **Opis:** Zbirka 4-5 člankov/zapisov, ki pokrivajo ključne tehnike, metode ali nasvete za obvladovanje overthinkanja (npr. CBT tehnike, mindfulness, reframing).
* **Funkcionalnost:**
    * Uporabniki lahko brskajo in berejo vsebino modulov.
    * Vsebina modulov služi kot **osnova za RAG bazo znanja**, ki jo AI uporablja med seansami za predlaganje tehnik.
* **Omejitve MVP:** Moduli so samo za branje, brez interaktivnih elementov (razen posredne uporabe preko AI).

### 3.3. Sistem Spomina in Konteksta (Memory & Context System)
* **Opis:** Napreden sistem, ki AI Racionalnemu Prijatelju omogoča ohranjanje kontinuitete, prepoznavanje vzorcev in zagotavljanje globoko personaliziranih odgovorov. *(Podrobnosti v `Memory / Context Feature Document`)*.
* **Funkcionalnost:**
    * **Komponente Konteksta:** Specifični statični profil (ime, starostna skupina, glavna tema, cilj), dinamični profil, povzetek zadnje seanse, **prepoznani vzorci** uporabnikovega razmišljanja (RAG), baza znanja o metodah proti overthinkanju (RAG, filtrirano po izbrani stopnji racionalnosti), zgodovina trenutne seanse, sistemski prompt (vezan na stopnjo racionalnosti).
    * **RAG (Retrieval-Augmented Generation):** Dinamično iskanje in vključevanje relevantnih informacij iz **zgodovine sporočil, prepoznanih vzorcev in baze znanja (filtrirane po racionalnosti)** v AI prompt. Uporablja Supabase AI embeddinge (`gte-small`) in `pgvector`.
    * **Obdelava ob Koncu Seanse:** Samodejno generiranje povzetka seanse, **identifikacija, ekstrakcija in shranjevanje ključnih vzorcev razmišljanja** (z embeddingi za RAG) ter posodabljanje dinamičnega profila uporabnika. Uporabljen model (`o4-mini` ali `40-mini`) je odvisen od nivoja uporabnika.
* **Tehnične Zahteve:** Implementacija znotraj Supabase Edge Functions, uporaba definiranih tabel v `database_schema.md` (prilagojeno za 'patterns' namesto 'journey_notes').

### 3.4. Uporabniški Profil in Zgodovina
* **Opis:** Zasloni, ki omogočajo upravljanje in pregled uporabniških podatkov in preteklih interakcij.
* **Funkcionalnost:**
    * **Profil:** Urejanje statičnih podatkov (iz onboardinga: ime, starostna skupina, glavna tema, cilj), pregled AI-generiranega dinamičnega profila, **pregled seznama prepoznanih vzorcev**, dostop do nastavitev (vključno s privzeto stopnjo racionalnosti), odjava.
    * **Zgodovina:** Seznam preteklih seans s povzetki, možnost ogleda celotne zgodovine sporočil zaključene seanse (read-only), možnost brisanja seans.
    * **Nastavitve:** Osnovne nastavitve (npr. upravljanje naročnine - če/ko relevantno) in dostop do pravnih besedil ter brisanja računa.
* **Tehnične Zahteve:** Pridobivanje in prikazovanje podatkov iz tabel `profiles`, `dynamic_profiles`, `message_patterns` (ali podobno), `sessions`, `messages`. Implementacija funkcionalnosti brisanja in odjave.

---

## 4. Obseg MVP-ja (In-Scope vs Out-of-Scope)

### 4.1. V Obsegu (In-Scope Features - MVP)
* Osnovna funkcionalnost AI klepeta z **AI Racionalnim Prijateljem** (odzivnost glede na stopnjo racionalnosti 1-5).
* Napreden **Memory / Context System** (kot definiran, s fokusom na prepoznavanju vzorcev in uporabo modelov `o4-mini`/`40-mini` glede na nivo, RAG filtriran po racionalnosti).
* **Tekstovna** in **Glasovna (STT)** interakcija v klepetu.
* **Opcijski Glasovni Izhod (TTS)** AI odgovorov.
* **4-5 Informativnih Modulov** o metodah proti overthinkanju (read-only + RAG vir, uporabljen glede na racionalnost).
* **Onboarding** tok za zbiranje statičnega profila in **izbiro začetne stopnje racionalnosti (1-5)**.
* **Uporabniški Profil** (statični podatki: ime, starostna skupina, glavna tema, cilj; dinamični profil; prikaz prepoznanih vzorcev).
* **Zgodovina Seans** (pregled, brisanje).
* **4-5 Informativnih Modulov** o metodah proti overthinkanju (read-only + RAG vir).
* **Onboarding** tok za zbiranje statičnega profila in izbiro avatarja.
* **Uporabniški Profil** (statični/dinamični/prikaz prepoznanih vzorcev).
* **Zgodovina Seans** (pregled, brisanje).
* **Osnovne Nastavitve** (pravna besedila, brisanje računa).
* **Avtentikacija** (Apple Sign In, Email/Password).
* **Cross-platform** podpora (iOS, Android) preko Expo React Native.
* **Osnovni UI/UX** (temna tema, glassy/glowing efekti).
* **Tier Sistem:** Implementacija logike za **No Account**, **Free** in **Paying** nivoje z ustreznimi omejitvami in modeli[cite: 20, 21].

### 4.2. Izven Obsega (Out-of-Scope Features - MVP)
* Drugi AI terapevti/psihološke usmeritve razen "Racionalnega Prijatelja".
* Multi-Agent arhitektura (Faza 2).
* Možnost izbire specifičnih metod/teorij s strani uporabnika v UI med seanso (razen posredno preko AI).
* Napredne analize počutja ali metrike (čeprav se podatki zbirajo za vzorce).
* Socialne funkcije, skupinske seanse.
* Povezovanje s profesionalnimi terapevti.
* Diagnostična orodja, medicinski nasveti.
* Spletna verzija aplikacije.
* Napredne funkcije nastavitev (npr. izvoz podatkov).
* Pripenjanje (pinning) seans v zgodovini.
* Kompleksne animacije ali gamifikacija.
* Offline način delovanja (razen morda prikaza že naloženih podatkov).
* Upravljanje naročnin in plačila (implementacija plačilnega sistema, le logika za razlikovanje tirov).
* **Deep Thinking Mode**[cite: 7].

---

## 5. Tehnološki Sklop in API-ji (Tech Stack & APIs - MVP Summary)

*(Podrobnosti v `Tech Stack Document (MVP v1.0.0)`)*

* **Frontend:** Expo React Native, TypeScript, Expo Router, NativeWind, React Core APIs (State), knjižnice za STT/TTS (npr. Google Cloud).
* **Backend:** Supabase (Auth, PostgreSQL z `pgvector`, Edge Functions - Deno/TypeScript).
* **AI Klepet:** **OpenAI API** (Modeli: **`o4-mini`**, **`40 mini`**) [cite: 13, 15] (preko Edge Functions).
* **Embeddings:** Supabase AI vgrajen model (`gte-small`) (preko Edge Functions).
* **Avtentikacija:** Supabase Auth (Email/Pass, Apple).
* **Primarni API-ji:** Supabase API, **OpenAI API**, API-ji za STT/TTS (Google Cloud).

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
* **Prenos Podatkov:** Vsa komunikacija med klientom, Supabase in **OpenAI API** mora potekati preko varne (HTTPS/WSS) povezave.
* **Shranjevanje Ključev:** API ključi (Supabase service_role, **OpenAI**) morajo biti varno shranjeni kot skrivnosti (secrets) v Supabase in nikoli izpostavljeni na klientu.
* **Zasebnost Podatkov:** Upoštevanje načel zasebnosti pri oblikovanju in implementaciji (glej Politiko Zasebnosti).

---

## 8. Omejitve Projekta in Predpostavke (Project Constraints & Assumptions)

### 8.1. Omejitve
* **Ekipa:** Razvoj izvaja ena oseba.
* **Časovnica:** Razvoj MVP-ja mora biti zaključen in aplikacija poslana v pregled na App Store **v roku 1 meseca** od začetka.
* **Proračun:** Ni specificiran; predvideva se uporaba brezplačnih ali "pay-as-you-go" nivojev storitev (Supabase, **OpenAI**, STT/TTS API-ji), dokler je mogoče in stroškovno učinkovito za MVP.
* **Obseg MVP:** Strogo omejen na zgoraj definirane funkcionalnosti v sekciji 4.1.

### 8.2. Predpostavke
* **Uporabniki:** Razumejo, da aplikacija ni nadomestilo za profesionalno terapijo. So tehnično dovolj pismeni za uporabo mobilne aplikacije, vključno z glasovnimi funkcijami. So pripravljeni na reflektivno komunikacijo z AI (tekstovno ali glasovno). Najdejo vrednost v AI Racionalnem Prijatelju za pomoč pri overthinkanju.
* **Tehnologija:** Supabase in **OpenAI API** bosta zagotavljala zanesljive in dovolj zmogljive storitve po sprejemljivih cenah za MVP obseg. Izbrani tehnični sklop (Expo RN, Supabase AI Embeddings, STT/TTS knjižnice) je primeren za implementacijo zahtevanih funkcionalnosti.
* **Razvoj:** Ena oseba lahko obvlada kompleksnost razvoja MVP-ja v zastavljenem 1-mesečnem roku.

---

## 9. Ocena Tveganja (Risk Assessment - MVP)

* **Tehnična Tveganja:**
    * Kompleksnost implementacije Memory/Context sistema s prepoznavanjem vzorcev in RAG (zagotavljanje relevance in zmogljivosti).
    * Zanesljivost/latenca/stroški Supabase storitev (DB, Auth, Edge Functions, AI Embeddings).
    * Zanesljivost/latenca/stroški/omejitve **OpenAI API (modeli `o4-mini`, `40 mini`)**[cite: 11, 27].
    * Zanesljivost/latenca/stroški/kakovost izbranih STT in TTS rešitev/API-jev (Google Cloud).
    * Izzivi pri integraciji vseh komponent (RN -> STT -> Edge Function -> **OpenAI** -> DB -> RAG -> Edge Function -> TTS -> RN).
    * Časovna omejitev (1 mesec) za implementacijo vseh funkcij, vključno z novimi (STT/TTS, avatarji, vzorci).
* **Tveganja Uporabniške Izkušnje:**
    * AI odgovori niso dovolj koristni, relevantni ali empatični kljub kontekstu in avatarjem.
    * Uporabniki ne vidijo vrednosti v konceptu Racionalnega Prijatelja ali pa jim avatarji niso všeč.
    * UI/UX ni dovolj intuitiven ali prijeten za uporabo, še posebej z glasovnimi funkcijami.
    * Kakovost STT ali TTS ni zadovoljiva.
* **Tveganja Odvisnosti:**
    * Spremembe v Supabase, **OpenAI**, Google Cloud STT/TTS API-jih, ki zahtevajo prilagoditve kode.
    * Morebitne omejitve ali skriti stroški brezplačnih/plačljivih nivojev storitev.
* **Varnostna Tveganja:**
    * Nenamerno razkritje občutljivih podatkov zaradi napak v RLS politikah ali kodi.
    * Varnostne ranljivosti v uporabljenih knjižnicah (vključno s STT/TTS).
* **Tveganja Višje Sile:**
    * Pomanjkanje časa razvijalca za dokončanje projekta v 1 mesecu.

*(Za vsako tveganje je treba med razvojem razmišljati o strategijah mitigacije in ukrepih ob morebitnem nastopu.)*