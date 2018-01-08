#!/usr/bin/env node

'use strict';

const yargs = require('yargs');
const fetch = require('node-fetch');
const _ = require('lodash');
const fs = require('fs');

let apibase = "https://api.compose.io/2016-07";
let apitoken = process.env.COMPOSEAPITOKEN;
let apiheaders = {
    "Authorization": "Bearer " + apitoken,
    "Content-Type": "application/json"
};

let listDeployments = () => {
    fetch(`${apibase}/deployments/`, { headers: apiheaders })
        .then(function (res) {
            return res.json();
        }).then(function (json) {
            let deployments = json["_embedded"].deployments;
            for (let deployment of deployments) {
                console.log(`${deployment.id} ${deployment.type} ${deployment.name}`);
            }
        }).catch(function (err) {
            console.log(err);
        });
};

let listLogs = (deploymentid) => {
    fetch(`${apibase}/deployments/${deploymentid}/logfiles`, { headers: apiheaders })
        .then((res) => { return res.json(); })
        .then((json) => {
            let logfiles = json["_embedded"].logfiles;
            let logfilesByDate = _.groupBy(logfiles, (v) => { return v.date });
            for (let dateset in logfilesByDate) {
                console.log(`Logs for ${dateset}`)
                logfiles = logfilesByDate[dateset]
                for (let logfile of logfiles) {
                    let capsulename = logfile.name.split("\.")[0]
                    console.log(`${capsulename} ${logfile.id} (${Math.round(logfile.file_size / 1024)}KB)`)
                }
                console.log();
            }
        })
        .catch((err) => { console.log(err) });
}

let getLog = (deploymentid, logid) => {
    console.log("Requesting logfile")
    fetch(`${apibase}/deployments/${deploymentid}/logfiles/${logid}`, { headers: apiheaders })
        .then((res) => { return res.json(); })
        .then((json) => {
            fetch(json.download_link)
                .then((res) => {
                    console.log(`Downloading ${json.name}`);
                    const dest = fs.createWriteStream(`./${json.name}`);
                    res.body.pipe(dest);
                })
                .then((res) => {
                    console.log(`Downloaded ${json.name}`);
                })
        })
        .catch((err) => { console.log(err) });
}

yargs.version("1.0.0")
    .command("deployments", "List deployments", {}, (argv) => listDeployments())
    .command("logs <deploymentid>", "List deployment logfiles", {}, (argv) => listLogs(argv.deploymentid))
    .command("get <deploymentid> <logid>", "Get specific log file", {}, (argv) => getLog(argv.deploymentid, argv.logid))
    .help()
    .argv;


