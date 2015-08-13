(function () {
  'use strict';

  app.service('util', function (moment) {
    return {

      isLink: function (value) {
        return _.startsWith(value, 'http://') || _.startsWith(value, 'https://');
      },

      getEventIconClass: function (name) {
        name = name.toUpperCase();
        if (name === 'BIRTH') {
          return 'fa fa-birthday-cake';
        }
        else {
          return '';
        }
      },

      getEventName: function (name) {
        name = name.toUpperCase();
        if (name === 'BIRTH') {
          return 'Birth';
        }
        else if (name === 'CHILD_BAPTISM') {
          return 'Baptism';
        }
        else if (name === 'CONFIRMATION') {
          return 'Confirmation';
        }
        else if (name === 'DEATH') {
          return 'Death';
        }
        else if (name === 'FORMAL_EDUCATION') {
          return 'Education';
        }
        else if (name === 'GRADUATION') {
          return 'Graduation';
        }
        else if (name === 'OCCUPATION') {
          return 'Occupation';
        }
        else if (name === 'PLACE_OF_RESIDENCE') {
          return 'Residence';
        }
        else if (name === 'IMMIGRATION') {
          return 'Immigration';
        }
        else if (name === 'MILITARY_SERVICE') {
          return 'Military';
        }
        else {
          return name;
        }
      },

      getGenderIconClass: function (gender) {
        if (!gender) {
          return '';
        }

        gender = gender.toUpperCase();
        if (gender === 'MALE') {
          return 'fa fa-mars';
        }
        else if (gender === 'FEMALE') {
          return 'fa fa-venus';
        }
      },

      getFormattedDate: function (d) {
        var md = moment(d);
        if (d && md.isValid() && parseInt(md.format('YYYY')) > 999) {
          if (d.length === 4) {
            return 'Sometime in ' + md.format('YYYY');
          } else {
            return md.format('MMMM Do, YYYY');
          }
        } else {
          return '';
        }
      }

    };
  });

})();