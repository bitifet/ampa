#!/usr/bin/env node

const globals = {};

const path = require("path");
const fs = require("fs");
const pug = require("pug");

const CUTTING_HOUR = 14; // Up to this hour is considered morning.
const DAYS = ( // No magic numbers ;-)
    1000 // milliseconds
    * 60 // seconds
    * 60 // minutes
    * 24 // hours
);
const MAX_FORGOTTEN_DELAY = 3 * DAYS;
const DAYS_PER_PAGE = 12;
const re_globals = /^\s*(?<key>\w+?)\s*:\s*(?<value>.*?)\s*$/;
const re_fields = /^(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})\s(?<hour>\d{2})(?<minutes>\d{2})\s(?<diastole>\d+)\s(?<systole>\d+)\s(?<pulse>\d+)/;

const srcFile = path.join(__dirname, process.argv[2]);
if (! fs.existsSync(srcFile)) throw(`File does not exist: ${srcFile}`);

const payload = fs.readFileSync(srcFile).toString();

const rows = payload
    .split("\n")
    .filter(x=>!!x.trim().length)
;

const inputs = rows
    .filter(r=>{
        const g = r.match(re_globals);
        if (! g) return true;
        const {key, value} = g.groups;
        globals[key] = value;
        return false;
    })
    .map(r=>r.match(re_fields).groups)
    .map(
        ({
            year, month, day,
            hour, minutes,
            diastole, systole, pulse
        }) => ({
            timestamp: new Date(year, month - 1, day, hour, minutes),
            date: `${day}/${month}/${year}`,
            time: `${hour}:${minutes}`,
            hour: parseInt(hour),
            diastole,
            systole,
            pulse,
        })
    )
;

const blank = {
    time: "",
    diastole: "",
    systole: "",
    pulse: "",
};
const data = [];

for (let i = 0; i < inputs.length; i++) {
    const {timestamp, hour, ...current} = inputs[i];
    if (hour > CUTTING_HOUR) { // No morning measurement
        // Insert blank morning measurement:
        data.push({
            ...current,
            ...blank,
        });
        // Insert evening measurement:
        data.push(current);

    } else {
        // Insert real morning measurement:
        data.push(current);
        const following = inputs[i+1];
        if ( // Following item is corresponding evening:
            !! following
            && following.hour > CUTTING_HOUR
            && following.timestamp - timestamp < MAX_FORGOTTEN_DELAY
        ) {
            // Pick and insert (following) evening measurement:
            const {timestamp, hour, ...next} = inputs[++i];
            data.push(next);
        } else {
            data.push({
                ...current,
                ...blank,
            });
        };
    };
};


const pages = [];
for (var i = 0; i < data.length; i += DAYS_PER_PAGE * 2) {
    pages.push(data.slice(i, i + DAYS_PER_PAGE * 2));
}





const template = `doctype html
html
    head
        title=title
        meta(name="viewport" content="width=device-width, initial-scale=1.0")
        meta(http-equiv='Content-Type', content='text/html; charset=utf-8')
    body
        style.
            table {
                margin: 0 auto; /* Centra la taula horitzontalment */
                border-collapse: collapse;
                margin-bottom: 1em;
            }
            table.data {
                font-size: small;
                page-break-after: always;
            }
            table.data th, table.data td {
                border: solid 1px black;
            }
            table.heading, table.heading td {
                border: none;
                padding: 0px;
            }
            table.heading {
                padding-top: 8rem;
            }
            table.heading span {
                margin: 0px 1em;
            }
            h1, h2 {
                padding: 0px;
            }
            th, td {
                border: 1px solid #ccc;
                padding: 8px;
                text-align: center;
            }
            .left {
                text-align: left;
                padding-left: .5em !important;
            }
            .right {
                text-align: right;
                padding-right: .5em !important;
            }
            .bold {
                font-weight: bold;
            }
            th {
                background: #f5f5ff;
            }
        each data, pgIndex in pages
            br
            table.heading
                tr
                    td(rowspan=3)
                        h1 AMPA
                    td.right.bold ATD.
                    td.left=doctor
                tr
                    td.right.bold Paciente:
                    td.left=patient
                tr
                    td.right.bold Página:
                    td.left
                        span=1+pgIndex
                        span de
                        span=pages.length
                tr
                    td(colspan=3)
                        h2 Medición de la tensión arterial en domicilio
            table.data
                tr 
                    th Diagnóstico
                    th FECHA
                    th HORA
                    th PA Máxima
                    th PA Mínima
                    th Pulsaciones
                - let i = -1
                while ++i < (DAYS_PER_PAGE * 2)
                    -
                        const row = data[i] || {};
                        const d = pgIndex * DAYS_PER_PAGE + Math.floor(i/2) + 1;
                        const turn = (
                            ! (i % 2) ? "mañana"
                            : "tarde"
                        );
                    tr
                        th.left SEMANA #{d} #{turn}
                        td=row.date
                        td=row.time
                        td=row.diastole
                        td=row.systole
                        td=row.pulse

`;





const output = pug.compile(template, {
    pretty: true,
})({
    ...globals,
    DAYS_PER_PAGE,
    pages,
});


//console.log(globals);
//console.log(inputs);
//console.log(data);
//console.log(pages);
console.log(output);
