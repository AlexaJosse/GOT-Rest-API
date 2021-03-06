const JWT = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');

exports.signup = (req, res, next) => {
  var email = req.body.email;
  var password = req.body.password;

  if (!email) {
    res.status(422).json({
      message: "Email parameter is missing"
    })
  } else if (!password) {
    res.status(422).json({
      message: "Password parameter is missing"
    })
  } else {
    User.findOne({
        email: email
      })
      .exec()
      .then(user => {
        if (user) {
          res.status(409).json({
            message: "Email is already registered"
          })
        } else {
          bcrypt.hash(password, 10)
            .then(hash => {
              const user = new User({
                email: email,
                hash: hash,
                isAdmin: false
              });
              user.save()
                .then(user => {
                  res.status(201).json({
                    message: "User created",
                    email: email
                  })
                })
                .catch(err => next(err))
            })
            .catch(err => next(err))
        }
      })
      .catch(err => next(err))
  }
};

exports.login = (req, res, next) => {
  var email = req.body.email;
  var password = req.body.password;

  if (!email || !password) {
    res.status(401).json({
      message: "Unauthorized"
    })
  } else {
    User.findOne({
        email: email
      })
      .exec()
      .then(user => {

        if (!user) {
          res.status(401).json({
            message: "Unauthorized"
          })
        } else {
          bcrypt.compare(password, user.hash)
            .then(match => {
              if (!match) {
                res.status(401).json({
                  message: "Unauthorized"
                })
              } else {
                const token = JWT.sign({
                    email: user.email,
                    isAdmin: user.isAdmin
                  },
                  process.env.JWT_KEY, {
                    expiresIn: "1h"
                  }
                );
                res.status(200).json({
                  message: "Authentication succeeded.",
                  token: token
                });

              }
            })
            .catch(err => {
              next(err);
            })
        }
      })
      .catch(err => {
        next(err);
      })
  }
};

exports.deleteUser = (req, res, next) => {
  var userId = req.params.userId;
  User.findOneAndRemove({
      _id: userId
    })
    .select("id email")
    .exec()
    .then(user => {
      if (!user) {
        res.status(404).json({
          message: "No user with this id"
        });
      } else {
        res.status(200).json({
          message: "User deleted",
          user: user
        });
      }
    })
    .catch(err => {
      next(err);
    })
};

exports.getAllUsers = (req, res, next) => {
  User.find()
    .exec()
    .then(userArray => {
      const objectUsers = {}

      for (var i = 0; i < userArray.length; i++) {
        let user = userArray[i]
        objectUsers[user._id] = {
          email: user.email,
          isAdmin: user.isAdmin
        }
      }

      res.status(200).json(objectUsers);
    })
    .catch(err => {
      next(err);
    })
};
