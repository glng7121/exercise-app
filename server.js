const express = require('express');
const path = require('path');
const wav = require('wav'),
      Speaker = require('speaker'),
      xmlbuilder = require('xmlbuilder'),
      axios = require('axios'),
      fs = require('fs')
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// API calls
app.post('/api/tts', (req, res) => {
    const message = req.body.message;
    console.log(message);
    const ssmlDoc = xmlbuilder.create('speak')
    .att('version', '1.0')
    .att('xml:lang', 'en-us')
    .ele('voice')
    .att('xml:lang', 'en-us')
    .att('xml:gender', 'Male')
    .att('name', 'Microsoft Server Speech Text to Speech Voice (en-US, Guy24kRUS)')
    .txt(message? message : 'unknown message')
    .end();
    const speakData = ssmlDoc.toString();

    axios.request({
        url: 'https://westus.api.cognitive.microsoft.com/sts/v1.0/issueToken',
        method: 'post',
        headers: {'Ocp-Apim-Subscription-Key': '10c95f8e063d489fbb2bb70346bf07af',
            'Host': 'westus.api.cognitive.microsoft.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': 0
        },
    })
    .then(function (response) {
        let token = response.data;
        console.log('========================= NEW TOKEN ================ \n' + token);
        return axios.request({
            url: 'https://westus.tts.speech.microsoft.com/cognitiveservices/v1',
            method: 'post',
            headers: {'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
                'User-Agent': 'Test TTS application',
                'X-Search-AppId': '07D3234E49CE426DAA29772419F436CA',
                'X-Search-ClientID': '1ECFAE91408841A480F00935DC390960',
            },
            data: speakData,
            responseType: 'arraybuffer'
        });
    })
    .then(function (response) {
        /* return new Promise((resolve, reject) => {
            let reader = new wav.Reader();
            reader.on('format', function (format) {
                //reader.pipe(new Speaker(format));
                resolve(true);
            });
            reader.on('error', (e) => {
                reject(e);
            });
    
            console.log('checkpoint 1');
            const Readable = require('stream').Readable;
            let s = new Readable;
            s.on('error', (e) => {
                reject(e);
            });
            s.push(response.data);
            console.log('checkpoint 2');
            s.push(null);
            console.log('checkpoint 3');
            s.pipe(reader);
            console.log('checkpoint 4');
        });
        */
       res.send({ sound: response.data });
    })
    .catch(function (error) {
        console.log(error);
        res.send(null);
    });
});

if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, 'client/build')));
  // Handle React routing, return all requests to React app
  app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}
app.listen(port, () => console.log(`Listening on port ${port}`));