var path = require('path');
var express = require('express');
var bodyparser = require("body-parser");
var GoogleImages = require('google-images');
var fs = require('fs'),
    gm = require('gm').subClass({
        imageMagick: true
    });

var request = require('request');
var mongoose = require('mongoose');

mongoose.connect('mongodb://bpraveen:nokia123@ds143532.mlab.com:43532/zillion');

//Schema Dsigne
var Schema = mongoose.Schema;

var Image = new Schema({
    keyword: String,
    searchData: []
})

var imageSchema = mongoose.model('searchindexs', Image);

var client = new GoogleImages('017464005860650340083:yomji77-la8', 'AIzaSyCXtXanOASbmfIf67moyB_HJD_dGSUiQa0');

var app = express();

app.use(bodyparser.urlencoded({
    extended: false
}));
app.use(bodyparser.json());
app.use(express.static(path.resolve(__dirname, 'frontend')));
app.use(express.static(path.resolve(__dirname, './images')));

var searchResult = [];

function searchImage(data, page) {
    return new Promise((resolve, reject) => {

        client.search(data, {
                page: page,
                size: 'small'
            })
            .then(images => {

                images.map(function(element, index) {
                    searchResult.push({
                        "url": element.url,
                        "type": element.type,
                        "size": element.size
                    })
                })
                return resolve(searchResult);
            });
    })
}

app.post('/api/search', function(req, res) {

    searchImage(req.query.data, 1).then(done => {

            //console.log(searchResult.length);
            searchImage(req.query.data, 2).then(done => {
                console.log(searchResult.length);
                res.send(searchResult.slice(0, 15));
                compress(searchResult.slice(0, 15), req.query.data);
                searchResult = [];
            })

        })
        .catch(err => {
            console.log(err);
        })

    /* var structure = [{
         "url": "https://static.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg",
         "type": "image/jpeg",
         "size": 1951980
     }, {
         "url": "http://www.nationalgeographic.com/content/dam/animals/thumbs/rights-exempt/mammals/d/domestic-cat_thumb.ngsversion.1472140774957.adapt.1900.1.jpg",
         "type": "image/jpeg",
         "size": 333847
     }, {
         "url": "https://static.pexels.com/photos/126407/pexels-photo-126407.jpeg",
         "type": "image/jpeg",
         "size": 1168727
     }, {
         "url": "http://www.petmd.com/sites/default/files/4-meow-conversational-cat.gif",
         "type": "image/gif",
         "size": 145541
     }, {
         "url": "http://www.nationalgeographic.com/content/dam/animals/thumbs/rights-exempt/mammals/d/domestic-cat_thumb.jpg",
         "type": "image/jpeg",
         "size": 2777607
     }, {
         "url": "http://www.petmd.com/sites/default/files/what-does-it-mean-when-cat-wags-tail.jpg",
         "type": "image/jpeg",
         "size": 47966
     }, {
         "url": "https://static.independent.co.uk/s3fs-public/thumbnails/image/2016/03/30/19/cat.jpg",
         "type": "image/jpeg",
         "size": 553496
     }, {
         "url": "https://media1.giphy.com/media/yAqdjThdDEMF2/200_s.gif",
         "type": "image/gif",
         "size": 52420
     }, {
         "url": "https://cdn.kinsights.com/cache/2f/a0/2fa05bebbd843b9aa91e348a7e77d5c2.jpg",
         "type": "image/jpeg",
         "size": 30473
     }, {
         "url": "https://yt3.ggpht.com/-V92UP8yaNyQ/AAAAAAAAAAI/AAAAAAAAAAA/zOYDMx8Qk3c/s900-c-k-no-mo-rj-c0xffffff/photo.jpg",
         "type": "image/jpeg",
         "size": 79553
     }, {
         "url": "http://www.nationalgeographic.com/content/dam/animals/thumbs/rights-exempt/mammals/d/domestic-cat_thumb.ngsversion.1472140774957.adapt.1900.1.jpg",
         "type": "image/jpeg",
         "size": 333847
     }, {
         "url": "https://static.pexels.com/photos/126407/pexels-photo-126407.jpeg",
         "type": "image/jpeg",
         "size": 1168727
     }, {
         "url": "http://www.petmd.com/sites/default/files/4-meow-conversational-cat.gif",
         "type": "image/gif",
         "size": 145541
     }, {
         "url": "http://www.nationalgeographic.com/content/dam/animals/thumbs/rights-exempt/mammals/d/domestic-cat_thumb.jpg",
         "type": "image/jpeg",
         "size": 2777607
     }, {
         "url": "http://www.petmd.com/sites/default/files/what-does-it-mean-when-cat-wags-tail.jpg",
         "type": "image/jpeg",
         "size": 47966
     }]*/


})

function compress(data, key) {

    console.log(data);
    var finalCompressedImagesArray = [];
    var counter = 0; //TO Handle Async
    data.map(function(item, index) {

        var extension = /[^\.]*$/.exec(item.url);
        var fileName = key + index + '-' + Math.random() + '.' + extension;
        gm(request(item.url))
            .quality(50)
            .monochrome()
            .write('./frontend/images/' + fileName, function(err) {

                if (!err) {
                    console.log('done');
                    finalCompressedImagesArray.push({
                        fileName: fileName
                    });
                    counter++;
                    //console.log(counter);
                    if (counter == data.length) { //When last Files Processed it will call db Method.

                        saveToDB(finalCompressedImagesArray, key);
                    }
                }
                else {
                    counter++;
                    if (counter == data.length) { //When last Files Processed it will call db Method.

                        saveToDB(finalCompressedImagesArray, key);
                    }
                    //console.log(err);
                }
            });
    });
}

function saveToDB(array, key) {
    var saveImage = new imageSchema({
        keyword: key,
        searchData: array
    })
    saveImage.save(function(err) {
        if (err) {
            console.log(err)
        }
        else {
            console.log("SAVED")
        }
    })
}


app.get('/api/getsearch', function(req, res) {

    imageSchema.find({}, function(err, result) {
        if (err) console.log(err);
        if (result) {

            res.send(result)
        }
    })


})

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {

    console.log("Node is Up!");
});
