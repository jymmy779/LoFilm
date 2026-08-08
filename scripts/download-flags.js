const fs = require("fs");
const path = require("path");
const https = require("https");

const codes = [
  "kr", "cn", "jp", "th", "us", "tw", "hk", "in", "vn",
  "gb", "fr", "de", "es", "tr", "nl", "id", "ru", "mx",
  "au", "ca", "my", "no", "fi", "dk", "pl", "se", "ch",
  "at", "ar", "cl", "co", "il", "pk", "eg", "sa", "sg",
  "nz", "cz", "hu", "ro", "gr", "br", "ph", "it", "pt",
  "ua", "ae", "za", "ng", "ke", "be",
];

const dir = path.join(__dirname, "..", "public", "images", "flags");
fs.mkdirSync(dir, { recursive: true });

const download = (code) =>
  new Promise((resolve) => {
    const file = path.join(dir, `${code}.png`);
    if (fs.existsSync(file)) {
      console.log(`${code} => exists`);
      return resolve();
    }
    https
      .get(`https://flagcdn.com/w80/${code}.png`, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          fs.writeFileSync(file, buf);
          console.log(`${code} => ${res.statusCode} ${buf.length} bytes`);
          resolve();
        });
      })
      .on("error", (e) => {
        console.log(`${code} => ERROR ${e.message}`);
        resolve();
      });
  });

// Cờ Liên Hợp Quốc ("Quốc gia khác") — SVG từ flag-icons (jsDelivr)
const downloadUn = () =>
  new Promise((resolve) => {
    const file = path.join(dir, "un.svg");
    if (fs.existsSync(file)) {
      console.log("un => exists");
      return resolve();
    }
    https
      .get(
        "https://cdn.jsdelivr.net/gh/lipis/flag-icons@main/flags/4x3/un.svg",
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const buf = Buffer.concat(chunks);
            fs.writeFileSync(file, buf);
            console.log(`un => ${res.statusCode} ${buf.length} bytes`);
            resolve();
          });
        }
      )
      .on("error", (e) => {
        console.log(`un => ERROR ${e.message}`);
        resolve();
      });
  });

(async () => {
  for (const code of codes) {
    await download(code);
  }
  await downloadUn();
  console.log("DONE");
})();
