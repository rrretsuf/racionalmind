# Inner App - Memory / Context Feature Document (MVP v1.0.0)

## 1. Namen in Cilj (Purpose & Goal)

**Namen:** Ta dokument podrobno opisuje zasnovo in delovanje sistema za upravljanje spomina in konteksta v MVP aplikacije Inner.

**Cilj:** Ustvariti AI asistenta (specializiranega **Športnega Psihologa**), ki:
* Razume uporabnika na podlagi preteklih interakcij in profilnih podatkov.
* Ohranja kontinuiteto med seansami.
* Zagotavlja personalizirane in kontekstualno relevantne odgovore znotraj domene športne psihologije.
* Se sčasoma uči in prilagaja uporabniku (preko dinamičnega profila in Journey Doc notes).
* Učinkovito uporablja Retrieval-Augmented Generation (RAG) za dostop do specifičnega znanja s področja športne psihologije.

Ta sistem je ključen za doseganje občutka pogovora z AI-jem, ki uporabnika resnično "pozna" in mu nudi poglobljeno podporo na področju športne psihologije.

## 2. Ključne Komponente Spomina in Konteksta (Key Components)

Naslednje komponente sestavljajo celoten kontekst, ki ga AI Športni Psiholog uporablja:

1.  **Statični Uporabniški Profil (Static User Profile):**
    * **Vsebina:** Podatki, zbrani med onboardingom (odgovori na vprašanja o ciljih, izkušnjah s športno psihologijo itd.) in osnovni podatki (npr. ime, če ga uporabnik vnese).
    * **Vir:** Tabela `users` v Supabase.
    * **Namen:** Zagotavlja osnovne, redko spreminjajoče se informacije o uporabniku.
    * **Uporaba:** Vključen v začetni kontekst vsake seanse.

2.  **Dinamični Uporabniški Profil (Dynamic User Profile):**
    * **Vsebina:** AI-generiran povzetek ključnih lastnosti, vzorcev, napredka in izzivov uporabnika, ki se posodablja po vsaki seansi. Predstavlja razumevanje AI-ja o uporabniku.
    * **Vir:** Tabela `dynamic_profiles` v Supabase (povezana z `user_id`).
    * **Namen:** Zagotavlja razvijajoč se vpogled v uporabnika za AI.
    * **Uporaba:** Vključen v začetni kontekst vsake seanse.

3.  **Povzetek Predhodne Seanse (Previous Session Overview):**
    * **Vsebina:** AI-generiran povzetek (300-400 besed) **ene same**, **zadnje zaključene** seanse.
    * **Vir:** Stolpec `session_overview_summary` v tabeli `sessions` v Supabase (za zadnjo zaključeno seanso uporabnika).
    * **Namen:** Zagotavlja neposreden kontekst iz zadnje interakcije.
    * **Uporaba:** Vključen v začetni kontekst vsake nove seanse.

4.  **Journey Doc Notes (via RAG):**
    * **Vsebina:** Zbirka kratkih, jedrnatih AI-generiranih zapisov (bullet points), ki zajemajo pomembne trenutke, spoznanja, dogovore ali ključne teme iz *vseh preteklih* seans. Vsak zapis ima pripadajoč embedding.
    * **Vir:** Tabela `journey_notes` v Supabase (stolpca `note_text` in `embedding`, povezano z `user_id`).
    * **Namen:** Predstavlja dolgoročni spomin ključnih dogodkov in spoznanj uporabnikove poti.
    * **Uporaba:** **Ne** pošilja se celotna zbirka. Namesto tega se ob **začetku seanse** in **pred vsakim AI odgovorom med seanso** izvede RAG poizvedba:
        * Generira se embedding (z `Supabase.ai`) za uporabnikovo sporočilo (ali za splošno relevantnost na začetku).
        * Izvede se vektorsko iskanje (`pgvector`) v tabeli `journey_notes` za *najbolj relevantne* pretekle zapise glede na trenutno sporočilo/temo.
        * Rezultati RAG (najbolj relevantni zapisi) se vključijo v kontekst, poslan Gemini API-ju.

5.  **Baza Znanja Športne Psihologije (Sports Psychology Knowledge Base via RAG):**
    * **Vsebina:** Zbirka informacij o metodah, protokolih, tehnikah in konceptih športne psihologije, pridobljena iz vsebine MVP modulov/člankov. Vsebina je razdeljena na kose (chunks) in vsak kos ima pripadajoč embedding.
    * **Vir:** Tabela `module_embeddings` v Supabase (stolpca `content_chunk` in `embedding`).
    * **Namen:** Zagotavlja AI-ju dostop do specifičnega strokovnega znanja s področja športne psihologije.
    * **Uporaba:** RAG poizvedba se izvede:
        * **Ob začetku seanse (Initial RAG):** Na podlagi prvega sporočila ali splošne teme se pridobi osnovni relevantni "cheat sheet" iz te baze znanja.
        * **Med seanso (Mid-Session RAG - Ključno!):** Pred **vsakim** AI odgovorom se na podlagi **trenutnega uporabnikovega sporočila** izvede RAG poizvedba. To omogoča AI-ju, da dinamično pridobi in uporabi specifične tehnike, razlage ali koncepte, ki postanejo relevantni *med* pogovorom.

6.  **Specifični Prompt AI Športnega Psihologa (Sports Therapist Specific Prompt):**
    * **Vsebina:** Podroben sistemski prompt, ki definira osebnost, vlogo, cilje, metode, etična načela in komunikacijski stil AI-ja kot **specializiranega športnega psihologa**. Vključuje navodila za uporabo konteksta in RAG rezultatov.
    * **Vir:** Definiran kot konstanta ali pridobljen iz konfiguracije znotraj Edge Funkcije.
    * **Namen:** Usmerja delovanje in odzivanje AI modela v skladu z želeno vlogo.
    * **Uporaba:** Vedno vključen na začetku konteksta, poslanega Gemini API-ju.

7.  **Zgodovina Trenutne Seanse (Current Session History):**
    * **Vsebina:** Celotno zaporedje sporočil (uporabnik in AI) znotraj **trenutno aktivne** seanse.
    * **Vir:** Zgrajeno dinamično v Edge Funkciji pred vsakim AI klicem.
    * **Namen:** Zagotavlja neposredni potek trenutnega pogovora.
    * **Uporaba:** Vedno vključeno v kontekst, poslan Gemini API-ju.

8.  **Trenutno Uporabnikovo Sporočilo (Current User Message):**
    * **Vsebina:** Zadnje sporočilo, ki ga je poslal uporabnik.
    * **Vir:** Del tovora (payload), poslanega iz RN aplikacije v Edge Funkcijo.
    * **Namen:** Osnovni input za generiranje odgovora AI-ja.
    * **Uporaba:** Vedno vključeno na koncu konteksta, poslanega Gemini API-ju.

## 3. Življenjski Cikel Seanse in Upravljanje Konteksta (Session Lifecycle & Context Management)

Celoten proces upravljanja konteksta poteka znotraj **Supabase Edge Functions**.

### 3.1. Začetek Nove Seanse (Starting a New Session)

1.  **Sprožilec:** Uporabnik pritisne gumb "Start New Session" v RN aplikaciji. Aplikacija zabeleži začetek nove seanse v tabelo `sessions` s statusom 'active'.
2.  **Prvo Sporočilo:** Uporabnik pošlje prvo sporočilo. RN aplikacija pokliče `gemini-chat` Edge Funkcijo s tem sporočilom in `user_id`.
3.  **Sestavljanje Začetnega Konteksta (Initial Context Assembly) - v `gemini-chat` Edge Funkciji:**
    * Pridobi **Specifični Prompt AI Športnega Psihologa**.
    * Pridobi **Statični Uporabniški Profil** (iz `users`).
    * Pridobi **Dinamični Uporabniški Profil** (iz `dynamic_profiles`).
    * Pridobi **Povzetek Predhodne Seanse** (iz `sessions`, zadnja zaključena).
    * Izvede **Začetni Journey Doc RAG**:
        * Generira embedding za prvo sporočilo (ali splošno relevantnost).
        * Poišče najbolj relevantne zapise v `journey_notes` preko `pgvector`.
    * Izvede **Začetni Sports Therapy Knowledge RAG**:
        * Generira embedding za prvo sporočilo.
        * Poišče najbolj relevantne kose znanja v `module_embeddings` preko `pgvector`.
    * Doda **Trenutno (prvo) Uporabnikovo Sporočilo**.
4.  **Klic Gemini API:** Celoten sestavljen kontekst se pošlje Gemini API (`gemini-2.0-flash`).
5.  **Odgovor:** Prejeti odgovor (preko SSE) se posreduje RN aplikaciji za prikaz.

### 3.2. Med Seanso (During the Session) - Vsak Naslednji Turn

1.  **Sprožilec:** Uporabnik pošlje novo sporočilo. RN aplikacija pokliče `gemini-chat` Edge Funkcijo s tem sporočilom, `user_id` in zgodovino trenutne seanse.
2.  **Sestavljanje Konteksta za Vsak Turn (Turn-by-Turn Context Assembly) - v `gemini-chat` Edge Funkciji:**
    * Pridobi **Specifični Prompt AI Športnega Psihologa**.
    * Pridobi **Statični Uporabniški Profil**.
    * Pridobi **Dinamični Uporabniški Profil**.
    * Pridobi **Povzetek Predhodne Seanse**.
    * Izvede **Mid-Session Journey Doc RAG**:
        * Generira embedding za **trenutno** uporabnikovo sporočilo.
        * Poišče najbolj relevantne zapise v `journey_notes`.
    * Izvede **Mid-Session Sports Therapy Knowledge RAG (Ključno!)**:
        * Generira embedding za **trenutno** uporabnikovo sporočilo.
        * Poišče najbolj relevantne kose znanja v `module_embeddings`.
    * Vključi **Celotno Zgodovino Trenutne Seanse** (vsa sporočila doslej).
    * Doda **Trenutno Uporabnikovo Sporočilo**.
3.  **Klic Gemini API:** Celoten, na novo sestavljen kontekst se pošlje Gemini API.
4.  **Odgovor:** Prejeti odgovor (preko SSE) se posreduje RN aplikaciji za prikaz.

### 3.3. Konec Seanse (Ending a Session) - Obdelava v Ozadju

1.  **Sprožilec:** Seansa se zaključi (ročno, timeout, nova seansa). Status seanse v tabeli `sessions` se posodobi na 'completed'. To lahko sproži (npr. preko Supabase Triggers ali direktnega klica iz klienta/druge funkcije) izvajanje `process-session-end` Edge Funkcije v ozadju.
2.  **Izvajanje `process-session-end` Edge Funkcije:**
    * **A. Generiraj Povzetek Seanse (Generate Session Overview):**
        * Pridobi celotno zgodovino sporočil zaključene seanse iz tabele `messages`.
        * Pošlje zgodovino Gemini API-ju (morda močnejšemu modelu, če je potrebno za kakovost povzetka) z navodilom za generiranje povzetka (300-400 besed).
        * Shrani generiran povzetek v stolpec `session_overview_summary` v tabeli `sessions` za to seanso.
    * **B. Ekstrahiraj in Shrani Journey Doc Notes (Extract & Save Journey Doc Notes):**
        * Pošlje zgodovino sporočil (ali generiran povzetek) Gemini API-ju z navodilom za ekstrakcijo ključnih zapisov/spoznanj v obliki bullet pointov.
        * Za vsak ekstrahiran zapis:
            * Pokliče `generate-embeddings` funkcijo za pridobitev embeddinga zapisa.
            * Ustvari nov vnos v tabeli `journey_notes` z `user_id`, `session_id`, `note_text` in `embedding`.
    * **C. Posodobi Dinamični Profil (Update Dynamic Profile):**
        * Pridobi trenutni dinamični profil iz tabele `dynamic_profiles`.
        * Pridobi novo generiran povzetek seanse (iz koraka A) in morda nove Journey Doc Notes (iz koraka B).
        * Pošlje te informacije (stari profil, novi povzetek/zapiski) Gemini API-ju z navodilom za generiranje **posodobljenega** dinamičnega profila.
        * Shrani posodobljen dinamični profil nazaj v tabelo `dynamic_profiles`.

## 4. Strategija RAG (Retrieval-Augmented Generation) - Športna Psihologija

Učinkovit RAG je ključen za zagotavljanje specifičnega znanja AI Športnemu Psihologu.

* **Vir Znanja:** Vsebina iz MVP modulov/člankov o športni psihologiji, razdeljena na smiselne kose (chunks) in shranjena z embeddingi v tabeli `module_embeddings`.
* **RAG Tip 1: Journey Doc Notes:** Omogoča AI-ju dostop do relevantnih preteklih spoznanj in dogodkov uporabnika med pogovorom. Iskanje se izvaja v tabeli `journey_notes`.
* **RAG Tip 2: Sports Therapy Knowledge:** Omogoča AI-ju dostop do strokovnega znanja. Iskanje se izvaja v tabeli `module_embeddings`.
* **Izvajanje:**
    * **Začetno (Session Start):** Oba tipa RAG se izvedeta enkrat ob začetku seanse na podlagi prvega sporočila, da se zagotovi osnovni kontekst.
    * **Med Seanso (Mid-Session - Nujno Potrebno!):** Oba tipa RAG se izvedeta **pred vsakim AI odgovorom** na podlagi **trenutnega uporabnikovega sporočila**.
        * **Utemeljitev:** Brez mid-session RAG bi bil AI Športni Psiholog omejen na znanje, pridobljeno na začetku, in svoje splošno znanje. Ne bi mogel dinamično priklicati specifičnih tehnik, protokolov ali podrobnih razlag, ki postanejo relevantne šele *med* pogovorom. To bi bistveno zmanjšalo njegovo učinkovitost kot specializiranega terapevta. Zato je implementacija mid-session RAG ključnega pomena za doseganje ciljev aplikacije.

## 5. Tehnična Implementacija (Technical Implementation Summary)

* **Jedro Logike:** Supabase Edge Functions (TypeScript/Deno).
    * `gemini-chat`: Upravlja sestavljanje konteksta za vsak turn, klice Gemini API in RAG poizvedbe (preko klica `rag-search`), ter SSE streaming.
    * `process-session-end`: Asinhrono izvaja obdelavo po koncu seanse (generiranje povzetkov, zapisov, posodobitev profila).
    * `generate-embeddings`: Centralizirana funkcija za generiranje embeddingov z `Supabase.ai`.
    * `rag-search`: Centralizirana funkcija za izvajanje vektorskih iskanj v `journey_notes` in `module_embeddings` z `pgvector`.
* **AI Modeli:**
    * Google `gemini-2.0-flash` za chat.
    * Google Gemini (morda močnejši model) za povzetke/zapiske/profil.
* **Embeddings:** `Supabase.ai.Session('gte-small')` znotraj Edge funkcij.
* **Vektorska Baza:** PostgreSQL z `pgvector` extenzijo znotraj Supabase DB.

## 6. Ohranjanje Konteksta (Turn-by-Turn Context Maintenance)

* **Stateless API:** API klici k Gemini (in Supabase Edge Functions, če se gledajo kot ločeni klici) so po naravi brez stanja (stateless). Ne pomnijo prejšnjih klicev v isti "seansi" API interakcij.
* **Rekonstrukcija Konteksta:** Zato je **odgovornost `gemini-chat` Edge Funkcije**, da **pred vsakim posameznim klicem** Gemini API **popolnoma na novo sestavi celoten potreben kontekstni paket**, kot je opisano v razdelku 3.2. Ta paket vključuje vse komponente iz razdelka 2 (prompt, profili, povzetek prejšnje seanse, RAG rezultati, zgodovina trenutne seanse, trenutno sporočilo).
* **Posledice:** Ta pristop zagotavlja, da ima AI vedno na voljo maksimalno relevantne informacije, hkrati pa poudarja pomen učinkovitega sestavljanja konteksta in pridobivanja RAG rezultatov za ohranjanje dobre odzivnosti.

## 7. Zasebnost in Varnost (Privacy & Security)

* Vsi podatki (profili, seanse, sporočila, zapiski) so shranjeni v Supabase PostgreSQL bazi.
* Dostop do podatkov je omejen z uporabo Supabase avtentikacije in Row Level Security (RLS) politik, ki zagotavljajo, da lahko uporabniki dostopajo le do svojih podatkov.
* Klici med RN aplikacijo in Supabase Edge funkcijami so avtenticirani.
* Klici med Edge funkcijami in Gemini API uporabljajo varne API ključe, shranjene kot skrivnosti (secrets) v Supabase.
* Podrobnosti o brisanju podatkov so definirane v App Flow (Settings Screen -> Delete Account).