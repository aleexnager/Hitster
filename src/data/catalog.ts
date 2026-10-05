import type { Song } from '../game/types';

/**
 * Catálogo curado. Formato por línea: Título;Artista;Año;géneros;países
 * - Año: primera publicación de la versión que suena (álbum o single, lo que salga antes).
 * - géneros y países separados por comas (claves de taxonomy.ts).
 * El audio no se distribuye: se buscan vistas previas de 30 s en tiempo de ejecución.
 */
const RAW = `
Rock Around the Clock;Bill Haley & His Comets;1954;rock;US
Mr. Sandman;The Chordettes;1954;pop;US
Earth Angel;The Penguins;1954;rnb;US
Tutti Frutti;Little Richard;1955;rock;US
Only You (And You Alone);The Platters;1955;rnb,pop;US
Heartbreak Hotel;Elvis Presley;1956;rock;US
Hound Dog;Elvis Presley;1956;rock;US
Blue Suede Shoes;Carl Perkins;1956;rock,country;US
Be-Bop-A-Lula;Gene Vincent;1956;rock;US
Jailhouse Rock;Elvis Presley;1957;rock;US
Great Balls of Fire;Jerry Lee Lewis;1957;rock;US
Peggy Sue;Buddy Holly;1957;rock;US
Diana;Paul Anka;1957;pop;CA
Johnny B. Goode;Chuck Berry;1958;rock;US
La Bamba;Ritchie Valens;1958;rock,latino;US
Summertime Blues;Eddie Cochran;1958;rock;US
Tequila;The Champs;1958;rock,latino;US
Lollipop;The Chordettes;1958;pop;US
Fever;Peggy Lee;1958;jazz;US
Nel blu dipinto di blu (Volare);Domenico Modugno;1958;pop;IT
Mack the Knife;Bobby Darin;1959;jazz,pop;US
Take Five;The Dave Brubeck Quartet;1959;jazz;US
What'd I Say;Ray Charles;1959;rnb;US
Put Your Head on My Shoulder;Paul Anka;1959;pop;CA
Ne me quitte pas;Jacques Brel;1959;pop;BE
Non, je ne regrette rien;Édith Piaf;1960;pop;FR
Georgia on My Mind;Ray Charles;1960;rnb,jazz;US
At Last;Etta James;1960;rnb,jazz;US
Stand by Me;Ben E. King;1961;rnb;US
Hit the Road Jack;Ray Charles;1961;rnb;US
Can't Help Falling in Love;Elvis Presley;1961;pop;US
Tous les garçons et les filles;Françoise Hardy;1962;pop;FR
Quando, quando, quando;Tony Renis;1962;pop;IT
Be My Baby;The Ronettes;1963;pop;US
I Want to Hold Your Hand;The Beatles;1963;pop,rock;GB
She Loves You;The Beatles;1963;pop,rock;GB
Twist and Shout;The Beatles;1963;rock;GB
Surfin' U.S.A.;The Beach Boys;1963;rock,pop;US
Ring of Fire;Johnny Cash;1963;country;US
Blowin' in the Wind;Bob Dylan;1963;country;US
Sapore di sale;Gino Paoli;1963;pop;IT
The House of the Rising Sun;The Animals;1964;rock;GB
You Really Got Me;The Kinks;1964;rock;GB
Oh, Pretty Woman;Roy Orbison;1964;rock;US
My Girl;The Temptations;1964;rnb;US
Dancing in the Street;Martha and the Vandellas;1964;rnb;US
Fly Me to the Moon;Frank Sinatra;1964;jazz,pop;US
The Girl from Ipanema;Stan Getz & João Gilberto;1964;jazz,latino;BR
(I Can't Get No) Satisfaction;The Rolling Stones;1965;rock;GB
My Generation;The Who;1965;rock;GB
Help!;The Beatles;1965;rock,pop;GB
Yesterday;The Beatles;1965;pop;GB
Like a Rolling Stone;Bob Dylan;1965;rock;US
Mr. Tambourine Man;The Byrds;1965;rock;US
California Dreamin';The Mamas & the Papas;1965;pop;US
I Got You (I Feel Good);James Brown;1965;rnb;US
Stop! In the Name of Love;The Supremes;1965;rnb,pop;US
Feeling Good;Nina Simone;1965;jazz;US
La Bohème;Charles Aznavour;1965;pop;FR
La chica ye-yé;Concha Velasco;1965;pop;ES
Paint It Black;The Rolling Stones;1966;rock;GB
Good Vibrations;The Beach Boys;1966;pop;US
Strangers in the Night;Frank Sinatra;1966;jazz,pop;US
Bang Bang (My Baby Shot Me Down);Cher;1966;pop;US
Wild Thing;The Troggs;1966;rock;GB
I'm a Believer;The Monkees;1966;pop;US
Sunny;Bobby Hebb;1966;rnb;US
Mas que nada;Sergio Mendes & Brasil '66;1966;latino,jazz;BR
Black Is Black;Los Bravos;1966;rock,pop;ES
Yo soy aquel;Raphael;1966;pop;ES
Gracias a la vida;Violeta Parra;1966;country,latino;CL
Respect;Aretha Franklin;1967;rnb;US
Light My Fire;The Doors;1967;rock;US
Purple Haze;The Jimi Hendrix Experience;1967;rock;US
White Rabbit;Jefferson Airplane;1967;rock;US
Somebody to Love;Jefferson Airplane;1967;rock;US
A Whiter Shade of Pale;Procol Harum;1967;rock;GB
Brown Eyed Girl;Van Morrison;1967;rock;GB
Happy Together;The Turtles;1967;pop;US
Ain't No Mountain High Enough;Marvin Gaye & Tammi Terrell;1967;rnb;US
What a Wonderful World;Louis Armstrong;1967;jazz;US
Daydream Believer;The Monkees;1967;pop;US
Mi gran noche;Raphael;1967;pop;ES
Hey Jude;The Beatles;1968;rock,pop;GB
Sympathy for the Devil;The Rolling Stones;1968;rock;GB
Mrs. Robinson;Simon & Garfunkel;1968;pop,country;US
(Sittin' On) The Dock of the Bay;Otis Redding;1968;rnb;US
I Heard It Through the Grapevine;Marvin Gaye;1968;rnb;US
Born to Be Wild;Steppenwolf;1968;rock,metal;US
Son of a Preacher Man;Dusty Springfield;1968;pop,rnb;GB
Build Me Up Buttercup;The Foundations;1968;pop,rnb;GB
All Along the Watchtower;The Jimi Hendrix Experience;1968;rock;US
Israelites;Desmond Dekker & The Aces;1968;reggae;JM
Comment te dire adieu;Françoise Hardy;1968;pop;FR
La, la, la;Massiel;1968;pop;ES
Come Together;The Beatles;1969;rock;GB
Here Comes the Sun;The Beatles;1969;pop,rock;GB
Space Oddity;David Bowie;1969;rock,pop;GB
Whole Lotta Love;Led Zeppelin;1969;rock,metal;GB
Suspicious Minds;Elvis Presley;1969;rock,pop;US
Proud Mary;Creedence Clearwater Revival;1969;rock;US
Bad Moon Rising;Creedence Clearwater Revival;1969;rock;US
Fortunate Son;Creedence Clearwater Revival;1969;rock;US
Sugar, Sugar;The Archies;1969;pop;US
The Thrill Is Gone;B.B. King;1969;jazz;US
Venus;Shocking Blue;1969;rock;NL
Je t'aime... moi non plus;Serge Gainsbourg & Jane Birkin;1969;pop;FR
Les Champs-Élysées;Joe Dassin;1969;pop;FR
La vida sigue igual;Julio Iglesias;1969;pop;ES
Vivo cantando;Salomé;1969;pop;ES
Let It Be;The Beatles;1970;rock,pop;GB
Bridge over Troubled Water;Simon & Garfunkel;1970;pop;US
Paranoid;Black Sabbath;1970;metal;GB
Layla;Derek and the Dominos;1970;rock;GB
Lola;The Kinks;1970;rock;GB
Your Song;Elton John;1970;pop;GB
Oye como va;Santana;1970;rock,latino;US
Black Magic Woman;Santana;1970;rock,latino;US
Get Up (I Feel Like Being a) Sex Machine;James Brown;1970;rnb;US
Gwendolyne;Julio Iglesias;1970;pop;ES
Un rayo de sol;Los Diablos;1970;pop;ES
Imagine;John Lennon;1971;pop,rock;GB
Stairway to Heaven;Led Zeppelin;1971;rock,metal;GB
Brown Sugar;The Rolling Stones;1971;rock;GB
Life on Mars?;David Bowie;1971;rock,pop;GB
American Pie;Don McLean;1971;rock,country;US
Ain't No Sunshine;Bill Withers;1971;rnb;US
What's Going On;Marvin Gaye;1971;rnb;US
Let's Stay Together;Al Green;1971;rnb;US
Take Me Home, Country Roads;John Denver;1971;country;US
Mediterráneo;Joan Manuel Serrat;1971;pop;ES
Soy rebelde;Jeanette;1971;pop;ES
Smoke on the Water;Deep Purple;1972;rock,metal;GB
Rocket Man;Elton John;1972;pop,rock;GB
Starman;David Bowie;1972;rock,pop;GB
Superstition;Stevie Wonder;1972;rnb;US
Lean on Me;Bill Withers;1972;rnb;US
Libre;Nino Bravo;1972;pop;ES
Un beso y una flor;Nino Bravo;1972;pop;ES
Money;Pink Floyd;1973;rock;GB
Angie;The Rolling Stones;1973;rock;GB
Piano Man;Billy Joel;1973;pop,rock;US
Dream On;Aerosmith;1973;rock,metal;US
Let's Get It On;Marvin Gaye;1973;rnb;US
Jolene;Dolly Parton;1973;country;US
Get Up, Stand Up;Bob Marley & The Wailers;1973;reggae;JM
Eres tú;Mocedades;1973;pop;ES
Entre dos aguas;Paco de Lucía;1973;flamenco;ES
Y viva España;Manolo Escobar;1973;pop,flamenco;ES
Eva María;Fórmula V;1973;pop;ES
Waterloo;ABBA;1974;pop;SE
Sweet Home Alabama;Lynyrd Skynyrd;1974;rock,country;US
Rebel Rebel;David Bowie;1974;rock;GB
Kung Fu Fighting;Carl Douglas;1974;disco;GB
Lady Marmalade;Labelle;1974;rnb,disco;US
No Woman, No Cry;Bob Marley & The Wailers;1974;reggae;JM
I Shot the Sheriff;Eric Clapton;1974;rock,reggae;GB
Quimbara;Celia Cruz & Johnny Pacheco;1974;latino;CU
Porque te vas;Jeanette;1974;pop;ES
Rumore;Raffaella Carrà;1974;pop,disco;IT
Bohemian Rhapsody;Queen;1975;rock;GB
Wish You Were Here;Pink Floyd;1975;rock;GB
Born to Run;Bruce Springsteen;1975;rock;US
Rock and Roll All Nite;KISS;1975;rock,metal;US
Walk This Way;Aerosmith;1975;rock;US
Mamma Mia;ABBA;1975;pop;SE
Et si tu n'existais pas;Joe Dassin;1975;pop;FR
Un ramito de violetas;Cecilia;1975;pop;ES
Dancing Queen;ABBA;1976;pop,disco;SE
Hotel California;Eagles;1976;rock;US
Go Your Own Way;Fleetwood Mac;1976;rock;US
More Than a Feeling;Boston;1976;rock;US
Isn't She Lovely;Stevie Wonder;1976;rnb;US
Car Wash;Rose Royce;1976;disco,rnb;US
Don't Leave Me This Way;Thelma Houston;1976;disco;US
Blitzkrieg Bop;Ramones;1976;punk;US
Anarchy in the U.K.;Sex Pistols;1976;punk;GB
Daddy Cool;Boney M.;1976;disco;DE
We Will Rock You;Queen;1977;rock;GB
We Are the Champions;Queen;1977;rock;GB
Heroes;David Bowie;1977;rock;GB
God Save the Queen;Sex Pistols;1977;punk;GB
Dreams;Fleetwood Mac;1977;rock,pop;US
Stayin' Alive;Bee Gees;1977;disco;GB
How Deep Is Your Love;Bee Gees;1977;pop;GB
Night Fever;Bee Gees;1977;disco;GB
I Feel Love;Donna Summer;1977;disco,electronica;US
Sir Duke;Stevie Wonder;1976;rnb;US
Just the Way You Are;Billy Joel;1977;pop;US
Barracuda;Heart;1977;rock;US
Psycho Killer;Talking Heads;1977;indie,punk;US
Three Little Birds;Bob Marley & The Wailers;1977;reggae;JM
Fiesta;Raffaella Carrà;1977;pop,disco;IT
Ti amo;Umberto Tozzi;1977;pop;IT
Gavilán o paloma;Pablo Abraira;1977;pop;ES
Don't Stop Me Now;Queen;1978;rock,pop;GB
Wuthering Heights;Kate Bush;1978;pop;GB
Roxanne;The Police;1978;rock,reggae;GB
Sultans of Swing;Dire Straits;1978;rock;GB
Le Freak;Chic;1978;disco;US
I Will Survive;Gloria Gaynor;1978;disco;US
Y.M.C.A.;Village People;1978;disco;US
September;Earth, Wind & Fire;1978;disco,rnb;US
Miss You;The Rolling Stones;1978;rock,disco;GB
Hold the Line;Toto;1978;rock;US
Rivers of Babylon;Boney M.;1978;disco,reggae;DE
Rasputin;Boney M.;1978;disco;DE
Take a Chance on Me;ABBA;1977;pop;SE
You're the One That I Want;John Travolta & Olivia Newton-John;1978;pop;US
The Gambler;Kenny Rogers;1978;country;US
Heart of Glass;Blondie;1978;pop,disco;US
Is This Love;Bob Marley & The Wailers;1978;reggae;JM
El cantante;Héctor Lavoe;1978;latino;PR
Pedro Navaja;Rubén Blades & Willie Colón;1978;latino;PA
Ojalá;Silvio Rodríguez;1978;country,latino;CU
Vivir así es morir de amor;Camilo Sesto;1978;pop;ES
Soy un truhán, soy un señor;Julio Iglesias;1978;pop;ES
Another Brick in the Wall, Pt. 2;Pink Floyd;1979;rock;GB
Highway to Hell;AC/DC;1979;rock,metal;AU
London Calling;The Clash;1979;punk;GB
Message in a Bottle;The Police;1979;rock;GB
Walking on the Moon;The Police;1979;rock,reggae;GB
Boys Don't Cry;The Cure;1979;indie;GB
One Step Beyond;Madness;1979;reggae;GB
I Was Made for Lovin' You;KISS;1979;rock,disco;US
Don't Stop 'Til You Get Enough;Michael Jackson;1979;disco,pop;US
Rock with You;Michael Jackson;1979;pop,rnb;US
Hot Stuff;Donna Summer;1979;disco;US
Good Times;Chic;1979;disco;US
Boogie Wonderland;Earth, Wind & Fire;1979;disco;US
Ring My Bell;Anita Ward;1979;disco;US
Rapper's Delight;The Sugarhill Gang;1979;hiphop,disco;US
Gimme! Gimme! Gimme! (A Man After Midnight);ABBA;1979;pop,disco;SE
Chiquitita;ABBA;1979;pop;SE
Gloria;Umberto Tozzi;1979;pop;IT
Volando voy;Camarón;1979;flamenco;ES
Another One Bites the Dust;Queen;1980;rock,rnb;GB
Back in Black;AC/DC;1980;rock,metal;AU
You Shook Me All Night Long;AC/DC;1980;rock,metal;AU
Ace of Spades;Motörhead;1980;metal;GB
Crazy Train;Ozzy Osbourne;1980;metal;GB
Love Will Tear Us Apart;Joy Division;1980;indie,punk;GB
Once in a Lifetime;Talking Heads;1980;indie;US
Call Me;Blondie;1980;pop,rock;US
Fame;Irene Cara;1980;pop,disco;US
9 to 5;Dolly Parton;1980;country;US
Could You Be Loved;Bob Marley & The Wailers;1980;reggae;JM
Redemption Song;Bob Marley & The Wailers;1980;reggae;JM
Super Trouper;ABBA;1980;pop;SE
The Winner Takes It All;ABBA;1980;pop;SE
Hey!;Julio Iglesias;1980;pop;ES
La chica de ayer;Nacha Pop;1980;pop,indie;ES
Enamorado de la moda juvenil;Radio Futura;1980;pop,indie;ES
Under Pressure;Queen & David Bowie;1981;rock;GB
Tainted Love;Soft Cell;1981;pop,electronica;GB
Don't You Want Me;The Human League;1981;pop,electronica;GB
Just Can't Get Enough;Depeche Mode;1981;pop,electronica;GB
Girls on Film;Duran Duran;1981;pop;GB
Don't Stop Believin';Journey;1981;rock;US
Physical;Olivia Newton-John;1981;pop;AU
Déjame;Los Secretos;1981;pop,rock;ES
Como el agua;Camarón;1981;flamenco;ES
Africa;Toto;1982;rock,pop;US
Rosanna;Toto;1982;rock;US
Eye of the Tiger;Survivor;1982;rock;US
Billie Jean;Michael Jackson;1982;pop,rnb;US
Beat It;Michael Jackson;1982;pop,rock;US
Thriller;Michael Jackson;1982;pop,rnb;US
Run to the Hills;Iron Maiden;1982;metal;GB
Should I Stay or Should I Go;The Clash;1982;punk,rock;GB
Hungry Like the Wolf;Duran Duran;1982;pop;GB
Mad World;Tears for Fears;1982;pop,electronica;GB
Our House;Madness;1982;pop,reggae;GB
Pass the Dutchie;Musical Youth;1982;reggae;GB
The Message;Grandmaster Flash & The Furious Five;1982;hiphop;US
Felicità;Al Bano & Romina Power;1982;pop;IT
Hoy no me puedo levantar;Mecano;1982;pop;ES
Me colé en una fiesta;Mecano;1982;pop;ES
Bailando;Alaska y los Pegamoides;1982;pop,punk;ES
Every Breath You Take;The Police;1983;rock,pop;GB
Sweet Dreams (Are Made of This);Eurythmics;1983;pop,electronica;GB
Total Eclipse of the Heart;Bonnie Tyler;1983;pop,rock;GB
Karma Chameleon;Culture Club;1983;pop;GB
Relax;Frankie Goes to Hollywood;1983;pop,electronica;GB
Blue Monday;New Order;1983;electronica,indie;GB
This Charming Man;The Smiths;1983;indie;GB
Sunday Bloody Sunday;U2;1983;rock;IE
Gold;Spandau Ballet;1983;pop;GB
True;Spandau Ballet;1983;pop;GB
The Trooper;Iron Maiden;1983;metal;GB
Red Red Wine;UB40;1983;reggae;GB
Buffalo Soldier;Bob Marley & The Wailers;1983;reggae;JM
Girls Just Want to Have Fun;Cyndi Lauper;1983;pop;US
Time After Time;Cyndi Lauper;1983;pop;US
Holiday;Madonna;1983;pop,disco;US
Flashdance... What a Feeling;Irene Cara;1983;pop;US
All Night Long (All Night);Lionel Richie;1983;pop,rnb;US
Islands in the Stream;Kenny Rogers & Dolly Parton;1983;country,pop;US
99 Luftballons;Nena;1983;pop;DE
Major Tom (völlig losgelöst);Peter Schilling;1983;pop,electronica;DE
L'italiano;Toto Cutugno;1983;pop;IT
Vamos a la playa;Righeira;1983;pop,electronica;IT
Cadillac solitario;Loquillo y los Trogloditas;1983;rock;ES
Like a Virgin;Madonna;1984;pop;US
Material Girl;Madonna;1984;pop;US
Purple Rain;Prince;1984;rock,rnb;US
When Doves Cry;Prince;1984;pop,rnb;US
Born in the U.S.A.;Bruce Springsteen;1984;rock;US
Dancing in the Dark;Bruce Springsteen;1984;rock,pop;US
Footloose;Kenny Loggins;1984;pop,rock;US
Ghostbusters;Ray Parker Jr.;1984;pop,rnb;US
What's Love Got to Do with It;Tina Turner;1984;pop,rnb;US
Smooth Operator;Sade;1984;rnb,jazz;GB
Wake Me Up Before You Go-Go;Wham!;1984;pop;GB
Last Christmas;Wham!;1984;pop;GB
Careless Whisper;George Michael;1984;pop;GB
Radio Ga Ga;Queen;1984;pop,rock;GB
I Want to Break Free;Queen;1984;pop,rock;GB
Smalltown Boy;Bronski Beat;1984;pop,electronica;GB
Pride (In the Name of Love);U2;1984;rock;IE
Rock You Like a Hurricane;Scorpions;1984;metal;DE
Lobo hombre en París;La Unión;1984;pop,rock;ES
Escuela de calor;Radio Futura;1984;pop,rock;ES
Amante bandido;Miguel Bosé;1984;pop;ES
Ni tú ni nadie;Alaska y Dinarama;1984;pop;ES
Take On Me;a-ha;1985;pop;NO
Everybody Wants to Rule the World;Tears for Fears;1985;pop;GB
Don't You (Forget About Me);Simple Minds;1985;rock,pop;GB
Money for Nothing;Dire Straits;1985;rock;GB
Running Up That Hill;Kate Bush;1985;pop;GB
West End Girls;Pet Shop Boys;1985;pop,electronica;GB
The Power of Love;Huey Lewis and the News;1985;rock,pop;US
How Will I Know;Whitney Houston;1985;pop;US
Conga;Miami Sound Machine;1985;latino,pop;US
Rock Me Amadeus;Falco;1985;pop;AT
Devuélveme a mi chica;Hombres G;1985;pop,rock;ES
Venecia;Hombres G;1985;pop,rock;ES
Livin' on a Prayer;Bon Jovi;1986;rock;US
Master of Puppets;Metallica;1986;metal;US
Walk Like an Egyptian;The Bangles;1986;pop;US
Papa Don't Preach;Madonna;1986;pop;US
La Isla Bonita;Madonna;1986;pop,latino;US
Kiss;Prince;1986;rnb,pop;US
Walk This Way;Run-DMC & Aerosmith;1986;hiphop,rock;US
The Final Countdown;Europe;1986;rock,metal;SE
There Is a Light That Never Goes Out;The Smiths;1986;indie;GB
A Kind of Magic;Queen;1986;rock,pop;GB
Venus;Bananarama;1986;pop;GB
Voyage, voyage;Desireless;1986;pop,electronica;FR
Persiana americana;Soda Stereo;1986;rock;AR
Hijo de la luna;Mecano;1986;pop;ES
Cruz de navajas;Mecano;1986;pop;ES
A quién le importa;Alaska y Dinarama;1986;pop;ES
La puerta de Alcalá;Ana Belén & Víctor Manuel;1986;pop;ES
Cien gaviotas;Duncan Dhu;1986;pop,rock;ES
Sweet Child o' Mine;Guns N' Roses;1987;rock,metal;US
Welcome to the Jungle;Guns N' Roses;1987;rock,metal;US
With or Without You;U2;1987;rock;IE
I Still Haven't Found What I'm Looking For;U2;1987;rock;IE
Never Gonna Give You Up;Rick Astley;1987;pop;GB
Faith;George Michael;1987;pop;GB
Just Like Heaven;The Cure;1987;indie;GB
Pour Some Sugar on Me;Def Leppard;1987;rock,metal;GB
Here I Go Again;Whitesnake;1987;rock,metal;GB
I Wanna Dance with Somebody (Who Loves Me);Whitney Houston;1987;pop;US
Bad;Michael Jackson;1987;pop;US
Smooth Criminal;Michael Jackson;1987;pop;US
Man in the Mirror;Michael Jackson;1987;pop,rnb;US
Push It;Salt-N-Pepa;1987;hiphop;US
Rhythm Is Gonna Get You;Gloria Estefan & Miami Sound Machine;1987;latino,pop;US
Bamboléo;Gipsy Kings;1987;flamenco,latino;FR
Djobi, Djoba;Gipsy Kings;1987;flamenco;FR
Ella, elle l'a;France Gall;1987;pop;FR
Joe le taxi;Vanessa Paradis;1987;pop;FR
En algún lugar;Duncan Dhu;1987;pop,rock;ES
Don't Worry, Be Happy;Bobby McFerrin;1988;pop,jazz;US
Straight Outta Compton;N.W.A;1988;hiphop;US
Mujer contra mujer;Mecano;1988;pop;ES
Resistiré;Dúo Dinámico;1988;pop;ES
Insurrección;El Último de la Fila;1988;rock;ES
Like a Prayer;Madonna;1989;pop;US
Fight the Power;Public Enemy;1989;hiphop;US
The Best;Tina Turner;1989;pop,rock;US
Personal Jesus;Depeche Mode;1989;electronica,rock;GB
Lovesong;The Cure;1989;indie;GB
Pump Up the Jam;Technotronic;1989;electronica;BE
Ride on Time;Black Box;1989;electronica;IT
Lambada;Kaoma;1989;latino;FR
Ojalá que llueva café;Juan Luis Guerra 4.40;1989;latino;DO
Voy a pasármelo bien;Hombres G;1989;pop,rock;ES
Vogue;Madonna;1990;pop,electronica;US
U Can't Touch This;MC Hammer;1990;hiphop;US
Ice Ice Baby;Vanilla Ice;1990;hiphop;US
Gonna Make You Sweat (Everybody Dance Now);C+C Music Factory;1990;electronica;US
Friends in Low Places;Garth Brooks;1990;country;US
Thunderstruck;AC/DC;1990;rock,metal;AU
Enjoy the Silence;Depeche Mode;1990;electronica,pop;GB
Freedom! '90;George Michael;1990;pop;GB
Wind of Change;Scorpions;1990;rock;DE
The Power;Snap!;1990;electronica,hiphop;DE
Burbujas de amor;Juan Luis Guerra 4.40;1990;latino;DO
La bilirrubina;Juan Luis Guerra 4.40;1990;latino;DO
Rayando el sol;Maná;1990;rock,pop;MX
De música ligera;Soda Stereo;1990;rock;AR
Entre dos tierras;Héroes del Silencio;1990;rock;ES
Maldito duende;Héroes del Silencio;1990;rock;ES
Smells Like Teen Spirit;Nirvana;1991;rock,indie;US
Come as You Are;Nirvana;1991;rock,indie;US
Alive;Pearl Jam;1991;rock;US
Losing My Religion;R.E.M.;1991;rock,indie;US
Under the Bridge;Red Hot Chili Peppers;1991;rock;US
Enter Sandman;Metallica;1991;metal;US
Nothing Else Matters;Metallica;1991;metal;US
November Rain;Guns N' Roses;1991;rock;US
One;U2;1991;rock;IE
The Show Must Go On;Queen;1991;rock;GB
Get Ready for This;2 Unlimited;1991;electronica;NL
Un año de amor;Luz Casal;1991;pop;ES
Piensa en mí;Luz Casal;1991;pop;ES
Creep;Radiohead;1992;rock,indie;GB
Friday I'm in Love;The Cure;1992;indie,pop;GB
Fear of the Dark;Iron Maiden;1992;metal;GB
Killing in the Name;Rage Against the Machine;1992;metal,hiphop;US
Jump Around;House of Pain;1992;hiphop;US
Nuthin' but a "G" Thang;Dr. Dre;1992;hiphop;US
I Will Always Love You;Whitney Houston;1992;pop,rnb;US
Everybody Hurts;R.E.M.;1992;rock,indie;US
Achy Breaky Heart;Billy Ray Cyrus;1992;country;US
Dreams;The Cranberries;1992;rock,indie;IE
Rhythm Is a Dancer;Snap!;1992;electronica;DE
It's My Life;Dr. Alban;1992;electronica,reggae;SE
All That She Wants;Ace of Base;1992;pop,reggae;SE
Sweat (A La La La La Long);Inner Circle;1992;reggae;JM
Informer;Snow;1992;reggae,hiphop;CA
Como la flor;Selena;1992;latino;US
Oye mi amor;Maná;1992;rock,pop;MX
What Is Love;Haddaway;1993;electronica;DE
Mr. Vain;Culture Beat;1993;electronica;DE
No Limit;2 Unlimited;1993;electronica;NL
The Rhythm of the Night;Corona;1993;electronica;IT
The Sign;Ace of Base;1993;pop;SE
Linger;The Cranberries;1993;rock,indie;IE
Mi tierra;Gloria Estefan;1993;latino;US
Matador;Los Fabulosos Cadillacs;1993;rock,reggae,latino;AR
Macarena;Los del Río;1993;flamenco,latino;ES
Chiquilla;Seguridad Social;1993;pop,rock;ES
Zombie;The Cranberries;1994;rock;IE
Basket Case;Green Day;1994;punk;US
Self Esteem;The Offspring;1994;punk;US
Black Hole Sun;Soundgarden;1994;rock,metal;US
Juicy;The Notorious B.I.G.;1994;hiphop;US
Live Forever;Oasis;1994;rock,indie;GB
Girls & Boys;Blur;1994;indie,pop;GB
Parklife;Blur;1994;indie,pop;GB
Kiss from a Rose;Seal;1994;pop,rnb;GB
Here Comes the Hotstepper;Ini Kamoze;1994;reggae,hiphop;JM
Cotton Eye Joe;Rednex;1994;country,electronica;SE
Lamento boliviano;Enanitos Verdes;1994;rock;AR
Bidi Bidi Bom Bom;Selena;1994;latino;US
Wonderwall;Oasis;1995;rock,indie;GB
Don't Look Back in Anger;Oasis;1995;rock,indie;GB
Champagne Supernova;Oasis;1995;rock,indie;GB
Common People;Pulp;1995;indie,pop;GB
Insomnia;Faithless;1995;electronica;GB
Gangsta's Paradise;Coolio;1995;hiphop;US
California Love;2Pac;1995;hiphop;US
Waterfalls;TLC;1995;rnb;US
Ironic;Alanis Morissette;1995;rock,pop;CA
You Oughta Know;Alanis Morissette;1995;rock;CA
Boombastic;Shaggy;1995;reggae;JM
Children;Robert Miles;1995;electronica;IT
Lemon Tree;Fool's Garden;1995;pop;DE
Be My Lover;La Bouche;1995;electronica;DE
María;Ricky Martin;1995;latino,pop;PR
Estoy aquí;Shakira;1995;pop,rock;CO
La chispa adecuada (Bendecida 3);Héroes del Silencio;1995;rock;ES
Wannabe;Spice Girls;1996;pop;GB
Say You'll Be There;Spice Girls;1996;pop;GB
Firestarter;The Prodigy;1996;electronica;GB
Born Slippy .NUXX;Underworld;1996;electronica;GB
Killing Me Softly with His Song;Fugees;1996;hiphop,rnb;US
Freed from Desire;Gala;1996;electronica;IT
Coco Jamboo;Mr. President;1996;electronica,reggae;DE
La flaca;Jarabe de Palo;1996;pop,rock;ES
So payaso;Extremoduro;1996;rock;ES
Lo echamos a suertes;Ella Baila Sola;1996;pop;ES
Bitter Sweet Symphony;The Verve;1997;rock,indie;GB
Song 2;Blur;1997;rock,indie;GB
Karma Police;Radiohead;1997;rock,indie;GB
No Surprises;Radiohead;1997;rock,indie;GB
Tubthumping;Chumbawamba;1997;rock,pop;GB
Spice Up Your Life;Spice Girls;1997;pop,latino;GB
Good Riddance (Time of Your Life);Green Day;1997;punk,rock;US
Hypnotize;The Notorious B.I.G.;1997;hiphop;US
Everybody (Backstreet's Back);Backstreet Boys;1997;pop;US
My Heart Will Go On;Céline Dion;1997;pop;CA
Man! I Feel Like a Woman!;Shania Twain;1997;country,pop;CA
Torn;Natalie Imbruglia;1997;pop,rock;AU
Barbie Girl;Aqua;1997;pop,electronica;DK
Around the World;Daft Punk;1997;electronica;FR
Ecuador;Sash!;1997;electronica;DE
Clavado en un bar;Maná;1997;rock,pop;MX
En el muelle de San Blas;Maná;1997;rock,pop;MX
Corazón partío;Alejandro Sanz;1997;pop,flamenco;ES
Amiga mía;Alejandro Sanz;1997;pop;ES
...Baby One More Time;Britney Spears;1998;pop;US
Doo Wop (That Thing);Lauryn Hill;1998;hiphop,rnb;US
Pretty Fly (for a White Guy);The Offspring;1998;punk;US
Changes;2Pac;1998;hiphop;US
Music Sounds Better with You;Stardust;1998;electronica;FR
Blue (Da Ba Dee);Eiffel 65;1998;electronica;IT
Ojos así;Shakira;1998;pop,latino;CO
La copa de la vida;Ricky Martin;1998;latino,pop;PR
Vuelve;Ricky Martin;1998;latino,pop;PR
Suavemente;Elvis Crespo;1998;latino;PR
La vida es un carnaval;Celia Cruz;1998;latino;CU
Depende;Jarabe de Palo;1998;pop,rock;ES
Pájaros de barro;Manolo García;1998;pop,rock;ES
Cuéntame al oído;La Oreja de Van Gogh;1998;pop;ES
I Want It That Way;Backstreet Boys;1999;pop;US
Genie in a Bottle;Christina Aguilera;1999;pop,rnb;US
No Scrubs;TLC;1999;rnb;US
Say My Name;Destiny's Child;1999;rnb;US
All the Small Things;blink-182;1999;punk,rock;US
Californication;Red Hot Chili Peppers;1999;rock;US
Scar Tissue;Red Hot Chili Peppers;1999;rock;US
Otherside;Red Hot Chili Peppers;1999;rock;US
My Name Is;Eminem;1999;hiphop;US
Still D.R.E.;Dr. Dre;1999;hiphop;US
Smooth;Santana;1999;rock,latino;US
Maria Maria;Santana;1999;rock,latino,rnb;US
Corazón espinado;Santana & Maná;1999;rock,latino;US,MX
Livin' la Vida Loca;Ricky Martin;1999;latino,pop;PR
Bailamos;Enrique Iglesias;1999;latino,pop;ES
Mambo No. 5 (A Little Bit of...);Lou Bega;1999;latino,pop;DE
Sandstorm;Darude;1999;electronica;FI
Kernkraft 400;Zombie Nation;1999;electronica;DE
Tu calorro;Estopa;1999;flamenco,pop;ES
La raja de tu falda;Estopa;1999;flamenco,rock;ES
19 días y 500 noches;Joaquín Sabina;1999;pop,rock;ES
Oops!... I Did It Again;Britney Spears;2000;pop;US
Bye Bye Bye;*NSYNC;2000;pop;US
The Real Slim Shady;Eminem;2000;hiphop;US
Stan;Eminem;2000;hiphop;US
In the End;Linkin Park;2000;rock,metal;US
Last Resort;Papa Roach;2000;metal;US
It's My Life;Bon Jovi;2000;rock;US
It Wasn't Me;Shaggy;2000;reggae,pop;JM
Yellow;Coldplay;2000;rock,indie;GB
Beautiful Day;U2;2000;rock;IE
One More Time;Daft Punk;2000;electronica;FR
Fiesta pagana;Mägo de Oz;2000;metal;ES
Sobreviviré;Mónica Naranjo;2000;pop;ES
La playa;La Oreja de Van Gogh;2000;pop;ES
Get Ur Freak On;Missy Elliott;2001;hiphop;US
Survivor;Destiny's Child;2001;rnb;US
Chop Suey!;System of a Down;2001;metal;US
Clint Eastwood;Gorillaz;2001;hiphop,indie;GB
Can't Get You Out of My Head;Kylie Minogue;2001;pop,electronica;AU
Murder on the Dancefloor;Sophie Ellis-Bextor;2001;pop,disco;GB
Harder, Better, Faster, Stronger;Daft Punk;2001;electronica;FR
Whenever, Wherever;Shakira;2001;pop,latino;CO
Hero;Enrique Iglesias;2001;pop;ES
Lose Yourself;Eminem;2002;hiphop;US
Without Me;Eminem;2002;hiphop;US
Cry Me a River;Justin Timberlake;2002;pop,rnb;US
Can't Stop;Red Hot Chili Peppers;2002;rock;US
Complicated;Avril Lavigne;2002;pop,rock;CA
Sk8er Boi;Avril Lavigne;2002;pop,punk;CA
Don't Know Why;Norah Jones;2002;jazz,pop;US
This Love;Maroon 5;2002;pop,rock;US
Clocks;Coldplay;2002;rock;GB
The Scientist;Coldplay;2002;rock;GB
Obsesión;Aventura;2002;latino;US
A Dios le pido;Juanes;2002;pop,rock,latino;CO
Torero;Chayanne;2002;latino,pop;PR
Mariposa traicionera;Maná;2002;rock,pop;MX
Aserejé;Las Ketchup;2002;pop,flamenco;ES
Sin ti no soy nada;Amaral;2002;pop,rock;ES
Ave María;David Bisbal;2002;pop,latino;ES
Crazy in Love;Beyoncé;2003;rnb,pop;US
Hey Ya!;OutKast;2003;hiphop,pop;US
In da Club;50 Cent;2003;hiphop;US
Where Is the Love?;The Black Eyed Peas;2003;hiphop,pop;US
Toxic;Britney Spears;2003;pop;US
Seven Nation Army;The White Stripes;2003;rock,indie;US
Mr. Brightside;The Killers;2003;rock,indie;US
Numb;Linkin Park;2003;rock,metal;US
Bring Me to Life;Evanescence;2003;metal;US
Dragostea din tei;O-Zone;2003;pop,electronica;MD
Eres;Café Tacvba;2003;rock,pop;MX
Rosas;La Oreja de Van Gogh;2003;pop;ES
Yeah!;Usher;2004;rnb,hiphop;US
Since U Been Gone;Kelly Clarkson;2004;pop,rock;US
American Idiot;Green Day;2004;punk,rock;US
Boulevard of Broken Dreams;Green Day;2004;rock;US
Somebody Told Me;The Killers;2004;rock,indie;US
Take Me Out;Franz Ferdinand;2004;indie;GB
You're Beautiful;James Blunt;2004;pop;GB
Gasolina;Daddy Yankee;2004;urbano;PR
Bulería;David Bisbal;2004;pop,flamenco;ES
Malo;Bebe;2004;pop;ES
Gold Digger;Kanye West;2005;hiphop;US
Hollaback Girl;Gwen Stefani;2004;pop,hiphop;US
Lose Control;Missy Elliott;2005;hiphop;US
Pump It;The Black Eyed Peas;2005;hiphop;US
Feel Good Inc.;Gorillaz;2005;hiphop,indie;GB
I Bet You Look Good on the Dancefloor;Arctic Monkeys;2005;indie,rock;GB
Dakota;Stereophonics;2005;rock;GB
Fix You;Coldplay;2005;rock;GB
Hung Up;Madonna;2005;pop,disco;US
Feeling Good;Michael Bublé;2005;jazz,pop;CA
Welcome to Jamrock;Damian Marley;2005;reggae,hiphop;JM
La camisa negra;Juanes;2004;pop,rock,latino;CO
La tortura;Shakira & Alejandro Sanz;2005;pop,latino;CO,ES
El universo sobre mí;Amaral;2005;pop,rock;ES
Zapatillas;El Canto del Loco;2005;pop,rock;ES
SexyBack;Justin Timberlake;2006;pop,electronica;US
Crazy;Gnarls Barkley;2006;rnb,indie;US
Dani California;Red Hot Chili Peppers;2006;rock;US
Rehab;Amy Winehouse;2006;rnb,jazz;GB
Back to Black;Amy Winehouse;2006;rnb,jazz;GB
Chasing Cars;Snow Patrol;2006;rock,indie;GB
Hips Don't Lie;Shakira;2006;pop,latino;CO
Labios compartidos;Maná;2006;rock,pop;MX
Umbrella;Rihanna;2007;pop,rnb;US
Stronger;Kanye West;2007;hiphop,electronica;US
Low;Flo Rida;2007;hiphop;US
Girlfriend;Avril Lavigne;2007;pop,punk;CA
Bleeding Love;Leona Lewis;2007;pop;GB
Valerie;Mark Ronson & Amy Winehouse;2007;pop,rnb;GB
505;Arctic Monkeys;2007;indie,rock;GB
Kids;MGMT;2007;indie,electronica;US
Me enamora;Juanes;2007;pop,rock,latino;CO
La revolución sexual;La Casa Azul;2007;pop,indie;ES
Viva la Vida;Coldplay;2008;rock,pop;GB
I Kissed a Girl;Katy Perry;2008;pop;US
Hot n Cold;Katy Perry;2008;pop;US
Just Dance;Lady Gaga;2008;pop,electronica;US
Poker Face;Lady Gaga;2008;pop,electronica;US
Single Ladies (Put a Ring on It);Beyoncé;2008;rnb,pop;US
Halo;Beyoncé;2008;pop,rnb;US
Love Story;Taylor Swift;2008;country,pop;US
You Belong with Me;Taylor Swift;2008;country,pop;US
Sex on Fire;Kings of Leon;2008;rock;US
Use Somebody;Kings of Leon;2008;rock;US
Colgando en tus manos;Carlos Baute & Marta Sánchez;2008;pop,latino;VE,ES
Copenhague;Vetusta Morla;2008;indie;ES
Bad Romance;Lady Gaga;2009;pop,electronica;US
I Gotta Feeling;The Black Eyed Peas;2009;pop,electronica;US
Empire State of Mind;Jay-Z & Alicia Keys;2009;hiphop;US
Party in the U.S.A.;Miley Cyrus;2009;pop;US
Need You Now;Lady A;2009;country;US
When Love Takes Over;David Guetta & Kelly Rowland;2009;electronica;FR
Alors on danse;Stromae;2009;electronica,hiphop;BE
Rolling in the Deep;Adele;2010;pop,rnb;GB
Firework;Katy Perry;2010;pop;US
Just the Way You Are;Bruno Mars;2010;pop;US
Pumped Up Kicks;Foster the People;2010;indie,pop;US
Baby;Justin Bieber;2010;pop;CA
Danza Kuduro;Don Omar & Lucenzo;2010;urbano,latino;PR
Waka Waka (Esto es África);Shakira;2010;pop,latino;CO
Someone Like You;Adele;2011;pop;GB
Set Fire to the Rain;Adele;2011;pop;GB
Paradise;Coldplay;2011;rock,pop;GB
We Found Love;Rihanna;2011;pop,electronica;US
Party Rock Anthem;LMFAO;2011;electronica,hiphop;US
Moves like Jagger;Maroon 5;2011;pop;US
Titanium;David Guetta & Sia;2011;electronica,pop;FR
Levels;Avicii;2011;electronica;SE
Somebody That I Used to Know;Gotye;2011;indie,pop;AU
Call Me Maybe;Carly Rae Jepsen;2011;pop;CA
Little Talks;Of Monsters and Men;2011;indie,country;IS
Locked Out of Heaven;Bruno Mars;2012;pop;US
Diamonds;Rihanna;2012;pop;US
Radioactive;Imagine Dragons;2012;rock;US
Ho Hey;The Lumineers;2012;country,indie;US
R U Mine?;Arctic Monkeys;2012;indie,rock;GB
Skyfall;Adele;2012;pop;GB
Gangnam Style;PSY;2012;kpop,electronica;KR
Don't You Worry Child;Swedish House Mafia;2012;electronica;SE
Euphoria;Loreen;2012;pop,electronica;SE
Get Lucky;Daft Punk;2013;electronica,disco;FR
Happy;Pharrell Williams;2013;pop,rnb;US
Roar;Katy Perry;2013;pop;US
Wrecking Ball;Miley Cyrus;2013;pop;US
Counting Stars;OneRepublic;2013;pop;US
Wagon Wheel;Darius Rucker;2013;country;US
Do I Wanna Know?;Arctic Monkeys;2013;indie,rock;GB
Pompeii;Bastille;2013;indie,pop;GB
Take Me to Church;Hozier;2013;indie,rnb;IE
Riptide;Vance Joy;2013;indie,country;AU
Wake Me Up;Avicii;2013;electronica,country;SE
Hey Brother;Avicii;2013;electronica,country;SE
Animals;Martin Garrix;2013;electronica;NL
Papaoutai;Stromae;2013;electronica,pop;BE
Vivir mi vida;Marc Anthony;2013;latino;US
Propuesta indecente;Romeo Santos;2013;latino;US
Uptown Funk;Mark Ronson & Bruno Mars;2014;rnb,pop;GB
Shake It Off;Taylor Swift;2014;pop;US
Blank Space;Taylor Swift;2014;pop;US
All About That Bass;Meghan Trainor;2014;pop;US
Shut Up and Dance;Walk the Moon;2014;pop,rock;US
Sugar;Maroon 5;2014;pop;US
Thinking Out Loud;Ed Sheeran;2014;pop;GB
Stay with Me;Sam Smith;2014;pop,rnb;GB
A Sky Full of Stars;Coldplay;2014;pop,electronica;GB
Chandelier;Sia;2014;pop;AU
The Nights;Avicii;2014;electronica;SE
Bailando;Enrique Iglesias;2014;latino,pop;ES
Hello;Adele;2015;pop;GB
Lean On;Major Lazer & DJ Snake;2015;electronica;US
Can't Feel My Face;The Weeknd;2015;pop,rnb;CA
Hotline Bling;Drake;2015;hiphop,rnb;CA
Sorry;Justin Bieber;2015;pop,electronica;CA
Love Yourself;Justin Bieber;2015;pop;CA
Stressed Out;Twenty One Pilots;2015;indie,hiphop;US
Tennessee Whiskey;Chris Stapleton;2015;country;US
Faded;Alan Walker;2015;electronica;NO
Ginza;J Balvin;2015;urbano;CO
La gozadera;Gente de Zona & Marc Anthony;2015;latino;CU
One Dance;Drake;2016;hiphop,rnb;CA
Starboy;The Weeknd;2016;pop,rnb;CA
Closer;The Chainsmokers;2016;electronica,pop;US
Work;Rihanna;2016;rnb,reggae;US
Can't Stop the Feeling!;Justin Timberlake;2016;pop,disco;US
24K Magic;Bruno Mars;2016;rnb,pop;US
Cheap Thrills;Sia;2016;pop;AU
Chantaje;Shakira & Maluma;2016;urbano,latino;CO
Despacito;Luis Fonsi & Daddy Yankee;2017;urbano,latino;PR
Shape of You;Ed Sheeran;2017;pop;GB
Perfect;Ed Sheeran;2017;pop;GB
New Rules;Dua Lipa;2017;pop;GB
Something Just Like This;The Chainsmokers & Coldplay;2017;electronica,pop;US
Believer;Imagine Dragons;2017;rock,pop;US
Thunder;Imagine Dragons;2017;pop,rock;US
HUMBLE.;Kendrick Lamar;2017;hiphop;US
Mi gente;J Balvin & Willy William;2017;urbano;CO
Felices los 4;Maluma;2017;urbano,latino;CO
God's Plan;Drake;2018;hiphop;CA
I Like It;Cardi B, Bad Bunny & J Balvin;2018;hiphop,urbano;US
Shallow;Lady Gaga & Bradley Cooper;2018;pop,country;US
Old Town Road;Lil Nas X;2018;hiphop,country;US
lovely;Billie Eilish & Khalid;2018;pop;US
Taki Taki;DJ Snake, Selena Gomez, Ozuna & Cardi B;2018;urbano;FR
Te boté (Remix);Nio García, Casper Mágico, Bad Bunny, Ozuna, Darell & Nicky Jam;2018;urbano;PR
Malamente;Rosalía;2018;flamenco,pop;ES
Lo malo;Aitana & Ana Guerra;2018;pop,urbano;ES
bad guy;Billie Eilish;2019;pop,electronica;US
Blinding Lights;The Weeknd;2019;pop,electronica;CA
Don't Start Now;Dua Lipa;2019;pop,disco;GB
Watermelon Sugar;Harry Styles;2019;pop;GB
Cruel Summer;Taylor Swift;2019;pop;US
Dance Monkey;Tones and I;2019;pop;AU
Tusa;Karol G & Nicki Minaj;2019;urbano;CO
Callaita;Bad Bunny & Tainy;2019;urbano;PR
Con calma;Daddy Yankee & Snow;2019;urbano;PR
Con altura;Rosalía & J Balvin;2019;urbano,flamenco;ES
Levitating;Dua Lipa;2020;pop,disco;GB
Save Your Tears;The Weeknd;2020;pop;CA
Heat Waves;Glass Animals;2020;indie,pop;GB
Dynamite;BTS;2020;kpop,disco;KR
Dákiti;Bad Bunny & Jhay Cortez;2020;urbano;PR
Bichota;Karol G;2020;urbano;CO
Hawái;Maluma;2020;urbano;CO
Tú me dejaste de querer;C. Tangana, Niño de Elche & La Húngara;2020;flamenco,pop;ES
drivers license;Olivia Rodrigo;2021;pop;US
good 4 u;Olivia Rodrigo;2021;pop,punk;US
Peaches;Justin Bieber;2021;pop,rnb;CA
Stay;The Kid LAROI & Justin Bieber;2021;pop;AU
Industry Baby;Lil Nas X & Jack Harlow;2021;hiphop;US
Bad Habits;Ed Sheeran;2021;pop,electronica;GB
My Universe;Coldplay & BTS;2021;pop;GB,KR
Butter;BTS;2021;kpop;KR
Zitti e buoni;Måneskin;2021;rock;IT
Pepas;Farruko;2021;urbano,electronica;PR
Todo de ti;Rauw Alejandro;2021;urbano,pop;PR
Tacones rojos;Sebastián Yatra;2021;pop,latino;CO
As It Was;Harry Styles;2022;pop;GB
Anti-Hero;Taylor Swift;2022;pop;US
Unholy;Sam Smith & Kim Petras;2022;pop,electronica;GB
Tití me preguntó;Bad Bunny;2022;urbano;PR
Me porto bonito;Bad Bunny & Chencho Corleone;2022;urbano;PR
Provenza;Karol G;2022;urbano,pop;CO
La Bachata;Manuel Turizo;2022;latino;CO
Quevedo: Bzrp Music Sessions, Vol. 52;Bizarrap & Quevedo;2022;urbano,electronica;AR,ES
Despechá;Rosalía;2022;urbano,latino;ES
Saoko;Rosalía;2022;urbano;ES
SloMo;Chanel;2021;pop,urbano;ES
Ay mamá;Rigoberta Bandini;2021;pop,electronica;ES
Flowers;Miley Cyrus;2023;pop,disco;US
vampire;Olivia Rodrigo;2023;pop,rock;US
Last Night;Morgan Wallen;2023;country;US
Houdini;Dua Lipa;2023;pop,electronica;GB
Tattoo;Loreen;2023;pop;SE
Shakira: Bzrp Music Sessions, Vol. 53;Bizarrap & Shakira;2023;pop,urbano,electronica;AR,CO
Ella baila sola;Eslabon Armado & Peso Pluma;2023;latino;MX,US
LALA;Myke Towers;2023;urbano;PR
Columbia;Quevedo;2023;urbano;ES
Espresso;Sabrina Carpenter;2024;pop;US
Birds of a Feather;Billie Eilish;2024;pop;US
Not Like Us;Kendrick Lamar;2024;hiphop;US
Beautiful Things;Benson Boone;2024;pop,rock;US
Too Sweet;Hozier;2024;indie,rnb;IE
Texas Hold 'Em;Beyoncé;2024;country,pop;US
A Bar Song (Tipsy);Shaboozey;2024;country,hiphop;US
Die with a Smile;Lady Gaga & Bruno Mars;2024;pop;US
APT.;ROSÉ & Bruno Mars;2024;kpop,pop;KR,US
Si antes te hubiera conocido;Karol G;2024;latino,urbano;CO
Gata Only;FloyyMenor & Cris MJ;2024;urbano;CL
Abracadabra;Lady Gaga;2025;pop,electronica;US
Manchild;Sabrina Carpenter;2025;pop,country;US
Golden;HUNTR/X;2025;kpop,pop;US
Ordinary;Alex Warren;2025;pop;US
BAILE INoLVIDABLE;Bad Bunny;2025;latino,urbano;PR
DtMF;Bad Bunny;2025;urbano;PR
`;

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseSongLines(raw: string, custom = false): { songs: Song[]; errors: string[] } {
  const songs: Song[] = [];
  const errors: string[] = [];
  raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .forEach((line, i) => {
      const [title, artist, yearStr, genres = '', countries = ''] = line.split(';').map((p) => p.trim());
      const year = Number(yearStr);
      if (!title || !artist || !Number.isInteger(year) || year < 1900 || year > 2100) {
        errors.push(`Línea ${i + 1}: «${line}»`);
        return;
      }
      songs.push({
        id: `${custom ? 'c-' : ''}${slugify(artist)}--${slugify(title)}`,
        title,
        artist,
        year,
        genres: genres ? genres.split(',').map((g) => g.trim().toLowerCase()).filter(Boolean) : [],
        countries: countries ? countries.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean) : [],
        ...(custom ? { custom: true } : {}),
      });
    });
  return { songs, errors };
}

export const CATALOG: Song[] = parseSongLines(RAW).songs;
