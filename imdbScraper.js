const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const ObjectsToCsv = require("objects-to-csv");
const fs = require("fs");

const url = "https://www.imdb.com/chart/moviemeter";

// create CSV file with results from scraper function
const createCsv = async (data) => {
  let csv = new ObjectsToCsv(data);
  await csv.toDisk("./imdbScraper.csv", (err) => {
    if (err) throw err;
  });
};

// create JSON file with results from scraper function
const saveToJsonFile = async (data) => {
  await fs.writeFile("imdbData.json", JSON.stringify(data), (err) => {
    if (err) throw err;
  });
};

const imdbScraper = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);
  const html = await page.content();
  const $ = cheerio.load(html, {}, false); // isDocument set to false to not have html, head & body elements

  // create array of Cheerio objects using map() then return array of elements using get()
  const results = $("tr")
    .map((index, element) => {
      // title - convert to text
      const titleElement = $(element).find(".titleColumn > a");
      const title = $(titleElement).text();

      // year - remove unwanted ( and '
      const yearElement = $(element).find(".titleColumn > span");
      const year = yearElement.text().replace("(", "").replace(")", "");

      // imdbRating - convert to text
      const ratingRating = $(element).find(".imdbRating > strong");
      const rating = ratingRating.text();

      // url - take href attribute
      const urlElement = $(element).find(".titleColumn > a");
      const urlAttr = urlElement.attr("href");
      const url = `http://imdb.com${urlAttr}`;

      return title !== "" ? { index, title, year, rating, url } : null;
    })
    .get();

  await createCsv(results);
  await saveToJsonFile(results);
  await browser.close();
};

imdbScraper();
