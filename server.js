/**************************
 * CONFIG STUFF
 **************************/
var cache_lifetime = 14400;
var key = 'MySecretKey12345';
var iv = '1234567890123456';
/**************************
 * END CONFIG STUFF
 **************************/

//@TODO Make a drupal module that uses this
//@TODO Do not forget to encrypt the image url to fetch [ https://gist.github.com/rojan/9545706 ]

var express = require('express');
var validUrl = require('valid-url');
var url = require("url");
var FileCleanerService = require('./lib/fileCleanerService');
var utils = require('./lib/utils');
var fs = require('fs');
var dns = require('dns');
var app = express();
var request = require('request');
var crypto = require('crypto');
var fcs = new FileCleanerService(cache_lifetime);
var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);

app.get('/:image_url', function (req, res) {

    var decrypted = decipher.update(req.params.image_url, 'hex', 'binary');
    decrypted += decipher.final('binary');


    var image_url = decodeURIComponent(decrypted);


    if (!image_url) {
        res.json({'error': 'Required param url missing'});
        return;
    }
    if (!validUrl.isUri(image_url)) {
        res.json({'error': 'Invalid url'});
        return;
    }

    if (!req.query.userAgent) {
        req.query.userAgent = 'Mozilla/5.0 (Windows NT x.y; Win64; x64; rv:10.0) Gecko/20100101 Firefox/10.0';
    }

    if (!req.query.nocache) {
        req.query.nocache = false;
    }



    var options = {
        url: image_url,
        userAgent: req.query.userAgent
    };
    console.log(options);
    var filename = utils.md5(url + JSON.stringify(options));
    var filePath = 'cache/' + filename;
    var our_host = (req.secure) ? 'https://' + req.headers.host : 'http://' + req.headers.host;
    if (fs.existsSync(filePath) && req.query.nocache === false) {
        console.log('Request for %s - Found in cache', image_url);
        if (!req.query.sendlink) {
            res.sendFile(filePath, {root: __dirname}, function (err) {
                console.log('Done sending  cached file');
            });
        }
        return;
    }


    var hostname = url.parse(image_url).hostname;
    console.log(hostname);
    dns.resolve4(hostname, function (err, addresses) {
        if (err) {
            console.log(err);
            res.json({'error': 'Hostname not found'});
        } else {
            request.head(image_url, function(err, rres, body){
                console.log('content-type:', rres.headers['content-type']);
                console.log('content-length:', rres.headers['content-length']);

                request(image_url).pipe(fs.createWriteStream(filePath)).on('close', function(){
                    res.sendFile(filePath, {root: __dirname}, function (err) {
                        console.log('Done sending file');
                        fcs.addFile(filePath);
                    });
                });
            });
        }
    });
});

var dir = 'cache';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

app.listen(8080, function () {
    console.log('Example WebShot listening on port 8080!');
});

