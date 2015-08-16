'use strict';

var  async = require('async'),
        fs = require('fs'),
    mkdirp = require('mkdirp'),
        mv = require('mv'),
    gedcom = require('../lib/gedcom'),
     unzip = require('node-unzip-2'),
         _ = require('lodash'),
    Person = require('../models/person'),
    Family = require('../models/family'),
    Source = require('../models/source');

var DEBUG_ID = '@@';
var DATA_DIR;

/*
 * Given a gedcom person object retun a normalized person object
 */
var mapBasicPerson = function (person) {
  var basicPerson = {};
  basicPerson.gedId = person.gedId;

  // Person's Name
  var priName = _.find(person.names, {'type': 'PRIMARY'});
  basicPerson.name = '';
  if (priName && priName.first) {
    basicPerson.name = priName.first;
  }
  if (priName && priName.middle) {
    basicPerson.name += ' ' + priName.middle;
  }
  if (priName && priName.last) {
    basicPerson.name += ' ' + priName.last;
  }
  basicPerson.first = priName && priName.first ? priName && priName.first : '';
  basicPerson.last = priName && priName.last ? priName && priName.last : '';
  basicPerson.middle = priName && priName.middle ? priName && priName.middle : '';

  // Birth Information
  var birth = _.find(person.events, {'type': 'BIRTH'});
  if (birth) {
    basicPerson.birth = {
      date: birth.date ? birth.date : '',
      location: birth.place ? birth.place : '',
      lat: birth.location && birth.location.lat ? birth.location.lat : '',
      lon: birth.location && birth.location.lon ? birth.location.lon : ''
    };
  }

  // Death Information
  var death = _.find(person.events, {'type': 'DEATH'});
  if (death) {
    basicPerson.death = {
      date: death.date ? death.date : '',
      location: death.place ? death.place : '',
      lat: death.location && death.location.lat ? death.location.lat : '',
      lon: death.location && death.location.lon ? death.location.lon : ''
    };
  }

  // Gender
  basicPerson.gender = person.gender;

  return basicPerson;
};

/*
 * Return the parents for a given family id
 */
var getParents = function (familyId, gedcom, includeEvents) {
  var person, marriageEvent, divorceEvent;

  var family = _.find(gedcom.families, {gedId: familyId});
  var marriage = _.find(family.events, {'type': 'MARRIAGE'});
  if (marriage) {
    marriageEvent = {
      date: marriage.date ? marriage.date : '',
      location: marriage.place ? marriage.place : '',
      lat: marriage.location && marriage.location.lat ? marriage.location.lat : '',
      lon: marriage.location && marriage.location.lon ? marriage.location.lon : ''
    };
  }
  var divorce = _.find(family.events, {'type': 'DIVORCE'});
  if (divorce) {
    divorceEvent = {
      date: divorce.date ? divorce.date : '',
      location: divorce.place ? divorce.place : '',
      lat: divorce.location && divorce.location.lat ? divorce.location.lat : '',
      lon: divorce.location && divorce.location.lon ? divorce.location.lon : ''
    };
  }

  var parents = [];
  if (family.husband && family.husband.gedId) {
    var h = _.find(gedcom.individuals, {gedId: family.husband.gedId});
    if (h) {
      person = mapBasicPerson(h);
      if (includeEvents && marriageEvent) {
        person.marriage = marriageEvent;
      }
      if (includeEvents && divorceEvent) {
        person.divorce = divorceEvent;
      }
      parents.push(person);
    }
  }
  if (family.wife && family.wife.gedId) {
    var w = _.find(gedcom.individuals, {gedId: family.wife.gedId});
    var found = _.find(parents, {gedId: family.wife.gedId});
    if (w && !found) {
      person = mapBasicPerson(w);
      if (includeEvents && marriageEvent) {
        person.marriage = marriageEvent;
      }
      if (includeEvents && divorceEvent) {
        person.divorce = divorceEvent;
      }
      parents.push(person);
    }
  }
  return parents;
};

/*
 * Return the children for a given family id
 */
var getChildren = function (familyId, gedcom) {
  var family = _.find(gedcom.families, {gedId: familyId});
  var children = [];
  _.each(family.children, function (child) {
    var person = _.find(gedcom.individuals, {gedId: child.gedId});
    var found = _.find(children, {gedId: person.gedId});
    if (!found) {
      children.push(mapBasicPerson(person));
    }
  });
  return children;
};

/*
 * Map a gedcom person into a database person
 */
var mapPerson = function (person, gedcom, done) {
  if (person.gedId === DEBUG_ID) {
    console.log(person);
  }

  var model = new Person(mapBasicPerson(person));
  model.treeId = gedcom.treeId;

  // Parents
  _.each(person.parents, function (familyId) {
    model.parents = _.union(model.parents, getParents(familyId, gedcom));
  });

  // Gand-parents
  _.each(model.parents, function (parent) {
    var gedPerson = _.find(gedcom.individuals, {gedId: parent.gedId});
    _.each(gedPerson.parents, function (familyId) {
      parent.parents = _.union(parent.parents, getParents(familyId, gedcom));
    });
  });

  // Children
  _.each(person.families, function (familyId) {
    model.children = _.union(model.children, getChildren(familyId, gedcom));
  });

  // Gand-children
  _.each(model.children, function (child) {
    var gedPerson = _.find(gedcom.individuals, {gedId: child.gedId});
    _.each(gedPerson.families, function (familyId) {
      child.children = _.union(child.parents, getChildren(familyId, gedcom));
    });
  });

  // Siblings
  _.each(person.parents, function (familyId) {
    model.siblings = _.where(_.union(model.siblings, getChildren(familyId, gedcom)), function (child) {
      return child.gedId !== model.gedId;
    });
  });

  // spouses
  _.each(person.families, function (familyId) {
    model.spouses = _.where(_.union(model.spouses, getParents(familyId, gedcom, true)), function (spouse) {
      return spouse.gedId !== model.gedId;
    });
  });

  // Events
  _.each(person.events, function (e) {
    var eventModel = {
      type: e.type,
      date: e.date,
      description: e.description,
      location: {
        name: e.place,
        lat: e.location ? e.location.lat : '',
        lon: e.location ? e.location.lon : ''
      },
      sources: []
    };
    _.each(e.sources, function (s) {
      var gedSource = _.find(gedcom.sources, {gedId: s.gedId});
      var obj = _.find(gedSource.objects, function (o) {
        return o.title === s.page;
      });
      if (!obj && s.page) {
        obj = _.find(gedSource.objects, function (o) {
          return _.contains(o.title, '-' + s.page) || _.contains(o.title, s.page + '-') ||
                 _.contains(o.title, ' ' + s.page) || _.contains(o.title, s.page + ' ');
        });
      }
      if (!obj && s.page) {
        var parts = s.page.split(':');
        obj = _.find(gedSource.objects, function (o) {
          return _.contains(o.title, '-' + parts[0]) || _.contains(o.title, parts[0] + '-') ||
                 _.contains(o.title, ' ' + parts[0]) || _.contains(o.title, parts[0] + ' ');
        });
      }

      eventModel.sources.push({
        gedId: gedSource.gedId,
        title: gedSource.title,
        page: s.page,
        file: obj ? obj.file : ''
      });
    });

    if (person.gedId === DEBUG_ID) {
      console.log(eventModel);
    }

    model.events.push(eventModel);
  });

  // Sources
  model.sources = _.map(person.sources, function (s) {
    var gedSource = _.find(gedcom.sources, {gedId: s.gedId});
    var obj = _.find(gedSource.objects, function (o) {
      return o.title === s.page;
    });
    if (!obj && s.page) {
      obj = _.find(gedSource.objects, function (o) {
        return _.contains(o.title, '-' + s.page) || _.contains(o.title, s.page + '-') ||
               _.contains(o.title, ' ' + s.page) || _.contains(o.title, s.page + ' ');
      });
    }
    if (!obj && s.page) {
      var parts = s.page.split(':');
      obj = _.find(gedSource.objects, function (o) {
        return _.contains(o.title, '-' + parts[0]) || _.contains(o.title, parts[0] + '-') ||
               _.contains(o.title, ' ' + parts[0]) || _.contains(o.title, parts[0] + ' ');
      });
    }

    var sourceModel = {
      gedId: gedSource.gedId,
      title: gedSource.title,
      page: s.page,
      file: obj ? obj.file : ''
    };

    if (person.gedId === DEBUG_ID) {
      console.log(sourceModel);
    }

    return sourceModel;
  });

  done(null, model);
};


/*
 * Map a gedcom person into a database person
 * gedcom.individuals has already been converted
 */
var mapFamily = function (family, gedcom, done) {
  if (family.gedId === DEBUG_ID) {
    console.log(family);
  }

  var model = new Family();
  model.treeId = gedcom.treeId;
  model.gedId = family.gedId;

  // Partners
  if (family.husband && family.husband.gedId) {
    var h = _.find(gedcom.individuals, {gedId: family.husband.gedId});
    if (h) {
      model.partners.push(h);
    }
  }
  if (family.wife && family.wife.gedId) {
    var w = _.find(gedcom.individuals, {gedId: family.wife.gedId});
    if (w) {
      model.partners.push(w);
    }
  }

  // Children
  _.each(family.children, function (child) {
    var person = _.find(gedcom.individuals, {gedId: child.gedId});
    var found = _.find(model.children, {gedId: person.gedId});
    if (!found) {
      model.children.push(person);
    }
  });

  // Events
  _.each(family.events, function (e) {
    var eventModel = {
      type: e.type,
      date: e.date,
      description: e.description,
      location: {
        name: e.place,
        lat: e.location ? e.location.lat : '',
        lon: e.location ? e.location.lon : ''
      },
      sources: []
    };
    _.each(e.sources, function (s) {
      var gedSource = _.find(gedcom.sources, {gedId: s.gedId});
      var obj = _.find(gedSource.objects, function (o) {
        return o.title === s.page;
      });
      if (!obj && s.page) {
        obj = _.find(gedSource.objects, function (o) {
          return _.contains(o.title, '-' + s.page) || _.contains(o.title, s.page + '-') ||
                 _.contains(o.title, ' ' + s.page) || _.contains(o.title, s.page + ' ');
        });
      }
      if (!obj && s.page) {
        var parts = s.page.split(':');
        obj = _.find(gedSource.objects, function (o) {
          return _.contains(o.title, '-' + parts[0]) || _.contains(o.title, parts[0] + '-') ||
                 _.contains(o.title, ' ' + parts[0]) || _.contains(o.title, parts[0] + ' ');
        });
      }

      eventModel.sources.push({
        gedId: gedSource.gedId,
        title: gedSource.title,
        page: s.page,
        file: obj ? obj.file : ''
      });
    });

    if (family.gedId === DEBUG_ID) {
      console.log(eventModel);
    }

    model.events.push(eventModel);
  });

  // Sources
  model.sources = _.map(family.sources, function (s) {
    var gedSource = _.find(gedcom.sources, {gedId: s.gedId});
    var obj = _.find(gedSource.objects, function (o) {
      return o.title === s.page;
    });
    if (!obj && s.page) {
      obj = _.find(gedSource.objects, function (o) {
        return _.contains(o.title, '-' + s.page) || _.contains(o.title, s.page + '-') ||
               _.contains(o.title, ' ' + s.page) || _.contains(o.title, s.page + ' ');
      });
    }
    if (!obj && s.page) {
      var parts = s.page.split(':');
      obj = _.find(gedSource.objects, function (o) {
        return _.contains(o.title, '-' + parts[0]) || _.contains(o.title, parts[0] + '-') ||
               _.contains(o.title, ' ' + parts[0]) || _.contains(o.title, parts[0] + ' ');
      });
    }

    var sourceModel = {
      gedId: gedSource.gedId,
      title: gedSource.title,
      page: s.page,
      file: obj ? obj.file : ''
    };

    if (family.gedId === DEBUG_ID) {
      console.log(sourceModel);
    }

    return sourceModel;
  });

  done(null, model);
};


/*
 * Map a gedcom source into a database source
 * gedcom.individuals and gedcom.families have
 * already been converted
 */
var mapSource = function (source, gedcom, done) {
  if (source.gedId === DEBUG_ID) {
    console.log(source);
  }

  var model = new Source();
  model.treeId = gedcom.treeId;
  model.gedId = source.gedId;
  model.title = source.title;

  // People
  _.each(source.people, function (item) {
    var person = _.find(gedcom.individuals, {gedId: item.person}).toObject();
    var found = _.find(model.people, {person: person});
    if (!found) {
      model.people.push({
        person: person,
        page: item.page
      });
    }
  });

  // Events
  _.each(source.events, function (item) {
    var person = _.find(gedcom.individuals, {gedId: item.person}).toObject();
    var found = _.find(model.events, {person: person, event: item.event});
    if (!found) {
      model.events.push({
        person: person,
        event: item.event,
        page: item.page
      });
    }
  });

  // Objects
  model.objects = source.objects;

  done(null, model);
};


var processGedcom = function (treeId, filename, done) {
  async.waterfall([
    function (nextStep) {
      gedcom(filename, nextStep);
    },

    function (data, nextStep) {
      console.log(treeId + ' Mapping people');
      data.treeId = treeId;
      async.map(data.individuals, function (person, next) {
        mapPerson(person, data, next);
      },
      function (err, results) {
        data.individuals = results;
        nextStep(err, data);
      });
    },

    function (data, nextStep) {
      console.log(treeId + ' Mapping families');
      async.map(data.families, function (family, next) {
        mapFamily(family, data, next);
      },
      function (err, results) {
        data.families = results;
        nextStep(err, data);
      });
    },

    function (data, nextStep) {
      console.log(treeId + ' Mapping sources');
      async.map(data.sources, function (source, next) {
        mapSource(source, data, next);
      },
      function (err, results) {
        data.sources = results;
        nextStep(err, data);
      });
    },

    function (data, nextStep) {
      // console.log('---');
      // console.log(JSON.stringify(_.find(data.individuals, { gedId: DEBUG_ID}), null, 2));
      // console.log(JSON.stringify(_.find(data.families, { gedId: DEBUG_ID}), null, 2));
      // console.log(JSON.stringify(_.find(data.sources, { gedId: DEBUG_ID}), null, 2));
      nextStep(null, data);
    },

    function (data, nextStep) {
      console.log(treeId + ' Saving people');
      async.each(data.individuals, function (person, nextPerson) {
        Person.findOne({treeId: treeId, gedId: person.gedId}, function (err, oldPerson) {
          if (oldPerson) {
            oldPerson.remove(function () {
              person.save(nextPerson);
            });
          } else {
            person.save(nextPerson);
          }
        });
      }, function (err) {
        nextStep(err, data);
      });
    },

    function (data, nextStep) {
      console.log(treeId + ' Saving families');
      async.each(data.families, function (family, nextFamily) {
        Family.findOne({treeId: treeId, gedId: family.gedId}, function (err, oldFamily) {
          if (oldFamily) {
            oldFamily.remove(function () {
              family.save(nextFamily);
            });
          } else {
            family.save(nextFamily);
          }
        });
      }, function (err) {
        nextStep(err, data);
      });
    },

    function (data, nextStep) {
      console.log(treeId + ' Saving sources');
      async.each(data.sources, function (source, nextSource) {
        Source.findOne({treeId: treeId, gedId: source.gedId}, function (err, oldSource) {
          if (oldSource) {
            oldSource.remove(function () {
              source.save(nextSource);
            });
          } else {
            source.save(nextSource);
          }
        });
      }, function (err) {
        nextStep(err, data);
      });
    }
  ], function (err) {
    if (err) {
      console.log(err);
    }
    done(err);
  });
};


var upload = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  if (!req.files || !req.files.file) {
    req.status(400).send('Missing FIle');
    return;
  }

  var file = req.files.file;
  if (file && file.extension && file.extension.toLowerCase() !== 'ged' && file.extension.toLowerCase() !== 'zip') {
    req.status(400).send('Bad File');
    return;
  }

  async.waterfall([
    function (nextStep) {
      mkdirp(DATA_DIR + treeId + '/media', function (err) {
        nextStep(err);
      });
    },

    function (nextStep) {
      mkdirp(DATA_DIR + treeId + '/thumbs', function (err) {
        nextStep(err);
      });
    },

    function (nextStep) {
      mkdirp(DATA_DIR + treeId + '/normal', function (err) {
        nextStep(err);
      });
    },

    function (nextStep) {
      if (file && file.extension && file.extension.toLowerCase() === 'ged') {
        mv(file.path, DATA_DIR + treeId + '/gedcom.ged', function (err) {
          nextStep(err);
        });
      }
      else if (file && file.extension && file.extension.toLowerCase() === 'zip') {
        console.log(treeId + ' Processing ZIP file');
        fs.createReadStream(file.path)
          .pipe(unzip.Parse())
          .on('entry', function (entry) {
            if (_.startsWith(entry.path, '__MACOSX')) {
              entry.autodrain();
            }
            else if (entry.type === 'File' && _.endsWith(entry.path.toLowerCase(), '.ged')) {
              // console.log('Found gedcom: ' + entry.path);
              entry.pipe(fs.createWriteStream(DATA_DIR + treeId + '/gedcom.ged'));
            }
            else if (entry.type === 'File' && _.endsWith(entry.path.toLowerCase(), '.jpg')) {
              // console.log('Found media: ' + entry.path);
              var parts = entry.path.split('/');
              var filename = parts[parts.length - 1];
              entry.pipe(fs.createWriteStream(DATA_DIR + treeId + '/media/' + filename));
            } else {
              console.log('Unknown entry: ', entry.path);
              entry.autodrain();
            }
          })
          .on('close', nextStep);
      } else {
        nextStep();
      }
    },

    function (nextStep) {
      processGedcom(treeId, DATA_DIR + treeId + '/gedcom.ged', nextStep);
    }
  ], function (err) {
    fs.unlink(file.path, function () {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      } else {
        res.status(200).send('OK');
      }
    });
  });
};

exports.initialize = function (app) {
  DATA_DIR = app.treeDir;
  app.post('/upload/', upload);
};
