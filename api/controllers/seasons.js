const Season = require('../models/season')
const Character = require('../models/character');

exports.getAllSeasons = (req, res, next) => {
  Season.find({})
    .exec((err, seasons) => {
      if (err) {
        next(err);
      } else {
        seasons = seasons.map((season) => {
          return {
            number: season.number,
            numberOfDeadCharacters: season.deadCharacters.length
          }
        });
        res.status(200).json(seasons);
      }
    })
};

exports.getSeason =  (req, res, next) => {
  var nb = req.params.nb;

  Season.findOne({
      number: nb
    })
    .populate("deadCharacters", 'id firstName lastName')
    .exec((err, season) => {
      if (err) {
        next(err);
      } else if (!season) {
        res.status(404).json({
          message: "No season with this number."
        })
      } else {
        res.status(200).json({
          number: season.number,
          deadCharacters: season.deadCharacters
        });
      }
    })
};

exports.addCharacters = (req, res, next) => {
  var nb = req.params.nb;
  var deadCharacterIds = JSON.parse(req.body.deadCharacterIds);

  if (!Array.isArray(deadCharacterIds)) {
    res.status(422).json({
      message: "deadCharacters parameters is not a list"
    });
  } else if (deadCharacterIds.length === 0) {
    res.status(422).json({
      message: "deadCharacters list if empty"
    });
  } else {
    Season.findOneAndUpdate({
        number: nb
      }, {
        $addToSet: {
          deadCharacters: deadCharacterIds
        }
      }, {
        returnNewDocument: true
      })
      .exec((err, season) => {
        if (err && err.name === "CastError") {
          res.status(422).json({
            message: "At least one character id doesn't exist."
          });
        } else if (err) {
          next(err);
        } else if (!season) {
          res.status(404).json({
            message: "No season with this number."
          });
        } else {
          res.status(200).json(season);
        }
      })
  }
};
