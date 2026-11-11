'use strict';

/* ---- Hosted-version extras ---- */
// Refuse to run inside someone else's frame (clickjacking protection; GitHub Pages can't send X-Frame-Options)
if (window.top !== window.self) { try { window.top.location = window.self.location; } catch (e) { document.documentElement.innerHTML = ''; } }
// Offline support
if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('./sw.js').catch(function () {}); }); }

(function(){
'use strict';

/* ------------------------------------------------------------------
   1. STREAMING SERVICES (UK)
   k = key, n = name, c = colour dot, url = where "Open" goes, re = how TMDB provider names are matched.
   ------------------------------------------------------------------ */
const enc=encodeURIComponent;
const SERVICES=[
  {k:'netflix',  n:'Netflix',      c:'#E50914', url:t=>'https://www.netflix.com/search?q='+enc(t), re:/netflix/i},
  {k:'prime',    n:'Prime Video',  c:'#1A98FF', url:t=>'https://www.amazon.co.uk/s?k='+enc(t)+'&i=instant-video', re:/amazon prime video/i},
  {k:'disney',   n:'Disney+',      c:'#2340C8', url:t=>'https://www.disneyplus.com/search?q='+enc(t), re:/disney/i},
  {k:'apple',    n:'Apple TV',     c:'#8A8F98', url:t=>'https://tv.apple.com/gb/search?term='+enc(t), re:/apple tv/i},
  {k:'now',      n:'NOW / Sky',    c:'#12A89A', url:()=>'https://www.nowtv.com/', re:/^now\b|now tv|sky go/i},
  {k:'paramount',n:'Paramount+',   c:'#0064FF', url:()=>'https://www.paramountplus.com/gb/', re:/paramount/i},
  {k:'iplayer',  n:'BBC iPlayer',  c:'#F54997', url:t=>'https://www.bbc.co.uk/iplayer/search?q='+enc(t), re:/iplayer/i},
  {k:'itvx',     n:'ITVX',         c:'#B5C21B', url:()=>'https://www.itv.com/', re:/\bitv/i},
  {k:'c4',       n:'Channel 4',    c:'#7C5CC4', url:()=>'https://www.channel4.com/', re:/channel 4|channel4|all 4/i},
  {k:'mubi',     n:'MUBI',         c:'#3B6FB6', url:()=>'https://mubi.com/en/gb', re:/mubi/i}
];
const DATA_DATE='11 Nov 2026';

/* ------------------------------------------------------------------
   2. GENRES, MOODS, CERTIFICATES
   GENRES: [label, gradient start, gradient end, title-card text colour]
   ------------------------------------------------------------------ */
const GENRES={act:['Action','#C2410C','#4A1406','#FFF6EE'],adv:['Adventure','#0F766E','#0A3532','#F0FFFB'],ani:['Animation','#F59E0B','#C0266D','#FFFDF5'],
  com:['Comedy','#FDE047','#F08A24','#2A1A05'],cri:['Crime','#3B4252','#6B1515','#FBEFEF'],doc:['Documentary','#64748B','#1E293B','#F1F5F9'],
  dra:['Drama','#6D28D9','#1C1748','#F5F0FF'],fam:['Family','#38BDF8','#5458E0','#FFFFFF'],fan:['Fantasy','#7C3AED','#B0185A','#FFF3FA'],
  his:['History','#B45309','#371B05','#FFF7EC'],hor:['Horror','#262021','#7A1010','#F7E3E3'],mus:['Musical','#EC4899','#6526C9','#FFF5FB'],
  mys:['Mystery','#22408F','#0A0F22','#EEF2FF'],rom:['Romance','#FB7185','#9F1239','#FFF1F3'],sci:['Sci-fi','#0EA5E9','#2C2A78','#F0FBFF'],
  thr:['Thriller','#3A4658','#0B0F19','#F1F4F9'],war:['War','#55762A','#1C1917','#F4F7EE'],wes:['Western','#D97706','#5E260A','#FFF8EC']};
const MOODS={feel:'Feel-good',laugh:'Big laughs',edge:'Edge of your seat',cry:'Bring tissues',mind:'Mind-bending',epic:'Epic',cosy:'Cosy night in',date:'Date night',kids:'With the kids'};
const CERTS=['U','PG','12','15','18'];
const DECADES=[['old','Before 1980'],['1980','1980s'],['1990','1990s'],['2000','2000s'],['2010','2010s'],['2020','2020s']];
const LENGTHS=[[0,'Any length'],[100,'Under 100 min'],[120,'Under 2 hours'],[150,'Under 2½ hours']];

/* ------------------------------------------------------------------
   3. BUILT-IN FILMS
   F(id, title, year, minutes, UK certificate, genres, services, stable, moods, director, one-line summary)
   stable 1 = the service made or owns it (it normally stays there); 0 = licensed (may move).
   Services are a best estimate from general knowledge, not a live check. Use TMDB mode to refresh.
   ------------------------------------------------------------------ */
function F(id,t,y,m,c,g,s,st,mo,d,b){return {id,t,y,m,c,g:g.split(' '),s:s.split(' '),st:!!st,mo:mo?mo.split(' '):[],d,b};}
const BUILT=[
/* Netflix */
F("irishman","The Irishman",2019,209,"15","cri dra","netflix",1,"epic","Martin Scorsese","An ageing hitman looks back on decades of mob loyalty, and the friend he was ordered to betray."),
F("roma","Roma",2018,135,"15","dra","netflix",1,"cry","Alfonso Cuarón","A year in the life of a live-in housekeeper in 1970s Mexico City, shot in luminous black and white."),
F("marriagestory","Marriage Story",2019,137,"15","dra com","netflix",1,"cry","Noah Baumbach","A director and an actor try to divorce kindly, until the lawyers get involved."),
F("glassonion","Glass Onion: A Knives Out Mystery",2022,139,"12","mys com cri","netflix",1,"laugh mind date","Rian Johnson","Detective Benoit Blanc joins a tech billionaire's murder-mystery party on a private Greek island."),
F("wakeupdeadman","Wake Up Dead Man: A Knives Out Mystery",2025,144,"12","mys com cri","netflix",1,"mind date","Rian Johnson","Benoit Blanc takes on a seemingly impossible death in a small-town church."),
F("powerofthedog","The Power of the Dog",2021,126,"15","dra wes","netflix",1,"edge","Jane Campion","A cruel, charismatic Montana rancher torments his brother's new wife and her son."),
F("allquiet","All Quiet on the Western Front",2022,148,"15","war dra","netflix",1,"epic cry","Edward Berger","A German teenager's patriotic fervour dies in the trenches of the First World War."),
F("dontlookup","Don't Look Up",2021,138,"15","com sci","netflix",1,"laugh","Adam McKay","Two astronomers can't get anyone to care that a comet is about to destroy Earth."),
F("enolaholmes","Enola Holmes",2020,123,"12","mys adv fam","netflix",1,"feel kids","Harry Bradbeer","Sherlock's spirited teenage sister sets out to find their missing mother."),
F("extraction","Extraction",2020,116,"18","act thr","netflix",1,"edge","Sam Hargrave","A battle-worn mercenary fights his way through Dhaka to rescue a kidnapped boy."),
F("rednotice","Red Notice",2021,118,"12","act com","netflix",1,"laugh","Rawson Marshall Thurber","An FBI profiler and an art thief team up to catch the world's most wanted thief."),
F("adamproject","The Adam Project",2022,106,"12","sci adv com fam","netflix",1,"feel kids","Shawn Levy","A pilot from the future crash-lands in 2022 and teams up with his 12-year-old self."),
F("pinocchio","Guillermo del Toro's Pinocchio",2022,117,"PG","ani fan fam","netflix",1,"cry kids","Guillermo del Toro","A dark, beautiful stop-motion retelling set in 1930s fascist Italy."),
F("mitchells","The Mitchells vs the Machines",2021,114,"PG","ani com fam","netflix",1,"laugh feel kids","Mike Rianda","A chaotic family road trip collides with a global robot uprising."),
F("klaus","Klaus",2019,96,"PG","ani com fam","netflix",1,"feel cosy kids","Sergio Pablos","A spoilt trainee postman and a reclusive toymaker accidentally invent Christmas."),
F("nimona","Nimona",2023,101,"PG","ani fan act","netflix",1,"feel kids","Nick Bruno & Troy Quane","A shape-shifting teenager helps a framed knight prove his innocence."),
F("seabeast","The Sea Beast",2022,115,"PG","ani adv fam","netflix",1,"epic kids","Chris Williams","A girl stows away on a monster-hunting ship and befriends the beast it's chasing."),
F("kpop","KPop Demon Hunters",2025,100,"PG","ani mus act","netflix",1,"feel kids","Maggie Kang & Chris Appelhans","A K-pop girl group secretly protects their fans from demons, using their voices."),
F("societysnow","Society of the Snow",2023,144,"15","dra his thr","netflix",1,"edge cry","J.A. Bayona","The true story of the rugby team stranded in the Andes after a 1972 plane crash."),
F("maestro","Maestro",2023,129,"15","dra mus","netflix",1,"","Bradley Cooper","Leonard Bernstein's music, fame and complicated marriage to Felicia Montealegre."),
F("killer","The Killer",2023,118,"18","thr cri","netflix",1,"edge","David Fincher","A meticulous assassin misses a target and sets out to clean up the mess."),
F("leaveworld","Leave the World Behind",2023,141,"15","thr sci","netflix",1,"edge mind","Sam Esmail","A family's holiday rental turns tense as a mysterious cyber-attack spreads."),
F("frankenstein","Frankenstein",2025,150,"15","hor dra fan","netflix",1,"epic","Guillermo del Toro","Del Toro's gothic take on Mary Shelley's scientist and the creature he abandons."),
F("oldguard","The Old Guard",2020,125,"15","act fan","netflix",1,"edge","Gina Prince-Bythewood","A team of centuries-old immortal mercenaries discovers their secret is out."),
F("birdbox","Bird Box",2018,124,"15","hor thr","netflix",1,"edge","Susanne Bier","A mother leads two children, blindfolded, down a river through an apocalypse."),
F("okja","Okja",2017,120,"15","adv dra sci","netflix",1,"cry","Bong Joon Ho","A Korean girl risks everything to save her giant pig from a food corporation."),
F("chicago7","The Trial of the Chicago 7",2020,130,"15","dra his","netflix",1,"","Aaron Sorkin","Anti-war protesters face a politically charged trial after the 1968 Chicago riots."),
F("tickboom","tick, tick... BOOM!",2021,115,"12","mus dra","netflix",1,"feel","Lin-Manuel Miranda","A struggling composer races to write a hit musical before he turns 30."),
F("twopopes","The Two Popes",2019,125,"12","dra com","netflix",1,"cosy","Fernando Meirelles","Pope Benedict and the future Pope Francis argue, bond and watch football."),
F("hustle","Hustle",2022,117,"15","dra com","netflix",1,"feel","Jeremiah Zagar","A down-on-his-luck basketball scout discovers a raw talent on a Spanish court."),
F("rebelridge","Rebel Ridge",2024,131,"15","act thr","netflix",1,"edge","Jeremy Saulnier","An ex-Marine takes on a corrupt small-town police force to free his cousin."),
F("hishouse","His House",2020,93,"15","hor","netflix",1,"edge","Remi Weekes","A refugee couple from South Sudan find something evil in their new English home."),
F("grayman","The Gray Man",2022,122,"15","act thr","netflix",1,"edge","Anthony & Joe Russo","A CIA operative is hunted across the globe after uncovering agency secrets."),
F("carryon","Carry-On",2024,119,"15","act thr","netflix",1,"edge","Jaume Collet-Serra","An airport security officer is blackmailed into letting a deadly package onto a Christmas flight."),
F("henrysugar","The Wonderful Story of Henry Sugar",2023,39,"PG","com fan","netflix",1,"cosy","Wes Anderson","A rich man learns to see without his eyes, in Wes Anderson's playful Roald Dahl short."),
F("nyad","Nyad",2023,121,"12","dra","netflix",1,"feel","Elizabeth Chai Vasarhelyi & Jimmy Chin","At 60, a champion swimmer tries again to swim from Cuba to Florida."),
F("fearstreet","Fear Street Part One: 1994",2021,107,"18","hor mys","netflix",1,"edge","Leigh Janiak","Teenagers in a cursed town face killers from its bloody past."),
F("beasts","Beasts of No Nation",2015,137,"15","war dra","netflix",1,"cry","Cary Joji Fukunaga","A boy is forced to become a child soldier in a West African civil war."),
/* Disney+ */
F("toystory","Toy Story",1995,81,"U","ani com fam","disney",1,"feel kids cosy","John Lasseter","A cowboy doll's world is turned upside down when a flashy space ranger arrives."),
F("up","Up",2009,96,"U","ani adv fam","disney",1,"cry feel kids","Pete Docter","A grieving widower ties thousands of balloons to his house and flies off, with a stowaway."),
F("insideout","Inside Out",2015,95,"U","ani com fam","disney",1,"cry feel kids","Pete Docter","The emotions inside an 11-year-old's head steer her through a difficult move."),
F("insideout2","Inside Out 2",2024,96,"U","ani com fam","disney",1,"feel kids","Kelsey Mann","Puberty brings new emotions into Riley's head, led by an over-eager Anxiety."),
F("coco","Coco",2017,105,"PG","ani mus fam","disney",1,"cry feel kids","Lee Unkrich","A boy who dreams of music finds himself in the vibrant Land of the Dead."),
F("soul","Soul",2020,100,"PG","ani com fam","disney",1,"feel mind","Pete Docter","A jazz-loving teacher's soul gets separated from his body just before his big break."),
F("ratatouille","Ratatouille",2007,111,"U","ani com fam","disney",1,"feel cosy kids","Brad Bird","A rat with a gift for cooking teams up with a hapless kitchen boy in Paris."),
F("walle","WALL-E",2008,98,"U","ani sci fam","disney",1,"feel kids","Andrew Stanton","A lonely rubbish-clearing robot falls in love and follows her into space."),
F("findingnemo","Finding Nemo",2003,100,"U","ani adv fam","disney",1,"feel kids","Andrew Stanton","A nervous clownfish crosses the ocean to find his missing son."),
F("incredibles","The Incredibles",2004,115,"PG","ani act fam","disney",1,"feel kids","Brad Bird","A family of undercover superheroes is forced out of retirement."),
F("encanto","Encanto",2021,102,"PG","ani mus fam","disney",1,"feel kids","Byron Howard & Jared Bush","The only Madrigal without a magical gift may be the one to save the family."),
F("moana","Moana",2016,107,"PG","ani mus adv fam","disney",1,"feel kids","Ron Clements & John Musker","A chief's daughter sails across the ocean with a demigod to save her island."),
F("moana2","Moana 2",2024,100,"PG","ani mus adv fam","disney",1,"kids","David Derrick Jr.","Moana answers a call from her ancestors and sails to dangerous, long-lost seas."),
F("frozen","Frozen",2013,102,"PG","ani mus fam","disney",1,"feel kids","Chris Buck & Jennifer Lee","A fearless princess sets off to find her sister, whose icy powers have trapped the kingdom."),
F("zootropolis","Zootropolis",2016,108,"PG","ani com cri fam","disney",1,"laugh kids","Byron Howard & Rich Moore","A rookie bunny cop and a con-artist fox uncover a conspiracy."),
F("zootropolis2","Zootropolis 2",2025,108,"PG","ani com cri fam","disney",1,"laugh kids","Jared Bush & Byron Howard","Judy and Nick go undercover to crack a new case involving a mysterious snake."),
F("lionking","The Lion King",1994,88,"U","ani mus fam","disney",1,"cry kids","Roger Allers & Rob Minkoff","A lion cub flees after his father's death and must return to claim his kingdom."),
F("elemental","Elemental",2023,101,"U","ani rom com fam","disney",1,"feel kids","Peter Sohn","A fiery young woman and a go-with-the-flow water guy discover how much they have in common."),
F("nightmare","The Nightmare Before Christmas",1993,76,"PG","ani mus fan","disney",1,"cosy","Henry Selick","The Pumpkin King of Halloween Town decides to take over Christmas."),
F("endgame","Avengers: Endgame",2019,181,"12","act sci adv","disney",1,"epic","Anthony & Joe Russo","The surviving Avengers attempt one last stand to undo Thanos's devastating snap."),
F("gotg","Guardians of the Galaxy",2014,121,"12","act sci com","disney",1,"laugh feel","James Gunn","A ragtag band of outlaws must save the galaxy, set to a 70s mixtape."),
F("blackpanther","Black Panther",2018,134,"12","act sci","disney",1,"epic","Ryan Coogler","T'Challa returns home to rule Wakanda and faces a challenger with a claim to the throne."),
F("ragnarok","Thor: Ragnarok",2017,130,"12","act com fan","disney",1,"laugh","Taika Waititi","Thor is stranded on a junkyard planet and forced to fight his old friend the Hulk."),
F("thunderbolts","Thunderbolts*",2025,127,"12","act sci","disney",1,"laugh","Jake Schreier","A team of Marvel misfits and antiheroes is forced to work together."),
F("deadpoolwolverine","Deadpool & Wolverine",2024,128,"15","act com","disney",1,"laugh","Shawn Levy","Deadpool drags a reluctant Wolverine into a mission to save his timeline."),
F("starwars","Star Wars",1977,121,"U","adv sci fan","disney",1,"epic feel","George Lucas","A farm boy, a smuggler and a princess take on the Galactic Empire."),
F("empire","The Empire Strikes Back",1980,124,"PG","adv sci fan","disney",1,"epic","Irvin Kershner","The rebels are on the run as Luke trains with the Jedi master Yoda."),
F("rogueone","Rogue One: A Star Wars Story",2016,133,"12","act sci war","disney",1,"epic edge","Gareth Edwards","A band of rebels sets out to steal the plans for the Death Star."),
F("avatar","Avatar",2009,162,"12","sci adv","disney",1,"epic","James Cameron","A paralysed marine is given a new body on the alien moon Pandora, and switches sides."),
F("waywater","Avatar: The Way of Water",2022,192,"12","sci adv","disney",1,"epic","James Cameron","Jake Sully's family flee to the ocean reefs of Pandora."),
F("freeguy","Free Guy",2021,115,"12","act com","disney",1,"laugh feel","Shawn Levy","A background character in a video game realises he's in a video game."),
F("lemans66","Le Mans '66",2019,152,"12","dra act","disney",1,"edge feel","James Mangold","Ford hires a maverick designer and a hot-headed British driver to beat Ferrari."),
F("budapest","The Grand Budapest Hotel",2014,100,"15","com cri","disney",1,"laugh date","Wes Anderson","A legendary hotel concierge and his lobby boy are caught up in a murder and a stolen painting."),
F("poorthings","Poor Things",2023,141,"18","com sci fan","disney",1,"mind","Yorgos Lanthimos","A woman brought back to life by an eccentric scientist sets off to discover the world."),
F("nomadland","Nomadland",2020,108,"12","dra","disney",1,"cry","Chloé Zhao","After losing everything, a widow takes to the road and lives in her van."),
F("hamilton","Hamilton",2020,160,"12","mus his","disney",1,"epic feel","Thomas Kail","The filmed Broadway hit about America's founding fathers, told through hip hop."),
F("alien","Alien",1979,117,"15","hor sci","disney",1,"edge","Ridley Scott","A space crew answers a distress call and brings something deadly on board."),
F("diehard","Die Hard",1988,132,"15","act thr","disney",1,"edge cosy","John McTiernan","A New York cop takes on terrorists in a Los Angeles skyscraper at Christmas."),
F("homealone","Home Alone",1990,103,"PG","com fam","disney",1,"laugh cosy kids","Chris Columbus","An eight-year-old left behind at Christmas defends his house from burglars."),
F("princessbride","The Princess Bride",1987,98,"PG","adv com rom fan","disney",1,"feel laugh date","Rob Reiner","A grandfather reads a tale of true love, giants, swordfights and revenge."),
F("titanic","Titanic",1997,194,"12","rom dra","disney",1,"cry epic date","James Cameron","A penniless artist and a wealthy young woman fall in love aboard the doomed liner."),
F("pirates","Pirates of the Caribbean: The Curse of the Black Pearl",2003,143,"12","adv act fan","disney",1,"laugh epic","Gore Verbinski","A blacksmith teams up with an eccentric pirate to rescue the governor's daughter."),
F("soundofmusic","The Sound of Music",1965,174,"U","mus rom fam","disney",1,"feel cosy","Robert Wise","A free-spirited governess wins over a widowed naval captain and his seven children."),
F("prey","Prey",2022,99,"15","act hor sci","disney",1,"edge","Dan Trachtenberg","A young Comanche warrior defends her tribe against an alien hunter."),
F("completeunknown","A Complete Unknown",2024,141,"15","mus dra","disney",1,"","James Mangold","A 19-year-old Bob Dylan arrives in New York and shakes up the folk scene."),
F("ryelane","Rye Lane",2023,82,"15","rom com","disney",1,"feel laugh date","Raine Allen-Miller","Two twenty-somethings, both freshly dumped, spend a day wandering south London."),
/* Apple TV */
F("coda","CODA",2021,111,"12","dra com mus","apple",1,"feel cry","Siân Heder","The only hearing member of a deaf family discovers a talent for singing."),
F("flowermoon","Killers of the Flower Moon",2023,206,"15","cri dra his","apple",1,"epic","Martin Scorsese","A series of murders targets the oil-rich Osage Nation in 1920s Oklahoma."),
F("napoleon","Napoleon",2023,158,"15","his war dra","apple",1,"epic","Ridley Scott","The rise and fall of Napoleon, and his volatile love for Joséphine."),
F("greyhound","Greyhound",2020,91,"12","war act","apple",1,"edge","Aaron Schneider","A US Navy commander escorts a convoy through U-boat-infested waters."),
F("wolfs","Wolfs",2024,108,"15","act com","apple",1,"laugh","Jon Watts","Two lone-wolf fixers are hired to clean up the same mess."),
F("gorge","The Gorge",2025,127,"15","act sci rom","apple",1,"edge date","Scott Derrickson","Two snipers guarding opposite sides of a mysterious gorge fall for each other."),
F("f1","F1",2025,156,"12","act dra","apple",1,"edge feel","Joseph Kosinski","A veteran racing driver returns to Formula 1 to mentor a hotshot rookie."),
F("flymemoon","Fly Me to the Moon",2024,132,"12","rom com","apple",1,"date feel","Greg Berlanti","A marketing whizz is hired to sell the Moon landing, and to stage a fake one just in case."),
F("finch","Finch",2021,115,"12","sci dra","apple",1,"cry feel","Miguel Sapochnik","A dying inventor builds a robot to look after his dog after the world ends."),
F("wolfwalkers","Wolfwalkers",2020,103,"PG","ani fan fam","apple",1,"feel kids","Tomm Moore & Ross Stewart","A young hunter in 1650s Ireland befriends a girl who runs with wolves."),
F("argylle","Argylle",2024,139,"12","act com","apple",1,"laugh","Matthew Vaughn","A shy spy novelist finds her stories coming true."),
F("ghosted","Ghosted",2023,117,"12","act rom com","apple",1,"date","Dexter Fletcher","A farmer chases a first date abroad and discovers she's a secret agent."),
F("lostbus","The Lost Bus",2025,130,"15","thr dra","apple",1,"edge","Paul Greengrass","A bus driver and a teacher try to get 22 children out of a deadly wildfire."),
F("tetris","Tetris",2023,118,"15","dra thr","apple",1,"edge","Jon S. Baird","A games salesman battles the Soviet state for the rights to Tetris."),
F("spirited","Spirited",2022,127,"12","mus com","apple",1,"cosy laugh","Sean Anders","The Ghost of Christmas Present picks the wrong man to haunt."),
F("macbeth","The Tragedy of Macbeth",2021,105,"15","dra","apple",1,"","Joel Coen","Shakespeare's tale of ambition and murder in stark black and white."),
/* Prime Video */
F("saltburn","Saltburn",2023,131,"18","thr dra com","prime",1,"edge mind","Emerald Fennell","An Oxford student is invited to spend the summer at a classmate's grand family estate."),
F("tomorrowwar","The Tomorrow War",2021,138,"12","act sci","prime",1,"edge","Chris McKay","Soldiers from 2051 recruit today's civilians to fight an alien war."),
F("air","Air",2023,112,"15","dra","prime",1,"feel","Ben Affleck","Nike makes a long-shot bid to sign a rookie called Michael Jordan."),
F("roadhouse","Road House",2024,121,"15","act","prime",1,"edge","Doug Liman","An ex-UFC fighter takes a job as a bouncer at a rowdy Florida Keys bar."),
F("rwrb","Red, White & Royal Blue",2023,121,"15","rom com","prime",1,"date feel","Matthew López","The US President's son falls for his rival, a British prince."),
F("soundofmetal","Sound of Metal",2019,120,"15","dra mus","prime",1,"cry","Darius Marder","A heavy-metal drummer begins to lose his hearing."),
F("borat2","Borat Subsequent Moviefilm",2020,96,"15","com","prime",1,"laugh","Jason Woliner","Borat returns to America with his teenage daughter."),
F("bigsick","The Big Sick",2017,120,"15","rom com","prime",1,"date feel laugh","Michael Showalter","A comedian's girlfriend falls into a coma, just as he meets her parents."),
F("onenightmiami","One Night in Miami...",2020,114,"15","dra","prime",1,"","Regina King","Malcolm X, Muhammad Ali, Jim Brown and Sam Cooke spend one night talking."),
F("tinyperfect","The Map of Tiny Perfect Things",2021,99,"12","rom sci","prime",1,"date feel mind","Ian Samuels","Two teenagers stuck in the same day set out to find its perfect moments."),
F("headsofstate","Heads of State",2025,113,"15","act com","prime",1,"laugh","Ilya Naishuller","The US President and the UK Prime Minister go on the run together."),
F("accountant2","The Accountant 2",2025,132,"15","act thr","prime",1,"edge","Gavin O'Connor","A maths savant with lethal skills teams up with his brother to solve a murder."),
F("skyfall","Skyfall",2012,143,"12","act thr","prime",0,"edge epic","Sam Mendes","Bond's loyalty to M is tested when her past comes back to haunt her."),
F("casinoroyale","Casino Royale",2006,144,"12","act thr","prime",0,"edge","Martin Campbell","Bond's first mission as 007 leads to a high-stakes poker game in Montenegro."),
F("creed","Creed",2015,133,"12","dra act","prime",0,"feel","Ryan Coogler","Apollo Creed's son asks Rocky Balboa to train him."),
F("legallyblonde","Legally Blonde",2001,96,"12","com rom","prime",0,"feel laugh","Robert Luketic","A sorority queen enrols at Harvard Law School to win back her ex."),
/* Paramount+ */
F("topgunmaverick","Top Gun: Maverick",2022,131,"12","act dra","paramount",0,"edge feel","Joseph Kosinski","Maverick trains a new generation of pilots for an impossible mission."),
F("quietplace","A Quiet Place",2018,90,"15","hor thr","paramount",0,"edge","John Krasinski","A family survives in silence, hiding from creatures that hunt by sound."),
F("godfather","The Godfather",1972,175,"15","cri dra","paramount",0,"epic","Francis Ford Coppola","The ageing head of a crime family hands control to his reluctant son."),
F("sonic","Sonic the Hedgehog",2020,99,"PG","act com fam","paramount",0,"kids laugh","Jeff Fowler","A speedy blue hedgehog teams up with a small-town cop."),
F("meangirls","Mean Girls",2004,97,"12","com","paramount",0,"laugh","Mark Waters","A new girl infiltrates her school's most ruthless clique."),
F("gladiator2","Gladiator II",2024,148,"15","act his","paramount",0,"epic","Ridley Scott","Years after Maximus, Lucius is forced to fight in the Colosseum."),
F("mifallout","Mission: Impossible – Fallout",2018,147,"12","act thr","paramount",0,"edge","Christopher McQuarrie","Ethan Hunt races to recover stolen plutonium after a mission goes wrong."),
F("smile","Smile",2022,115,"15","hor","paramount",0,"edge","Parker Finn","A therapist is haunted by a grinning presence after a patient's death."),
F("grease","Grease",1978,110,"PG","mus rom","paramount",0,"feel","Randal Kleiser","A greaser and a good girl fall for each other over one summer."),
/* NOW / Sky Cinema */
F("oppenheimer","Oppenheimer",2023,180,"15","his dra","now",0,"epic","Christopher Nolan","The physicist who led the race to build the atomic bomb, and what it cost him."),
F("barbie","Barbie",2023,114,"12","com fan","now",0,"laugh feel","Greta Gerwig","Barbie leaves Barbieland for the real world after an existential crisis."),
F("wicked","Wicked",2024,160,"PG","mus fan","now",0,"feel epic","Jon M. Chu","The unlikely friendship between the future Wicked Witch and Glinda the Good."),
F("wickedforgood","Wicked: For Good",2025,137,"PG","mus fan","now",0,"feel epic","Jon M. Chu","Elphaba and Glinda face the consequences of their choices."),
F("dune","Dune",2021,155,"12","sci adv","now",0,"epic","Denis Villeneuve","A noble family takes control of the desert planet Arrakis and its precious spice."),
F("dune2","Dune: Part Two",2024,166,"12","sci adv","now",0,"epic","Denis Villeneuve","Paul Atreides unites with the Fremen to take revenge."),
F("superman","Superman",2025,129,"12","act sci","now",0,"feel","James Gunn","Superman balances his alien heritage with his life as Clark Kent."),
F("sinners","Sinners",2025,137,"15","hor dra mus","now",0,"edge","Ryan Coogler","Twin brothers open a juke joint in 1930s Mississippi and attract something evil."),
F("minecraft","A Minecraft Movie",2025,101,"PG","com adv fam","now",0,"laugh kids","Jared Hess","Four misfits are pulled through a portal into a cube-shaped world."),
F("httyd","How to Train Your Dragon",2025,125,"PG","fan adv fam","now",0,"feel kids","Dean DeBlois","A Viking boy befriends the dragon he was meant to kill."),
F("jurassicrebirth","Jurassic World Rebirth",2025,133,"12","act adv sci","now",0,"edge","Gareth Edwards","A covert team heads to a dinosaur-filled island to collect DNA."),
F("mickey17","Mickey 17",2025,137,"15","sci com","now",0,"mind laugh","Bong Joon Ho","An expendable worker who's cloned every time he dies meets his replacement."),
F("conclave","Conclave",2024,120,"12","thr dra","now",0,"edge mind","Edward Berger","A cardinal uncovers secrets while overseeing the election of a new pope."),
F("holdovers","The Holdovers",2023,133,"15","com dra","now",0,"cosy feel","Alexander Payne","A grumpy teacher is stuck at school over Christmas with a troubled pupil."),
F("twisters","Twisters",2024,122,"12","act thr","now",0,"edge","Lee Isaac Chung","A storm chaser and a cowboy YouTuber chase a season of deadly tornadoes."),
F("paddingtonperu","Paddington in Peru",2024,106,"PG","com adv fam","now",0,"feel cosy kids","Dougal Wilson","Paddington and the Browns head to Peru to visit Aunt Lucy."),
F("wildrobot","The Wild Robot",2024,102,"U","ani adv fam","now",0,"cry feel kids","Chris Sanders","A robot shipwrecked on a wild island raises an orphaned gosling."),
F("nosferatu","Nosferatu",2024,132,"15","hor fan","now",0,"edge","Robert Eggers","A young woman is haunted by an ancient vampire obsessed with her."),
/* BBC iPlayer / Channel 4 */
F("wallacegromit","Wallace & Gromit: Vengeance Most Fowl",2024,79,"PG","ani com fam","iplayer",1,"laugh cosy kids","Nick Park & Merlin Crossingham","Feathers McGraw returns, framing Wallace's new smart garden gnome."),
F("aftersun","Aftersun",2022,101,"12","dra","iplayer",0,"cry","Charlotte Wells","A woman remembers a holiday in Turkey with her young father."),
F("paddington2","Paddington 2",2017,104,"PG","com fam","iplayer",0,"feel cosy kids","Paul King","Paddington is wrongly jailed after a valuable pop-up book is stolen."),
F("pride","Pride",2014,120,"15","com dra","iplayer",0,"feel cry","Matthew Warchus","London gay activists raise money for striking Welsh miners in 1984."),
F("favourite","The Favourite",2018,119,"15","com dra his","c4",0,"laugh","Yorgos Lanthimos","Two cousins compete to be Queen Anne's favourite."),
F("threebillboards","Three Billboards Outside Ebbing, Missouri",2017,115,"15","cri dra com","c4",0,"","Martin McDonagh","A grieving mother takes on the local police with three blunt billboards."),
F("slumdog","Slumdog Millionaire",2008,120,"15","dra rom","c4",0,"feel","Danny Boyle","A Mumbai teenager is one question away from winning a quiz show fortune."),
F("zoneofinterest","The Zone of Interest",2023,105,"12","dra his war","c4",0,"","Jonathan Glazer","The commandant of Auschwitz builds a family idyll beside the camp wall.")
];

/* ------------------------------------------------------------------
   4. STATE (saved on this device only)
   ------------------------------------------------------------------ */
const KEY='filmSwipe.v1', TKEY='filmSwipe.tmdbKey';
function emptyFilters(){return {genres:[],moods:[],maxMins:0,maxCert:'',decades:[],svc:[]};}
function defaults(){return {v:1,setup:false,settings:{services:[],custom:[],onlyMine:true,posters:false},filters:emptyFilters(),
  seed:Math.floor(Math.random()*1e9),decided:{},history:[],front:[],watch:[],watched:{},tonight:null,own:[],svcOverride:{},
  live:{},found:[],tmIds:{},tm:{prov:null,provT:0,page:0,q:'',status:''},tog:null,tab:'swipe'};}
let state=defaults();
try{const raw=localStorage.getItem(KEY); if(raw){const s=JSON.parse(raw), d=defaults();
  state=Object.assign(d,s); state.settings=Object.assign(d.settings,s.settings||{}); state.filters=Object.assign(emptyFilters(),s.filters||{}); state.tm=Object.assign(defaults().tm,s.tm||{});}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){toast('Couldn\u2019t save on this device');}}

/* ------------------------------------------------------------------
   5. HELPERS
   ------------------------------------------------------------------ */
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>Array.from(el.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
const framed=(()=>{try{return window.self!==window.top;}catch(e){return true;}})();
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function seededRng(seed){let a=seed>>>0; return ()=>{a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296;};}
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const plural=(n,a,b)=>n+' '+(n===1?a:(b||a+'s'));
const ICON={
  x:'<svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  heart:'<svg class="i" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  undo:'<svg class="i" viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  info:'<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  eye:'<svg class="i" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  dice:'<svg class="i" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/></svg>',
  play:'<svg class="i" viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z"/></svg>',
  ext:'<svg class="i" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
};

/* Services */
function customServices(){return (state.settings.custom||[]).map(n=>({k:'x:'+n,n,c:'#9A8F86',url:t=>'https://www.justwatch.com/uk/search?q='+enc(t),re:new RegExp(escRe(n),'i'),custom:true}));}
function allServices(){return SERVICES.concat(customServices());}
function svcInfo(k){return allServices().find(s=>s.k===k)||{k,n:k.replace(/^x:/,''),c:'#9A8F86',url:t=>'https://www.justwatch.com/uk/search?q='+enc(t),re:/$^/};}
function myServices(){return state.settings.services||[];}

/* Films */
let filmIndex=null;
function reindex(){filmIndex=null;}
function allFilms(){return BUILT.concat(state.own,state.found);}
function getFilm(id){if(!filmIndex){filmIndex=new Map(); allFilms().forEach(f=>filmIndex.set(f.id,f));} return filmIndex.get(id);}
function svcOf(f){const o=state.svcOverride[f.id]; if(o) return o; const l=state.live[f.id]; if(l&&l.svc) return l.svc; return f.s||[];}
function svcSource(f){if(state.svcOverride[f.id]) return 'you'; const l=state.live[f.id]; if(l&&l.svc) return 'live'; return f.own?'you':'built';}
function onMine(f){const m=myServices(); return svcOf(f).some(k=>m.includes(k));}
function mineOf(f){const m=myServices(); return svcOf(f).filter(k=>m.includes(k));}
function inWatch(id){return state.watch.some(w=>w.id===id);}
function certClass(c){return c?(/^\d/.test(c)?'c'+c:c):'';}
function certRank(c){return CERTS.indexOf(c);}
function hrs(m){if(!m) return ''; const h=Math.floor(m/60), mm=m%60; return h?`${h}h ${String(mm).padStart(2,'0')}m`:`${mm} min`;}
function factsText(f){return [f.y,f.m?hrs(f.m):'',f.c?'Cert '+f.c:''].filter(Boolean).join(' · ');}
function genreText(f){return (f.g||[]).map(g=>GENRES[g]?GENRES[g][0]:g).join(', ');}
function svcTags(f,opt={}){const list=svcOf(f), m=myServices();
  if(!list.length) return `<span class="svc none">${opt.short?'Not on a service':'Not on a UK subscription service we know of'}</span>`;
  const sorted=list.slice().sort((a,b)=>(m.includes(b)?1:0)-(m.includes(a)?1:0));
  return sorted.map(k=>{const s=svcInfo(k); return `<span class="svc${m.includes(k)?' mine':''}" style="--sc:${s.c}"><i></i>${esc(s.n)}${m.includes(k)?' ✓':''}</span>`;}).join('');}

/* Title card art */
function titleSize(t){const len=t.length, longest=Math.max(...t.split(/\s+/).map(w=>w.length)); return Math.max(6,Math.min(16,90/(longest*0.62),240/len+3)).toFixed(2);}
function mono(t){const w=t.replace(/^(the|a|an)\s+/i,'').split(/[\s:–-]+/).filter(x=>/\w/.test(x)); return (w.length>1?w[0][0]+w[1][0]:(w[0]||t).slice(0,2)).toUpperCase();}
function posterPath(f){if(!state.settings.posters||!tmdbKey()) return ''; const l=state.live[f.id]; return f.poster||(l&&l.poster)||'';}
function artHtml(f,cls){
  const g=GENRES[(f.g||[])[0]]||GENRES.dra, h=hash(f.id), lay=h%3, ang=120+(h>>3)%90, poster=posterPath(f), mini=cls==='mini';
  return `<div class="tc l${lay} ${cls||''}${poster?' has-poster':''}" style="--a:${g[1]};--b:${g[2]};--tk:${g[3]};--ang:${ang}deg" aria-hidden="true">
    ${poster?`<img class="poster" src="https://image.tmdb.org/t/p/${mini?'w92':'w500'}${esc(poster)}" alt="" referrerpolicy="no-referrer" loading="lazy">`:''}
    <div class="tc-in">${mini?`<b class="tc-mono">${esc(mono(f.t))}</b>`:`<span class="tc-year num">${esc(f.y||'')}</span><b class="tc-title" style="--fs:${titleSize(f.t)}">${esc(f.t)}</b>${f.d?`<span class="tc-dir">${esc(f.d)}</span>`:''}`}</div>
    ${f.c?`<span class="cert ${certClass(f.c)}">${esc(f.c)}</span>`:''}</div>`;}

/* ------------------------------------------------------------------
   6. FILTERS + DECK
   ------------------------------------------------------------------ */
function decadeOf(y){if(!y) return ''; return y<1980?'old':String(Math.floor(y/10)*10);}
function matchesFilters(f,flt){flt=flt||state.filters;
  if(flt.genres.length&&!(f.g||[]).some(g=>flt.genres.includes(g))) return false;
  if(flt.moods.length&&!(f.mo||[]).some(m=>flt.moods.includes(m))) return false;
  if(flt.maxMins&&f.m&&f.m>flt.maxMins) return false;
  if(flt.maxCert&&(certRank(f.c)<0||certRank(f.c)>certRank(flt.maxCert))) return false;
  if(flt.decades.length&&!flt.decades.includes(decadeOf(f.y))) return false;
  if(flt.svc.length&&!svcOf(f).some(k=>flt.svc.includes(k))) return false;
  return true;}
function serviceGate(f){return !(state.settings.onlyMine&&myServices().length)||onMine(f);}
function deck(){
  const front=state.front||[];
  const list=allFilms().filter(f=>!state.decided[f.id]&&!state.watched[f.id]&&!inWatch(f.id)&&serviceGate(f)&&matchesFilters(f));
  const key=f=>{const i=front.indexOf(f.id); return i>=0?-1e13+i:hash(state.seed+':'+f.id);};
  return list.sort((a,b)=>key(a)-key(b));}
function filterCount(){const f=state.filters; return f.genres.length+f.moods.length+f.decades.length+f.svc.length+(f.maxMins?1:0)+(f.maxCert?1:0);}

/* ------------------------------------------------------------------
   7. SWIPE
   ------------------------------------------------------------------ */
function cardHtml(f,i,top){
  const both=state.tog&&state.tog.matches&&state.tog.matches.includes(f.id);
  return `<article class="card${top?' top':''}" data-id="${esc(f.id)}" style="transform:translateY(${i*8}px) scale(${1-i*0.03});z-index:${10-i}" ${top?'tabindex="0" aria-label="'+esc(f.t)+'. Swipe right to add to watchlist, left to skip, or press Enter for details."':'aria-hidden="true"'}>
    ${artHtml(f)}
    <span class="stamp pick">WATCH</span><span class="stamp nope">NOPE</span><span class="stamp seen">SEEN IT</span>
    ${both?'<span class="both-tag">You both liked</span>':''}
    <div class="card-body">
      <div class="eyebrow num">${esc(factsText(f))}${f.g&&f.g.length?' · '+esc(genreText(f)):''}</div>
      <h2>${esc(f.t)}</h2>
      ${f.b?`<p>${esc(f.b)}</p>`:''}
      <div class="svcs">${svcTags(f,{short:true})}</div>
    </div>
  </article>`;}
function tonightHtml(){const tn=state.tonight; if(!tn) return ''; const f=getFilm(tn.id); if(!f){state.tonight=null; return '';}
  const mine=mineOf(f), s=svcInfo(mine[0]||svcOf(f)[0]||'');
  return `<div class="tonight">${artHtml(f,'mini')}<div style="min-width:0"><div class="lbl">Tonight's film</div><button class="tonight-name" data-act="open" data-id="${esc(f.id)}">${esc(f.t)}</button>
    <div class="small muted num">${esc(factsText(f))}${svcOf(f).length?' · '+esc(s.n):''}</div>
    <div class="row">${svcOf(f).length?`<a class="btn sm primary" href="${esc(s.url(f.t))}" target="_blank" rel="noopener noreferrer">${ICON.play} Open ${esc(s.n)}</a>`:''}<button class="btn sm" data-act="watchedtn">We watched it</button><button class="btn sm ghost" data-act="spin">Change</button></div></div></div>`;}
function renderSwipe(){
  const v=$('#view-swipe');
  if(togOn()){ensureTog(); const left=togLeft().map(getFilm).filter(Boolean);
    v.innerHTML=togHeader()+(left.length?`<div class="deck" id="deck">${left.slice(0,3).map((f,i)=>cardHtml(f,i,i===0)).reverse().join('')}</div>
    <div class="actions"><button class="act sm" data-act="undo" aria-label="Undo last swipe">${ICON.undo}</button>
      <button class="act lg skip" data-act="skip" aria-label="Not for me">${ICON.x}</button>
      <button class="act lg pick" data-act="pick" aria-label="I'd watch this">${ICON.heart}</button>
      <button class="act sm" data-act="info" aria-label="Film details">${ICON.info}</button></div>`:togDoneHtml());
    const tt=$('#deck .card.top'); if(tt) bindDrag(tt); return;}
  const d=deck(), fc=filterCount(), mine=myServices(), f=state.filters;
  const svcChips=mine.length?mine.map(k=>{const s=svcInfo(k); return `<button class="chip" data-act="fsvc" data-v="${esc(k)}" aria-pressed="${f.svc.includes(k)}"><span class="sw" style="background:${s.c}"></span>${esc(s.n)}</button>`;}).join(''):'';
  const chips=`<button class="chip" data-act="filters" aria-pressed="${fc>0}">Filters${fc?` <span class="cnt">${fc}</span>`:''}</button>${svcChips}
    ${Object.keys(MOODS).map(k=>`<button class="chip" data-act="fmood" data-v="${k}" aria-pressed="${f.moods.includes(k)}">${esc(MOODS[k])}</button>`).join('')}`;
  let body;
  if(!d.length){const skipped=Object.values(state.decided).filter(x=>x==='L').length;
    body=`<div class="empty"><h2>That's every film for now</h2><p>You've seen everything that matches${state.settings.onlyMine&&mine.length?' on your services':''}${fc?' and your filters':''}${skipped?`, and skipped ${skipped}`:''}.</p>
      <div class="row" style="width:100%;max-width:360px">${skipped?'<button class="btn primary" data-act="reshow">Show skipped again</button>':''}${fc?'<button class="btn" data-act="clearfilters">Clear filters</button>':''}
      ${tmdbKey()?'<button class="btn" data-act="findmore">Find more films</button>':''}${state.settings.onlyMine&&mine.length?'<button class="btn" data-act="onlymine">Include other services</button>':''}</div></div>`;}
  else body=`<div class="deck" id="deck">${d.slice(0,3).map((x,i)=>cardHtml(x,i,i===0)).reverse().join('')}</div>
    <div class="actions"><button class="act sm" data-act="undo" aria-label="Undo last swipe">${ICON.undo}</button>
      <button class="act lg skip" data-act="skip" aria-label="Skip this film">${ICON.x}</button>
      <button class="act sm seen" data-act="seen" aria-label="Seen it already">${ICON.eye}</button>
      <button class="act lg pick" data-act="pick" aria-label="Add to watchlist">${ICON.heart}</button>
      <button class="act sm" data-act="info" aria-label="Film details">${ICON.info}</button></div>`;
  v.innerHTML=`${tonightHtml()}<div class="strip"><div><b class="num">${plural(d.length,'film')} to swipe</b><div class="small muted">${mine.length?(state.settings.onlyMine?'On your services':'All services, yours marked ✓'):'<button class="x-btn" data-act="services" style="padding:0">Choose your services</button>'}</div></div>
    <div class="row" style="flex-wrap:nowrap"><button class="btn sm" data-act="together">Swipe together</button></div></div>
    <div class="chips" role="group" aria-label="Filter films">${chips}</div>${body}`;
  const top=$('#deck .card.top'); if(top) bindDrag(top);}
function bindDrag(card){
  let sx=0,sy=0,dx=0,dy=0,active=false,moved=false;
  card.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;active=true;moved=false;sx=e.clientX;sy=e.clientY;dx=dy=0;try{card.setPointerCapture(e.pointerId);}catch(_){}card.classList.add('dragging');});
  card.addEventListener('pointermove',e=>{if(!active)return;dx=e.clientX-sx;dy=e.clientY-sy;if(Math.abs(dx)>6||Math.abs(dy)>6)moved=true;
    const down=!togOn()&&dy>0&&dy>Math.abs(dx);
    card.style.transform=`translate(${dx}px,${down?dy:dy*0.25}px) rotate(${dx/18}deg)`;
    const p=Math.min(1,Math.abs(dx)/100), pd=down?Math.min(1,dy/110):0;
    card.style.setProperty('--pick-o',dx>0&&!down?p:0);card.style.setProperty('--nope-o',dx<0&&!down?p:0);card.style.setProperty('--seen-o',pd);});
  const end=e=>{if(!active)return;active=false;card.classList.remove('dragging');
    if(!togOn()&&dy>110&&dy>Math.abs(dx)) return decide('S');
    if(dx>100) return decide('R'); if(dx<-100) return decide('L');
    card.style.transform='';['--pick-o','--nope-o','--seen-o'].forEach(k=>card.style.setProperty(k,0));
    if(!moved&&e.type==='pointerup') openFilm(card.dataset.id,'deck');};
  card.addEventListener('pointerup',end);card.addEventListener('pointercancel',end);
  card.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();decide('R');}else if(e.key==='ArrowLeft'){e.preventDefault();decide('L');}else if(e.key==='ArrowDown'&&!togOn()){e.preventDefault();decide('S');}else if(e.key==='Enter'||e.key===' '){e.preventDefault();openFilm(card.dataset.id,'deck');}});
}
let busy=false;
function decide(dir){
  const card=$('#deck .card.top'); if(!card||busy) return; busy=true; const id=card.dataset.id;
  card.classList.remove('dragging');
  card.style.setProperty(dir==='R'?'--pick-o':dir==='L'?'--nope-o':'--seen-o',1);
  card.style.transform=dir==='S'?'translate(0,120%)':`translate(${dir==='R'?140:-140}%, -30px) rotate(${dir==='R'?20:-20}deg)`;
  card.classList.add('leaving');
  setTimeout(()=>{busy=false;applyDecision(id,dir);},reduced()?0:240);}
function applyDecision(id,dir){
  if(togOn()){const T=state.tog; T.dec[id]=dir; T.hist.push(id); T.matches=null; save(); renderSwipe(); if(!togLeft().length) toast(`All ${TOG_N} done. Swap codes!`); return;}
  state.decided[id]=dir; state.history.push(id); state.front=state.front.filter(x=>x!==id);
  if(dir==='R'&&!inWatch(id)) state.watch.unshift({id,t:Date.now()});
  if(dir==='S'&&!state.watched[id]) state.watched[id]={t:Date.now(),r:0,swipe:true};
  save(); renderSwipe(); renderNav();
  if(dir==='S') toast('Marked as seen. Rate it on the Watched tab');}
function undo(){
  if(togOn()){const T=state.tog, tid=T.hist.pop(); if(!tid){toast('Nothing to undo');return;} delete T.dec[tid]; T.matches=null; save(); renderSwipe(); toast('Brought it back'); return;}
  const id=state.history.pop(); if(!id){toast('Nothing to undo');return;}
  const d=state.decided[id];
  if(d==='R') state.watch=state.watch.filter(w=>w.id!==id);
  if(d==='S'&&state.watched[id]&&state.watched[id].swipe) delete state.watched[id];
  delete state.decided[id]; state.front.unshift(id); save(); renderSwipe(); renderNav(); toast('Brought it back');}

/* ------------------------------------------------------------------
   8. WATCHLIST + TONIGHT'S PICK
   ------------------------------------------------------------------ */
let watchSort='added';
function filmRow(f,extra){
  return `<div class="film">${artHtml(f,'mini')}
    <div class="film-main"><button class="film-name" data-act="open" data-id="${esc(f.id)}">${esc(f.t)}</button>
      <span class="film-meta num">${esc(factsText(f))}</span><div class="svcs">${svcTags(f,{short:true})}</div></div>
    <div class="film-side">${extra&&extra.side||''}</div>
    ${extra&&extra.actions?`<div class="film-actions">${extra.actions}</div>`:''}</div>`;}
function renderWatch(){
  const v=$('#view-watch'); let list=state.watch.map(w=>({w,f:getFilm(w.id)})).filter(x=>x.f);
  if(!list.length){v.innerHTML=`${tonightHtml()}<div class="empty" style="min-height:58vh"><h2>Your watchlist is empty</h2><p>Swipe right on films you'd like to watch. They'll wait here until film night.</p>
    <div class="row" style="width:100%;max-width:360px"><button class="btn primary" data-tab="swipe">Start swiping</button><button class="btn" data-act="together">Swipe together</button></div></div>`; return;}
  if(watchSort==='short') list.sort((a,b)=>(a.f.m||999)-(b.f.m||999));
  else if(watchSort==='service') list.sort((a,b)=>{const ka=(mineOf(a.f)[0]||'~'+(svcOf(a.f)[0]||'~')), kb=(mineOf(b.f)[0]||'~'+(svcOf(b.f)[0]||'~')); return ka<kb?-1:ka>kb?1:0;});
  const onMy=list.filter(x=>onMine(x.f)).length;
  v.innerHTML=`${tonightHtml()}
    <button class="btn primary block" data-act="spin">${ICON.dice} What shall we watch tonight?</button>
    <div class="kv"><h2 style="font-size:22px" class="num">${plural(list.length,'film')}</h2><span class="small muted num">${myServices().length?`${onMy} on your services`:''}</span></div>
    <div class="chips" role="group" aria-label="Sort">${[['added','Recently added'],['short','Shortest first'],['service','By service']].map(([k,l])=>`<button class="chip" data-act="wsort" data-v="${k}" aria-pressed="${watchSort===k}">${l}</button>`).join('')}</div>
    ${list.map(({w,f})=>filmRow(f,{side:w.both?'<span class="pill">You both liked</span>':'',
      actions:`<button class="btn sm" data-act="settonight" data-id="${esc(f.id)}">Tonight</button><button class="toggle" data-act="markwatched" data-id="${esc(f.id)}">Watched it</button><button class="x-btn" data-act="unwatch" data-id="${esc(f.id)}">Remove</button>`})).join('')}`;}
function setTonight(id){state.tonight={id,t:Date.now()}; save(); renderAll(); const f=getFilm(id); toast(`Tonight: ${f?f.t:'film'}`);}
let spinOpt={from:'watch',max:0,mood:'',mine:true}, spinLast=null, spinPick=null;
function spinPool(){
  const base=spinOpt.from==='watch'?state.watch.map(w=>getFilm(w.id)).filter(Boolean):allFilms().filter(f=>!state.watched[f.id]&&state.decided[f.id]!=='L');
  return base.filter(f=>(!spinOpt.max||!f.m||f.m<=spinOpt.max)&&(!spinOpt.mood||(f.mo||[]).includes(spinOpt.mood))&&(!spinOpt.mine||!myServices().length||onMine(f)));}
function spinSheet(){spinPick=null; const draw=()=>{const pool=spinPool(), f=spinPick&&getFilm(spinPick);
  return `<h2>What shall we watch tonight?</h2>
    <div class="chips wrap" role="group" aria-label="Choose from">${[['watch','From our watchlist'],['all','Anything we haven\u2019t seen']].map(([k,l])=>`<button class="chip" data-act="spinopt" data-k="from" data-v="${k}" aria-pressed="${spinOpt.from===k}">${l}</button>`).join('')}</div>
    <div class="chips wrap" role="group" aria-label="Length">${LENGTHS.map(([k,l])=>`<button class="chip" data-act="spinopt" data-k="max" data-v="${k}" aria-pressed="${spinOpt.max===k}">${l}</button>`).join('')}</div>
    <div class="chips wrap" role="group" aria-label="Mood"><button class="chip" data-act="spinopt" data-k="mood" data-v="" aria-pressed="${!spinOpt.mood}">Any mood</button>${Object.keys(MOODS).map(k=>`<button class="chip" data-act="spinopt" data-k="mood" data-v="${k}" aria-pressed="${spinOpt.mood===k}">${esc(MOODS[k])}</button>`).join('')}</div>
    ${myServices().length?`<label class="chk"><input type="checkbox" id="spin-mine" ${spinOpt.mine?'checked':''}> Only films on our services</label>`:''}
    ${f?`<div class="reveal panel" style="gap:12px">${artHtml(f,'hero')}<h3 style="font-size:22px">${esc(f.t)}</h3><span class="small muted num">${esc(factsText(f))} · ${esc(genreText(f))}</span>${f.b?`<p class="muted">${esc(f.b)}</p>`:''}<div class="svcs">${svcTags(f)}</div>
      <div class="row"><button class="btn primary" data-act="settonight" data-id="${esc(f.id)}" data-close="1">Watch this tonight</button><button class="btn" data-act="spingo">${ICON.dice} Spin again</button></div></div>`
      :`<button class="btn primary block" data-act="spingo" ${pool.length?'':'disabled'}>${ICON.dice} Pick for us${pool.length?` (from ${plural(pool.length,'film')})`:''}</button>
      ${pool.length?'':`<p class="small muted">Nothing matches. ${spinOpt.from==='watch'?'Try \u201cAnything we haven\u2019t seen\u201d, or swipe right on a few more films.':'Loosen the length or mood.'}</p>`}`}`;};
  openSheet(draw(),{ctx:{redraw:()=>sheetRedraw(draw,bindSpinMine)},onMount:bindSpinMine});}
function bindSpinMine(b){const c=$('#spin-mine',b); if(c) c.onchange=()=>{spinOpt.mine=c.checked; spinPick=null; if(sheetCtx&&sheetCtx.redraw) sheetCtx.redraw();};}
function spinGo(){const pool=spinPool(); if(!pool.length){toast('Nothing matches');return;} let opts=pool.filter(f=>f.id!==spinLast); if(!opts.length) opts=pool;
  spinPick=opts[Math.floor(Math.random()*opts.length)].id; spinLast=spinPick; sheetCtx&&sheetCtx.redraw();}

/* ------------------------------------------------------------------
   9. WATCHED + RATINGS
   ------------------------------------------------------------------ */
function starsHtml(id){const r=(state.watched[id]||{}).r||0;
  return `<div class="stars" role="group" aria-label="Your rating">${[1,2,3,4,5].map(n=>`<button data-act="rate" data-id="${esc(id)}" data-v="${n}" aria-pressed="${n<=r}" aria-label="${n} star${n>1?'s':''}">★</button>`).join('')}</div>`;}
function markWatched(id){if(!state.watched[id]) state.watched[id]={t:Date.now(),r:0}; state.watch=state.watch.filter(w=>w.id!==id); if(state.tonight&&state.tonight.id===id) state.tonight=null; state.decided[id]=state.decided[id]||'S'; save(); renderAll(); rateSheet(id);}
function rateSheet(id){const f=getFilm(id); if(!f) return; const draw=()=>`<h2>How was ${esc(f.t)}?</h2><p class="muted">Rate it so you remember. It's saved on the Watched tab.</p>${starsHtml(id)}<button class="btn primary block" data-act="close">Done</button>`;
  openSheet(draw(),{ctx:{id,redraw:()=>sheetRedraw(draw)}});}
function renderSeen(){
  const v=$('#view-seen'), ids=Object.keys(state.watched).filter(getFilm).sort((a,b)=>state.watched[b].t-state.watched[a].t);
  if(!ids.length){v.innerHTML=`<div class="empty" style="min-height:62vh"><h2>No films watched yet</h2><p>Tap "We watched it" on tonight's film, or swipe down on a card you've already seen.</p><button class="btn primary" data-tab="swipe">Start swiping</button></div>`; return;}
  const films=ids.map(getFilm), mins=films.reduce((a,f)=>a+(f.m||0),0), rated=ids.filter(id=>state.watched[id].r), avg=rated.length?rated.reduce((a,id)=>a+state.watched[id].r,0)/rated.length:0;
  const gc={}; films.forEach(f=>(f.g||[]).forEach(g=>gc[g]=(gc[g]||0)+1)); const topG=Object.keys(gc).sort((a,b)=>gc[b]-gc[a])[0];
  const fmt=t=>new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  v.innerHTML=`<div class="stats"><div><b class="num">${ids.length}</b><span>films</span></div><div><b class="num">${Math.round(mins/60)}</b><span>hours</span></div><div><b class="num">${avg?avg.toFixed(1):'–'}</b><span>avg stars</span></div><div><b>${topG&&GENRES[topG]?esc(GENRES[topG][0]):'–'}</b><span>top genre</span></div></div>
    ${ids.map(id=>{const f=getFilm(id), w=state.watched[id]; return filmRow(f,{side:`<span class="small muted num">${esc(fmt(w.t))}</span>`,actions:`${starsHtml(id)}<span style="flex:1"></span><button class="x-btn" data-act="watchagain" data-id="${esc(id)}">Watch again</button><button class="x-btn" data-act="unseen" data-id="${esc(id)}">Remove</button>`});}).join('')}`;}

/* ------------------------------------------------------------------
   10. BROWSE + FILM DETAIL
   ------------------------------------------------------------------ */
let browseQ='', browseMode='all';
function browseListHtml(){const q=browseQ.trim().toLowerCase();
  let list=allFilms().filter(f=>browseMode==='all'||(browseMode==='mine'&&onMine(f))||(browseMode==='own'&&f.own)||(browseMode==='found'&&f.tmdb&&!f.own));
  if(q) list=list.filter(f=>(f.t+' '+(f.d||'')+' '+genreText(f)+' '+f.y).toLowerCase().includes(q));
  list.sort((a,b)=>a.t.replace(/^(the|a|an)\s+/i,'').localeCompare(b.t.replace(/^(the|a|an)\s+/i,'')));
  return list.length?list.map(f=>filmRow(f,{side:inWatch(f.id)?'<span class="pill">Watchlist</span>':state.watched[f.id]?'<span class="pill plain">Seen</span>':''})).join(''):'<p class="muted">No films match.</p>';}
function renderBrowse(){
  const v=$('#view-browse'), modes=[['all','All'],['mine','On my services'],['own','Added by me'],['found','Found on TMDB']];
  v.innerHTML=`<input class="search" id="browse-q" type="search" placeholder="Search ${allFilms().length} films, directors, genres" value="${esc(browseQ)}" aria-label="Search films">
    <div class="chips" role="group" aria-label="Show">${modes.map(([k,l])=>`<button class="chip" data-act="bmode" data-v="${k}" aria-pressed="${browseMode===k}">${l}</button>`).join('')}</div>
    <div class="row"><button class="btn sm" data-act="addfilm">Add a film</button><button class="btn sm" data-act="tmdb">${tmdbKey()?'Find more on TMDB':'Live updates (TMDB)'}</button></div>
    <div id="browse-list" style="display:flex;flex-direction:column;gap:10px">${browseListHtml()}</div>`;
  const inp=$('#browse-q'); inp.oninput=()=>{browseQ=inp.value; $('#browse-list').innerHTML=browseListHtml();};}
function sourceNote(f){const src=svcSource(f), l=state.live[f.id];
  if(src==='you') return 'Services set by you.';
  if(src==='live') return `Checked live with TMDB on ${new Date(l.t).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}. Where-to-watch data from JustWatch.`;
  return f.st?`From the built-in list (${DATA_DATE}). ${esc(svcInfo(f.s[0]).n)} made or owns this film, so it normally stays there.`:`From the built-in list (${DATA_DATE}). Licensed films move between services, so check before you sit down.`;}
function openFilm(id,from){const f=getFilm(id); if(!f) return;
  const draw=()=>{const l=state.live[f.id], list=svcOf(f), w=state.watched[f.id], extras=l&&l.names?l.names.filter(n=>!allServices().some(s=>s.re.test(n))):[];
    const deckBtns=from==='deck'?`<div class="row sticky-actions"><button class="btn" data-act="dskip">${ICON.x} Skip</button><button class="btn" data-act="dseen">${ICON.eye} Seen it</button><button class="btn primary" data-act="dpick">${ICON.heart} Watchlist</button></div>`:'';
    return `${artHtml(f,'hero')}
    <h2>${esc(f.t)}</h2>
    <div class="small muted num">${esc(factsText(f))}${f.d?' · '+esc(f.d):''}</div>
    <div class="svcs">${(f.g||[]).map(g=>`<span class="pill plain">${esc(GENRES[g]?GENRES[g][0]:g)}</span>`).join('')}${(f.mo||[]).map(m=>`<span class="pill gold">${esc(MOODS[m]||m)}</span>`).join('')}</div>
    ${f.b?`<p>${esc(f.b)}</p>`:''}
    <div class="panel"><b>Where to watch in the UK</b><div class="svcs">${svcTags(f)}</div>
      ${extras.length?`<p class="note">Also on: ${esc(extras.join(', '))}</p>`:''}
      <p class="note">${sourceNote(f)}</p>
      <div class="linkrow">${list.map(k=>{const s=svcInfo(k); return `<a class="btn sm${myServices().includes(k)?' primary':''}" href="${esc(s.url(f.t))}" target="_blank" rel="noopener noreferrer">${ICON.play} ${esc(s.n)}</a>`;}).join('')}
        <a class="btn sm" href="${esc(l&&l.link?l.link:'https://www.justwatch.com/uk/search?q='+enc(f.t))}" target="_blank" rel="noopener noreferrer">${ICON.ext} Check where to watch</a>
        <a class="btn sm" href="https://www.youtube.com/results?search_query=${enc(f.t+' '+(f.y||'')+' trailer')}" target="_blank" rel="noopener noreferrer">${ICON.ext} Trailer</a></div>
      <div class="row"><button class="btn sm ghost" data-act="editsvc" data-id="${esc(f.id)}">Change services</button>${tmdbKey()?`<button class="btn sm ghost" data-act="refreshone" data-id="${esc(f.id)}">Check live now</button>`:''}</div></div>
    ${w?`<div class="panel"><b>You watched this</b>${starsHtml(f.id)}</div>`:''}
    ${from!=='deck'?`<div class="row">${inWatch(f.id)?`<button class="btn" data-act="unwatch" data-id="${esc(f.id)}">Remove from watchlist</button>`:`<button class="btn" data-act="addwatch" data-id="${esc(f.id)}">${ICON.heart} Add to watchlist</button>`}
      <button class="btn" data-act="settonight" data-id="${esc(f.id)}" data-close="1">Watch tonight</button>${w?'':`<button class="btn" data-act="markwatched" data-id="${esc(f.id)}">Watched it</button>`}</div>`:''}
    ${f.own?`<div class="row"><button class="btn sm" data-act="editfilm" data-id="${esc(f.id)}">Edit film</button><button class="btn sm ghost" data-act="delfilm" data-id="${esc(f.id)}">Delete film</button></div>`:''}
    ${f.tmdb&&!f.own?'<p class="note">Film details from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>':''}
    ${deckBtns}`;};
  openSheet(draw(),{ctx:{id,from,redraw:()=>sheetRedraw(draw)}});}
function svcEditSheet(id){const f=getFilm(id); if(!f) return; const cur=svcOf(f);
  openSheet(`<h2>Where is ${esc(f.t)}?</h2><p class="muted">Tick every service it's on right now. Your choice overrides the built-in list and TMDB.</p>
    <div class="chips wrap">${allServices().map(s=>`<label class="chip"><input type="checkbox" name="es" value="${esc(s.k)}" ${cur.includes(s.k)?'checked':''}><span class="sw" style="background:${s.c}"></span>${esc(s.n)}</label>`).join('')}</div>
    <div class="row"><button class="btn primary" id="es-save">Save</button>${state.svcOverride[id]?'<button class="btn" id="es-reset">Use the list again</button>':''}</div>`,
  {onMount:b=>{$('#es-save',b).onclick=()=>{state.svcOverride[id]=$$('input[name=es]:checked',b).map(i=>i.value); save(); renderAll(); openFilm(id); toast('Services updated');};
    const r=$('#es-reset',b); if(r) r.onclick=()=>{delete state.svcOverride[id]; save(); renderAll(); openFilm(id);};}});}

/* Add or edit your own film */
function filmForm(id){const f=id?getFilm(id):null;
  openSheet(`<h2>${f?'Edit film':'Add a film'}</h2>
    <label class="field">Title<input id="ff-t" value="${esc(f?f.t:'')}" maxlength="120" autocomplete="off"></label>
    <div class="grid3"><label class="field">Year<input id="ff-y" type="number" inputmode="numeric" min="1900" max="2100" value="${esc(f?f.y:'')}"></label>
      <label class="field">Minutes<input id="ff-m" type="number" inputmode="numeric" min="1" max="600" value="${esc(f?f.m:'')}"></label>
      <label class="field">Certificate<select id="ff-c"><option value="">Not sure</option>${CERTS.map(c=>`<option${f&&f.c===c?' selected':''}>${c}</option>`).join('')}</select></label></div>
    <div class="field">Genres<div class="chips wrap">${Object.keys(GENRES).map(k=>`<label class="chip"><input type="checkbox" name="ffg" value="${k}" ${f&&f.g.includes(k)?'checked':''}>${GENRES[k][0]}</label>`).join('')}</div></div>
    <div class="field">Where can you watch it?<div class="chips wrap">${allServices().map(s=>`<label class="chip"><input type="checkbox" name="ffs" value="${esc(s.k)}" ${f&&svcOf(f).includes(s.k)?'checked':''}><span class="sw" style="background:${s.c}"></span>${esc(s.n)}</label>`).join('')}</div></div>
    <div class="field">Mood<div class="chips wrap">${Object.keys(MOODS).map(k=>`<label class="chip"><input type="checkbox" name="ffo" value="${k}" ${f&&(f.mo||[]).includes(k)?'checked':''}>${esc(MOODS[k])}</label>`).join('')}</div></div>
    <label class="field">Director (optional)<input id="ff-d" value="${esc(f?f.d:'')}" maxlength="80"></label>
    <label class="field">What's it about? (optional)<textarea id="ff-b" maxlength="300">${esc(f?f.b:'')}</textarea></label>
    <div id="ff-err" class="err" role="alert"></div>
    <div class="row sticky-actions"><button class="btn" data-act="close">Cancel</button><button class="btn primary" id="ff-save">${f?'Save changes':'Add film'}</button></div>`,
  {onMount:b=>{$('#ff-save',b).onclick=()=>{const t=$('#ff-t',b).value.trim(); if(!t){$('#ff-err',b).textContent='Give the film a title.'; return;}
    const g=$$('input[name=ffg]:checked',b).map(i=>i.value);
    const film={id:f?f.id:'own-'+Date.now().toString(36),t,y:parseInt($('#ff-y',b).value)||'',m:parseInt($('#ff-m',b).value)||0,c:$('#ff-c',b).value,g:g.length?g:['dra'],
      s:$$('input[name=ffs]:checked',b).map(i=>i.value),st:false,mo:$$('input[name=ffo]:checked',b).map(i=>i.value),d:$('#ff-d',b).value.trim(),b:$('#ff-b',b).value.trim(),own:true};
    if(f){const i=state.own.findIndex(x=>x.id===f.id); if(i>=0) state.own[i]=film;} else state.own.push(film);
    delete state.svcOverride[film.id]; reindex(); save(); renderAll(); openFilm(film.id); toast(f?'Film updated':'Film added');};}});}

/* ------------------------------------------------------------------
   11. SWIPE TOGETHER
   Everyone with the same services ticked gets the same 28 built-in films each day (picked from the date,
   so phones agree without talking to each other). Each person swipes all 28, then you swap short codes.
   ------------------------------------------------------------------ */
const TOG_N=28;
function dayKey(d){d=d||new Date(); return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');}
function svcMask(){let m=0; SERVICES.forEach((s,i)=>{if(myServices().includes(s.k)) m+=2**i;}); return m;}
function maskNames(m){return SERVICES.filter((s,i)=>Math.floor(m/2**i)%2===1).map(s=>s.n);}
function togSet(day,mask){const rnd=seededRng(hash('fstog:'+day+':'+mask)), mine=maskNames(mask), keys=SERVICES.filter(s=>mine.includes(s.n)).map(s=>s.k);
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a;};
  const on=shuffle(BUILT.filter(f=>f.s.some(k=>keys.includes(k))).map(f=>f.id)), rest=shuffle(BUILT.filter(f=>!f.s.some(k=>keys.includes(k))).map(f=>f.id));
  return on.concat(rest).slice(0,TOG_N);}
function togOn(){return !!(state.tog&&state.tog.active);}
function ensureTog(){const day=dayKey(), mask=svcMask(), key=day+'-'+mask.toString(36);
  if(!state.tog||state.tog.key!==key) state.tog={active:!!(state.tog&&state.tog.active),key,day,mask,ids:togSet(day,mask),dec:{},hist:[],matches:null,theirs:0};}
function togLeft(){return state.tog.ids.filter(id=>!state.tog.dec[id]);}
function togLikes(){return state.tog.ids.filter(id=>state.tog.dec[id]==='R');}
function togCheck(ids){return hash(ids.join(',')).toString(36).slice(0,4);}
function togCode(){const T=state.tog; let bits=0; T.ids.forEach((id,i)=>{if(T.dec[id]==='R') bits+=2**i;}); return `FS1-${T.day}-${T.mask.toString(36)}-${togCheck(T.ids)}-${bits.toString(36)}`;}
function readTogCode(txt){
  const m=String(txt||'').match(/FS1-(\d{8})-([a-z0-9]+)-([a-z0-9]{1,4})-([a-z0-9]+)/i); if(!m) return {err:'That doesn\u2019t look like a Film Swipe code. Paste the whole thing, starting FS1-.'};
  const T=state.tog;
  if(m[1]!==T.day){const d=m[1]; return {err:`That code is for ${+d.slice(6)} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+d.slice(4,6)-1]}. You both need to swipe the same day\u2019s ${TOG_N} films. Ask for today\u2019s code.`};}
  const theirMask=parseInt(m[2],36);
  if(theirMask!==T.mask){const t=maskNames(theirMask), mine=maskNames(T.mask); return {err:`You have different services ticked, so you swiped different films. Theirs: ${t.join(', ')||'none'}. Yours: ${mine.join(', ')||'none'}. Tick the same services (Settings), then both swipe again.`};}
  if(m[3].toLowerCase()!==togCheck(T.ids)) return {err:'Your apps have different film lists. Make sure you\u2019re both on the latest version, then swipe again.'};
  const bits=parseInt(m[4],36); if(!(bits>=0)) return {err:'That code is damaged. Copy it again.'};
  return {likes:T.ids.filter((id,i)=>Math.floor(bits/2**i)%2===1)};}
function startTogether(){ensureTog(); state.tog.active=true; save(); closeSheet(); setTab('swipe');}
function togHeader(){const done=TOG_N-togLeft().length;
  return `<div class="tog-strip"><div style="min-width:0"><b>Swipe together</b><div class="small muted num">${done} of ${TOG_N} · the same ${TOG_N} films for both of you today</div></div><button class="btn sm" data-act="togexit">Exit</button></div>
    <div class="bar"><i style="width:${Math.round(done/TOG_N*100)}%"></i></div>`;}
function canShare(){try{return !!navigator.share&&window.self===window.top;}catch(e){return false;}}
function togDoneHtml(){const T=state.tog, mine=togLikes();
  return `<div class="tog-done">
    <h2>All ${TOG_N} swiped</h2><p class="muted">You liked ${mine.length}. Send your code and paste theirs once they've swiped all ${TOG_N} too.</p>
    <div class="panel"><b>1. Send your code</b><code class="code-box num">${esc(togCode())}</code>
      <div class="row"><button class="btn" data-act="togcopy">Copy my code</button>${canShare()?'<button class="btn" data-act="togshare">Share my code</button>':''}</div>
      <textarea id="tog-mycode" class="inp code" hidden readonly aria-label="Your code"></textarea></div>
    <div class="panel"><b>2. Paste their code</b>
      <textarea id="tog-code" class="inp code" style="min-height:70px" placeholder="FS1-..." aria-label="Their code"></textarea>
      <div id="tog-err" class="err" role="alert"></div>
      <button class="btn primary" data-act="togfind">Find our matches</button></div>
    ${T.matches?`<div class="section-title">You both liked · ${T.matches.length}</div>
      ${T.matches.length?T.matches.map(id=>{const f=getFilm(id); return f?filmRow(f,{side:inWatch(id)?'<span class="pill">Watchlist</span>':''}):'';}).join('')
        +`<div class="row"><button class="btn primary" data-act="togpick">Pick one for tonight</button><button class="btn" data-act="togadd">Add all to watchlist</button></div>`
        :`<p class="small muted">No films in common today. They liked ${T.theirs}, you liked ${mine.length}. Try tomorrow's ${TOG_N}, or swipe the normal deck.</p>`}`:''}
    <div class="row"><button class="btn ghost" data-act="togredo">Swipe today's ${TOG_N} again</button><button class="btn ghost" data-act="togexit">Back to my deck</button></div>
  </div>`;}

/* ------------------------------------------------------------------
   12. LIVE WHERE-TO-WATCH (optional, needs your own free TMDB key)
   Only runs when you add a key. Requests go straight from this device to api.themoviedb.org.
   ------------------------------------------------------------------ */
const TMDB='https://api.themoviedb.org/3';
const TMDB_GENRES={28:'act',12:'adv',16:'ani',35:'com',80:'cri',99:'doc',18:'dra',10751:'fam',14:'fan',36:'his',27:'hor',10402:'mus',9648:'mys',10749:'rom',878:'sci',53:'thr',10752:'war',37:'wes'};
function tmdbKey(){try{return localStorage.getItem(TKEY)||'';}catch(e){return '';}}
function setTmdbKey(k){try{if(k) localStorage.setItem(TKEY,k); else localStorage.removeItem(TKEY);}catch(e){}}
async function tmdb(path,params){
  const key=tmdbKey(); if(!key) throw new Error('nokey');
  const u=new URL(TMDB+path); Object.entries(params||{}).forEach(([k,v])=>u.searchParams.set(k,v));
  const h={accept:'application/json'}; if(/^eyJ/.test(key)) h.Authorization='Bearer '+key; else u.searchParams.set('api_key',key);
  let r; try{r=await fetch(u.toString(),{headers:h,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});}catch(e){throw new Error('offline');}
  if(r.status===401) throw new Error('badkey'); if(r.status===429) throw new Error('slow'); if(!r.ok) throw new Error('http'+r.status);
  return r.json();}
function tmErr(e){const m=(e&&e.message)||'';
  return m==='badkey'?'TMDB didn\u2019t accept that key. Copy it again from your TMDB account (API settings).':m==='nokey'?'Add your TMDB key first.':m==='slow'?'TMDB says slow down. Wait a minute and try again.':
    m==='offline'?(framed?'Live updates can\u2019t reach TMDB from inside claude.ai. Use your GitHub version of the app for this.':'Couldn\u2019t reach TMDB. Check your internet connection.'):'Something went wrong talking to TMDB ('+m+').';}
async function ensureProviders(force){
  if(!force&&state.tm.prov&&Date.now()-state.tm.provT<30*864e5) return state.tm.prov;
  const res=await tmdb('/watch/providers/movie',{watch_region:'GB',language:'en-GB'}), map={};
  allServices().forEach(s=>{map[s.k]=(res.results||[]).filter(p=>s.re.test(p.provider_name)).map(p=>p.provider_id);});
  state.tm.prov=map; state.tm.provT=Date.now(); save(); return map;}
function liveFrom(d){const gb=((d['watch/providers']||{}).results||{}).GB||{}, list=[...(gb.flatrate||[]),...(gb.free||[]),...(gb.ads||[])];
  return {svc:allServices().filter(s=>list.some(p=>s.re.test(p.provider_name))).map(s=>s.k),t:Date.now(),link:gb.link||'',poster:d.poster_path||'',tmdb:d.id,names:[...new Set(list.map(p=>p.provider_name))]};}
function certFrom(d){const r=((d.release_dates||{}).results||[]).find(x=>x.iso_3166_1==='GB'); let c=r?(r.release_dates||[]).map(x=>x.certification).find(Boolean)||'':''; c=c.replace('12A','12'); return CERTS.includes(c)?c:'';}
const details=tid=>tmdb('/movie/'+tid,{append_to_response:'watch/providers,release_dates',language:'en-GB'});
async function tmdbIdFor(f){if(f.tmdb) return f.tmdb; if(state.tmIds[f.id]) return state.tmIds[f.id];
  let res=await tmdb('/search/movie',{query:f.t,year:f.y||'',include_adult:'false',language:'en-GB'}); let r=(res.results||[]);
  if(!r.length&&f.y){res=await tmdb('/search/movie',{query:f.t,include_adult:'false',language:'en-GB'}); r=res.results||[];}
  const hit=r.find(x=>String(x.release_date||'').startsWith(String(f.y)))||r[0]; if(!hit) return 0; state.tmIds[f.id]=hit.id; return hit.id;}
async function refreshFilm(f){const tid=await tmdbIdFor(f); if(!tid) return false; const d=await details(tid); state.live[f.id]=liveFrom(d);
  if(f.tmdb&&!f.own){f.m=d.runtime||f.m; f.c=certFrom(d)||f.c;} return true;}
async function runPool(items,n,fn,onProg){let i=0,done=0,fatal=null;
  const worker=async()=>{while(i<items.length&&!fatal){const it=items[i++]; try{await fn(it);}catch(e){if(['badkey','offline','nokey'].includes(e.message)) fatal=e;} done++; onProg&&onProg(done,items.length);}};
  await Promise.all(Array.from({length:Math.min(n,items.length)},worker)); if(fatal) throw fatal;}
let tmBusy=false;
function tmProg(t){const p=$('#tm-prog'); if(p) p.textContent=t;}
async function refreshMany(films,label){if(tmBusy) return; tmBusy=true; tmProg(`Checking ${plural(films.length,'film')}…`);
  try{await ensureProviders(); let ok=0; await runPool(films,4,async f=>{if(await refreshFilm(f)) ok++;},(d,n)=>tmProg(`${label}: ${d} of ${n}`)); save(); renderAll(); tmProg(`Done. Updated ${plural(ok,'film')}.`); toast(`Updated ${plural(ok,'film')}`);}
  catch(e){tmProg(tmErr(e)); toast(tmErr(e));} finally{tmBusy=false; save();}}
async function findMore(){if(tmBusy) return; tmBusy=true; tmProg('Looking for films on your services…');
  try{const prov=await ensureProviders(), mine=myServices(); const ids=[...new Set(mine.flatMap(k=>prov[k]||[]))];
    if(!ids.length) throw new Error(mine.length?'noprov':'nosvc');
    const f=state.filters, gids=Object.keys(TMDB_GENRES).filter(k=>f.genres.includes(TMDB_GENRES[k]));
    const q=[ids.join('|'),gids.join('|'),f.maxCert].join('/'); if(state.tm.q!==q){state.tm.q=q; state.tm.page=0;}
    const page=(state.tm.page||0)+1, params={watch_region:'GB',with_watch_providers:ids.join('|'),with_watch_monetization_types:'flatrate|free|ads',sort_by:'popularity.desc','vote_count.gte':'150',include_adult:'false',language:'en-GB',page:String(page)};
    if(gids.length) params.with_genres=gids.join('|'); if(f.maxCert){params.certification_country='GB'; params['certification.lte']=f.maxCert;}
    const res=await tmdb('/discover/movie',params);
    const known=new Set([...Object.values(state.tmIds),...state.found.map(x=>x.tmdb),...Object.values(state.live).map(x=>x.tmdb)]);
    const titleKey=(t,y)=>t.toLowerCase().replace(/[^a-z0-9]/g,'')+':'+y; const builtKeys=new Set(BUILT.concat(state.own).map(x=>titleKey(x.t,x.y)));
    const fresh=(res.results||[]).filter(r=>!known.has(r.id)&&!builtKeys.has(titleKey(r.title||'',String(r.release_date||'').slice(0,4)*1||'')));
    let added=0;
    await runPool(fresh,4,async r=>{const d=await details(r.id), g=(d.genres||[]).map(x=>TMDB_GENRES[x.id]).filter(Boolean);
      const film={id:'t'+d.id,t:d.title||r.title,y:parseInt(String(d.release_date||'').slice(0,4))||'',m:d.runtime||0,c:certFrom(d),g:g.length?g:['dra'],s:[],st:false,mo:moodsFor(g),d:'',b:String(d.overview||'').slice(0,240),tmdb:d.id,poster:d.poster_path||''};
      state.live[film.id]=liveFrom(d); state.found.push(film); added++;},(d,n)=>tmProg(`Adding films: ${d} of ${n}`));
    state.tm.page=page; reindex(); save(); renderAll();
    const msg=added?`Added ${plural(added,'new film')} to your deck.`:(page<(res.total_pages||1)?'Nothing new on that page. Tap again for more.':'No more films found for these filters.');
    tmProg(msg); toast(msg);}
  catch(e){const m=e.message==='nosvc'?'Choose your services first (Settings).':e.message==='noprov'?'TMDB doesn\u2019t list your services for the UK.':tmErr(e); tmProg(m); toast(m);}
  finally{tmBusy=false;}}
function moodsFor(g){const m=[]; if(g.includes('com')) m.push('laugh'); if(g.includes('fam')||g.includes('ani')) m.push('kids'); if(g.includes('thr')||g.includes('hor')) m.push('edge'); if(g.includes('rom')) m.push('date'); if(g.includes('sci')&&g.includes('mys')) m.push('mind'); return m;}
function tmdbSheet(){const draw=()=>{const key=tmdbKey(), watchFilms=state.watch.map(w=>getFilm(w.id)).filter(Boolean);
  return `<h2>Live where-to-watch</h2>
    <p class="muted">The built-in list is a best guess and films move between services every month. Add a free TMDB key to check what's on your services today, and to find more films to swipe.</p>
    ${framed?'<p class="small err">Live updates don\u2019t work inside claude.ai. Use your GitHub version of the app for this.</p>':''}
    <div class="panel"><label class="field" for="tm-key">TMDB API key or Read Access Token<input id="tm-key" type="password" autocomplete="off" spellcheck="false" value="${esc(key)}" placeholder="Paste your key"></label>
      <div class="row"><button class="btn primary" id="tm-save">Save and test</button>${key?'<button class="btn" id="tm-del">Remove key</button>':''}</div>
      <p class="err" id="tm-msg" role="alert"></p>
      <p class="note">Your key stays on this device. It is only sent to TMDB and is never included in backups or codes.</p></div>
    ${key?`<div class="panel"><b>Update</b>
      <button class="btn" data-act="refreshwatch" ${watchFilms.length?'':'disabled'}>Check my watchlist (${plural(watchFilms.length,'film')})</button>
      <button class="btn" data-act="refreshall">Check every film (${allFilms().length}, about a minute)</button>
      <button class="btn" data-act="findmore">Find more films on my services</button>
      <label class="chk"><input type="checkbox" id="tm-posters" ${state.settings.posters?'checked':''}> Show film posters from TMDB (instead of title cards)</label>
      <p class="note" id="tm-prog" role="status">${esc(state.tm.status||'')}</p></div>`:''}
    <details class="panel"><summary><b>How to get a free TMDB key</b></summary><ol class="steps">
      <li>Go to themoviedb.org and create a free account.</li><li>Open your profile → Settings → API.</li>
      <li>Request an API key, choose "Personal" use and fill in the short form.</li><li>Copy the "API Read Access Token" (or the API key) and paste it here.</li></ol></details>
    <p class="note">Where-to-watch data comes from JustWatch through TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>`;};
  const mount=b=>{$('#tm-save',b).onclick=async()=>{const k=$('#tm-key',b).value.trim(); if(!k){toast('Paste a key first');return;} setTmdbKey(k); $('#tm-msg',b).textContent=''; toast('Testing your key…'); const btn=$('#tm-save',b); btn.disabled=true;
      try{await ensureProviders(true); state.tm.status='Key works. Services matched: '+myServices().filter(s=>(state.tm.prov[s]||[]).length).map(s=>svcInfo(s).n).join(', '); save(); sheetRedraw(draw,mount); toast('TMDB key saved');}
      catch(e){if(e.message==='badkey') setTmdbKey(''); sheetRedraw(draw,mount); const m=$('#tm-msg'); if(m) m.textContent=tmErr(e);}};
    const d=$('#tm-del',b); if(d) d.onclick=()=>{setTmdbKey(''); state.tm.prov=null; state.tm.status=''; state.settings.posters=false; save(); renderAll(); sheetRedraw(draw,mount); toast('Key removed');};
    const p=$('#tm-posters',b); if(p) p.onchange=()=>{state.settings.posters=p.checked; save(); renderAll();};};
  openSheet(draw(),{ctx:{redraw:()=>sheetRedraw(draw,mount)},onMount:mount});}

/* ------------------------------------------------------------------
   13. SETTINGS, SERVICES, FILTERS, BACKUP
   ------------------------------------------------------------------ */
function servicesHtml(){const m=myServices();
  return `<div class="chips wrap" role="group" aria-label="Your services">${allServices().map(s=>`<button class="chip" data-act="svc" data-v="${esc(s.k)}" aria-pressed="${m.includes(s.k)}"><span class="sw" style="background:${s.c}"></span>${esc(s.n)}${s.custom?' ·':''}</button>`).join('')}</div>
    <div class="row"><input class="inp" id="svc-new" placeholder="Another service, e.g. BritBox" maxlength="40" style="flex:1 1 180px"><button class="btn sm" data-act="svcadd">Add</button></div>
    ${(state.settings.custom||[]).length?`<p class="note">To remove a service you added, tap it to untick it, then <button class="x-btn" data-act="svcclean" style="padding:0">remove unticked extras</button>.</p>`:''}`;}
function servicesSheet(first){const draw=()=>`<h2>${first?'Which services do you have?':'Your services'}</h2>
    <p class="muted">${first?'Tick the streaming services you pay for or watch. Film Swipe shows films on these first. You can change this any time in Settings.':'Films on these are marked ✓ and shown first.'}</p>
    ${servicesHtml()}
    <label class="chk"><input type="checkbox" id="only-mine" ${state.settings.onlyMine?'checked':''}> Only show films on my services when swiping</label>
    <button class="btn primary block" data-act="svcdone">${first?'Start swiping':'Done'}</button>`;
  const mount=b=>{const c=$('#only-mine',b); if(c) c.onchange=()=>{state.settings.onlyMine=c.checked; save(); renderAll();};};
  openSheet(draw(),{ctx:{redraw:()=>sheetRedraw(draw,mount)},onMount:mount});}
function filterSheet(){const draw=()=>{const f=state.filters, n=deck().length;
  const multi=(k,obj)=>Object.keys(obj).map(x=>`<button class="chip" data-act="fmulti" data-k="${k}" data-v="${x}" aria-pressed="${f[k].includes(x)}">${esc(Array.isArray(obj[x])?obj[x][0]:obj[x])}</button>`).join('');
  return `<h2>Filters</h2>
    <div class="section-title">Services</div>
    ${myServices().length?`<div class="chips wrap">${myServices().map(k=>`<button class="chip" data-act="fsvc" data-v="${esc(k)}" aria-pressed="${f.svc.includes(k)}"><span class="sw" style="background:${svcInfo(k).c}"></span>${esc(svcInfo(k).n)}</button>`).join('')}</div>`:''}
    <label class="chk"><input type="checkbox" id="f-only" ${state.settings.onlyMine?'checked':''}> Only films on my services</label>
    <div class="section-title">Genre</div><div class="chips wrap">${multi('genres',GENRES)}</div>
    <div class="section-title">Mood</div><div class="chips wrap">${multi('moods',MOODS)}</div>
    <div class="section-title">Length</div><div class="chips wrap">${LENGTHS.map(([v,l])=>`<button class="chip" data-act="fset" data-k="maxMins" data-v="${v}" aria-pressed="${f.maxMins===v}">${l}</button>`).join('')}</div>
    <div class="section-title">Certificate up to</div><div class="chips wrap"><button class="chip" data-act="fcert" data-v="" aria-pressed="${!f.maxCert}">Any</button>${CERTS.slice(0,4).map(c=>`<button class="chip" data-act="fcert" data-v="${c}" aria-pressed="${f.maxCert===c}">${c}</button>`).join('')}</div>
    <div class="section-title">Decade</div><div class="chips wrap">${DECADES.map(([v,l])=>`<button class="chip" data-act="fmulti" data-k="decades" data-v="${v}" aria-pressed="${f.decades.includes(v)}">${l}</button>`).join('')}</div>
    <div class="row sticky-actions"><button class="btn" data-act="clearfilters">Clear all</button><button class="btn primary" data-act="close">Show ${plural(n,'film')}</button></div>`;};
  const mount=b=>{const c=$('#f-only',b); if(c) c.onchange=()=>{state.settings.onlyMine=c.checked; save(); renderAll();};};
  openSheet(draw(),{ctx:{redraw:()=>sheetRedraw(draw,mount)},onMount:mount});}
function settingsSheet(){
  openSheet(`<h2>Settings</h2>
    <div class="panel"><b>Your services</b><div class="svcs">${myServices().length?myServices().map(k=>`<span class="svc mine" style="--sc:${svcInfo(k).c}"><i></i>${esc(svcInfo(k).n)}</span>`).join(''):'<span class="muted">None chosen yet</span>'}</div><button class="btn" data-act="services">Change services</button></div>
    <div class="panel"><b>Live where-to-watch (TMDB)</b><p class="note">${tmdbKey()?'Your key is saved. Check films, find more, or turn on posters.':'Optional. Add a free TMDB key to check what\u2019s on each service today.'}</p><button class="btn" data-act="tmdb">${tmdbKey()?'Open live updates':'Set up live updates'}</button></div>
    <div class="panel"><b>Swipe together</b><p class="note">Both swipe the same ${TOG_N} films today, then swap codes to see your matches. Tick the same services on both phones.</p><button class="btn" data-act="together">Start Swipe together</button></div>
    <div class="panel"><b>Backup and moving phones</b><p class="note">Copy a backup code to keep your watchlist, ratings and films, or move them to another phone.</p><button class="btn" data-act="backup">Backup or restore</button></div>
    <div class="panel"><b>About the film list</b><p class="note">${BUILT.length} built-in films, put together on ${DATA_DATE} from general knowledge, not a live check. Services marked as the film's home (for example Netflix originals) rarely move; licensed films do. Certificates and running times are for guidance; check the BBFC website if it matters.</p></div>
    <button class="btn ghost block" data-act="wipe">Delete all my data</button>`);}
function b64e(s){const b=new TextEncoder().encode(s); let bin=''; b.forEach(x=>bin+=String.fromCharCode(x)); return btoa(bin);}
function b64d(s){const bin=atob(s); return new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0)));}
function backupCode(){const copy=JSON.parse(JSON.stringify(state)); delete copy.tog; copy.tm={prov:null,provT:0,page:0,q:'',status:''}; return 'FSB1.'+b64e(JSON.stringify(copy));}
function backupSheet(){
  openSheet(`<h2>Backup or restore</h2>
    <div class="panel"><b>Make a backup</b><p class="note">Includes your services, watchlist, watched films and ratings, films you added and service changes. Not your TMDB key.</p>
      <button class="btn" data-act="bkcopy">Copy backup code</button><textarea id="bk-out" class="inp code" hidden readonly aria-label="Backup code"></textarea></div>
    <div class="panel"><b>Restore</b><p class="note">Paste a backup code. This replaces everything in the app on this phone.</p>
      <textarea id="bk-in" class="inp code" placeholder="FSB1...." aria-label="Backup code to restore"></textarea><div id="bk-err" class="err" role="alert"></div>
      <button class="btn primary" id="bk-go">Restore backup</button></div>`,
  {onMount:b=>{$('#bk-go',b).onclick=()=>{const t=$('#bk-in',b).value.trim().replace(/\s+/g,''); const m=t.match(/^FSB1\.(.+)$/);
    if(!m){$('#bk-err',b).textContent='That isn\u2019t a Film Swipe backup code. It starts FSB1.'; return;}
    let s; try{s=JSON.parse(b64d(m[1]));}catch(e){$('#bk-err',b).textContent='That code is damaged. Copy it again.'; return;}
    if(!s||s.v!==1){$('#bk-err',b).textContent='That code isn\u2019t from this app.'; return;}
    confirmSheet('Replace everything with this backup?','Your current watchlist, ratings and settings on this phone will be replaced.','Restore',()=>{const d=defaults(); state=Object.assign(d,s); state.settings=Object.assign(d.settings,s.settings||{}); state.filters=Object.assign(emptyFilters(),s.filters||{}); state.tm=Object.assign(defaults().tm,s.tm||{}); reindex(); save(); renderAll(); setTab('swipe'); toast('Backup restored');});};}});}
function copyText(text,fallbackId){
  const fb=()=>{const t=fallbackId&&document.getElementById(fallbackId); if(t){t.hidden=false;t.value=text;t.focus();t.select();} toast('Select the text and copy it');};
  try{if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(()=>toast('Copied'),fb); else fb();}catch(e){fb();}}
function confirmSheet(title,text,okLabel,onOk,danger){
  openSheet(`<h2>${esc(title)}</h2><p class="muted">${esc(text)}</p><div class="row"><button class="btn" data-act="close">Cancel</button><button class="btn ${danger?'danger':'primary'}" id="confirm-ok">${esc(okLabel)}</button></div>`,
    {onMount:b=>{$('#confirm-ok',b).onclick=()=>{closeSheet();onOk();};}});}

/* ------------------------------------------------------------------
   14. SHEET, TOAST, NAV, EVENTS
   ------------------------------------------------------------------ */
let sheetGen=0, sheetCtx=null, lastFocus=null;
function sheetRedraw(draw,after){const p=$('#sheet-panel'),st=p.scrollTop; $('#sheet-body').innerHTML=draw(); p.scrollTop=st; if(after) after($('#sheet-body'));}
function openSheet(html,opts={}){
  sheetGen++; const s=$('#sheet'); sheetCtx=opts.ctx||null; $('#sheet-body').innerHTML=html;
  if(s.hidden){lastFocus=document.activeElement; s.hidden=false; void s.offsetWidth;}
  s.classList.add('open'); $('#sheet-panel').scrollTop=0; if(opts.onMount) opts.onMount($('#sheet-body'));
  setTimeout(()=>{try{$('#sheet-panel').focus({preventScroll:true});}catch(e){}},30);}
function closeSheet(){
  const g=++sheetGen, s=$('#sheet'); s.classList.remove('open'); sheetCtx=null;
  setTimeout(()=>{if(g!==sheetGen) return; s.hidden=true; $('#sheet-body').innerHTML=''; if(lastFocus&&lastFocus.focus&&document.contains(lastFocus)) try{lastFocus.focus({preventScroll:true});}catch(e){}},reduced()?0:220);}
let toastT;
function toast(msg){const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2000);}
function setTab(t){state.tab=t; save(); $$('.view').forEach(v=>v.hidden=v.id!=='view-'+t);
  $$('.tab').forEach(b=>{if(b.dataset.tab===t) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');});
  renderView(t); $('#main').scrollTop=0;}
function renderView(t){({swipe:renderSwipe,watch:renderWatch,seen:renderSeen,browse:renderBrowse})[t]();}
function renderNav(){const n=state.watch.filter(w=>getFilm(w.id)).length, b=$('#badge-watch'); b.hidden=!n; b.textContent=n;
  const tn=state.tonight&&getFilm(state.tonight.id), m=myServices();
  $('#sub-label').textContent=tn?'Tonight: '+tn.t:m.length?`${allFilms().filter(onMine).length} films on ${m.length===1?svcInfo(m[0]).n:m.length+' services'}`:'Choose your services to start';}
function renderAll(){renderNav(); renderView(state.tab); if(sheetCtx&&sheetCtx.redraw) sheetCtx.redraw();}

document.addEventListener('click',e=>{
  const tabBtn=e.target.closest('[data-tab]'), el=e.target.closest('[data-act]');
  if(el){const a=el.dataset.act, id=el.dataset.id, f=state.filters;
    switch(a){
      case 'close': closeSheet(); break;
      case 'settings': settingsSheet(); break;
      case 'services': servicesSheet(false); break;
      case 'svc': {const s=state.settings, v=el.dataset.v; s.services=s.services.includes(v)?s.services.filter(x=>x!==v):s.services.concat(v); f.svc=f.svc.filter(x=>s.services.includes(x)); save(); renderAll(); break;}
      case 'svcadd': {const inp=$('#svc-new'); const n=(inp&&inp.value||'').trim().replace(/\s+/g,' '); if(!n) break;
        if(allServices().some(s=>s.n.toLowerCase()===n.toLowerCase())){toast('You already have that one'); break;}
        state.settings.custom.push(n); state.settings.services.push('x:'+n); state.tm.prov=null; save(); renderAll(); toast('Added '+n); break;}
      case 'svcclean': state.settings.custom=state.settings.custom.filter(n=>state.settings.services.includes('x:'+n)); save(); renderAll(); break;
      case 'svcdone': state.setup=true; save(); closeSheet(); renderAll(); break;
      case 'onlymine': state.settings.onlyMine=false; save(); renderAll(); toast('Showing films on every service'); break;
      case 'filters': filterSheet(); break;
      case 'fmulti': {const k=el.dataset.k, v=el.dataset.v; f[k]=f[k].includes(v)?f[k].filter(x=>x!==v):f[k].concat(v); save(); renderAll(); break;}
      case 'fmood': {const v=el.dataset.v; f.moods=f.moods.includes(v)?f.moods.filter(x=>x!==v):f.moods.concat(v); save(); renderAll(); break;}
      case 'fsvc': {const v=el.dataset.v; f.svc=f.svc.includes(v)?f.svc.filter(x=>x!==v):f.svc.concat(v); save(); renderAll(); break;}
      case 'fset': f[el.dataset.k]=parseFloat(el.dataset.v)||0; save(); renderAll(); break;
      case 'fcert': f.maxCert=el.dataset.v; save(); renderAll(); break;
      case 'clearfilters': state.filters=emptyFilters(); save(); renderAll(); break;
      case 'reshow': for(const k in state.decided) if(state.decided[k]==='L') delete state.decided[k]; state.history=state.history.filter(x=>state.decided[x]); state.seed=Math.floor(Math.random()*1e9); save(); renderSwipe(); break;
      case 'skip': decide('L'); break;
      case 'pick': decide('R'); break;
      case 'seen': decide('S'); break;
      case 'undo': undo(); break;
      case 'info': {const c=$('#deck .card.top'); if(c) openFilm(c.dataset.id,'deck'); break;}
      case 'open': openFilm(id,state.tab); break;
      case 'dpick': case 'dskip': case 'dseen': {const ctx=sheetCtx; closeSheet(); const top=$('#deck .card.top'); const dir=a==='dpick'?'R':a==='dskip'?'L':'S';
        if(togOn()&&dir==='S') break;
        if(top&&ctx&&top.dataset.id===ctx.id) setTimeout(()=>decide(dir),reduced()?0:200); else if(ctx) applyDecision(ctx.id,dir); break;}
      case 'addwatch': if(!inWatch(id)){state.watch.unshift({id,t:Date.now()}); state.decided[id]='R'; save(); renderAll(); toast('Added to watchlist');} break;
      case 'unwatch': state.watch=state.watch.filter(w=>w.id!==id); if(state.decided[id]==='R') delete state.decided[id]; if(state.tonight&&state.tonight.id===id) state.tonight=null; save(); renderAll(); toast('Removed from watchlist'); break;
      case 'wsort': watchSort=el.dataset.v; renderWatch(); break;
      case 'settonight': setTonight(id); break;
      case 'spin': spinSheet(); break;
      case 'spinopt': {const k=el.dataset.k; spinOpt[k]=k==='max'?(+el.dataset.v||0):el.dataset.v; spinPick=null; sheetCtx&&sheetCtx.redraw(); break;}
      case 'spingo': spinGo(); break;
      case 'watchedtn': if(state.tonight) markWatched(state.tonight.id); break;
      case 'markwatched': markWatched(id); break;
      case 'rate': {const w=state.watched[id]; if(w){const v=+el.dataset.v; w.r=w.r===v?0:v; save(); renderAll();} break;}
      case 'watchagain': if(!inWatch(id)){state.watch.unshift({id,t:Date.now()}); save(); renderAll(); toast('Back on your watchlist');} break;
      case 'unseen': delete state.watched[id]; if(state.decided[id]==='S') delete state.decided[id]; save(); renderAll(); break;
      case 'bmode': browseMode=el.dataset.v; renderBrowse(); break;
      case 'addfilm': filmForm(); break;
      case 'editfilm': filmForm(id); break;
      case 'delfilm': confirmSheet('Delete this film?','It\u2019s removed from your films, watchlist and ratings.','Delete film',()=>{state.own=state.own.filter(x=>x.id!==id); state.watch=state.watch.filter(w=>w.id!==id); delete state.watched[id]; delete state.decided[id]; reindex(); save(); renderAll(); toast('Film deleted');},true); break;
      case 'editsvc': svcEditSheet(id); break;
      case 'refreshone': {const film=getFilm(id); if(!film) break; el.disabled=true; el.textContent='Checking…';
        ensureProviders().then(()=>refreshFilm(film)).then(ok=>{save(); renderAll(); toast(ok?'Updated from TMDB':'TMDB couldn\u2019t find this film');}).catch(err=>{toast(tmErr(err)); renderAll();}); break;}
      case 'tmdb': tmdbSheet(); break;
      case 'refreshwatch': refreshMany(state.watch.map(w=>getFilm(w.id)).filter(Boolean),'Watchlist'); break;
      case 'refreshall': refreshMany(allFilms(),'All films'); break;
      case 'findmore': if(!tmdbKey()){tmdbSheet(); break;} if($('#tm-prog')) findMore(); else {tmdbSheet(); setTimeout(findMore,50);} break;
      case 'backup': backupSheet(); break;
      case 'bkcopy': copyText(backupCode(),'bk-out'); break;
      /* swipe together */
      case 'together': startTogether(); break;
      case 'togexit': if(state.tog) state.tog.active=false; save(); renderSwipe(); break;
      case 'togredo': confirmSheet(`Swipe today's ${TOG_N} again?`,'Your swipes and code for today are cleared so you can start over.','Start again',()=>{const T=state.tog; T.dec={}; T.hist=[]; T.matches=null; save(); renderSwipe();}); break;
      case 'togcopy': if(togOn()&&!togLeft().length) copyText(`My Film Swipe code for today: ${togCode()}`,'tog-mycode'); break;
      case 'togshare': if(togOn()&&!togLeft().length) navigator.share({title:'Film Swipe',text:`My Film Swipe code for today: ${togCode()}`}).catch(()=>{}); break;
      case 'togfind': {if(!togOn()||togLeft().length) break; const res=readTogCode(($('#tog-code')||{}).value), errEl=$('#tog-err');
        if(res.err){if(errEl) errEl.textContent=res.err; break;}
        const mine=new Set(togLikes()); state.tog.matches=res.likes.filter(x=>mine.has(x)); state.tog.theirs=res.likes.length; save(); renderSwipe(); break;}
      case 'togadd': if(state.tog&&state.tog.matches){state.tog.matches.forEach(fid=>{const w=state.watch.find(x=>x.id===fid); if(w) w.both=true; else state.watch.unshift({id:fid,t:Date.now(),both:true}); state.decided[fid]='R';}); state.tog.active=false; save(); setTab('watch'); renderNav(); toast('Matches added to your watchlist');} break;
      case 'togpick': if(state.tog&&state.tog.matches&&state.tog.matches.length){const ms=state.tog.matches; ms.forEach(fid=>{const w=state.watch.find(x=>x.id===fid); if(w) w.both=true; else state.watch.unshift({id:fid,t:Date.now(),both:true}); state.decided[fid]='R';});
        const pick=ms[Math.floor(Math.random()*ms.length)]; state.tog.active=false; save(); setTab('watch'); setTonight(pick);} break;
      case 'wipe': confirmSheet('Delete all your data?','Your watchlist, ratings, films you added and settings are removed from this phone. This cannot be undone. Copy a backup code first if you want to keep them.','Delete everything',()=>{try{localStorage.removeItem(KEY); localStorage.removeItem(TKEY);}catch(e){} state=defaults(); reindex(); setTab('swipe'); renderNav(); servicesSheet(true);},true); break;
    }
    if(el.dataset.close&&a!=='close') closeSheet();
  }
  if(tabBtn&&!tabBtn.closest('.sheet')) setTab(tabBtn.dataset.tab);
  else if(tabBtn){closeSheet(); setTab(tabBtn.dataset.tab);}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('#sheet').hidden){closeSheet();return;}
  if(e.key==='Enter'&&e.target&&e.target.id==='svc-new'){e.preventDefault(); const b=document.querySelector('[data-act="svcadd"]'); if(b) b.click(); return;}
  if($('#sheet').hidden&&state.tab==='swipe'&&!/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'')){
    if(e.key==='ArrowRight'){e.preventDefault();decide('R');} else if(e.key==='ArrowLeft'){e.preventDefault();decide('L');} else if(e.key==='ArrowDown'&&!togOn()){e.preventDefault();decide('S');}
  }
});

/* Boot */
if(!['swipe','watch','seen','browse'].includes(state.tab)) state.tab='swipe';
['watch','own','found','history','front'].forEach(k=>{if(!Array.isArray(state[k])) state[k]=[];});
['decided','watched','svcOverride','live','tmIds'].forEach(k=>{if(!state[k]||typeof state[k]!=='object'||Array.isArray(state[k])) state[k]={};});
renderNav(); setTab(state.tab);
if(!state.setup) servicesSheet(true);
})();

