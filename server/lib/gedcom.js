'use strict';

var  async = require('async'),
    moment = require('moment'),
    parser = require('parse-gedcom'),
        fs = require('fs'),
         _ = require('lodash');

/**
 * Get date
 **/
var getDate = function (data) {
  if (!data) {
    return;
  }

  if (data.tree && data.tree.length > 0) {
    var date = _.find(data.tree, {tag:'DATE'});
    var time = _.find(date.tree, {tag:'TIME'});
    if (date.data && time.data) {
      var dt = moment(date.data + ' ' + time.data, 'DD MMM YYYY HH:MM:SS');
      if (dt.isValid()) {
        return dt.toISOString();
      }
      return;
    }
    else {
      var d = moment(date.data, 'DD MMM YYYY');
      if (!d.isValid()) {
        d = moment(data.data, 'YYYY');
      }
      if (!d.isValid()) {
        d = moment(data.data, 'MMM YYYY');
      }
      if (!d.isValid()) {
        d = moment(data.data, 'MMM/YYYY');
      }
      if (!d.isValid()) {
        return;
      }
      return d.format('YYYY-MM-DD');
    }
  }
  else {
    var sd = moment(data.data, 'DD MMM YYYY');
    if (!sd.isValid()) {
      sd = moment(data.data, 'YYYY');
    }
    if (!sd.isValid()) {
      sd = moment(data.data, 'MMM YYYY');
    }
    if (!sd.isValid()) {
      sd = moment(data.data, 'MMM/YYYY');
    }
    if (!sd.isValid()) {
      return;
    }
    return sd.format('YYYY-MM-DD');
  }
};

var getPointer = function (data) {
  if (data && data.data) {
    return data.data;
  }
  return;
};

var getSource = function (data) {
  var source = {
    gedId: data.data
  };

  if (_.find(data.tree, {tag:'PAGE'})) {
    source.page = getPointer(_.find(data.tree, {tag:'PAGE'}));
  }
  return source;
};

/**
 * Map an event
 **/
var mapEvent = function (data) {
  var event = {};

  switch (data.tag) {
    case '_FCH': event.type = 'FOSTER_CHILD';       break;
    case 'ADOP': event.type = 'ADOPTION';           break;
    case 'BAPM': event.type = 'CHILD_BAPTISM';      break;
    case 'BASM': event.type = 'BAS_MITZVAH';        break;
    case 'BIRT': event.type = 'BIRTH';              break;
    case 'BLES': event.type = 'BLESSING';           break;
    case 'BURI': event.type = 'BURIAL';             break;
    case 'CENS': event.type = 'CENSUS';             break;
    case 'CHR':  event.type = 'CHRISTENING';        break;
    case 'CHRA': event.type = 'ADULT_BAPTISM';      break;
    case 'CIRC': event.type = 'CIRCUMCISION';       break;
    case 'CONF': event.type = 'CONFIRMATION';       break;
    case 'CREM': event.type = 'CREMATION';          break;
    case 'DEAT': event.type = 'DEATH';              break;
    case 'DEED': event.type = 'DOCUMENT';           break;
    case 'EDUC': event.type = 'FORMAL_EDUCATION';   break;
    case 'EMIG': event.type = 'EMIGRATION';         break;
    case 'EVEN': event.type = 'OTHER';              break;
    case 'FCOM': event.type = 'FIRST_COMMUNION';    break;
    case 'GRAD': event.type = 'GRADUATION';         break;
    case 'ILL':  event.type = 'ILLNESS';            break;
    case 'IMMI': event.type = 'IMMIGRATION';        break;
    case 'SLGC': event.type = 'LDS_CHILD_SEALING';  break;
    case 'CONL': event.type = 'LDS_CONFIRMATION';   break;
    case 'ENDL': event.type = 'LDS ENDOWMENT';      break;
    case 'WAC':  event.type = 'LDS_INITIATORY';     break;
    case 'BAPL': event.type = 'LDS_BAPTISM';        break;
    case 'MISE': event.type = 'MILITARY_SERVICE';   break;
    case 'MISC': event.type = 'MISCARRIAGE';        break;
    case 'MISS': event.type = 'MISSION';            break;
    case 'RELI': event.type = 'FAITH';              break;
    case 'NATU': event.type = 'NATURALIZATION';     break;
    case 'NICK': event.type = 'NICKNAME';           break;
    case 'NOBI': event.type = 'NOBILITY_TITLE';     break;
    case 'OCCU': event.type = 'OCCUPATION';         break;
    case 'ORDN': event.type = 'ORDINATION';         break;
    case 'RESI': event.type = 'PLACE_OF_RESIDENCE'; break;
    case 'RETI': event.type = 'RETIREMENT';         break;
    case 'WILL': event.type = 'WILL';               break;
    case 'PROB': event.type = 'PROBATE';            break;

    case 'MARR': event.type = 'MARRIAGE';           break;
    case 'DIV':  event.type = 'DIVORCE';            break;
    default: event.type = data.tag;
  }
  if (data.data) {
    event.description = data.data;
  }
  if (getDate(_.find(data.tree, {tag:'DATE'}))) {
    event.date = getDate(_.find(data.tree, {tag:'DATE'}));
  }
  if (_.find(data.tree, {tag:'PLAC'})) {
    event.place = _.find(data.tree, {tag:'PLAC'}).data.replace(/,,+/g, ',').replace(/^,/, '');
  }
  if (_.find(data.tree, {tag:'LATI'}) && _.find(data.tree, {tag:'LONG'})) {
    event.location = {
      lat: _.find(data.tree, {tag:'LATI'}).data,
      lon: _.find(data.tree, {tag:'LONG'}).data
    };
  }
  if (getDate(_.find(data.tree, {tag:'CHAN'}))) {
    event.lastUpdate = getDate(_.find(data.tree, {tag:'CHAN'}));
  }
  if (getDate(_.find(data.tree, {tag:'CREA'}))) {
    event.created = getDate(_.find(data.tree, {tag:'CREA'}));
  }

  // sources
  event.sources = [];
  event.sources.push(_.map(_.where(data.tree, {tag: 'SOUR'}), getSource));
  event.sources = _.flatten(event.sources);

  return event;
};

/**
 * Map a fact
 **/
var mapFact = function (data) {
  var fact = {};
  switch (data.tag) {
    case 'NATI': fact.type = 'NATION';      break;
    case 'EYES': fact.type = 'EYE_COLOR';   break;
    case 'HEIG': fact.type = 'HEIGHT';      break;
    case 'EMAI': fact.type = 'EMAIL';       break;
    case 'RACE': fact.type = 'RACE';        break;
    case 'HAIR': fact.type = 'HAIR_COLOR';  break;
    case 'CAST': fact.type = 'CASTE';       break;
    case 'COLO': fact.type = 'SKIN_COLOR';  break;
    case 'HONO': fact.type = 'HONORS';      break;
    case 'PHON': fact.type = 'PHONE';       break;
    case 'HOBB': fact.type = 'HOBBY';       break;
    case 'PROP': fact.type = 'POSSESSION';  break;
    case 'IDNO': fact.type = 'NATIONAL_ID'; break;
    case 'SSN':  fact.type = 'SSN';         break;
    case 'WEIG': fact.type = 'WEIGHT';      break;
    case 'DSCR': fact.type = 'DESCRIPTION'; break;
    default: fact.type = data.tag;
  }
  if (data.data) {
    fact.value = data.data;
  }
  return fact;
};

/**
 * Map a NAME object to a name
 **/
var mapName = function (data) {
  // console.log(JSON.stringify(data, null, 2));
  var name = {};
  if (_.find(data.tree, {tag:'GIVN'})) {
    name.first = _.find(data.tree, {tag:'GIVN'}).data;
  }
  if (_.find(data.tree, {tag:'SURN'})) {
    name.last = _.find(data.tree, {tag:'SURN'}).data;
  }
  if (_.find(data.tree, {tag:'SECG'})) {
    name.middle = _.find(data.tree, {tag:'SECG'}).data;
  }
  if (_.find(data.tree, {tag:'NPFX'})) {
    name.title = _.find(data.tree, {tag:'NPFX'}).data;
  }
  if (_.find(data.tree, {tag:'NSFX'})) {
    name.suffix = _.find(data.tree, {tag:'NSFX'}).data;
  }
  var t = _.find(data.tree, {tag:'TYPE'});
  switch (t ? t.data : '-1') {
    case '-1': name.type = 'PRIMARY';   break;
    case '0':  name.type = 'BIRTH';     break;
    case '1':  name.type = 'STAGE';     break;
    case '2':  name.type = 'OTHER';     break;
    case '3':  name.type = 'MARRIED';   break;
    case '4':  name.type = 'DOUBLE';    break;
    case '5':  name.type = 'FAMILY';    break;
    case '6':  name.type = 'VARIATION'; break;
    case '7':  name.type = 'NICKNAME';  break;
    case '8':  name.type = 'ADOPTIVE';  break;
    case '9':  name.type = 'FORMAL';    break;
    case '10': name.type = 'RELIGIOUS'; break;
    default: name.type = _.find(data.tree, {tag:'TYPE'}).data;
  }
  if (getDate(_.find(data.tree, {tag:'CHAN'}))) {
    name.lastUpdate = getDate(_.find(data.tree, {tag:'CHAN'}));
  }
  if (getDate(_.find(data.tree, {tag:'CREA'}))) {
    name.created = getDate(_.find(data.tree, {tag:'CREA'}));
  }
  return name;
};

/**
 * Map a INDI object to a person
 **/
var mapIndi = function (indi) {
  var person = {
    gedId: indi.pointer
  };

  person.names = _.map(_.where(indi.tree, {tag: 'NAME'}), mapName);
  person.gender = (function (s) {
    if (s.data === 'M') {
      return 'MALE';
    }
    else if (s.data === 'F') {
      return 'FEMALE';
    }
    else {
      return 'UNKNOWN';
    }
  }(_.find(indi.tree, {tag: 'SEX'})));

  // Map events
  person.events = [];
  person.events.push(_.map(_.where(indi.tree, {tag: '_FCH'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'ADOP'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'BAPM'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'BASM'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'BIRT'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'BLES'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'BURI'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'CENS'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'CHR'}),  mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'CHRA'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'CIRC'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'CONF'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'CREM'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'DEAT'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'DEED'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'EDUC'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'EMIG'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'EVEN'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'FCOM'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'GRAD'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'RELI'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'ILL'}),  mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'IMMI'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'SLGC'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'CONL'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'ENDL'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'WAC'}),  mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'BAPL'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'MISE'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'MISC'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'MISS'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'NATU'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'NICK'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'NOBI'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'OCCU'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'ORDN'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'RESI'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'RETI'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'WILL'}), mapEvent));
  person.events.push(_.map(_.where(indi.tree, {tag: 'PROB'}), mapEvent));
  person.events = _.flatten(person.events);

  // Map facts
  person.facts = [];
  person.facts.push(_.map(_.where(indi.tree, {tag: 'NATI'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'EYES'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'HEIG'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'EMAI'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'RACE'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'HAIR'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'CAST'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'COLO'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'HONO'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'PHON'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'HOBB'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'PROP'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'IDNO'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'SSN'}),  mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'WEIG'}), mapFact));
  person.facts.push(_.map(_.where(indi.tree, {tag: 'DSCR'}), mapFact));
  person.facts = _.flatten(person.facts);

  // Families - person is a spouse
  person.families = [];
  person.families.push(_.map(_.where(indi.tree, {tag: 'FAMS'}), getPointer));
  person.families = _.flatten(person.families);

  // Parents - person is a child
  person.parents = [];
  person.parents.push(_.map(_.where(indi.tree, {tag: 'FAMC'}), getPointer));
  person.parents = _.flatten(person.parents);

  // sources
  person.sources = [];
  person.sources.push(_.map(_.where(indi.tree, {tag: 'SOUR'}), getSource));
  person.sources = _.flatten(person.sources);

  return person;
};


var mapFamily = function (fam) {
  var family = {
    gedId: fam.pointer
  };

  var hus = getPointer(_.find(fam.tree, {tag: 'HUSB'}));
  if (hus) {
    family.husband = {
      gedId: hus
    };
  }
  var wif = getPointer(_.find(fam.tree, {tag: 'WIFE'}));
  if (wif) {
    family.wife = {
      gedId: wif
    };
  }

  // Children
  family.children = [];
  family.children.push(_.map(_.where(fam.tree, {tag: 'CHIL'}), getPointer));
  family.children = _.flatten(family.children);
  family.children = _.map(family.children, function (id) {
    return {
      gedId: id
    };
  });

  // Map events
  family.events = [];
  family.events.push(_.map(_.where(fam.tree, {tag: 'MARR'}), mapEvent));
  family.events.push(_.map(_.where(fam.tree, {tag: 'DIV'}), mapEvent));
  family.events = _.flatten(family.events);

  return family;
};


var mapSource = function (data) {
  var source = {
    gedId: data.pointer,
    people: [],
    events: []
  };

  // console.log(data);

  if (_.find(data.tree, {tag:'TITL'})) {
    source.title = _.find(data.tree, {tag:'TITL'}).data;
  }
  if (_.find(data.tree, {tag:'REFN'})) {
    var refn = _.find(data.tree, {tag:'REFN'});
    source.reference = refn.data;
    if (_.find(refn.tree, {tag:'TYPE'})) {
      source.type = _.find(refn.tree, {tag:'TYPE'}).data;
    }
  }
  if (getDate(_.find(data.tree, {tag:'CHAN'}))) {
    source.lastUpdate = getDate(_.find(data.tree, {tag:'CHAN'}));
  }
  if (getDate(_.find(data.tree, {tag:'CREA'}))) {
    source.created = getDate(_.find(data.tree, {tag:'CREA'}));
  }

  source.objects = [];
  source.objects.push(_.map(_.where(data.tree, {tag: 'OBJE'}), getPointer));
  source.objects = _.flatten(source.objects);

  return source;
};


var mapObject = function (data) {
  var obj = {
    gedId: data.pointer
  };

  if (_.find(data.tree, {tag:'FILE'})) {
    obj.file = _.find(data.tree, {tag:'FILE'}).data;
  }
  if (_.find(data.tree, {tag:'TITL'})) {
    obj.title = _.find(data.tree, {tag:'TITL'}).data;
  }

  return obj;
};


module.exports = function (filename, callback) {
  async.waterfall([
    function (nextStep) {
      fs.readFile(filename, nextStep);
    },

    function (data, nextStep) {
      console.log('Parsing GEDCOM');
      nextStep(null, parser.parse(data.toString()));
    },

    function (gedcom, nextStep) {
      var indi = _.chain(gedcom).where({tag: 'INDI'}).map(mapIndi).value();
      var fams = _.chain(gedcom).where({tag: 'FAM'}).map(mapFamily).value();
      var sources = _.chain(gedcom).where({tag: 'SOUR'}).map(mapSource).value();
      var objects = _.chain(gedcom).where({tag: 'OBJE'}).map(mapObject).value();
      _.each(sources, function (s) {
        s.objects = _.map(s.objects, function (s) {
          return _.find(objects, { gedId: s });
        });
      });

      // Back link people to sources
      _.each(indi, function (i) {
        _.each(i.sources, function (s) {
          var source = _.find(sources, {gedId: s.gedId});
          if (source && !_.contains(source.people, i.gedId)) {
            source.people.push({
              person: i.gedId,
              page: s.page
            });
          }
        });
        _.each(i.events, function (e) {
          _.each(e.sources, function (s) {
            var source = _.find(sources, {gedId: s.gedId});
            if (source && !_.find(source.events, { person: i.gedId, event: e })) {
              source.events.push({
                person: i.gedId,
                event: e,
                page: s.page
              });
            }
          });
        });
      });

      nextStep(null, {
        individuals: indi,
        families: fams,
        sources: sources,
        objects: objects
      });
    }

  ], callback);
};
