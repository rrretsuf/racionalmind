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
        * [x] Ustvari `.env` datoteke (npr. `.env`, `.env.production`, `.env.development`).
        * [x] Definiraj spremenljivko za okolje (npr. `APP_ENV=development` ali `APP_ENV=production`).
        * [x] Varno shrani Supabase ključe in Sentry DSN v `.env`.
        * [x] Konfiguriraj dostop do teh spremenljivk v Expo aplikaciji (npr. preko `expo-constants` ali `react-native-dotenv`).
* **Supabase Projekt:**
    * [x] Ustvari nov projekt na Supabase.
    * [x] Pridobi in varno shrani projektne URL-je in API ključe (anon, service_role).
    * [x] Nastavi Supabase Auth (omogoči Email/Password in Apple Sign In).
    * [x] Ustvari tabele v Supabase DB (glej `database_schema.md`).
    * [x] Omogoči `pgvector` extenzijo v Supabase DB.
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

## Faza 2: Backend Razvoj (Supabase)

* **Avtentikacija (Auth):**
    * [x] Implementiraj Supabase Auth klienta v RN aplikaciji (sign up, sign in, sign out) za Email/Password.
    * [x] Implementiraj Supabase Auth klienta za Apple Sign In.
    * [x] Nastavi poslušalce (listeners) za spremembe stanja avtentikacije v RN aplikaciji.
    * [x] Nastavi Row Level Security (RLS) politike za osnovne tabele (npr. da uporabniki vidijo/urejajo le svoje podatke).
* **Baza Podatkov (Database Schema):**
    * [x] Definiraj in ustvari tabele v Supabase za MVP:
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
    * [ ] Naloži podatke o seansah (datum, povzetek) iz Supabase `