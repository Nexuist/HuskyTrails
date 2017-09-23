const fs = require("fs");
const { URL, URLSearchParams } = require("url");

// https://stackoverflow.com/a/42531964
function combinations(array) {
    return new Array(1 << array.length).fill().map(
        (e1,i) => array.filter((e2, j) => i & 1 << j));
}

let pointsAPI = "https://huskytrails.core.uconn.edu/api/points";
let payees = ["Employees", "Vendors", "Subagreements", "Other"];
let grantTypes = ["Federal", "State", "Corporate", "Other"];
let yearCombinations = combinations([2014, 2015, 2016, 2017]);
 // All of the tileserver endpoints 404 in k6 for some reason, but load fine in browser (except for united-states-of-america-vector.json, which does actually 404)
let staticURLs = [
        "https://huskytrails.core.uconn.edu/",
        "https://huskytrails.core.uconn.edu/css/app.css",
        "https://huskytrails.core.uconn.edu/js/index.js",
        "https://huskytrails.core.uconn.edu/styles/positron/style.json",
        "https://huskytrails.core.uconn.edu/img/squared-labs.svg",
        "https://huskytrails.core.uconn.edu/img/uconn-wordmark-single-blue.png"
];
let filterURLs = [];

function makeFilterURL(payee, grantType, years) {
    let baseURL = new URL(pointsAPI);
    baseURL.searchParams.set("Payees[0]", payee);
    baseURL.searchParams.set("Grant Type[0]", grantType);
    years.forEach((year, i) => {
        baseURL.searchParams.set(`Fiscal Year[${i}]`, year);
    });
    return baseURL.toString();
}

payees.forEach((payee) => {
    grantTypes.forEach((grantType) => {
        yearCombinations.forEach((yearCombo) => {
            filterURLs.push(makeFilterURL(payee, grantType, yearCombo));
        });
    });
});

/*
I hate having to do a workaround like this, but k6 really struggled to generate these arrays when I tried running this code in the main script. The nested forEach's caused a Go routine crash, URLSearchParams wasn't available and unable to be imported as k6 can't import node.js modules (url), the Array object created in combinations() didn't have a fill() method for some reason...I figured it would just be easier to generate the object here and have k6 import it. But wait, there's more! k6 *also* can't load files from the filesystem, or if it can, I have no idea how you would since you can't import the fs module. It is capable of loading JS code both locally and remotely, so that's what this part does: generates urls.js, which are then imported in the main script.
*/
let output = `
    module.exports = {
        "static": ${JSON.stringify(staticURLs)},
        "points": "${pointsAPI}",
        "pointsFilters": ${JSON.stringify(filterURLs)}
    };
`;
fs.writeFileSync("urls.js", output, "utf8");
