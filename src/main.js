import danish from "@centia-io/danish-search";
import "@centia-io/danish-search/style.css";
import { sql } from "./baas/client.js";

const resultEl = document.getElementById("result");

function showLoading() {
  resultEl.className = "visible";
  resultEl.innerHTML = '<span class="loading">Søger adresse...</span>';
}

function showResult(enhedsadresse, lden) {
  resultEl.className = "visible";
  resultEl.innerHTML = `
        <div class="label">Nærmeste støjkortlagte adresse</div>
        <div class="meta">${enhedsadresse}</div>
        <div class="label">Støjmåling</div>
        <div class="stor">${lden}</div>
    `;
}

function showError(msg) {
  resultEl.className = "visible";
  resultEl.innerHTML = `<span class="loading">${msg}</span>`;
}

async function findKommune(feature, value) {
  showLoading();

  try {
    const res = await sql.postSqlNoToken("ballerup", {
      q: `SELECT *
                FROM konflikt_web.stoejkortlaegning k
                ORDER BY the_geom <-> ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326), 25832)
                LIMIT 1`,
      params: [{"geojson": feature.geometry}],
    });

    if (res.data && res.data.length > 0) {
      const row = res.data[0];
      showResult(row.enhedsadresse, row.lden, value);
    } else {
      showError("Kunne ikke finde måling for den valgte lokation.");
    }
  } catch (err) {
    console.error(err);
    showError("Fejl ved opslag: " + err.message);
  }
}

danish({
  el: ".custom-search",
  onlyAddress: true, // true = hide matrikel results
  komKode: "151", // municipality filter: "*", "0101", or ["0101","0147"]
  onSelect({ type, gid, value, searchType, feature }) {
    console.log("Selected:", type, gid, value, searchType, feature);
    findKommune(feature, value);
  },
});
