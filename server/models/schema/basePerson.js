'use strict';

module.exports = {
  gedId: { type: String, required: true },
  name: String,
  first: String,
  last: String,
  middle: String,
  gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] },
  birth: {
    date: Date,
    location: String,
    lat: String,
    lon: String
  },
  death: {
    date: Date,
    location: String,
    lat: String,
    lon: String
  }
};