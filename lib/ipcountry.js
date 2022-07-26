const axios = require("axios");

module.exports = {
    getCountry(ip) {
        return new Promise((resolve, reject) => {
        axios.get('https://api.ipgeolocation.io/ipgeo?apiKey=d00432030ff7416eb15b6a7bc13ef4e6&ip=' + ip)
            .then(res => {		
                resolve({
                    name: res.data.country_name,
                    flag: res.data.country_flag
                });
            })
            .catch(error => {
                resolve({
                    name: "",
                    flag: ""
                });
            });
        });
    }
}