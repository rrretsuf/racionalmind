# Inner App - MVP Implementation Plan (v2.0.0)

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
        * [x] Ustvari `.env` datoteke (npr. `.env`, `.env.production`, `.env.development`).
        * [x] Definiraj spremenljivko za okolje (npr. `APP_ENV=development` ali `APP_ENV=production`).
        * [x] Varno shrani Supabase ključe in Sentry DSN v `.env`.
        * [x] Konfiguriraj dostop do teh spremenljivk v Expo aplikaciji (npr. preko `expo-constants` ali `react-native-dotenv`).
* **Supabase Projekt:**
    * [x] Ustvari nov projekt na Supabase.
    * [x] Pridobi in varno shrani projektne URL-je in API ključe (anon, service_role).
    * [x] Nastavi Supabase Auth (omogoči Email/Password in Apple Sign In).
    * [x] **Potrdi/Ustvari tabele v Supabase DB:**
        * [x] Tabele `profiles`, `dynamic_profiles`, `modules`, `module_embeddings`, `sessions`, `messages`, `journey_notes` so ustvarjene (glede na SQL).
        * [ ] Pred začetkom dela na Fazi 2/3/4 preveri strukturo, RLS in indekse vsake tabele glede na `database_schema.md` in dejansko stanje.
    * [x] Omogoči `pgvector` extenzijo v Supabase DB.
    * [x] Omogoči `moddatetime` extenzijo v Supabase DB.
    * [x] Nastavi osnovno strukturo za Supabase Edge Functions (Deno, TypeScript).
* **Sentry Nastavitev:**
    * [x] Ustvari nov projekt v Sentry za React Native aplikacijo.
    * [x] Ustvari nov projekt v Sentry za Supabase Edge Functions (ali uporabi istega z različnimi okolji).
    * [x] Pridobi Sentry DSN-je in jih varno shrani v okoljske spremenljivke (`.env`).
    * [x] **Expo/RN:** Namesti in inicializiraj `@sentry/react-native` SDK zgodaj v aplikaciji (npr. `App.tsx`), z uporabo pravilnega DSN in nastavitvijo `environment`.
    * [x] **Supabase Edge Functions:** Namesti in inicializiraj `@sentry/deno` v skupnem utility modulu ali na začetku funkcij, z uporabo pravilnega DSN in `environment`.
* **Centralni Logger Modul:**
    * [x] **Expo/RN:** Ustvari `Logger` utility (npr. `utils/logger.ts`):
        * [x] Implementiraj funkcije `log.debug()`, `log.info()`, `log.warn()`, `log.error(error, context?)`.
        * [x] Funkcije naj preverijo okoljsko spremenljivko (npr. `process.env.NODE_ENV === 'production'` ali `Constants.expoConfig.extra.appEnv === 'production'`).
        * [x] Če produkcija: pošlji dogodek/napako v Sentry (`Sentry.captureMessage`, `Sentry.captureException`).
        * [x] Če razvoj: uporabi `console.log/warn/error`.
    * [x] **Supabase Edge Functions:** Ustvari skupni `Logger` utility (npr. `supabase/functions/_shared/logger.ts`):
        * [x] Implementiraj podobne funkcije (`debug`, `info`, `warn`, `error`).
        * [x] Funkcije naj preverijo okoljsko spremenljivko (npr. `Deno.env.get('APP_ENV') === 'production'`).
        * [x] Če produkcija: pošlji dogodek/napako v Sentry (`Sentry.captureMessage`, `Sentry.captureException`).
        * [x] Če razvoj/lokalno: uporabi `console.log/warn/error`.
* **Osnovna Struktura RN Projekta:**
    * [x] Implementiraj osnovno strukturo map in datotek v Expo projektu (npr. `app/` za Expo Router, `components/`, `hooks/`, `services/`, `utils/`, `contexts/`).
    * [x] Nastavi NativeWind za stiliziranje.
* **Ostala Pravila:**
    * [x] Project Structure
    * [x] How to interact with the codebase (review, update, add, delete)

---

## Faza 2: Osnovna Aplikacija in Avtentikacija ("Raw App")

**Cilj:** Postaviti osnovno ogrodje aplikacije z delujočo avtentikacijo in navigacijo med glavnimi zasloni, brez napredne funkcionalnosti ali onboardinga.

* **Backend (Supabase - Osnove Auth & Profiles):**
    * [x] **Preglej RLS in Triggerje za `profiles`:**
        * [x] Potrdi, da RLS politiki (`SELECT` in `UPDATE` lastnega) za `profiles` delujeta kot pričakovano.
        * [x] **Implementiraj/Potrdi funkcijo `handle_new_user` in trigger `on_auth_user_created`:** Zagotovi, da se ob registraciji novega uporabnika avtomatsko ustvari vnos v `profiles`. (SQL funkcija je implementirana)
* **Storitve (React Native - Auth Service):** - Completed
    * [x] Ustvari `services/auth.ts` v RN projektu.
    * [x] Implementiraj funkcije za `signUpWithEmail`, `signInWithEmail`, `signInWithApple`, `signOut`.
    * [x] Implementiraj funkcijo `getSession` (za pridobivanje trenutne seanse/uporabnika iz Supabase).
    * [x] Implementiraj hook `useAuth` (ali Context) za upravljanje stanja avtentikacije in poslušanje sprememb (Supabase `onAuthStateChange`).
* **Frontend (Expo RN - UI, Navigacija & Auth Povezava):**
    * [x] **Expo Router Nastavitev:**
        * [x] Definiraj korenski `_layout.tsx` (globalni providerji, npr. AuthContext).
        * [x] Definiraj `app/index.tsx` za preusmerjanje (loading ali na `(auth)` / `(main)` glede na stanje prijave).
        * [x] Ustvari `(auth)` skupino z `_layout.tsx` in `welcome.tsx`.
        * [x] Ustvari `(main)` skupino z `_layout.tsx` (npr. osnovni stack navigator) in datotekami za glavne zaslone (`home.tsx`, `session.tsx`, `history.tsx`, `profile.tsx`).
    * [x] **Welcome Screen (`(auth)/welcome.tsx`):**
        * [x] Implementiraj osnovni UI (pozdrav, gumba "Log In", "Create Account").
        * [x] Implementiraj prikaz modalnih oken za Email/Geslo in Apple Sign In/Up (UI). - (Note: Implemented directly on screen for simplicity, modals not used yet)
        * [x] Poveži gumbe in modalna okna s funkcijami iz `services/auth.ts`.
    * [x] **Main Screen (`(main)/home.tsx`):**
        * [x] Implementiraj osnovni UI:
            * [x] Statičen pozdrav.
            * [x] Gumb "Start New Session" (navigira na `(main)/session`).
            * [x] Placeholderji za module (vizualno, kot `View` elementi, brez podatkov ali funkcije).
            * [x] Gumba/ikoni za `History` in `Profile` (navigirata na `(main)/history` in `(main)/profile`).
    * [x] **Session Screen (`(main)/session.tsx`):**
        * [x] Implementiraj osnovni UI:
            * [x] Gumb "Nazaj".
            * [x] Placeholder za seznam sporočil (`ScrollView` ali `FlatList` brez podatkov).
            * [x] Ne-funkcionalno vnosno polje (`TextInput`) in gumb za pošiljanje.
    * [x] **History Screen (`(main)/history.tsx`):**
        * [x] Implementiraj osnovni UI:
            * [x] Gumb "Nazaj".
            * [x] Naslov "History".
            * [x] Prazen seznam (`ScrollView` ali `FlatList` brez podatkov).
    * [x] **Profile Screen (`(main)/profile.tsx`):**
        * [x] Implementiraj osnovni UI:
            * [x] Gumb "Nazaj".
            * [x] Okrogel avatar placeholder (v stilu aplikacije).
            * [x] Statično besedilo "user name" pod avatarjem.
            * [x] **Delujoč** gumb "Log Out" (klic `signOut` iz `services/auth.ts`).

---

## Faza 3: Implementacija Funkcionalnosti Seanse ("Session Functionality")

**Cilj:** Implementirati jedro aplikacije – funkcionalen klepet z AI Športnim Psihologom, vključno s postopnim dodajanjem spomina in konteksta, ter delujoč pregled zgodovine seans.

* **Backend (Supabase - Edge Funkcije & DB):**
    * [ ] **Pregled Sheme za Seanse:**
        * [x] Tabele `sessions` in `messages` so ustvarjene.
        * [ ] **Preglej RLS in Indekse:** Potrdi, da so RLS politike in indeksi (še posebej `idx_messages_session_id_created_at`) za `sessions` in `messages` pravilno nastavljeni in delujoči.
    * [ ] **Faza 3A: Osnovna Chat Funkcionalnost (Brez Spomina):**
        * [ ] **Ustvari `gemini-chat` Funkcijo (Verzija 1 - Osnovna):**
            * [ ] Definiraj vhodne parametre: `messages` (samo zgodovina trenutne seanse), `userId`.
            * [ ] Definiraj konstanto `SPORTS_THERAPIST_PROMPT` (osnovni sistemski prompt za AI).
            * [ ] Sestavi zahtevek za Gemini API (vključi samo `SPORTS_THERAPIST_PROMPT` in `messages`).
            * [ ] Izvedi klic na Google Gemini API (`gemini-2.0-flash` model) preko REST API.
            * [ ] Implementiraj Server-Sent Events (SSE) za pretakanje (streaming) odgovora nazaj klientu.
            * [ ] Dodaj osnovno logiranje (preko `Logger` modula) in obravnavo napak.
    * [ ] **Faza 3B: Osnovni Konec Seanse in Zgodovina:**
        * [ ] Implementiraj logiko za zaključek seanse (npr. ob začetku nove seanse, timeout v `gemini-chat` ali na klientu).
        * [ ] Ustvari osnovno `process-session-end` Funkcijo (Verzija 1):
            * [ ] Sprejme `sessionId`, `userId`.
            * [ ] Samo posodobi `status` seanse v `sessions` tabeli na 'completed' in nastavi `ended_at`.
            * [ ] (Brez povzetka/notes/profila zaenkrat).
    * [ ] **Faza 3C: Implementacija Komponent Spomina (Postopno - Moduli):**
        * [ ] **Pregled Sheme za Module:**
            * [x] Tabele `modules` in `module_embeddings` so ustvarjene.
            * [ ] **Preglej RLS in Indekse:** Potrdi RLS za `modules` in vektorski indeks za `module_embeddings`.
        * [ ] **Priprava Podatkov:**
            * [ ] Pripravi vsebino za 5 MVP modulov (športna psihologija).
            * [ ] Napiši skripto ali ročno vnesi vsebino modulov v `modules` tabelo.
            * [ ] **Ustvari `generate-embeddings` Funkcijo:**
                * [ ] Definiraj vhodni parameter: `inputText`.
                * [ ] Uporabi `Supabase.ai.Session('gte-small')` za generiranje embeddinga.
                * [ ] Vrne `embedding`. Logiranje/napake.
            * [ ] Napiši skripto (ali uporabi Edge Funkcijo), ki:
                * [ ] Prebere module iz `modules`.
                * [ ] Razdeli vsebino na kose (`content_chunk`).
                * [ ] Za vsak kos pokliče `generate-embeddings`.
                * [ ] Shrani `module_id`, `content_chunk`, `embedding` v `module_embeddings`.
        * [ ] **Ustvari `rag-search` Funkcijo (Verzija 1 - Samo Moduli):**
            * [ ] Definiraj vhodne parametre: `queryEmbedding`, `match_threshold`, `match_count`.
            * [ ] Izvedi vektorsko iskanje samo v tabeli `module_embeddings`.
            * [ ] Vrne relevantne `content_chunk`-e. Logiranje/napake.
        * [ ] **Posodobi `gemini-chat` Funkcijo (Verzija 2 - Moduli RAG):**
            * [ ] Pred klicem Gemini API:
                * [ ] Kliči `generate-embeddings` za trenutno uporabnikovo sporočilo.
                * [ ] Kliči `rag-search` (Verzija 1) s prejetim embeddingom.
                * [ ] Dodaj najdene module chunks v kontekst, poslan Gemini.
    * [ ] **Faza 3D: Implementacija Naprednejšega Spomina (Profili, Journey Notes):**
        * [ ] **Pregled Sheme za Profile/Notes:**
            * [x] Tabele `dynamic_profiles` in `journey_notes` so ustvarjene.
            * [ ] **Preglej RLS in Indekse:** Potrdi RLS politike in vektorski indeks za `journey_notes`.
        * [ ] **Posodobi `process-session-end` Funkcijo (Verzija 2 - Povzetek & Notes):**
            * [ ] **Korak 1: Generiraj Povzetek Seanse:** Kliči Gemini za povzetek, shrani v `sessions.session_overview_summary`.
            * [ ] **Korak 2: Ekstrahiraj in Shrani Journey Notes:** Kliči Gemini za ekstrakcijo, za vsak note kliči `generate-embeddings`, shrani v `journey_notes`.
        * [ ] **Posodobi `process-session-end` Funkcijo (Verzija 3 - Dinamični Profil):**
            * [ ] **Korak 3: Posodobi Dinamični Profil:** Pridobi stari profil, novi povzetek, kliči Gemini za posodobitev, shrani v `dynamic_profiles`.
        * [ ] **Posodobi `rag-search` Funkcijo (Verzija 2 - Dodaj Journey Notes):**
            * [ ] Dodaj vhodni parameter `userId`.
            * [ ] Izvedi vektorsko iskanje tudi v `journey_notes` (filtrirano po `userId`).
            * [ ] Združi in vrni relevantne rezultate iz obeh (moduli, notes).
        * [ ] **Posodobi `gemini-chat` Funkcijo (Verzija 3 - Poln Spomin):**
            * [ ] Pred klicem Gemini API:
                * [ ] Pridobi statični profil (iz `profiles`).
                * [ ] Pridobi dinamični profil (iz `dynamic_profiles`).
                * [ ] Pridobi povzetek zadnje zaključene seanse (iz `sessions`).
                * [ ] Kliči `generate-embeddings`.
                * [ ] Kliči `rag-search` (Verzija 2).
                * [ ] Sestavi **poln** kontekst (Prompt, Profili, Povzetek, RAG rezultati, Zgodovina, Sporočilo).
* **Frontend (Expo RN - Povezava s Funkcijami):**
    * [ ] **Session Screen:**
        * [ ] Poveži UI s `gemini-chat` funkcijo (klicanje ob pošiljanju sporočila).
        * [ ] Implementiraj pravilno pošiljanje zgodovine sporočil funkciji.
        * [ ] Implementiraj sprejemanje in prikazovanje SSE odgovorov (postopno dodajanje besedila).
        * [ ] Implementiraj prikaz sporočil (uporabnik vs AI) z uporabo `FlatList`.
        * [ ] (Opcijsko) Implementiraj gumb za ročni zaključek seanse (sproži klic na `process-session-end` ali posodobi status seanse).
    * [ ] **History Screen:**
        * [ ] Naloži in prikaži seznam zaključenih seans iz `sessions` tabele (datum, `session_overview_summary`).
        * [ ] Implementiraj navigacijo na nov zaslon (`Session Detail Screen` - read-only).
        * [ ] Implementiraj `Session Detail Screen`: Naloži in prikaži vsa sporočila (`messages`) za izbrano `session_id`.
        * [ ] Implementiraj funkcionalnost brisanja seanse (iz UI in baze).
* **Storitve (React Native - Session Service):**
    * [ ] Ustvari/dopolni `services/session.ts`.
    * [ ] Implementiraj funkcijo za klic `gemini-chat` (verjetno z uporabo `fetch` in `ReadableStream`).
    * [ ] Implementiraj funkcije za pridobivanje seznama seans, pridobivanje sporočil seanse, brisanje seanse.

---

## Faza 4: Dokončanje MVP-ja ("Finishing App")

**Cilj:** Integrirati preostale dele, implementirati onboarding, dokončati profilni in ostale zaslone ter zagotoviti, da so vse MVP funkcionalnosti polirane in pripravljene za objavo.

* **Backend (Supabase):**
    * [ ] **Končni Pregled Baze:** Preglej in dokončno potrdi RLS politike in indekse za vse tabele. Zagotovi varnost in optimizacijo.
    * [ ] **Konfiguracija Produkcije (SMTP):**
        * [ ] Nastavi zunanji SMTP ponudnik v Supabase nastavitvah za zanesljivo pošiljanje e-pošte (npr. za ponastavitev gesla pri Email/Password prijavi). **To je priporočljivo za produkcijo.**
* **Frontend (Expo RN):**
    * [ ] **Onboarding Flow (`(onboarding)` skupina poti):**
        * [ ] Ustvari `(onboarding)` skupino v `app/`.
        * [ ] Implementiraj UI za več zaslonov z vprašanji in text inputi (po `app-flow.md`).
        * [ ] Implementiraj shranjevanje odgovorov v `profiles` tabelo (preko `services/profile.ts`).
        * [ ] Poveži registracijo z začetkom onboarding toka in konec toka z navigacijo na `(main)`.
    * [ ] **Profile Screen:**
        * [ ] Prikaz in urejanje podatkov iz `profiles` (klic `services/profile.ts` za branje/pisanje).
        * [ ] Prikaz podatkov iz `dynamic_profiles` (klic `services/profile.ts` za branje, read-only).
        * [ ] Implementacija vizualizacije `Journey Doc Notes` (klic `services/profile.ts` za branje `journey_notes`, read-only prikaz).
        * [ ] **Settings Screen:**
            * [ ] Ustvari `(settings)` zaslon (ali znotraj `(main)`).
            * [ ] Implementiraj UI (preklopi, povezave do Privacy/Terms, About).
            * [ ] Implementiraj funkcijo "Delete Account" (klic Supabase Admin API ali namenske Edge funkcije za brisanje uporabnika in povezanih podatkov).
    * [ ] **Main Screen (`(main)/home.tsx`):**
        * [ ] Zamenjaj placeholderje za module s `FlatList` ali `ScrollView`, ki nalaga in prikazuje podatke iz `modules` tabele (klic `services/modules.ts`).
        * [ ] Implementiraj navigacijo na `Module Detail Screen` ob pritisku na modul.
    * [ ] **Module Detail Screen:**
        * [ ] Ustvari zaslon `(module_detail)` ali znotraj `(main)`.
        * [ ] Implementiraj UI za prikaz vsebine modula (naslov, slika, povzetek, vsebina).
        * [ ] Naloži in prikaži vsebino izbranega modula iz `modules` (klic `services/modules.ts`). Read-only.
    * [ ] **Obravnava Napak & Poliranje:**
        * [ ] Implementiraj centralizirano prikazovanje napak uporabniku (npr. toast sporočila, modalna okna).
        * [ ] Integriraj klice `Logger` modula na ključnih mestih (API klici, napake).
        * [ ] Končni pregled UI/UX vseh zaslonov, skladnost s `styling-rules.mdc`.
        * [ ] Poliranje animacij in prehodov.
* **Storitve (React Native - Ostale Storitve):**
    * [ ] Ustvari `services/profile.ts` (branje/pisanje `profiles`, branje `dynamic_profiles`, branje `journey_notes`).
    * [ ] Ustvari `services/modules.ts` (branje seznama modulov, branje podrobnosti modula).
* **Dokumentacija:**
    * [ ] Posodobi vse `.md` dokumente (App Flow, Requirements, itd.), da odražajo končno stanje MVP-ja.
    * [ ] Pripravi besedili za Politiko Zasebnosti in Pogoje Uporabe.

---

## Faza 5: Objava Aplikacije ("Publish App")

**Cilj:** Pripraviti aplikacijo za produkcijsko okolje in jo objaviti v App Store in Google Play.

* **Priprava na Produkcijo:**
    * [ ] Konfiguriraj `.env.production` z ustreznimi ključi in nastavitvami.
    * [ ] Nastavi Sentry DSN in okolje za produkcijo v RN in Edge funkcijah.
    * [ ] Temeljito testiranje na fizičnih napravah (iOS in Android), vključno z regresijskim testiranjem.
    * [ ] Optimizacija velikosti aplikacije (npr. analiza paketov, kompresija sredstev).
    * [ ] Priprava sredstev za trgovine (app ikona, splash screen, posnetki zaslona, promocijsko besedilo).
    * [ ] Konfiguracija `app.json` za produkcijo (verzija, build številka, dovoljenja, ikone itd.).
* **Objava:**
    * [ ] Ustvari produkcijske build-e z `eas build --profile production`.
    * [ ] Ustvari račune v App Store Connect in Google Play Console.
    * [ ] Konfiguriraj podrobnosti aplikacije v obeh trgovinah (metapodatki, cenik, države itd.).
    * [ ] Naloži build-e z `eas submit` (ali ročno).
    * [ ] Izpolni obrazce za pregled (npr. informacije o zasebnosti podatkov).
    * [ ] Oddaj aplikacijo v pregled.
    * [ ] Spremljaj status pregleda in odgovarjaj na morebitna vprašanja recenzentov.
