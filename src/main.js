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
        <div class="meta">Det beregnede støjniveau for <b>${enhedsadresse}</b> er:</div>
        <div class="stor">${Math.round(lden * 10)/10} dB (L<sub>den</sub>)</div>
        <div class="meta">
        <h4>Vejledende forklaring</h4>
        <ul>
            <li>Vejstøj beskrives med støjindikatoren, L<sub>den</sub>, som er et vægtet gennemsnit over et døgn beregnet for et helt år. Støj om aftenen og natten er indregnet med ekstra vægt, da man her er mere følsom over for støj.</li>
            <li>Støjniveauet stammer fra Ballerup Kommunes seneste støjkortlægning fra 2022-2023 og er vejledende. Det kan derfor afvige fra de faktiske forhold på din grund.</li>
            <li>Støjkortlægningen er lavet i en computermodel, som beregner støjen på ydersiden af boligens facade. Den tager ikke højde for helt lokale forhold på din matrikel – f.eks. tætte hække, private plankeværk eller mindre udhuse, der kan give læ for lyden, ligesom den ikke viser støjniveauet inden døre.</li>
        </ul>
        </div>
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
      q: `
            WITH nearest AS (SELECT *, the_geom <-> ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326), 25832) AS dis from konflikt_web.stoejkortlaegning)
                SELECT *
                FROM nearest
                WHERE dis < 10
                ORDER BY dis
                LIMIT 1`,
      params: [{"geojson": feature.geometry}],
    });

    if (res.data && res.data.length > 0) {
      const row = res.data[0];
      showResult(row.enhedsadresse, row.lden, value);
    } else {
      showError(`
                        <div>Det har ikke været muligt at finde et beregnet støjniveau for adressen.</div>
                        <h4>Hvorfor er støjniveauet ikke beregnet?</h4>
                        <ul>
                            <li>Støjniveauerne stammer fra Ballerup Kommunes seneste støjkortlægning fra 2022-2023. Hvis din bolig ikke var registreret som helårsbolig i Bygnings- og Boligregistret (BBR) på kortlægningstidspunktet, er der ikke udarbejdet en specifik støjberegning for adressen.</li>
                            <li>Du kan eventuelt prøve at indtaste din nabos adresse i stedet for. Støjniveauet for de to boliger vil sandsynligvis ligge tæt på hinanden.</li>
                        </ul>
                      `);
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
