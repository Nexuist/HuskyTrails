import http from "k6/http";
import { group, check } from "k6";
import urls from "./urls.js";


/* TWEAKABLE CONSTANTS */
let maxAllowableRequestDuration = 1000;

/* RESPONSE TEST */
let standardCheck = (res) => {
    check(res, {
        "status was 200": (r) => r.status == 200 || console.warn(`'${r.url}' failed with status code ${r.status}`),
        "transaction time OK": (r) => r.timings.duration < maxAllowableRequestDuration || console.warn(`'${r.url}' took too long: ${Math.round(r.timings.duration)}ms`)
    });
}

export default function() {    
    group("Static Page Resources", () => {
        let responses = http.batch(urls.static);
        for (var i = 0; i < urls.static.length; i++) {
            standardCheck(responses[i]);
        }
    });
    group("Points API w/o Filters", () => {
        standardCheck(http.get(urls.points));
    });
    group("Points API w/ Filters", () => {
        let responses = http.batch(urls.pointsFilters);
        for (var i = 0; i < urls.pointsFilters.length; i++) {
            standardCheck(responses[i]);
        }
    });
};