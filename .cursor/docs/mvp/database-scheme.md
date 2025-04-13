# Inner App - Database Schema (MVP v1.0.0)

## 1. Uvod

Ta dokument specificira dokončno strukturo tabel v Supabase (PostgreSQL) podatkovni bazi za MVP aplikacije Inner. Poudarek je na natančni definiciji vsakega stolpca, njegovem podatkovnem tipu, omejitvah, privzetih vrednostih, indeksih in namenu, še posebej v luči zagotavljanja **najboljšega možnega konteksta za AI Športnega Psihologa (Gemini 2.0 Flash)**. Zasnova sledi principom optimalnosti, jasnosti in funkcionalnosti, izogiba se nepotrebni redundanci, hkrati pa zagotavlja logično ločevanje podatkov za boljše upravljanje in zmogljivost.

**Konvencije:**
* **Primarni Ključi (PK):** Tipa `uuid` z `DEFAULT gen_random_uuid()`, razen `profiles.id`, ki ustreza `auth.users.id`. UUID-ji so izbrani za boljšo skalabilnost in preprečevanje ugibanja ID-jev.
* **Tuji Ključi (FK):** Jasno definirani z `REFERENCES`, večinoma `ON DELETE CASCADE` za ohranjanje referenčne integritete (npr. ob brisanju uporabnika se izbrišejo vsi njegovi povezani podatki).
* **Časovni Žigi:** `created_at` in `updated_at` tipa `timestamp with time zone` (`timestamptz`) za natančno sledenje času dogodkov ne glede na časovne pasove. `DEFAULT now()` za `created_at`.
* **Embeddingi:** Tipa `vector(384)` za shranjevanje vektorjev iz modela `gte-small`, ki ga uporablja `Supabase.ai`. Dimenzija je ključna za pravilno delovanje vektorskih operacij.
* **RLS (Row Level Security):** Omogočen za vse tabele z uporabniškimi podatki za zagotavljanje zasebnosti in varnosti na nivoju vrstic.
* **SQL Razširitve:** `moddatetime` (za `updated_at` trigger) in `vector` (za vektorske operacije) morata biti omogočena v Supabase projektu.

```sql
-- SQL ukazi za omogočanje potrebnih razširitev (izvedi v Supabase SQL Editorju, če še nista omogočeni)
CREATE EXTENSION IF NOT EXISTS moddatetime;
CREATE EXTENSION IF NOT EXISTS vector;
```

## 2. Definicije Tabel

---

### 2.1. Tabela `profiles`

* **Namen:** Hrani **statične, večinoma ročno vnesene podatke** o uporabniku, pridobljene med onboardingom in kasnejšimi urejanji. Ti podatki predstavljajo osnovno, redko spreminjajočo se plast konteksta za AI, ki pomaga razumeti uporabnikovo izhodišče in cilje.
* **Optimizacija/Relacije:** Stroga 1:1 relacija z `auth.users` (preko `id`) zagotavlja integriteto. Ločena od `dynamic_profiles`, ker se vir (uporabnik vs AI) in frekvenca posodobitev bistveno razlikujeta.

```sql
-- ### TABLE: profiles ###
-- Opis: Statični profil uporabnika, povezan z auth.users.

CREATE TABLE public.profiles (
    -- --- Stolpci ---
    id           uuid NOT NULL PRIMARY KEY,
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, PRIMARY KEY
                 -- Namen: Enolični identifikator uporabnika, **enak kot v `auth.users`. Ključ za povezavo vseh ostalih uporabniških podatkov.** Referencira `auth.users.id`.

    updated_at   timestamptz NOT NULL DEFAULT now(),
                 -- Podatkovni Tip: timestamp with time zone
                 -- Omejitve: NOT NULL, DEFAULT now()
                 -- Namen: Sledi zadnji spremembi statičnega profila. Koristno za audit/debug.

    username     text NULL UNIQUE,
                 -- Podatkovni Tip: text
                 -- Omejitve: UNIQUE (če je podan), CHECK (dolžina >= 3, če ni NULL)
                 -- Namen: Opcijsko uporabniško ime. **Lahko se uporabi v AI nagovoru za večjo personalizacijo.**

    full_name    text NULL,
                 -- Podatkovni Tip: text
                 -- Namen: Opcijsko polno ime. **Podobno kot username, za personalizacijo.**

    avatar_url   text NULL,
                 -- Podatkovni Tip: text
                 -- Namen: URL do slike. Primarno za UI, za AI ni neposredno relevanten.

    -- === Odgovori iz Onboardinga ===
    -- Namen: Zagotoviti **začetni, statični kontekst o uporabniku za AI.**
    onboarding_goals           text NULL,
                 -- Podatkovni Tip: text
                 -- Namen: Odgovor na vprašanje o ciljih (npr. "Improve pre-game focus"). **Ključen kontekst za usmerjanje seans.**

    onboarding_experience      text NULL,
                 -- Podatkovni Tip: text
                 -- Namen: Odgovor na vprašanje o izkušnjah s športno psihologijo. **Pomaga AI prilagoditi pristop in jezik.**

    onboarding_challenges      text NULL,
                 -- Podatkovni Tip: text
                 -- Namen: Odgovor na vprašanje o glavnih izzivih. **Pomaga AI razumeti področja fokusa.**

    -- (Po potrebi dodaj več `onboarding_...` stolpcev za druga vprašanja)

    -- --- Omejitve (Constraints) ---
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE, -- Zagotavlja povezavo in samodejno brisanje ob brisanju userja v auth.users
    CONSTRAINT username_length CHECK (username IS NULL OR char_length(username) >= 3)
);

-- Komentarji na tabelo in stolpce za boljšo dokumentacijo sheme
COMMENT ON TABLE public.profiles IS 'Hrani statične profilne podatke uporabnikov, pridobljene med onboardingom in urejanjem profila. Povezano 1:1 z auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'PK in FK, ki referencira auth.users.id.';
COMMENT ON COLUMN public.profiles.onboarding_goals IS 'Uporabnikov odgovor na vprašanje o ciljih iz onboardinga.';

-- Trigger za avtomatsko posodabljanje 'updated_at' ob spremembi
-- (Zahteva predhodno omogočeno razširitev moddatetime in definirano funkcijo moddatetime(TEXT))
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);

-- Trigger za avtomatsko kreiranje profila ob registraciji novega uporabnika
-- (Zahteva predhodno definirano funkcijo handle_new_user, kot v prejšnjih odgovorih)
/*
CREATE OR REPLACE FUNCTION public.handle_new_user()...
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY; -- Pomembno za zagotovitev, da RLS vedno velja

CREATE POLICY "Allow users to read their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id); -- Uporabnik lahko bere samo svoj profil

CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id); -- Uporabnik lahko posodablja samo svoj profil

-- INSERT vrstice hendla trigger ob registraciji. DELETE hendla ON DELETE CASCADE.
```

---

### 2.2. Tabela `dynamic_profiles`

* **Namen:** Hrani **dinamični, AI-generiran povzetek uporabnika**. Ta profil se posodablja po vsaki zaključeni seansi in predstavlja **AI-jevo trenutno, razvijajoče se razumevanje** uporabnikovih vzorcev, napredka in izzivov. Je ključni vhodni podatek za kontekstualizacijo novih seans.
* **Optimizacija/Relacije:** Ločena tabela od `profiles` zaradi različnega izvora (AI vs Uporabnik) in cikla posodabljanja. Stroga 1:1 relacija z `auth.users` preko `user_id` (z `UNIQUE` omejitvijo).

```sql
-- ### TABLE: dynamic_profiles ###
-- Opis: Dinamični, AI-generiran profil uporabnika.

CREATE TABLE public.dynamic_profiles (
    -- --- Stolpci ---
    id               uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, PRIMARY KEY, DEFAULT
                 -- Namen: Enolični identifikator zapisa.

    user_id          uuid NOT NULL UNIQUE,
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, UNIQUE, FOREIGN KEY
                 -- Namen: Povezuje dinamični profil z uporabnikom (`auth.users`). **UNIQUE zagotavlja, da ima vsak uporabnik največ en dinamični profil.**

    profile_content  text NULL,
                 -- Podatkovni Tip: text
                 -- Namen: **Jedro te tabele. Vsebuje AI-generirano besedilo (povzetek), ki opisuje AI-jevo razumevanje uporabnika.** Neposredno se uporablja kot del konteksta za AI pri naslednjih seansah.

    created_at       timestamptz NOT NULL DEFAULT now(),
                 -- Podatkovni Tip: timestamp with time zone
                 -- Omejitve: NOT NULL, DEFAULT now()
                 -- Namen: Kdaj je bil prvi dinamični profil ustvarjen.

    updated_at       timestamptz NOT NULL DEFAULT now(),
                 -- Podatkovni Tip: timestamp with time zone
                 -- Omejitve: NOT NULL, DEFAULT now()
                 -- Namen: Kdaj je bil dinamični profil nazadnje posodobljen s strani AI (`process-session-end` funkcija).

    -- --- Omejitve ---
    CONSTRAINT dynamic_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Komentarji
COMMENT ON TABLE public.dynamic_profiles IS 'Hrani AI-generiran dinamični povzetek uporabnika, posodobljen po vsaki seansi.';
COMMENT ON COLUMN public.dynamic_profiles.profile_content IS 'AI-generirano besedilo, ki povzema ključne lastnosti, napredek in izzive uporabnika.';

-- Trigger za 'updated_at'
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.dynamic_profiles
  FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);

-- Row Level Security (RLS)
ALTER TABLE public.dynamic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own dynamic profile" ON public.dynamic_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT in UPDATE izvajajo samo Edge funkcije s 'service_role' ključem, ki obide RLS.
```

---

### 2.3. Tabela `modules`

* **Namen:** Hrani **izvorno vsebino statičnih informativnih člankov/modulov** o športni psihologiji. Služi kot "knjižnica" znanja, iz katere se generirajo embeddingi za RAG.
* **Optimizacija/Relacije:** Preprosta tabela za vsebino, namenjena branju s strani vseh uporabnikov in procesiranju s strani backend skript/funkcij za generiranje embeddingov.

```sql
-- ### TABLE: modules ###
-- Opis: Vsebina informativnih modulov/člankov.

CREATE TABLE public.modules (
    -- --- Stolpci ---
    id         uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, PRIMARY KEY, DEFAULT
                 -- Namen: Enolični identifikator modula. **Uporabljen kot FK v `module_embeddings`.**

    title      text NOT NULL,
                 -- Podatkovni Tip: text
                 -- Omejitve: NOT NULL
                 -- Namen: Naslov modula (viden v UI).

    summary    text NULL,
                 -- Podatkovni Tip: text
                 -- Namen: Kratek povzetek modula (viden v UI).

    content    text NOT NULL,
                 -- Podatkovni Tip: text
                 -- Omejitve: NOT NULL
                 -- Namen: **Celotno besedilo modula. To je vir za ustvarjanje `content_chunk` v `module_embeddings` za RAG.**

    image_url  text NULL,
                 -- Podatkovni Tip: text
                 -- Namen: URL slike za prikaz v UI (opcijsko).

    created_at timestamptz NOT NULL DEFAULT now()
                 -- Podatkovni Tip: timestamp with time zone
                 -- Omejitve: NOT NULL, DEFAULT now()
                 -- Namen: Sledenje.
);

-- Komentarji
COMMENT ON TABLE public.modules IS 'Vsebina informativnih člankov o športni psihologiji za prikaz uporabnikom in kot vir za RAG.';
COMMENT ON COLUMN public.modules.content IS 'Izvorno besedilo modula, ki se razdeli na kose za embedding.';

-- Row Level Security (RLS)
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules FORCE ROW LEVEL SECURITY;

-- Vsi prijavljeni uporabniki lahko berejo vsebino modulov.
CREATE POLICY "Allow authenticated users to read modules" ON public.modules
  FOR SELECT USING (auth.role() = 'authenticated');

-- Vstavljanje/posodabljanje/brisanje izvajajo samo admini ali skripte s 'service_role'.
```

---

### 2.4. Tabela `module_embeddings`

* **Namen:** Hrani **kose besedila (chunks)** iz `modules` in njihove **vektorske embeddinge**. To je **ključna tabela za RAG iskanje po bazi znanja športne psihologije**. AI preko te tabele dostopa do specifičnih informacij iz modulov med seanso.
* **Optimizacija/Relacije:** N:1 relacija z `modules`. Ločevanje od `modules` je ključno za učinkovitost RAG. **Pravilen vektorski indeks je nujen za hitrost iskanja podobnosti.**

```sql
-- ### TABLE: module_embeddings ###
-- Opis: Kosi besedil iz modulov in njihovi embeddingi za RAG.

CREATE TABLE public.module_embeddings (
    -- --- Stolpci ---
    id              uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, PRIMARY KEY, DEFAULT
                 -- Namen: Enolični ID kosa/embeddinga.

    module_id       uuid NOT NULL,
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, FOREIGN KEY
                 -- Namen: **Povezuje ta kos z izvornim modulom v tabeli `modules`.**

    content_chunk   text NOT NULL,
                 -- Podatkovni Tip: text
                 -- Omejitve: NOT NULL
                 -- Namen: **Dejanski kos besedila (npr. odstavek), ki se vrne kot rezultat RAG iskanja in doda v AI prompt kot kontekstualno znanje.**

    embedding       vector(384) NOT NULL,
                 -- Podatkovni Tip: vector(384) - Dimenzija za gte-small
                 -- Omejitve: NOT NULL
                 -- Namen: **Vektorska predstavitev `content_chunk`. Uporablja se za iskanje semantične podobnosti pri RAG poizvedbah po bazi znanja.**

    created_at      timestamptz NOT NULL DEFAULT now(),
                 -- Podatkovni Tip: timestamp with time zone
                 -- Omejitve: NOT NULL, DEFAULT now()
                 -- Namen: Sledenje.

    -- --- Omejitve ---
    CONSTRAINT module_embeddings_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE
);

-- Komentarji
COMMENT ON TABLE public.module_embeddings IS 'Shranjuje kose besedil iz modulov in njihove embeddinge za RAG iskanje po bazi znanja športne psihologije.';
COMMENT ON COLUMN public.module_embeddings.embedding IS 'Vektor dimenzije 384 (model gte-small). Ključen za vektorsko iskanje.';
COMMENT ON COLUMN public.module_embeddings.content_chunk IS 'Besedilo, ki se vrne kot RAG kontekst.';

-- Indeks za hitro vektorsko iskanje (NUJNO!)
-- Izberi IVFFlat ali HNSW in prilagodi parametre (npr. lists za IVFFlat). HNSW je pogosto boljši za splošno uporabo.
CREATE INDEX idx_module_embeddings_embedding_hnsw ON public.module_embeddings USING hnsw (embedding vector_cosine_ops);
-- ali
-- CREATE INDEX idx_module_embeddings_embedding_ivfflat ON public.module_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);


-- Row Level Security (RLS)
ALTER TABLE public.module_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_embeddings FORCE ROW LEVEL SECURITY;

-- Branje izvaja RAG funkcija s service_role ključem, zato eksplicitna SELECT politika ni nujna,
-- a jo lahko dodamo za jasnost, če bi kdaj brali direktno (čeprav ni planirano).
-- CREATE POLICY "Allow authenticated users read module embeddings" ON public.module_embeddings FOR SELECT USING (auth.role() = 'authenticated');

-- Vstavljanje/urejanje s service_role (preko skripte/funkcije za procesiranje modulov).
```

---

### 2.5. Tabela `sessions`

* **Namen:** Hrani **metapodatke o vsaki klepetalni seansi** (kdo, kdaj, status). Vsebuje tudi **AI-generiran povzetek** (`session_overview_summary`), ki služi kot ključen kontekstualni element ("spomin" na zadnjo seanso) za začetek naslednje seanse.
* **Optimizacija/Relacije:** N:1 relacija z `auth.users`. Ločeni metapodatki omogočajo hitro iskanje seans brez nalaganja vseh sporočil. `session_overview_summary` je denormaliziran tukaj za hiter dostop.

```sql
-- ENUM za možne statuse seanse
CREATE TYPE public.session_status AS ENUM ('active', 'completed', 'error');

-- ### TABLE: sessions ###
-- Opis: Metapodatki o uporabniških klepetalnih seansah.

CREATE TABLE public.sessions (
    -- --- Stolpci ---
    id                          uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, PRIMARY KEY, DEFAULT
                 -- Namen: Enolični identifikator seanse. **Povezuje sporočila (`messages`) in `journey_notes` s to seanso.**

    user_id                     uuid NOT NULL,
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, FOREIGN KEY
                 -- Namen: Povezuje seanso z uporabnikom (`auth.users`).

    status                      session_status NOT NULL DEFAULT 'active',
                 -- Podatkovni Tip: public.session_status (ENUM)
                 -- Omejitve: NOT NULL, DEFAULT 'active'
                 -- Namen: Sledi stanju seanse. **Pomembno za logiko zaključka seanse, prikaz v UI in določanje, ali gre za aktivno seanso.**

    started_at                  timestamptz NOT NULL DEFAULT now(),
                 -- Podatkovni Tip: timestamp with time zone
                 -- Omejitve: NOT NULL, DEFAULT now()
                 -- Namen: Začetek seanse.

    ended_at                    timestamptz NULL,
                 -- Podatkovni Tip: timestamp with time zone
                 -- Omejitve: NULL
                 -- Namen: Čas zaključka seanse. **Uporablja se za določanje zadnje zaključene seanse.**

    session_overview_summary    text NULL,
                 -- Podatkovni Tip: text
                 -- Omejitve: NULL
                 -- Namen: **AI-generiran povzetek (300-400 besed) vsebine te seanse, ustvarjen ob zaključku. Ključni vhodni kontekst ('Previous Session Overview') za naslednjo seanso.**

    created_at                  timestamptz NOT NULL DEFAULT now(),
                 -- Podatkovni Tip: timestamp with time zone
                 -- Omejitve: NOT NULL, DEFAULT now()
                 -- Namen: Sledenje zapisu.

    updated_at                  timestamptz NOT NULL DEFAULT now(),
                 -- Podatkovni Tip: timestamp with time zone
                 -- Omejitve: NOT NULL, DEFAULT now()
                 -- Namen: Sledi zadnji spremembi metapodatkov (npr. status, dodajanje povzetka).

    -- --- Omejitve ---
    CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Komentarji
COMMENT ON TABLE public.sessions IS 'Metapodatki o uporabniških klepetalnih seansah, vključno z AI povzetkom.';
COMMENT ON COLUMN public.sessions.session_overview_summary IS 'AI-generiran povzetek seanse, uporabljen kot kontekst za naslednjo seanso.';

-- Trigger za 'updated_at'
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);

-- Indeksi za hitro iskanje uporabnikovih seans po statusu in času
CREATE INDEX idx_sessions_user_id_status_ended_at ON public.sessions (user_id, status, ended_at DESC);

-- Row Level Security (RLS)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;

-- Ena politika za vse operacije uporabnika nad lastnimi seansami
CREATE POLICY "Allow users full access to their own sessions" ON public.sessions
  USING (auth.uid() = user_id) -- Uporabnik lahko izvaja SELECT, INSERT, UPDATE, DELETE samo na svojih seansah
  WITH CHECK (auth.uid() = user_id); -- Dodatno preverjanje ob INSERT/UPDATE
```

---

### 2.6. Tabela `messages`

* **Namen:** Hrani **vsako posamezno sporočilo** (uporabnikovo in AI-jevo) znotraj vsake seanse. Predstavlja **osnovno zgodovino pogovora** ("transcript"), ki je ključna za kontekst med seanso (`Current Session History`) in za obdelavo ob koncu seanse (`process-session-end`).
* **Optimizacija/Relacije:** N:1 relacija s `sessions`. Denormalizacija `user_id` poenostavi RLS. Indeks na `(session_id, created_at)` je ključen za hitro pridobivanje sporočil v pravilnem vrstnem redu.

```sql
-- ENUM za vlogo pošiljatelja sporočila
CREATE TYPE public.message_sender_role AS ENUM ('user', 'ai');

-- ### TABLE: messages ###
-- Opis: Posamezna sporočila znotraj klepetalnih seans.

CREATE TABLE public.messages (
    -- --- Stolpci ---
    id            uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, PRIMARY KEY, DEFAULT
                 -- Namen: Enolični identifikator sporočila.

    session_id    uuid NOT NULL,
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, FOREIGN KEY
                 -- Namen: **Povezuje sporočilo s pripadajočo seanso v `sessions`. Ključen za grupiranje sporočil.**

    user_id       uuid NOT NULL,
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, FOREIGN KEY (za RLS)
                 -- Namen: Uporabnik, ki mu pripada seansa. **Denormalizirano za enostavnejše in bolj performantne RLS politike.**

    sender_role   message_sender_role NOT NULL,
                 -- Podatkovni Tip: public.message_sender_role (ENUM)
                 -- Omejitve: NOT NULL
                 -- Namen: **Razlikuje med pošiljateljem ('user' ali 'ai'). Ključno za pravilno sestavljanje zgodovine pogovora za AI prompt.**

    content       text NOT NULL,
                 -- Podatkovni Tip: text
                 -- Omejitve: NOT NULL
                 -- Namen: **Dejansko besedilo sporočila.**

    created_at    timestamptz NOT NULL DEFAULT now(),
                 -- Podatkovni Tip: timestamp with time zone
                 -- Omejitve: NOT NULL, DEFAULT now()
                 -- Namen: Čas, ko je bilo sporočilo ustvarjeno/poslano. **Ključno za ohranjanje pravilnega vrstnega reda sporočil v seansi.**

    -- --- Omejitve ---
    CONSTRAINT messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE,
    CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Komentarji
COMMENT ON TABLE public.messages IS 'Hrani vsa sporočila (uporabnik in AI) za vsako seanso.';
COMMENT ON COLUMN public.messages.sender_role IS 'Označuje, ali je sporočilo poslal uporabnik ali AI.';
COMMENT ON COLUMN public.messages.user_id IS 'Denormaliziran ID uporabnika za lažji RLS.';

-- Indeks za hitro pridobivanje sporočil seanse v pravilnem vrstnem redu (zelo pomembno!)
CREATE INDEX idx_messages_session_id_created_at ON public.messages (session_id, created_at ASC);

-- Row Level Security (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read messages in their own sessions" ON public.messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert messages into their own sessions" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE in DELETE posameznih sporočil nista predvidena za uporabnike. Brisanje se zgodi preko CASCADE ob brisanju seanse.
```

---

### 2.7. Tabela `journey_notes`

* **Namen:** Hrani **AI-ekstrahirane ključne zapise/spoznanja ("Journey Doc Notes")** iz zaključenih seans in njihove **vektorske embeddinge**. Predstavlja **strukturiran dolgoročni spomin** pomembnih dogodkov, spoznanj, vzorcev in dogovorov, ki se uporablja za **kontekstualizacijo preko RAG** v prihodnjih seansah.
* **Optimizacija/Relacije:** N:1 relacija z `auth.users` in `sessions`. Omogoča učinkovito RAG iskanje po preteklih spoznanjih. Indeks na `embedding` in `user_id` je pomemben za zmogljivost RAG in morebitni prikaz v UI.

```sql
-- ### TABLE: journey_notes ###
-- Opis: AI-generirani ključni zapiski/spoznanja iz seans in njihovi embeddingi za dolgoročni spomin in RAG.

CREATE TABLE public.journey_notes (
    -- --- Stolpci ---
    id           uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, PRIMARY KEY, DEFAULT
                 -- Namen: Enolični identifikator zapisa.

    user_id      uuid NOT NULL,
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, FOREIGN KEY
                 -- Namen: Povezuje zapis z uporabnikom (`auth.users`). **Ključen za RAG iskanje samo po zapiskih relevantnega uporabnika.**

    session_id   uuid NOT NULL,
                 -- Podatkovni Tip: uuid
                 -- Omejitve: NOT NULL, FOREIGN KEY
                 -- Namen: Povezuje zapis s seanso (`sessions`), iz katere je bil ekstrahiran. Omogoča sledljivost izvora zapisa.

    note_text    text NOT NULL,
                 -- Podatkovni Tip: text
                 -- Omejitve: NOT NULL
                 -- Namen: **Dejansko besedilo AI-ekstrahiranega zapisa/spoznanja (npr. bullet point). To se vrne kot rezultat RAG iskanja in doda v AI prompt kot dolgoročni kontekst.**

    embedding    vector(384) NOT NULL,
                 -- Podatkovni Tip: vector(384) - Dimenzija za gte-small
                 -- Omejitve: NOT NULL
                 -- Namen: **Vektorska predstavitev `note_text`. Ključna za RAG iskanje po preteklih spoznanjih na podlagi semantične podobnosti.**

    created_at   timestamptz NOT NULL DEFAULT now(),
                 -- Podatkovni Tip: timestamp with time zone
                 -- Omejitve: NOT NULL, DEFAULT now()
                 -- Namen: Čas, ko je bil zapis ustvarjen (približno čas zaključka izvorne seanse).

    -- --- Omejitve ---
    CONSTRAINT journey_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT journey_notes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE
);

-- Komentarji
COMMENT ON TABLE public.journey_notes IS 'AI-generirani ključni zapiski iz seans in njihovi embeddingi za dolgoročni spomin in RAG.';
COMMENT ON COLUMN public.journey_notes.note_text IS 'Besedilo AI-ekstrahiranega spoznanja.';
COMMENT ON COLUMN public.journey_notes.embedding IS 'Vektor dimenzije 384 (model gte-small) za RAG iskanje.';

-- Indeks za hitro RAG iskanje po embeddingih (NUJNO!)
CREATE INDEX idx_journey_notes_embedding_hnsw ON public.journey_notes USING hnsw (embedding vector_cosine_ops);
-- ali
-- CREATE INDEX idx_journey_notes_embedding_ivfflat ON public.journey_notes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Indeks za hitro iskanje zapisov uporabnika (npr. za prikaz v UI ali debug)
CREATE INDEX idx_journey_notes_user_id_created_at ON public.journey_notes (user_id, created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE public.journey_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_notes FORCE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own journey notes" ON public.journey_notes
  FOR SELECT USING (auth.uid() = user_id);