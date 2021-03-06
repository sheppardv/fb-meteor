Matches = new Mongo.Collection("matches");
onTypeStream = new Meteor.Stream('onType');

currentMatch = Matches.findOne({
    ended_at: null
});

function Match(first_team_names, second_team_names, started_at) {
    return {
        first_team: first_team_names || [{name: ''}, {name: ''}],
        second_team: second_team_names || [{name: ''}, {name: ''}],
        started_at: started_at || null,
        ended_at: null
    };
}
function addNewMatch(first_team_names, second_team_names) {
    var newMatch = new Match(first_team_names, second_team_names, new Date());
    Matches.insert(newMatch);
    return newMatch;
}

UI.registerHelper('timeDiffInMin', function (started_at, ended_at) {
    return ( ( ended_at.getTime() - started_at.getTime() ) / (60 * 1000) ).toFixed(1);
});

UI.registerHelper('formatDate', function (date, doNotIncludeDays) {
    var formatString = !doNotIncludeDays ? 'DD.MM.YYYY hh:mm' : 'hh:mm';
    return date ? moment(date).format(formatString) : 'N/A';
});

UI.registerHelper('fromNow', function (date) {
    return date ? moment(date).fromNow() : 'N/A';
});

UI.registerHelper('indexedArray', function (context, options) {
    if (context) {
        return context.map(function (item, index) {
            item._index = index + 1;
            return item;
        });
    }
});

UI.registerHelper('joinTeamNames', function (array) {
    return array.map(function (elem) {
        return elem.name;
    }).join(', ');
});

if (Meteor.isClient) {
    var counter = null;

    Template.match_history.helpers({
        matches: function () {
            return Matches.find({
                ended_at: {$ne: null}
            }, {sort: {ended_at: -1}});
        }
    });

    Template.current_match.helpers({
        match: function () {
            currentMatch = Matches.findOne({
                ended_at: null
            });
            if (currentMatch && currentMatch.started_at && !counter) {
                counter = setInterval(function () {
                    $('#counter').html(moment().diff(currentMatch.started_at, 'minute') + ' min');
                }, 500);
                console.log(counter);
            }
            return currentMatch || new Match();
        }
    });

    Template.match_history.events({});

    onTypeStream.on('teamPlayerChange', function (obj) {
        var qj_el = $('input[data-team=' + obj.team + '][data-player=' + obj.player + ']');
        qj_el.val(obj.value);

        enableStartBtn();

    });

    function enableStartBtn() {
        var isEvery = Array.prototype.every.call(
            $('.onType'),
            function (elem) {
                return !!elem.value;
            }
        );
        var jq_el_start = $('#start');
        if (jq_el_start.prop('disabled')) {
            jq_el_start.prop('disabled', !isEvery);
        }

    }

    Template.current_match.events({
        'input .onType': function (event) {
            var el = event.target;
            var objToSend = {
                value: el.value,
                team: el.getAttribute('data-team'),
                player: el.getAttribute('data-player')
            };

            enableStartBtn();

            onTypeStream.emit('teamPlayerChange', objToSend);
        },

        'click #start': function () {
            var first_team_names = Array.prototype.map.call(document.getElementsByClassName('first_team'), function (el) {
                return {name: el.value};
            });

            var second_team_names = Array.prototype.map.call(document.getElementsByClassName('second_team'), function (el) {
                return {name: el.value};
            });

            currentMatch = addNewMatch(first_team_names, second_team_names);

            counter = setInterval(function () {
                $('#counter').html(moment().diff(currentMatch.started_at, 'minute') + ' min');
            }, 500);
            console.log('counter ' + counter);

        },
        'click #stop': function () {
            currentMatch = Matches.findOne({
                ended_at: null
            });

            Matches.update(currentMatch._id, {$set: {ended_at: new Date()}});
            clearInterval(counter);
            counter = null;
        }

    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}
