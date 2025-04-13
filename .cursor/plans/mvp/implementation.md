# Inner App - MVP Implementation Plan (v1.0.0)

**Cilj:** Razviti in objaviti osnovno delujočo verzijo aplikacije Inner (MVP) za iOS in Android, osredotočeno na AI športnega psihologa, z uporabo Expo React Native in Supabase.

---

## Faza 1: Priprava in Nastavitev Projekta

* **Dokumentacija:**
    * [x] App Flow Document
    * [x] Tech Stack Document
    * [x] Implementation Plan Document
    * [x] Memory / Context Feature Document
    * [x] Databases Schemas Document
    * [x] Overral Plan
    * [x] Project Requirements Document
* **Glavna Pravila:**
    * [x] Syling / UI / UX
    * [x] Kako biti konsistenten skozi celotno aplikacijo (vključno z logiranjem)
    * [x] Posodabljanje `@implementation-plan.md` dokumenta med razvojem (obkljukaš stvari, ko jih končaš)
    * [x] Navigiranje skozi dokumentacijo - jih povežeš med sabo
* **Okolje in Orodja:**
    * [x] Namesti potrebna orodja (Node.js, npm/yarn, Expo CLI, Git, Cursor IDE).
    * [x] Inicializiraj nov Expo (React Native) projekt s TypeScript predlogo.
    * [x] Nastavi Git repozitorij na GitHubu in poveži lokalni projekt.
    * **[ ] Nastavi upravljanje okoljskih spremenljivk:**
        * [ ] Ustvari `.env` datoteke (npr. `.env`, `.env.production`, `.env.development`).
        * [ ] Definiraj spremenljivko za okolje (npr. `APP_ENV=development` ali `APP_ENV=production`).
        * [ ] Varno shrani Supabase ključe in Sentry DSN v `.env`.
        * [ ] Konfiguriraj dostop do teh spremenljivk v Expo aplikaciji (npr. preko `expo-constants` ali `react-native-dotenv`).
        * [ ] Definiraj način za dostop do okoljskih spremenljivk v Supabase Edge Functions (Supabase Secrets / lokalni `.env` za razvoj).
* **Supabase Projekt:**
    * [ ] Ustvari nov projekt na Supabase.
    * [ ] Pridobi in varno shrani projektne URL-je in API ključe (anon, service_role).
    * [ ] Nastavi Supabase Auth (omogoči Email/Password in Apple Sign In).
    * [ ] Ustvari tabele v Supabase DB (glej `database_schema.md`).
    * [ ] Omogoči `pgvector` extenzijo v Supabase DB.
    * [ ] Nastavi osnovno strukturo za Supabase Edge Functions (Deno, TypeScript).
* **Sentry Nastavitev:**
    * [ ] Ustvari nov projekt v Sentry za React Native aplikacijo.
    * [ ] Ustvari nov projekt v Sentry za Supabase Edge Functions (ali uporabi istega z različnimi okolji).
    * [ ] Pridobi Sentry DSN-je in jih varno shrani v okoljske spremenljivke (`.env`).
    * [ ] **Expo/RN:** Namesti in inicializiraj `@sentry/react-native` SDK zgodaj v aplikaciji (npr. `App.tsx`), z uporabo pravilnega DSN in nastavitvijo `environment`.
    * [ ] **Supabase Edge Functions:** Namesti in inicializiraj `@sentry/deno` v skupnem utility modulu ali na začetku funkcij, z uporabo pravilnega DSN in `environment`.
* **Centralni Logger Modul:**
    * [ ] **Expo/RN:** Ustvari `Logger` utility (npr. `utils/logger.ts`):
        * [ ] Implementiraj funkcije `log.debug()`, `log.info()`, `log.warn()`, `log.error(error, context?)`.
        * [ ] Funkcije naj preverijo okoljsko spremenljivko (npr. `process.env.NODE_ENV === 'production'` ali `Constants.expoConfig.extra.appEnv === 'production'`).
        * [ ] Če produkcija: pošlji dogodek/napako v Sentry (`Sentry.captureMessage`, `Sentry.captureException`).
        * [ ] Če razvoj: uporabi `console.log/warn/error`.
    * [ ] **Supabase Edge Functions:** Ustvari skupni `Logger` utility (npr. `supabase/functions/_shared/logger.ts`):
        * [ ] Implementiraj podobne funkcije (`debug`, `info`, `warn`, `error`).
        * [ ] Funkcije naj preverijo okoljsko spremenljivko (npr. `Deno.env.get('APP_ENV') === 'production'`).
        * [ ] Če produkcija: pošlji dogodek/napako v Sentry (`Sentry.captureMessage`, `Sentry.captureException`).
        * [ ] Če razvoj/lokalno: uporabi `console.log/warn/error`.
* **Osnovna Struktura RN Projekta:**
    * [ ] Implementiraj osnovno strukturo map in datotek v Expo projektu (npr. `app/` za Expo Router, `components/`, `hooks/`, `services/`, `utils/`, `contexts/`).
    * [ ] Integriraj in konfiguriraj Expo Router za osnovno navigacijo.
    * [ ] Nastavi NativeWind za stiliziranje.
* **Ostala Pravila:**
    * [ ] Project Structure
    * [ ] How to interact with the codebase (review, update, add, delete)

## Faza 2: Backend Razvoj (Supabase)

* **Avtentikacija (Auth):**
    * [ ] Implementiraj Supabase Auth klienta v RN aplikaciji (sign up, sign in, sign out) za Email/Password.
    * [ ] Implementiraj Supabase Auth klienta za Apple Sign In.
    * [ ] Nastavi poslušalce (listeners) za spremembe stanja avtentikacije v RN aplikaciji.
    * [ ] Nastavi Row Level Security (RLS) politike za osnovne tabele (npr. da uporabniki vidijo/urejajo le svoje podatke).
* **Baza Podatkov (Database Schema):**
    * [ ] Definiraj in ustvari tabele v Supabase za MVP:
        * `users`: (Razširitev `auth.users` s statičnimi profilnimi podatki iz onboardinga).
        * `dynamic_profiles`: (Za AI-generirane vpoglede o uporabniku).
        * `sessions`: (Za shranjevanje meta podatkov o seansah: id, user_id, start_time, end_time, status, session_overview_summary).
        * `messages`: (Za shranjevanje posameznih sporočil: id, session_id, user_id, content, sender_role ('user' ali 'ai'), timestamp).
        * `journey_notes`: (Za shranjevanje AI-generiranih zapisov: id, user_id, session_id, note_text, created_at, embedding).
        * `modules`: (Za shranjevanje vsebine informativnih modulov: id, title, summary, content, image_url - opcijsko).
        * `module_embeddings`: (Tabela za shranjevanje embeddingov kosov vsebine iz modulov za RAG: id, module_id, content_chunk, embedding).
* **Edge Funkcije (Razdeljeno na Faze):**
    * **Faza 2A: Osnovna Chat Funkcionalnost (Brez Spomina)**
        * [ ] **Ustvari `gemini-chat` Funkcijo (Verzija 1 - Osnovna):**
            * [ ] Definiraj vhodne parametre: `messages` (samo zgodovina trenutne seanse), `userId`.
            * [ ] Definiraj konstanto `SPORTS_THERAPIST_PROMPT` (osnovni sistemski prompt za AI).
            * [ ] Sestavi zahtevek za Gemini API (vključi samo `SPORTS_THERAPIST_PROMPT` in `messages`).
            * [ ] Izvedi klic na Google Gemini API (`gemini-2.0-flash` model) preko REST API.
            * [ ] Implementiraj Server-Sent Events (SSE) za pretakanje (streaming) odgovora nazaj klientu.
            * [ ] Dodaj osnovno logiranje (npr. začetek klica, morebitne napake Gemini API) v Sentry in/ali Supabase log.
            * [ ] Implementiraj osnovno obravnavo napak (npr. vrni napako klientu, če Gemini API klic ne uspe).

    * **Faza 2B: Implementacija Komponent Spomina in Konteksta**
        * [ ] **Ustvari `generate-embeddings` Funkcijo:**
            * [ ] Definiraj vhodni parameter: `inputText` (string).
            * [ ] Uporabi `Supabase.ai.Session('gte-small')` za generiranje embeddinga iz `inputText`.
            * [ ] Vrne generiran `embedding` (array številk).
            * [ ] Dodaj osnovno logiranje in obravnavo napak.
        * [ ] **Ustvari `rag-search` Funkcijo:**
            * [ ] Definiraj vhodne parametre: `queryEmbedding` (array številk), `userId`.
            * [ ] Izvedi vektorsko iskanje v tabeli `journey_notes` (filtrirano po `userId`) z uporabo `pgvector` in `queryEmbedding`.
            * [ ] Izvedi vektorsko iskanje v tabeli `module_embeddings` z uporabo `pgvector` in `queryEmbedding`.
            * [ ] Združi in vrni omejeno število najbolj relevantnih rezultatov (tekstovnih kosov) iz obeh iskanj.
            * [ ] Dodaj osnovno logiranje in obravnavo napak.
        * [ ] **Ustvari `process-session-end` Funkcijo:**
            * [ ] Definiraj vhodne parametre: `sessionId`, `userId`.
            * [ ] Pridobi vsa sporočila za dani `sessionId` iz tabele `messages`.
            * [ ] **Korak 1: Generiraj Povzetek Seanse:**
                * [ ] Pripravi prompt za Gemini API za generiranje povzetka (300-400 besed) iz zgodovine sporočil.
                * [ ] Kliči Gemini API (lahko tudi `gemini-2.0-flash` za začetek, ali močnejši model).
                * [ ] Shrani prejeti povzetek v tabelo `sessions` za `sessionId`.
            * [ ] **Korak 2: Ekstrahiraj in Shrani Journey Notes:**
                * [ ] Pripravi prompt za Gemini API za ekstrakcijo ključnih zapisov (bullet points) iz zgodovine sporočil ali povzetka.
                * [ ] Kliči Gemini API.
                * [ ] Za vsak prejeti zapis ("note"):
                    * [ ] Kliči `generate-embeddings` funkcijo, da dobiš embedding za zapis.
                    * [ ] Shrani zapis (`note_text`) in njegov `embedding` v tabelo `journey_notes` (povezano z `userId` in `sessionId`).
            * [ ] **Korak 3: Posodobi Dinamični Profil:**
                * [ ] Pridobi trenutni `dynamic_profile` za `userId`.
                * [ ] Pridobi novo generiran povzetek seanse (iz Koraka 1).
                * [ ] Pripravi prompt za Gemini API za posodobitev dinamičnega profila na podlagi starega profila in novega povzetka.
                * [ ] Kliči Gemini API.
                * [ ] Shrani posodobljen dinamični profil v tabelo `dynamic_profiles`.
            * [ ] Dodaj logiranje in obravnavo napak za vsak korak.

    * **Faza 2C: Integracija Spomina v Chat Funkcijo**
        * [ ] **Posodobi `gemini-chat` Funkcijo (Verzija 2 - S Spominom):**
            * [ ] **Pridobivanje Konteksta (pred klicem Gemini):**
                * [ ] Pridobi statični profil iz tabele `users`.
                * [ ] Pridobi dinamični profil iz tabele `dynamic_profiles`.
                * [ ] Pridobi povzetek zadnje zaključene seanse iz tabele `sessions`.
                * [ ] Kliči `generate-embeddings` funkcijo za trenutno uporabnikovo sporočilo.
                * [ ] Kliči `rag-search` funkcijo s prejetim embeddingom, da dobiš relevantne Journey Notes in Module Chunks.
            * [ ] **Sestavljanje Polnega Konteksta:**
                * [ ] Združi vse pridobljene dele (Prompt, Profili, Povzetek, RAG rezultati, Zgodovina trenutne seanse, Trenutno sporočilo) v enoten kontekstni paket za Gemini API.
            * [ ] **Klic Gemini API:**
                * [ ] Pošlji sestavljen **poln** kontekstni paket Gemini API (`gemini-2.0-flash`).
            * [ ] **Izboljšano Logiranje:**
                * [ ] Dodaj logiranje za sledenje, kateri deli konteksta so bili pridobljeni in poslani.
* **Polnjenje Podatkov:**
    * [ ] Pripravi vsebino za 5 MVP modulov (samo športna psihologija).
    * [ ] Napiši skripto ali ročno vnesi vsebino modulov v `modules` tabelo.
    * [ ] Napiši skripto (ali uporabi Edge Funkcijo), ki razdeli vsebino modulov na kose (chunks), generira embeddinge zanje in jih shrani v `module_embeddings`.

## Faza 3: Frontend Razvoj (Expo React Native)

* **Avtentikacija in Uvajanje (Auth & Onboarding):**
    * [ ] Implementiraj `Welcome Screen` z gumbi za prijavo/registracijo.
    * [ ] Implementiraj modalna okna za Email/Geslo in Apple Sign In/Up.
    * [ ] Poveži UI z Supabase Auth funkcijami.
    * [ ] Implementiraj `Onboarding Flow` (več zaslonov z vprašanji in text inputi).
    * [ ] Shrani odgovore iz onboardinga v Supabase `users` tabelo (preko Supabase klienta ali namenske Edge Funkcije).
* **Glavni Zaslon (Main Screen):**
    * [ ] Implementiraj UI za `Main Screen` (Pozdrav, Ikoni za Zgodovino/Profil, Gumb "Start New Session", Horizontalni seznam Modulov).
    * [ ] Naloži in prikaži podatke o modulih iz Supabase `modules` tabele.
    * [ ] Implementiraj navigacijo do ostalih zaslonov (Session, History, Profile, Module Detail) z Expo Router.
* **Zaslon Seanse (Session Screen):**
    * [ ] Implementiraj UI za klepet (seznam sporočil - `FlatList` ali podobno, oblački za sporočila, vnosno polje, gumb za pošiljanje).
    * [ ] Implementiraj logiko za prikaz sporočil (uporabnik vs AI).
    * [ ] Poveži vnosno polje in gumb za pošiljanje z logiko, ki kliče `gemini-chat` Edge Funkcijo.
    * [ ] Implementiraj sprejemanje in prikazovanje SSE odgovorov iz Edge Funkcije (postopno dodajanje besedila v zadnji AI oblaček).
    * [ ] Implementiraj logiko za pošiljanje celotne potrebne zgodovine in konteksta `gemini-chat` funkciji.
    * [ ] (Opcijsko za MVP) Implementiraj gumb za ročni zaključek seanse.
* **Zaslon Podrobnosti Modula (Module Detail Screen):**
    * [ ] Implementiraj UI za prikaz vsebine modula (Naslov, Slika/Placeholder, Povzetek, Besedilo).
    * [ ] Naloži in prikaži vsebino izbranega modula iz Supabase `modules` tabele.
    * [ ] Zagotovi, da je zaslon samo za branje.
* **Zaslon Zgodovine (History Screen):**
    * [ ] Implementiraj UI za prikaz seznama preteklih seans (`FlatList`).
    * [ ] Naloži podatke o seansah (datum, povzetek) iz Supabase `sessions` tabele.
    * [ ] Implementiraj navigacijo do pogleda zaključene seanse (read-only) ali preusmeritev na `Session Screen` za aktivno seanso.
    * [ ] Implementiraj pogled zaključene seanse (prikaz vseh sporočil iz `messages` tabele).
    * [ ] Implementiraj funkcionalnost brisanja seanse (klic Supabase delete).
* **Zaslon Profila (Profile Screen):**
    * [ ] Implementiraj UI za prikaz statičnega in dinamičnega profila ter Journey Doc vizualizacije.
    * [ ] Naloži podatke iz `users` in `dynamic_profiles` tabel.
    * [ ] Naloži podatke iz `journey_notes` in jih vizualiziraj.
    * [ ] Implementiraj možnost urejanja statičnih profilnih podatkov (posodobitev v `users` tabeli).
    * [ ] Implementiraj gumb za odjavo (klic Supabase sign out).
    * [ ] Implementiraj navigacijo do `Settings Screen`.
* **Zaslon Nastavitev (Settings Screen):**
    * [ ] Implementiraj UI za prikaz nastavitev (Obvestila, Jezik, Tema, Povezave do Policy/ToS, Info, Gumb za brisanje računa).
    * [ ] Implementiraj funkcionalnost za shranjevanje nastavitev (če je potrebno).
    * [ ] Implementiraj logiko za brisanje računa (klic namenske Supabase Edge Funkcije, ki izbriše vse povezane podatke).
* **Splošni UI/UX:**
    * [ ] Implementiraj osnovno temo (dark mode, barve) z NativeWind.
    * [ ] Dodaj "glassy" in "glowing" efekte na ključne elemente po potrebi.
    * [ ] Implementiraj osnovne animacije in prehode med zasloni z Expo Router in React Native Animated/Reanimated.
    * [ ] Zagotovi dosledno uporabo komponent in stilov.
    * [ ] Implementiraj osnovno obravnavo napak v UI (prikaz sporočil uporabniku).

## Faza 4: Testiranje

* **Unit Testi:**
    * [ ] Napiši osnovne unit teste za ključne pomožne funkcije (utils) in morda nekatere React hooke z uporabo Jest.
* **Integracijski Testi:**
    * [ ] Napiši osnovne integracijske teste za preverjanje interakcije med komponentami in osnovnimi Supabase klici (npr. prijava).
* **Ročno Testiranje:**
    * [ ] Temeljito preizkusi vse uporabniške poti (flows) na iOS simulatorju/napravi.
    * [ ] Temeljito preizkusi vse uporabniške poti na Android emulatorju/napravi.
    * [ ] Preizkusi odzivnost UI in gladkost animacij.
    * [ ] Preizkusi obravnavo napak (npr. izklop interneta med uporabo).
    * [ ] Preizkusi delovanje AI klepeta in kontekstualne zmožnosti.
    * [ ] Preizkusi proces zaključka seanse in generiranja povzetkov/zapisov.
* **Testiranje Zmogljivosti (Osnovno):**
    * [ ] Spremljaj porabo pomnilnika in CPU med uporabo aplikacije.
    * [ ] Ocenjuj odzivni čas AI odgovorov.

## Faza 5: Priprava na Objavokevo in Dokumentacija

* **Ikone in Sličice:**
    * [ ] Oblikuj in pripravi ikono aplikacije v vseh zahtevanih velikostih za iOS in Android.
    * [ ] Pripravi promocijske sličice zaslona (screenshots) za App Store in Google Play.
* **Konfiguracija Objave:**
    * [ ] Konfiguriraj `app.json` / `app.config.js` za produkcijo (ime aplikacije, bundle identifier, verzija, ikone, splash screen, dovoljenja itd.).
    * [ ] Nastavi EAS projekt in profile (preview, production).
* **Pravna Besedila:**
    * [ ] Pripravi končno verzijo Politike Zasebnosti (Privacy Policy).
    * [ ] Pripravi končno verzijo Pogojev Uporabe (Terms of Service).
    * [ ] Zagotovi, da so povezave do teh besedil dostopne v aplikaciji (Settings Screen).
* **Dokumentacija:**
    * [ ] Posodobi `README.md` v repozitoriju z navodili za zagon in osnovnim opisom projekta.
    * [ ] Dodaj komentarje v kodo po potrebi za razjasnitev kompleksnejših delov.

## Faza 6: Objava (Deployment)

* **Testiranje Pred Objavko (Release Candidate):**
    * [ ] Ustvari "preview" ali "internal testing" build preko EAS.
    * [ ] Razdeli build testerjem (če obstajajo) ali ga sam temeljito preizkusi (TestFlight za iOS, Internal Testing za Android).
    * [ ] Odpravi zadnje odkrite hrošče.
* **Produkcijski Build:**
    * [ ] Ustvari produkcijski build za iOS preko EAS Build.
    * [ ] Ustvari produkcijski build za Android preko EAS Build.
* **Oddaja v Trgovine:**
    * [ ] Pripravi vnos v App Store Connect (meta podatki, sličice, build).
    * [ ] Oddaj iOS aplikacijo v pregled Applu preko EAS Submit ali ročno.
    * [ ] Pripravi vnos v Google Play Console (meta podatki, sličice, build).
    * [ ] Oddaj Android aplikacijo v pregled Googlu preko EAS Submit ali ročno.
* **Spremljanje po Objavi:**
    * [ ] Spremljaj stanje pregledov v obeh trgovinah.
    * [ ] Po odobritvi sproži objavo.
    * [ ] Spremljaj morebitne prijave napak ali zrušitev (crash reports) preko Expo nadzorne plošče ali drugih orodij.