const fs = require('fs')
const { sendReportMessage } = require("../discord/discord");
var reporter = {
    _reports: [],
    get reports () {
        return this._reports
    },

    addReport(report) {
        var reportIndex = this.reports.findIndex((r) => r.server.id == report.server.id && r.server.ip == report.server.ip);

        if(reportIndex == -1) {
            this._reports.push(report);
            sendReportMessage(report);
        } else
            this._reports[reportIndex] = report;

        const jsonString = JSON.stringify(this.reports)
        fs.writeFile('./reports.json', jsonString, err => {
            if (err) {
                console.log('Error writing file', err)
            } 
        })
    }
}

try {
    // Note that jsonString will be a <Buffer> since we did not specify an
    // encoding type for the file. But it'll still work because JSON.parse() will
    // use <Buffer>.toString().
    const jsonString = fs.readFileSync("./reports.json");
    reporter._reports = JSON.parse(jsonString);
} catch (err) {
    reporter._reports = []
}


module.exports = reporter;