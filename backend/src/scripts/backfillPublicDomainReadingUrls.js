const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Book = require("../models/Book");

dotenv.config();

const sources = [
  ["Crime and Punishment", "Fyodor Dostoevsky", "https://www.gutenberg.org/cache/epub/2554/pg2554.txt"],
  ["Dracula", "Bram Stoker", "https://www.gutenberg.org/cache/epub/345/pg345.txt"],
  ["Frankenstein", "Mary Shelley", "https://www.gutenberg.org/cache/epub/84/pg84.txt"],
  ["Jane Eyre", "Charlotte Bronte", "https://www.gutenberg.org/cache/epub/1260/pg1260.txt"],
  ["Pride and Prejudice", "Jane Austen", "https://www.gutenberg.org/cache/epub/1342/pg1342.txt"],
  ["The Hound of the Baskervilles", "Arthur Conan Doyle", "https://www.gutenberg.org/cache/epub/2852/pg2852.txt"],
  ["War and Peace", "Leo Tolstoy", "https://www.gutenberg.org/cache/epub/2600/pg2600.txt"],
  ["Wuthering Heights", "Emily Bronte", "https://www.gutenberg.org/cache/epub/768/pg768.txt"]
];

async function verifySource(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  const sample = (await response.text()).slice(0, 2000);
  if (!sample.trim()) throw new Error(`${url} returned an empty file`);
}

async function backfillPublicDomainReadingUrls({ apply = false, verify = true } = {}) {
  let matched = 0;
  for (const [title, author, readingUrl] of sources) {
    const book = await Book.findOne({ title, author });
    if (!book) {
      console.log(`SKIP: ${title} by ${author} was not found exactly`);
      continue;
    }

    const hasNoSource = !book.readingUrl || book.readingType === "none";
    const hasOldDraculaSource = title === "Dracula" && book.readingUrl.includes("/345/pg345-images.html");
    if (!hasNoSource && !hasOldDraculaSource) {
      console.log(`SKIP: ${title} already has a reading source`);
      continue;
    }

    if (verify) await verifySource(readingUrl);
    matched += 1;
    if (apply) {
      book.readingType = "text";
      book.readingUrl = readingUrl;
      book.readingProvider = "Project Gutenberg";
      book.readingAccess = "full";
      await book.save();
      console.log(`UPDATED: ${title}`);
    } else {
      console.log(`MATCH: ${title} -> ${readingUrl}`);
    }
  }

  const booksWithoutSources = await Book.find({
    $or: [{ readingType: "none" }, { readingUrl: "" }, { readingUrl: { $exists: false } }]
  });
  let externalMatches = 0;
  for (const book of booksWithoutSources) {
    const query = encodeURIComponent(`intitle:${book.title} inauthor:${book.author}`);
    const readingUrl = `https://books.google.com/books?q=${query}`;
    externalMatches += 1;
    if (apply) {
      book.readingType = "external";
      book.readingUrl = readingUrl;
      book.readingProvider = "Google Books";
      book.readingAccess = "search";
      await book.save();
      console.log(`EXTERNAL: ${book.title}`);
    } else {
      console.log(`EXTERNAL MATCH: ${book.title} -> ${readingUrl}`);
    }
  }

  console.log(`${apply ? "Updated" : "Verified"} ${matched} public-domain books.`);
  console.log(`${apply ? "Updated" : "Found"} ${externalMatches} external book links.`);
  if (!apply) console.log("Dry run only. Run again with --apply to save these matches.");
  return matched;
}

async function main() {
  await connectDB();
  await backfillPublicDomainReadingUrls({ apply: process.argv.includes("--apply") });
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.connection.close();
    });
}

module.exports = { backfillPublicDomainReadingUrls };
