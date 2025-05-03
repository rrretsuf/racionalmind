# Inner App - App Flow Document (MVP v1.0.0)

## 1. Uvod in Cilj Dokumenta

Ta dokument je zemljevid MVP verzije aplikacije Inner. Podrobno opisuje vsak zaslon in pojasnjuje, kako se uporabniki premikajo med njimi. Jezik je preprost in specifičen, da olajša razumevanje. Vse je jasno zapisano, da se prepreči zmeda. Cilj MVP-ja je zagotoviti osnovno funkcionalnost, osredotočeno na **AI Racionalnega Prijatelja**, ki pomaga pri obvladovanju **overthinkanja**, in služi kot vodilo za razvoj ter oblikovanje.

## 2. Onboarding in Prijava/Registracija (Sign-In/Sign-Up)

**Namen:** Omogočiti novim uporabnikom ustvarjanje računa, obstoječim prijavo in zbrati osnovne informacije za statični profil uporabnika, ki jih bo AI lahko upošteval pri nudenju **podpore za racionalno razmišljanje**.

### 2.1. Welcome Screen (Pozdravni Zaslon)

* **Opis:** Ko uporabnik prvič odpre aplikacijo, se mu prikaže Pozdravni Zaslon. Na vrhu zaslona je pozdravno besedilo. V prihodnosti je lahko v ozadju subtilna animacija. Na tem zaslonu sta dva gumba: eden z napisom "Log In" (Prijava) in drugi z napisom "Create Account" (Ustvari račun).
* **Interakcija "Log In":**
    * Če uporabnik pritisne gumb "Log In", se na zaslonu prikaže pogovorno okno (dialog). To okno ima dve možnosti: prvi gumb z napisom "Sign in with Apple" in drugi gumb z napisom "Use my own email".
    * **Apple Sign In:** Če uporabnik pritisne gumb "Sign in with Apple", se sproži postopek Apple avtentikacije. Apple to izvede gladko, in ob uspešni avtentikaciji je uporabnik preusmerjen na `Main Screen` (Glavni zaslon). Če avtentikacija ne uspe, se v pogovornem oknu prikaže sporočilo, da je šlo nekaj narobe, in uporabnik lahko poskusi znova.
    * **Email Prijava:** Če uporabnik namesto tega pritisne gumb "Use my own email", se prikaže drugo pogovorno okno. To okno vsebuje tekstovno polje za e-pošto, tekstovno polje za geslo in gumb "Continue" (Nadaljuj). Uporabnik vpiše svojo e-pošto in geslo v polji ter pritisne gumb "Continue". Če sta e-pošta in geslo pravilna, je uporabnik preusmerjen na `Main Screen`. Če sta e-pošta ali geslo napačna, prekratka ali neveljavna, se v pogovornem oknu prikaže sporočilo v rdeči pisavi. To sporočilo uporabniku pove, kaj je šlo narobe, in lahko poskusi znova po popravku vnosa.
* **Interakcija "Create Account":**
    * Če uporabnik na Pozdravnem Zaslonu pritisne gumb "Create Account", se prikaže pogovorno okno z enakima možnostma kot pri prijavi. Prva možnost je gumb "Sign up with Apple", druga pa gumb "Use my own email".
    * **Apple Sign Up:** Če uporabnik pritisne gumb "Sign up with Apple", se sproži postopek Apple avtentikacije. Ko uspe, je uporabnik preusmerjen na prvi zaslon Uvajalnega Toka (`Onboarding Flow Screen 1`). Če ne uspe, se v pogovornem oknu prikaže sporočilo, da avtentikacija ni delovala, in lahko poskusi znova.
    * **Email Registracija:** Če uporabnik pritisne gumb "Use my own email", se prikaže pogovorno okno s tekstovnim poljem za e-pošto, tekstovnim poljem za geslo in gumbom "Continue". Uporabnik vnese e-pošto in geslo ter pritisne gumb "Continue". Če sta e-pošta in geslo veljavna, je uporabnik preusmerjen na `Onboarding Flow Screen 1`. Če sta e-pošta ali geslo napačna, prekratka ali neveljavna, se v pogovornem oknu prikaže sporočilo v rdeči pisavi, ki pove, kaj je narobe, in lahko poskusi znova.

### 2.2. Onboarding Flow (Uvajalni Tok)

* **Namen:** Zbrati ključne informacije od novega uporabnika za izgradnjo njegovega statičnega profila, ki bo pomagal AI-ju pri razumevanju konteksta.
* **Potek:** Uvajalni tok se začne po uspešni registraciji novega uporabnika. Sestavljen je iz serije zaslonov (npr. 3-5), kjer vsak zastavi eno vprašanje.
* **Struktura Zaslona:** Vsak zaslon v tem toku ima:
    * Naslov/Vprašanje v zgornjem levem kotu (npr. "Describe Yourself in relation to sports", "What are your primary goals using Inner?", "Any previous experience with sports psychology?").
    * Pod naslovom je tekstovno polje, kamor uporabnik lahko vpiše svoj odgovor.
    * Pod tekstovnim poljem je gumb "Continue".
    * Možnost preskoka vprašanja (npr. majhna povezava ali gumb "Skip" blizu tekstovnega polja).
* **Interakcija:** Uporabnik vpiše nekaj v tekstovno polje in pritisne "Continue", da se premakne na naslednji zaslon, ali pa pritisne "Skip". To se nadaljuje skozi več zaslonov. Na zadnjem zaslonu, ko uporabnik pritisne "Continue", je preusmerjen na `Main Screen`.
* **Podatki:** Vsi odgovori (ali informacija, da je bilo vprašanje preskočeno) se shranijo v Supabase kot del statičnega profila uporabnika.
* **Občutek:** Tok je gladek in enostaven za uporabo, s prijetnimi animacijami in prehodi. Barve, pisave in splošni vtis se ujemajo z ostalo aplikacijo.

## 3. Glavni Zasloni Aplikacije (MVP)

### 3.1. Main Screen (Glavni Zaslon / Domov)

* **Namen:** Po prijavi ali zaključku Uvajalnega Toka uporabnik pristane na Glavnem Zaslonu. To je osrednja točka, ki omogoča začetek nove seanse, dostop do zgodovine, profila in brskanje po informativnih modulih.
* **Struktura:** Zaslon je preprost.
    * **Zgoraj:** Pozdravno besedilo, npr. "Hello, [User's Name]!".
    * **Zgornji koti:**
        * Levo: Ikona (npr. ikona ure ali arhiva) za dostop do `History Screen` (Zaslon Zgodovine).
        * Desno: Ikona (npr. silhueta osebe ali zobnik) za dostop do `Profile Screen` (Zaslon Profila).
    * **Sredina:** Izstopajoč gumb z napisom "Start New Session" (Začni novo seanso).
    * **Spodaj:** Horizontalno drsljiva vrsta z naslovom "Modules" (Moduli). Ta vrsta vsebuje 5 začetnih modulov, prikazanih kot kartice. Vsak modul je kot kratek članek, ki razlaga metode, protokole ali nasvete s področja športne psihologije. Uporabnik lahko drsi levo ali desno, da vidi vse kartice. Vsaka kartica ima naslov.
* **Interakcije:**
    * Pritisk na gumb "Start New Session" preusmeri uporabnika na `Session Screen` (Zaslon Seanse).
    * Pritisk na kartico modula preusmeri uporabnika na `Module Detail Screen` (Zaslon Podrobnosti Modula) za izbrani modul.
    * Pritisk na ikono Zgodovine preusmeri na `History Screen`.
    * Pritisk na ikono Profila preusmeri na `Profile Screen`.
* **Uporabniška Izkušnja:** Zaslon izgleda večinoma enako za nove in vračajoče uporabnike. Za MVP se **ne** prikazuje posebna dobrodošlica ali uvodna pojasnila za prve uporabnike po onboardingu, da se poenostavi razvoj.

### 3.2. Session Screen (Zaslon Seanse)

* **Namen:** Omogočiti uporabniku tekstovno **in glasovno** komunikacijo z **izbranim AI Racionalnim Prijateljem** v varnem in namenskem okolju, s ciljem **raziskovanja in obvladovanja misli, ki vodijo v overthinkanje**.
* **Vstop:** Ko uporabnik pritisne gumb "Start New Session" na `Main Screen`.
* **Struktura:** Zaslon je preprost AI klepetalniški vmesnik, podoben aplikacijam kot sta ChatGPT ali Grok.
    * Prikaz zgodovine sporočil v obliki oblačkov (chat bubbles): uporabnikova sporočila na desni, AI odgovori na levi. **Pod vsakim AI oblačkom je majhna ikona zvočnika ("Listen")**.
    * Na dnu zaslona je tekstovno polje, kamor uporabnik lahko vtipka sporočilo.
    * **Levo od tekstovnega polja je ikona mikrofona ("Voice Input")**.
    * **Desno od tekstovnega polja** je gumb "Send" (Pošlji).
* **Funkcionalnost:**
    * Uporabnik vtipka svoje sporočilo in pritisne gumb "Send", da ga pošlje AI-ju.
    * **Alternativno lahko uporabnik pritisne ikono mikrofona, govori, in njegov govor se pretvori v besedilo (STT) ter vnese v tekstovno polje (ali neposredno pošlje).**
    * AI odgovori s tekstovnim oblačkom nad vnosnim poljem.
    * **Uporabnik lahko pritisne ikono zvočnika pod AI sporočilom, da posluša AI odgovor, prebran na glas (TTS).**
    * Implementirana je napredna funkcionalnost "Memory / Context Feature" (podrobneje opisana v ločenem dokumentu), ki AI-ju omogoča dostop do relevantnega konteksta (statični/dinamični profil, prejšnje seanse, Journey Doc, RAG iz modulov).
    * **MVP Omejitev:** V uporabniškem vmesniku **ni** možnosti izbire drugega AI avatarja **med seanso** (izbira se ob onboardingu ali morda v profilu). AI je vedno konfiguriran kot Racionalni Prijatelj z izbrano osebnostjo. Kontekst iz modulov se lahko dinamično vključi preko RAG sistema v ozadju.
    * **MVP Omejitev:** Polna funkcionalnost STT in TTS je del MVP-ja.
    * **Konec Seanse:** Seansa se zaključi na enega od naslednjih načinov:
        * **Ročno:** Uporabnik pritisne namenski gumb "End Session" (Zaključi seanso) - *implementacija tega gumba je opcijska za MVP*.
        * **Avtomatsko (timeout):** Seansa se samodejno zaključi po določenem obdobju neaktivnosti (npr. 12 ur).
        * **Avtomatsko (nova seansa):** Če uporabnik začne novo seanso, medtem ko je prejšnja še aktivna, se po potrditvi uporabnika ("Ali želite zaključiti trenutno seanso in začeti novo?") prejšnja seansa zaključi.
* **Navigacija:** V zgornjem levem kotu je gumb "Nazaj" za vrnitev na `Main Screen`.
* **Uporabniška Izkušnja:** Za MVP se **ne** prikazuje posebna uvodna stran za prve uporabnike tega zaslona. Uporabnik je takoj preusmerjen v klepetalnico.

### 3.3. Module Detail Screen (Zaslon Podrobnosti Modula)

* **Namen:** Prikazati informativno vsebino o specifičnem protokolu, nasvetu ali temi s področja **obvladovanja overthinkanja in racionalnega razmišljanja**. **(Samo za branje v MVP)**.
* **Vstop:** Ko uporabnik pritisne kartico modula na `Main Screen`.
* **Struktura:** Zaslon izgleda kot dobro oblikovan članek ali blog zapis.
    * Na vrhu je naslov modula.
    * Pod naslovom je slika ali ilustracija (lahko tudi animacija, če je smiselno).
    * Pod sliko je kratek povzetek vsebine modula.
    * Pod povzetkom je glavno besedilo modula, strukturirano za dobro berljivost. Vsebina naj bi bila dovolj kratka, da jo uporabnik prebere v nekaj minutah.
* **Interakcije:**
    * Uporabnik lahko le bere vsebino.
    * **MVP Omejitev:** Na tem zaslonu **ni** gumba "Listen" (Poslušaj), gumba "Try in Session" (Preizkusi v seansi), ali kakršnekoli druge interaktivne funkcionalnosti, ki bi modul povezala s seanso. Prav tako **ni** dodatne informacijske strani. Vsebina je zgolj informativna.
* **Navigacija:** V zgornjem levem kotu je gumb "Nazaj" za vrnitev na `Main Screen`.
* **Uporabniška Izkušnja:** Za MVP se **ne** prikazuje posebna uvodna stran za prve uporabnike tega zaslona.

### 3.4. History Screen (Zaslon Zgodovine)

* **Namen:** Omogočiti uporabniku pregled preteklih zaključenih seans in dostop do njihove vsebine (samo za branje).
* **Vstop:** Ko uporabnik pritisne ikono Zgodovine na `Main Screen`.
* **Struktura:** Zaslon prikazuje seznam vseh uporabnikovih preteklih seans. Vsaka seansa je predstavljena v svoji vrstici ali kartici, oblikovani v skladu s splošno estetiko aplikacije.
    * Vsaka vrstica vsebuje:
        * Na levi strani: Datum (ali čas, če je bil zaključen danes), kdaj se je seansa končala.
        * Osrednji del: Kratek AI generiran povzetek ali naslov seanse (izvleček iz Journey Doc Notes).
        * Na desni strani: Vizualni indikator statusa seanse:
            * **Active:** Če je seansa zadnja in še vedno aktivna (ni bila ročno zaključena ali časovno omejena). Indikator je subtilno zelene barve, ki izstopa ravno dovolj, da je opazen, a ne moteč. Vključuje tudi elegantno ikono, ki odraža aktivnost in se sklada s temo aplikacije (npr. stiliziran pulzirajoč krog ali podobno), prav tako oblikovano, da ne izstopa preveč.
            * **Finished:** Če je seansa zaključena. Indikator je nevtralne (npr. sive) barve. Vključuje ikono, ki simbolizira zaključek (npr. stilizirana kljukica ali pika) in se lepo vklaplja v celoten dizajn, ne da bi pritegnila preveč pozornosti.
* **Interakcije:**
    * **Ogled Seanse:** Uporabnik lahko pritisne na vrstico:
        * Če je status seanse **Finished**: Odpre se nov zaslon, ki prikaže celotno zgodovino klepeta te seanse v načinu samo za branje.
    * **Brisanje Seanse:** Uporabnik lahko izbriše seanso s pritiskom na opcijo za brisanje v vrstici (npr. ikona smetnjaka ali swipe-to-delete funkcionalnost).
    * **MVP Omejitev:** Možnost pripenjanja (pinning) seans **ni** del MVP-ja.
* **Občutek:** Zaslon je preprost in funkcionalen, podoben zgodovinskim zaslonom v drugih AI klepetalnih aplikacijah.
* **Navigacija:** V zgornjem levem kotu je gumb "Nazaj" za vrnitev na `Main Screen`.

### 3.5. Profile Screen (Zaslon Profila)

* **Namen:** Prikaz uporabniških informacij (statičnih in dinamičnih), omogočanje urejanja statičnih podatkov in dostop do nastavitev ter odjave.
* **Vstop:** Ko uporabnik pritisne ikono Profila na `Main Screen`.
* **Struktura:** Zaslon prikazuje informacije o uporabniku, razdeljene na sekcije:
    * **Statični Profil:** Prikazuje informacije, zbrane med Uvajalnim Tokom (npr. ime, e-pošta, če ni Apple prijava, odgovori na vprašanja). Vsak podatek je lahko v svoji vrstici. Uporabnik lahko pritisne na vrstico, da uredi ta podatek.
    * **Dinamični Profil (Read-Only):** Prikazuje AI-generirane vpoglede o uporabniku, ki se dinamično posodabljajo na podlagi interakcij (samo za branje).
    * **Journey Doc Prikaz (Read-Only):** Vizualno privlačen prikaz zbranih "Journey Doc Notes", predstavljen kot nekakšen zemljevid poti, časovnica ali podobna vizualizacija (samo za branje).
    * **Gumbi:**
        * Gumb za dostop do `Settings Screen` (Zaslon Nastavitev).
        * Gumb "Log Out" (Odjava) na dnu zaslona.
* **Interakcije:**
    * Urejanje podatkov v sekciji Statični Profil.
    * Pritisk na gumb Nastavitve preusmeri na `Settings Screen`.
    * Pritisk na gumb "Log Out" odjavi uporabnika in ga preusmeri nazaj na `Welcome Screen`.
* **Navigacija:** V zgornjem levem kotu je gumb "Nazaj" za vrnitev na `Main Screen`.

### 3.6. Settings Screen (Zaslon Nastavitev)

* **Namen:** Omogočiti uporabniku upravljanje nastavitev aplikacije in računa.
* **Vstop:** Ko uporabnik pritisne gumb Nastavitve na `Profile Screen`.
* **Struktura:** Zaslon prikazuje seznam možnosti za nastavitve. Vsaka možnost je v svoji vrstici:
    * Vklop/izklop obvestil (Notifications).
    * Izbira jezika aplikacije (Language), če je podprtih več jezikov.
    * Sprememba teme aplikacije (Theme), če je poleg privzete temne na voljo še kaj.
    * Ogled politike zasebnosti (Privacy Policy) - odpre povezavo ali nov zaslon z besedilom.
    * Ogled pogojev uporabe (Terms of Service) - odpre povezavo ali nov zaslon z besedilom.
    * Ogled strani "O nas" (About Us).
    * Opcija za brisanje uporabniškega računa in vseh podatkov (Delete Account) - zahteva večkratno potrditev za varnost.
* **Interakcije:** Uporabnik lahko pritisne na posamezno vrstico, da spremeni nastavitev (npr. preklopi stikalo za obvestila) ali si ogleda povezano vsebino (npr. politiko zasebnosti).
* **Navigacija:** V zgornjem levem kotu je gumb "Nazaj" za vrnitev na `Profile Screen`.

## 4. Ravnanje z Napakami (Error States)

### 4.1. Avtentikacijske Napake (Auth Error)

* **Opis:** Če gre kaj narobe med prijavo ali ustvarjanjem računa, se napaka obravnava znotraj pogovornega okna na Pozdravnem Zaslonu.
* **Primer:** Če uporabnik vpiše napačno geslo ali neobstoječ e-poštni naslov, se pod vnosnim poljem v pogovornem oknu prikaže sporočilo v rdeči pisavi. Sporočilo je preprosto, jasno in prijazno, npr. "Napačno geslo" ali "Uporabnik s tem e-naslovom ne obstaja". Uporabnik lahko nato popravi vnos in poskusi znova. Če Apple avtentikacija ne uspe, se v pogovornem oknu prikaže rdeče sporočilo, da ni delovalo, in uporabnik lahko poskusi znova. Oblikovanje je minimalistično, varno in enostavno za razumevanje.

### 4.2. Druge Napake (Other Errors)

* **Opis:** Za druge težave, kot so težave s povezljivostjo (ni interneta) ali nepričakovane napake na strani strežnika (npr. Supabase ali Gemini API ni dosegljiv), je uporabnik obveščen znotraj aplikacije.
* **Prikaz:** Na zaslonu se prikaže majhno modalno pogovorno okno (popup) s sporočilom, ki razloži napako na uporabniku prijazen način (npr. "Povezava ni uspela. Preverite internetno povezavo." ali "Prišlo je do napake pri komunikaciji s strežnikom.").
* **Interakcija:** Pogovorno okno ima gumb "Poskusi znova" (Try Again), ki ponovno sproži neuspelo dejanje, in gumb "V redu" (OK), ki zapre okno. To ohranja uporabnika obveščenega in mu daje možnost ukrepanja. Gumb "Contact Support" za MVP ni nujno potreben.

## 5. Splošna Navigacija in Občutek

* **Doslednost:** Aplikacija uporablja gladke prehode in animacije med vsemi zasloni za prijetno uporabniško izkušnjo. Vsi zasloni ohranjajo enak vizualni stil (barve, pisave, "vibe"), da je vse dosledno in pomirjujoče.
* **Navigacija Nazaj:** Skoraj vsak zaslon (razen `Welcome Screen` in `Main Screen`) ima v zgornjem levem kotu gumb/ikono "Nazaj" (z želeno "sexy" ikono), ki uporabniku omogoča vrnitev na prejšnji zaslon.
* **Prvi Uporabnik vs. Vračajoči Uporabnik:** Potovanje skozi aplikacijo je večinoma enako za obe skupini. Ključna razlika je Uvajalni Tok, ki ga opravijo le novi uporabniki. Za MVP verzijo so **odstranjene** posebne uvodne strani za Zaslon Seanse in Zaslon Modulov, kot tudi posebna dobrodošlica na Glavnem Zaslonu, da se poenostavi in pospeši razvoj. Vračajoči uporabniki in novi uporabniki (po onboardingu) tako takoj dostopajo do glavnih funkcionalnosti.
* **Intuitivnost:** Tok je zasnovan tako, da je enostaven in intuitiven za uporabo.