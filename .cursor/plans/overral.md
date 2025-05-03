# Inner App - Overall Plan (Dolgoročni Razvojni Načrt)

## 1. Uvod

Ta dokument opisuje strateški načrt za dolgoročni razvoj mobilne aplikacije Inner. Načrt je razdeljen na ključne faze, ki gradijo ena na drugi, z jasno definirano končno vizijo ("North Star"). Vsaka faza predstavlja pomemben mejnik v evoluciji aplikacije od specializiranega orodja do celostnega, visoko personaliziranega AI terapevtskega asistenta.

## 2. Faza 1: MVP - Temelji in AI Racionalni Prijatelj (Trenutni Fokus)

* **Cilj:** Lansirati stabilno in funkcionalno osnovno verzijo aplikacije (Minimum Viable Product), osredotočeno izključno na **AI Racionalnega Prijatelja**, ki pomaga mladim pri **obvladovanju overthinkanja**. Postaviti tehnične temelje in preizkusiti osnovno vrednost za ciljno publiko (16-24 let).
* **Ključne Značilnosti:**
    * Cross-platform mobilna aplikacija (iOS, Android) z uporabo Expo React Native.
    * Varen backend z uporabo Supabase (Avtentikacija, PostgreSQL baza, Edge Funkcije).
    * Osnovni uporabniški vmesnik (Welcome, Onboarding, Main Screen, Session Screen, Read-only Modules, History, Profile, Settings).
    * Tekstovna in glasovna komunikacija z **AI Racionalnim Prijateljem** (poganja Gemini 2.0 Flash, izbira med 3-5 avatarji).
    * Napredna **Memory / Context funkcionalnost** (Statični/Dinamični profil, Povzetek prejšnje seanse, **Prepoznani Vzorci (RAG)**, Baza znanja o metodah proti overthinkanju (RAG)).
    * Informativni moduli (članki) s področja **obvladovanja overthinkanja** (za RAG in branje).
    * Specifičen UI/UX (temna tema, glassy/glowing efekti, minimalističen dizajn).
* **Namen Te Faze:** Zgraditi jedro aplikacije, validirati koncept AI Racionalnega Prijatelja za pomoč pri overthinkanju, zbrati povratne informacije uporabnikov in ustvariti stabilno platformo za prihodnje razširitve.

## 3. Faza 2: Multi-Agent Orodje - Poglobljen AI Racionalni Prijatelj

* **Cilj:** Izboljšati in poglobiti zmožnosti obstoječega **AI Racionalnega Prijatelja** z uvedbo **multi-agent arhitekture**, ki temelji na **Google Agent Development Kit**. Aplikacija ostaja osredotočena na **pomoč pri obvladovanju overthinkanja**.
* **Ključne Značilnosti:**
    * **Integracija Google Agent Development Kit:** Implementacija ogrodja za upravljanje več AI agentov.
    * **Hierarhična Struktura Agentov:**
        * **Manager Agent (Glavni Racionalni Prijatelj):** Še naprej komunicira neposredno z uporabnikom, analizira potrebe in delegira naloge pod-agentom. Ohranja celosten pogled na uporabnika in seanso v kontekstu overthinkanja.
        * **Specializirani Pod-Agenti (Obvladovanje Overthinkanja):** Več manjših agentov, vsak specializiran za **zelo specifičen vidik overthinkanja ali sorodno tehniko** (npr. agent za prepoznavanje kognitivnih distorzij, agent za tehnike reframinga, agent za metode čuječnosti, agent za analizo skrbi, agent za spodbujanje k akciji itd.). Ti agenti izvajajo poglobljene analize ali generirajo specifične intervencije/vaje na zahtevo Manager Agenta.
    * **Dinamična Interakcija Agentov:** Manager Agent orkestrira delo pod-agentov znotraj ene seanse za zagotavljanje bolj niansiranih in ciljno usmerjenih odgovorov pri obravnavi overthinkanja.
    * **Razširljivost:** Arhitektura je zasnovana tako, da omogoča dodajanje novih specializiranih pod-agentov v prihodnosti za še boljše pokrivanje različnih vidikov overthinkanja in povezanih tem.
* **Namen Te Faze:** Bistveno povečati "inteligenco" in učinkovitost **AI Racionalnega Prijatelja** z uporabo specializiranih agentov. Uporabniku ponuditi še bolj poglobljeno in prilagojeno podporo znotraj **domene obvladovanja overthinkanja**. Zgraditi in preizkusiti multi-agent ogrodje za kasnejšo uporabo na drugih področjih (v Fazi 3). Gradi neposredno na MVP temeljih (AI, Memory/Context, Platforma).

## 4. Faza 3: Razširitev na Več Terapevtskih Področij

* **Cilj:** Razširiti funkcionalnost aplikacije **izven domene overthinkinja** z dodajanjem **novih AI terapevtov/svetov**, specializiranih za druga področja človeške psihologije in osebne rasti.
* **Ključne Značilnosti:**
    * **Implementacija Novih Terapevtskih Usmeritev:** Dodajanje novih AI "osebnosti" ali "svetov", kot so:
        * Terapevt za Introspekcijo (npr. temelječ na Freudianskih ali Jungovskih konceptih).
        * Terapevt za Družinske Odnose.
        * Terapevt za Kognitivno-Vedenjsko Terapijo (CBT).
        * Terapevt za Čuječnost (Mindfulness).
        * (Dodajanje drugih relevantnih področij).
    * **Uporabniški Vmesnik za Izbiro Terapevta/Področja:** Uporabnik bo lahko pred začetkom seanse (ali morda celo med njo) izbral področje ali specifičnega AI terapevta, s katerim želi komunicirati.
    * **Ponovna Uporaba Multi-Agent Ogrodja:** Vsak nov terapevt/področje bo verjetno implementiran z uporabo **podobne multi-agent arhitekture**, kot je bila razvita v Fazi 2 (Manager Agent za to področje + specializirani pod-agenti). To omogoča globino in specializacijo tudi na novih področjih.
    * **Prilagoditev Konteksta in Spomina:** Sistem za spomin in kontekst se bo moral prilagoditi, da bo lahko ločeval in uporabljal relevantne informacije glede na izbrano terapevtsko področje (npr. ločeni dinamični profili ali RAG iskanje po specifičnih bazah znanja).
* **Namen Te Faze:** Preoblikovati Inner iz nišne aplikacije za športno psihologijo v **celovito orodje za psihološko podporo in osebno rast**, ki naslavlja širši spekter uporabniških potreb. Izkorišča tehnične temelje in multi-agent ogrodje, razvito v prejšnjih fazah.

## 5. Severna Zvezda (North Star) - Končna Vizija

* **Končni Cilj:** Ustvariti **najboljše možno, globoko personalizirano AI orodje za psihološko podporo in "hekanje življenja"**, ki deluje kot **zaupanja vreden, zaseben in vedno dostopen (24/7) osebni "svet" (council) AI terapevtov/agentov.**
* **Ključni Elementi Vizije:**
    * **Hiper-Personalizacija:** AI sistem, ki uporabnika resnično pozna na podlagi naprednega **Memory / Context** sistema (dolgoročni spomin, dinamično razumevanje).
    * **Visoka Inteligenca in Specializacija:** Kompleksna **multi-agent arhitektura**, kjer številni specializirani AI agenti (terapevti za različna področja in njihovi pod-agenti) sodelujejo pod vodstvom manager agentov, da zagotovijo najboljši možen vpogled in podporo za specifično situacijo uporabnika.
    * **Opolnomočenje Uporabnika:** Orodje, ki uporabniku pomaga **razumeti samega sebe** (introspekcija, vzorci, motivacije) in mu s pomočjo psiholoških principov omogoča aktivno **oblikovanje in izboljšanje svojega življenja** ("hacking life from the inside out").
    * **Zasebnost in Varnost:** Zagotavljanje varnega okolja za raziskovanje najglobljih misli in občutkov.
    * **Dostopnost:** Vedno na voljo (24/7) podpora v žepu.

Končna vizija je ustvariti edinstveno orodje, ki združuje moč napredne AI, globokega razumevanja konteksta in preverjenih psiholoških principov, da uporabnikom pomaga doseči boljše razumevanje sebe in polnejše življenje. Vsaka razvojna faza je korak k uresničitvi te vizije.