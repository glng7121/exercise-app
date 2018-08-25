const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// API calls
app.get('/sounds/:file', (req, res, next) => {
    const options = {
        root: __dirname
    };
    res.sendFile(`/sounds/${req.params.file}`, options, function (error) {
        if (error) {
            next(error);
        }
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