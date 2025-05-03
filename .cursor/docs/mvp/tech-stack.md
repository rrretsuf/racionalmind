# Inner App - Tech Stack Document (MVP v1.0.0)

## 1. Pregled in Arhitektura

### 1.1. Namen Dokumenta
Ta dokument opredeljuje tehnološki sklop (tech stack), arhitekturne principe in ključne odvisnosti za razvoj Minimalno Viabilnega Produkta (MVP) mobilne aplikacije "Rational Mind". Cilj je zagotoviti jasno tehnično osnovo za razvoj cross-platform aplikacije, osredotočene na AI Overthinking Helper (za več podrobnosti poglej @project-requirements.md).

### 1.2. Visokonivojska Arhitektura
Aplikacija sledi arhitekturi, kjer cross-platform mobilni frontend (React Native/Expo) komunicira z Backend-as-a-Service platformo (Supabase) za upravljanje podatkov, avtentikacijo in izvajanje strežniške logike. Supabase Edge funkcije delujejo kot posrednik za klice do zunanjih AI API-jev (Google Gemini), izvajajo kompleksnejše operacije, kot je RAG, ter upravljajo mehanizme predpomnjenja (caching) za optimizacijo klicev AI modelov in procesiranje STT/TTS zahtev.

### 1.3. Arhitekturna Načela
Razvoj bo sledil naslednjim načelom:  
* **Varnost na Prvem Mestu (Security-First):** Implementacija varnostnih praks pri avtentikaciji, shranjevanju podatkov in API klicih.  
* **Osredotočenost na Zasebnost (Privacy-Focused):** Oblikovanje sistema z mislijo na zasebnost uporabnikovih podatkov in seans.  
* **Izkoriščanje BaaS (Leverage BaaS):** Maksimalna uporaba Supabase storitev za poenostavitev razvoja in zmanjšanje potrebe po upravljanju infrastrukture.  
* **Modularna Zasnova (Modular Design):** Strukturiranje kode v React Native (komponente, zasloni, storitve, kaveljčki) na način, ki omogoča ponovno uporabo in lažje vzdrževanje.  
* **Abstrakcija Zunanjih Storitev:** Ovijanje klicev do zunanjih API-jev (kot je Gemini) v namenske servisne module za lažjo zamenljivost ali posodabljanje.

## 2. Frontend (Mobilna Aplikacija)

* **Okvir (Framework):** Expo (React Native)  
    * **Opis:** Platforma in nabor orodij nad React Native, ki poenostavlja razvoj, buildanje in uvajanje univerzalnih aplikacij.  
    * **Razlog:** Omogoča hiter razvoj za iOS in Android iz ene kodne baze, širok nabor knjižnic in orodij (Expo SDK), lažje upravljanje z nativnimi moduli in poenostavljen proces objave preko EAS.  
* **Programski Jezik:** TypeScript  
    * **Opis:** Nadgradnja JavaScripta, ki dodaja statično tipizacijo.  
    * **Razlog:** Izboljšuje kakovost kode, omogoča zgodnje odkrivanje napak, olajša refaktoriranje in vzdrževanje večjih projektov. Odlična podpora v React Native/Expo ekosistemu in pri Supabase funkcijah.  
* **Navigacija:** Expo Router  
    * **Opis:** Datotečno osnovan usmerjevalnik za React Native, ki omogoča definiranje poti z ustvarjanjem datotek v `app` direktoriju.  
    * **Razlog:** Poenostavlja upravljanje navigacije, podpira globoko povezovanje (deep linking), zagotavlja tipsko varnost in je optimiziran za univerzalne aplikacije (iOS, Android, Web).
* **Upravljanje Stanja (State Management):** React Core APIs (useState, useContext)  
    * **Opis:** Uporaba vgrajenih React hookov za upravljanje stanja komponent in deljenje stanja med njimi.  
    * **Razlog:** Za MVP obseg, kjer kompleksnost globalnega stanja predvidoma ne bo velika, zadostujejo osnovna orodja. S tem se izognemo nepotrebni kompleksnosti in odvisnosti od zunanjih knjižnic. Po potrebi (če se stanje zaplete) se lahko kasneje uvede Zustand ali Jotai.  
* **UI Komponente in Stiliranje:**  
    * **Komponente:** Uporaba osnovnih React Native komponent (`View`, `Text`, `Pressable`, itd.) in ustvarjanje komponent po meri za specifične elemente UI (npr. `ChatBubble`, `ModuleCard`, `GlowingButton`).  
    * **Stiliranje:** NativeWind  
        * **Opis:** Implementacija Tailwind CSS za React Native, ki omogoča uporabo utility-first CSS razredov za stiliziranje komponent.  
        * **Razlog:** Pospešuje razvoj UI, zagotavlja doslednost, izboljšuje berljivost stilov in omogoča lažje prilagajanje dizajna. Razvijalcem, ki poznajo Tailwind, omogoča hitrejšo adaptacijo.  
    * **Dodatne Knjižnice (Možnost):** Za pospešitev razvoja se lahko uporabijo nekatere brezplačne, nestilizirane komponente iz NativeWindUI ali komponente iz Gluestack UI (če se izkaže za potrebno in stilsko ustrezno).  
* **UI/UX Oblikovanje (Smernice):**  
    * Implementacija vizualnega stila, ki vključuje: privzeto temno temo, temno modro barvno paleto, minimalističen pristop, elemente s "steklenim" (glassy/frosted) videzom, poudarke s sijem (glowing effects) za pomembne interaktivne elemente (npr. gumb "Start New Session"), gladke in subtilne animacije ter splošen občutek, ki sledi Applovim oblikovalskim načelom za kakovost in intuitivnost.
* **Govorne Tehnologije (Speech Technologies):**
    * **Speech-to-Text (STT):** Integracija **Google Cloud Speech-to-Text API** za omogočanje glasovnega vnosa v klepetu. Uporaba sprotnega pretakanja (real-time streaming) za takojšen odziv. Avdio podatki se bodo verjetno varno obdelovali preko namenske Supabase Edge funkcije.
    * **Text-to-Speech (TTS):** Integracija **Google Cloud Text-to-Speech API** za generiranje zvočnega predvajanja odgovorov AI modela. Priporočena uporaba WaveNet glasov za bolj naraven zvok. Integracija bo verjetno potekala preko Supabase Edge funkcije (ki generira avdio datoteko) ali direktno na klientu, če obstaja primeren Expo/React Native SDK.

## 3. Backend (Strežniška Stran)

* **Platforma:** Supabase  
    * **Opis:** Open-source platforma Backend-as-a-Service (BaaS), zgrajena na osnovi PostgreSQL.  
    * **Razlog:** Nudi celovit nabor integriranih storitev (avtentikacija, baza podatkov s Postgres močjo, shramba, funkcije brez strežnika, realtime), kar bistveno poenostavlja in pospešuje razvoj backend dela. Omogoča dobro skalabilnost in temelji na preverjenih odprtokodnih tehnologijah.  
* **Uporabljene Storitve Supabase:**  
    * **Authentication (Supabase Auth):** Za varno upravljanje uporabnikov, vključno s prijavo/registracijo preko Email/Geslo in "Sign in with Apple". Implementacija Row Level Security (RLS) za zaščito podatkov.  
    * **Database (Supabase PostgreSQL):** Osrednja baza podatkov za shranjevanje vseh trajnih podatkov aplikacije: uporabniški profili (statični, dinamični), vsebina modulov (za MVP kar v DB), seanse, sporočila znotraj seans, Journey Doc notes, itd.  
    * **Edge Functions (Supabase Edge Functions):** Za izvajanje strežniške logike v Deno (TypeScript) okolju, blizu uporabnikov za nižjo latenco. Glavne naloge:  
        * Varno klicanje Google Gemini API za generiranje odgovorov v klepetu, vključno z upravljanjem **Gemini SDK caching mehanizma (`CachedContent`)** za optimizacijo (glej `@context-memory-feature.md`).
        * Generiranje AI povzetkov in zapisov (npr. Session Overview, Journey Doc Notes) s klicanjem Gemini API.  
        * Generiranje tekstovnih embeddingov z uporabo vgrajene `Supabase.ai.Session` funkcionalnosti (`generate-embeddings` utility).
        * Implementacija RAG logike z uporabo namenskih iskalnih funkcij (`rag-search` utilities).
        * Procesiranje zahtev za **STT** (sprejem avdio toka, klic Google Cloud API) in **TTS** (sprejem besedila, klic Google Cloud API, vračanje avdia).
        * Morebitna druga strežniška logika, ki ni primerna za izvajanje na klientu.  
    * **Realtime:** Odgovori iz AI klepeta se bodo pretakali (stream) do klienta preko Server-Sent Events (SSE) iz Edge funkcije, ki komunicira z Gemini API.  
    * **Storage (Supabase Storage):** Za MVP **ni** planirana uporaba. Kasneje se lahko uporabi za shranjevanje datotek, kot so slike za profile ali module, če bo potrebno.  
    * **Vektorska Baza (`pgvector`):** PostgreSQL extenzija, integrirana v Supabase DB, za shranjevanje in učinkovito iskanje po visoko-dimenzionalnih vektorjih (embeddings). Ključna za implementacijo RAG. Uporabljal se bo `ivfflat` indeks z ustreznimi nastavitvami `lists` in `probes` ter kosinusna razdalja (`<=>`) za iskanje podobnosti.

## 4. Umetna Inteligenca (AI)

* **Osnovni Model za Klepet:** Google Gemini API (Model: `gemini-2.0-flash`)  
    * **Opis:** Hiter in cenovno učinkovit model iz družine Gemini, primeren za pogovorne naloge.  
    * **Integracija:** Klican preko varne Supabase Edge funkcije z uporabo **Gemini SDK** in njegovega **caching mehanizma (`CachedContent`)**. Statične komponente (sistemski prompt, profili) in zgodovina pogovora se predpomnijo po prvem klicu, kar zmanjša število poslanih žetonov za ~60-70% pri nadaljnjih klicih v isti seansi. Za podrobnosti glej `@context-memory-feature.md`.
    * **Uporaba:** Generiranje odgovorov AI Racionalnega Prijatelja.
* **Model za Embeddinge:** Supabase vgrajen AI (`gte-small` model)  
    * **Opis:** 512-dimenzionalni tekstovni embedding model, optimiziran za izvajanje znotraj Supabase Edge Runtime.  
    * **Integracija:** Uporaba `Supabase.ai.Session('gte-small')` znotraj Edge funkcij (verjetno preko namenske `generate-embeddings` funkcije).
    * **Razlog:** Omogoča generiranje embeddingov brez dodatnih zunanjih API klicev ali odvisnosti, kar poenostavlja arhitekturo in potencialno znižuje stroške/latenco.  
    * **Uporaba:** Pretvarjanje uporabniških sporočil in vsebine iz dinamičnih virov (Povzetki, Vzorci, Opisi oseb, Baza znanja) v vektorje za RAG.  
* **RAG (Retrieval-Augmented Generation):**  
    * **Implementacija:** Znotraj namenske Supabase Edge funkcije (ali sklopa `rag-search` utility funkcij), ki uporablja `pgvector`.
    * **Potek:**  
        1. Prejme uporabnikovo sporočilo.  
        2. Generira embedding poizvedbe z `Supabase.ai.Session('gte-small')`.  
        3. Izvede vektorsko iskanje (kosinusna razdalja, `ivfflat` indeks) v relevantnih tabelah (`sessions`, `people`, `ai_knowledge`) za najbolj relevantne kose vsebine (privzeto `k=3` zadetkov na vir, s pragom podobnosti `θ=0.75`). Viri vključujejo povzetke prejšnjih sej, vzorce iz sej, opise oseb in splošno bazo znanja o obvladovanju overthinkinga.
        4. Za iskanje oseb (`people`) se primarno uporabi **exact case-insensitive match** imena iz sporočila; če ni enoznačnega zadetka, se uporabi vektorsko iskanje po embeddingu imena.
        5. Pridobljene relevantne kose besedila ("kontekst") doda v prompt, poslan Gemini API preko SDK, ki že upravlja s predpomnjeno zgodovino pogovora (`CachedContent`).
        6. Gemini API generira odgovor ob upoštevanju dodatnega konteksta.
* **Govorne Tehnologije (Speech APIs):**
    * **Speech-to-Text (STT):** **Google Cloud Speech-to-Text API**. Uporabljen za pretvorbo uporabnikovega govora v besedilo za vnos v klepet. Integracija preko Supabase Edge funkcije. ([Dokumentacija](https://cloud.google.com/speech-to-text/docs))
    * **Text-to-Speech (TTS):** **Google Cloud Text-to-Speech API** (priporočeni WaveNet glasovi). Uporabljen za generiranje zvočnega predvajanja odgovorov AI modela. Integracija preko Supabase Edge funkcije ali direktno na klientu. ([Dokumentacija](https://cloud.google.com/text-to-speech/docs))

## 5. Razvojna Orodja in Procesi

* **IDE (Integrated Development Environment):** Cursor  
* **Version Control:** Git / GitHub (za upravljanje izvorne kode).  
* **Paketni Upravitelj:** npm ali yarn (za upravljanje JavaScript/TypeScript odvisnosti).  
* **Build in Deployment:**  
    * **Razvoj:** Expo Go aplikacija na mobilni napravi ali simulatorju/emulatorju za hitro testiranje.  
    * **Produkcijski Buildi:** Expo Application Services (EAS) Build za ustvarjanje `.ipa` (iOS) in `.aab`/`.apk` (Android) datotek.  
    * **Objava:** EAS Submit za poenostavljeno nalaganje buildov v App Store Connect in Google Play Console.  
* **AI Pomoč pri Razvoju:** Uporaba AI orodij kot sta Claude in Gemini za pomoč pri kodiranju, odpravljanju napak, pisanju dokumentacije in iskanju rešitev.  
* **Project Management:** Trenutno ni specificirano (Možnosti: Notion, Trello, GitHub Projects, itd. - po dogovoru).  
* **Testiranje:** Expo Go za frontend, **Deno Test** za testiranje logike Supabase Edge funkcij (npr. RAG poizvedbe, pomožne funkcije).
* **Logging:** Sentry  
    * **Opis:** Orodje za sledenje napakam in izjemam v realnem času.  
    * **Uporaba:**  
        - Edge funkcije bodo imele svoj glavni logging file za beleženje napak in dogodkov.  
        - Ostalo okolje (mobilna aplikacija) bo imelo svoj logging file za beleženje napak in dogodkov.  
    * **Integracija:** Uporaba `@sentry/react-native` za React Native aplikacijo in `@sentry/deno` za Supabase Edge funkcije.  

## 6. Ključne Zunanje Odvisnosti

* Expo SDK in povezane knjižnice (Expo Router, Expo Modules).  
* React & React Native.  
* Supabase (Platforma in JavaScript/TypeScript SDK - `@supabase/supabase-js`).  
* Google Gemini API (posredno preko Edge Functions, z uporabo Gemini SDK).
* Google Cloud Speech-to-Text API (posredno preko Edge Functions).
* Google Cloud Text-to-Speech API (posredno preko Edge Functions ali direktno).
* Apple Authentication Services (preko Expo modula).  
* NativeWind.

## 7. Izven Obsega za MVP (Tehnološko)

* Razvoj lastnih nativnih modulov (izven Expo SDK).  
* Podpora za spletno platformo (čeprav Expo to omogoča, fokus MVP je na iOS/Android).  
* Uporaba kompleksnih knjižnic za upravljanje stanja (npr. Redux Toolkit).  
* Napredne tehnike optimizacije ali cachinga (razen osnovnih in Gemini SDK cachinga).
* Napredno upravljanje vzdevkov za osebe (aliases).
* Pruning starih podatkov (v ozadju).

## 8. Dokumentacija

* [Sentry Documentation](https://docs.sentry.io/)  
* [Supabase Documentation](https://supabase.com/docs)  
* [Google Cloud Documentation](https://cloud.google.com/docs)  
    * [Speech-to-Text Documentation](https://cloud.google.com/speech-to-text/docs)
    * [Text-to-Speech Documentation](https://cloud.google.com/text-to-speech/docs)
* [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)  
* [Deno Documentation](https://docs.deno.com/)  
* [NativeWind Documentation](https://www.nativewind.dev)
* [@context-memory-feature.md](.cursor/docs/mvp/context-memory-feature.md)
* [@project-requirements.md](.cursor/docs/mvp/project-requirements.md)