////////////
// README //
////////////
/*
Corporeal is a library for generating fun test data for Hyperlink components

It draws on source data from Darius Kazemi's 'Corpora' project:
https://github.com/dariusk/corpora
> a collection of static corpora that are potentially useful in the creation of weird internet stuff
…hence the name of this lib :D

PLEASE NOTE…
- For ease of use, below functions take no parameters
- Some have variants e.g. getRandomTitleBook() and getRandomTitleBookShort()
- Tweak and add additional variants as needed!

Things it can generate:
- Titles: for cards
	- getRandomTitleBook()
	- getRandomTitleBookShort()
	- getRandomTitleWeird()
	- getRandomTitleOccupation()
- Content: text content, also for cards; one paragraph or several
	- getRandomParagraph()
	- getRandomContent()
- Names: human names e.g. Albert Einstein
	- getRandomName()
- Usernames: strings e.g. YachtJuan367
	- getRandomUsername()

Maybe later:
- Section names
- Chat content e.g. messages
- Bot and Member card data
*/



/////////////////
// IMPORT DATA //
/////////////////

var corpora = require('corpora-project');



/////////////
// HELPERS //
/////////////

function getData (folder, file) {
	return corpora.getFile(folder, file);
}

// see: https://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
function getRandom (list) {
	if (Array.isArray(list)) { // simple arrays - most of the corpora items!
		var length = list.length;
		return list[Math.floor(Math.random()*length)];
	}
	else { // otherwise an object; use simple heuristic to get keys instead (doesn't work if nested objects)
		var keys = Object.keys(list);
		var length = Object.keys(list).length;
		return Object.keys(list)[Math.floor(Math.random()*length)]
	}
}

// see: https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
function toTitleCase (str) {
	return str.replace(
		/\w\S*/g,
		function(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		}
	);
}

function getRandomInt (min, max) {
	return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function shuffleArray (array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
	return array;
}

function simpleString (item) {
	// stringify in case e.g. a number AND strip to first word only
	return item.toString().split(" ")[0];
}

// TRUNCATE BY SENTENCE - by # of sentences
// see: https://chrisbitting.com/2019/08/22/how-to-truncate-trim-text-by-sentence-in-javascript-not-word-or-character/
// NOT USED BUT MAYBE USEFUL?

// TRUNCATE STRINGS
// see: https://www.nfollmer.com/2016/07/06/truncate-string-word-break-javascript/
// NOT USED BUT MAYBE USEFUL?



////////////
// TITLES //
////////////

//SOURCES
const books = getData('books', 'bestsellers').books; // titles and authors
const winds = getData('geography', 'winds').winds;
const instruments = getData('music', 'instruments').instruments;
const religions = getData('religion', 'fictional_religions');
const musicgenres = getData('music', 'genres').genres;
const descriptions = getData('humans', 'descriptions').descriptions;
const occupations = getData('humans', 'occupations').occupations;
const moods = getData('humans', 'moods').moods;

// random title from popular books list
function getRandomTitleBook () {
	return getRandom(books).title;
}
// console.log(getRandomTitleBook());

// random title from popular books list - max 20 chars
function getRandomTitleBookShort () {
	let title = getRandom(books).title;
	maxlength = 20;
	while (title.length > maxlength) {
		title = getRandom(books).title;
	}
	return title;
}
// console.log(getRandomTitleBookShort());

// random title from fictional religion, wind name, and instrument
function getRandomTitleWeird () {
	let religion = getRandom(religions);
	let wind = getRandom(winds);
	let instrument = getRandom(instruments);
	const title = toTitleCase(religion) + ": " + toTitleCase(wind) + " Plays the " + toTitleCase(instrument);
	return title;
}
// console.log(getRandomTitleWeird());

// random title from list of occupations with mood descriptor
function getRandomTitleOccupation () {
	let occupation = getRandom(occupations);
	let mood = getRandom(moods);
	const title = toTitleCase(mood) + " " + toTitleCase(occupation);
	return title;
}
// console.log(getRandomTitleMood());



/////////////
// CONTENT //
/////////////

//SOURCES
const artisms = getData('art', 'isms').isms;
const academic_subjects = getData('books', 'academic_subjects').subjects;
const crash_blossoms = getData('words', 'crash_blossoms').crash_blossoms; // NB: ALL CAPS!
// const proverbs = getData('words', 'proverbs'); // NB: GROUPED BY CATEGORY INTO NESTED OBJECTS
const harvard_sentences = getData('words', 'harvard_sentences').data;
const shakespeare_phrases = getData('words/literature', 'shakespeare_phrases').phrases;

// random paragraph from between 100 and 1,000 chars
function getRandomParagraph () {
	let src = harvard_sentences;
	// let src = shakespeare_phrases; // alt - less sentence-y tho
	let content = getRandom(src);
	let minlength = 100;
	let maxlength = 1000;
	while (content.length < minlength) {
		let sentence = getRandom(src);
		content += " " + sentence;
	}
	let howmanymore = getRandomInt(1, 20);
	for (let i = 0; i < howmanymore; i++) {
		let sentence = getRandom(src);
		// check if current + next sentence will surpass maxlength, if so break, if not add it
		let lengthcheck = content + sentence;
		if (lengthcheck.length > maxlength) break;
		content += " " + sentence;
	}
	return content;
}
// console.log(getRandomParagraph());

// random content block with 1-5 paragraphs
function getRandomContent () {
	let maxparagraphs = 5;
	let paragraphcount = getRandomInt(1, maxparagraphs)
	let content = "";
	for (let i = 0; i < paragraphcount; i++) {
		let paragraph = getRandomParagraph();
		content += paragraph + "\n\n";
	}
	return content.trim();
}
// console.log(getRandomContent());

// ANOTHER IDEA…
// maybe generate 'opinion' list e.g. "I think…" "I surmise…" etc.
// and combine with art/isms or books/academic_subjects - ???



///////////
// NAMES //
///////////

//SOURCES
const scientists = getData('humans', 'scientists').scientists;
const ijchars = getData('words/literature', 'infinitejest').infinitejest;
const authors = getData('humans', 'authors').authors; // LAST NAMES ONLY
const fnames = getData('humans', 'firstNames').firstNames;
const lnames = getData('humans', 'lastNames').lastNames;
const nameprefixes = getData('humans', 'prefixes').prefixes;
const namesuffixes = getData('humans', 'suffixes').suffixes;

// random name, from a list of famous scientists
function getRandomName () {
	let name = getRandom(scientists);
	return name;
}
// console.log(getRandomName());

// OTHER IDEAS…
// authors - last names only…maybe combine 2-3?
// random first + last?



///////////////
// USERNAMES //
///////////////

//SOURCES
const animals = getData('animals', 'common').animals;
const colors = getData('colors', 'crayola').colors; // color name + hex code - NOT supported by getRandom for now
const clothing = getData('objects', 'clothing').clothes;
const objects = getData('objects', 'objects').objects;
const primes = getData('mathematics', 'primes').primes;
const strangewords = getData('words', 'strange_words').words;
const flowers = getData('plants', 'flowers').flowers;
const plants = getData('plants', 'plants').plants; // common name + species

// random username made up of 3 randomly ordered elements from the list below
// NB: filtered to alphanumeric only
// TODO: more variation / options?
function getRandomUsername () {
	let elements = [fnames, musicgenres, animals, flowers, primes];
	let shuffled = shuffleArray(elements);
	let item1 = simpleString(getRandom(shuffled[0]));
	let item2 = simpleString(getRandom(shuffled[1]));
	let item3 = simpleString(getRandom(shuffled[2]));
	let username = item1 + item2 + item3;
	username = username.replace(/\W/g, '') // strip non alphanumeric + underscores
	return username;
}
// console.log(getRandomUsername());


// ~~~~~~~~~~ TO DO LATER ~~~~~~~~~~ TO DO LATER ~~~~~~~~~~ TO DO LATER ~~~~~~~~~~ //



///////////////////
// SECTION NAMES //
///////////////////

//various options?
//QUESTION: do we have constraints e.g. alphanumeric and underscores only?



////////////////////////////
// CHAT MESSAGES + CONVOS //
////////////////////////////

//SOURCES
/*
words/emoji/emoji
words/encouraging_words
*/

//get a few different usernames…
//then maybe pick a theme
//generate some messages (thoughts + reactions + questions)
//generate related cards to attach?



//////////////////
// MEMBER CARDS //
//////////////////

//SOURCES
/*
humans/descriptions - LIST OF ADJECTIVES
humans/human_universals - LIST OF PHRASES
*/

//get a username
//then add a description section - ???



///////////////
// BOT CARDS //
///////////////

//SOURCES
/*
technology/new_technologies
words/units_of_time
TK?
*/

//generate a silly name, maybe technology + "bot" or similar
//make a simple description
//maybe add something re: frequency using units of time?



// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
/////////////////////////////////////////////////////////////////////////////////
// I think we need to export at the end…for something…TK return to this later… //
/////////////////////////////////////////////////////////////////////////////////
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

// export {}